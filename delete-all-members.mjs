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

async function deleteAllMembers() {
  try {
    console.log('Fetching all members...');
    
    // Get all member IDs
    const { data: members, error: fetchError } = await supabase
      .from('members')
      .select('id');
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!members || members.length === 0) {
      console.log('No members found in the database.');
      return;
    }
    
    console.log(`Found ${members.length} members. Deleting in batches...`);
    
    const memberIds = members.map(m => m.id);
    const batchSize = 100;
    let deletedCount = 0;
    
    // Delete in batches
    for (let i = 0; i < memberIds.length; i += batchSize) {
      const batch = memberIds.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('members')
        .delete()
        .in('id', batch);
      
      if (error) {
        console.error(`Error deleting batch ${i / batchSize + 1}:`, error);
      } else {
        deletedCount += batch.length;
        console.log(`Deleted ${deletedCount} / ${memberIds.length} members...`);
      }
    }
    
    console.log(`✓ Successfully deleted ${deletedCount} members!`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteAllMembers();
