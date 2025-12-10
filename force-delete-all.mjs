import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file
let supabaseUrl, supabaseKey;

try {
  const envContent = readFileSync('.env', 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=') || line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
    }
  }
} catch (error) {
  console.error('Error reading .env file:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceDeleteAllMembers() {
  try {
    console.log('Starting aggressive member deletion...\n');
    
    // First, get accurate count
    const { count: initialCount, error: countError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Count error:', countError);
      throw countError;
    }
    
    console.log(`Current database count: ${initialCount} members`);
    
    if (initialCount === 0) {
      console.log('✓ Database is already empty!');
      return;
    }
    
    console.log(`\nFetching all ${initialCount} member IDs...`);
    
    // Get ALL members in one query
    let allMembers = [];
    let start = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .range(start, start + pageSize - 1);
      
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allMembers = allMembers.concat(data);
      console.log(`  Fetched ${allMembers.length} / ${initialCount}...`);
      
      if (data.length < pageSize) break;
      start += pageSize;
    }
    
    console.log(`\nTotal members fetched: ${allMembers.length}`);
    console.log('Starting deletion in small batches...\n');
    
    const memberIds = allMembers.map(m => m.id);
    const batchSize = 50; // Very small batches
    let totalDeleted = 0;
    let failedBatches = [];
    
    for (let i = 0; i < memberIds.length; i += batchSize) {
      const batch = memberIds.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      
      try {
        const { error } = await supabase
          .from('members')
          .delete()
          .in('id', batch);
        
        if (error) {
          console.error(`❌ Batch ${batchNum} failed:`, error.message);
          failedBatches.push(batchNum);
        } else {
          totalDeleted += batch.length;
          console.log(`✓ Batch ${batchNum}: Deleted ${totalDeleted} / ${memberIds.length} members`);
        }
      } catch (err) {
        console.error(`❌ Batch ${batchNum} exception:`, err.message);
        failedBatches.push(batchNum);
      }
      
      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n=== DELETION SUMMARY ===');
    console.log(`Total deleted: ${totalDeleted} / ${memberIds.length}`);
    
    if (failedBatches.length > 0) {
      console.log(`Failed batches: ${failedBatches.join(', ')}`);
    }
    
    // Verify final count
    const { count: finalCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\nFinal database count: ${finalCount} members`);
    
    if (finalCount === 0) {
      console.log('\n✓✓✓ SUCCESS! All members deleted! ✓✓✓');
    } else {
      console.log(`\n⚠ Warning: ${finalCount} members remaining. Running one more pass...`);
      // Recursive call for remaining members
      await forceDeleteAllMembers();
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

forceDeleteAllMembers();
