// Direct MySQL Member Deletion Script
// Run this in your browser console on the website

async function deleteAllMySQLMembers() {
  try {
    console.log('Starting MySQL member deletion...');
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('Not logged in!');
      return;
    }
    
    console.log('Session found, calling Edge Function...');
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('delete-mysql-members', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ SUCCESS!');
      console.log(data.message);
      console.log('Deleted:', data.deleted_count);
      console.log('Remaining:', data.remaining_count);
    } else {
      console.error('❌ FAILED:', data.error);
    }
    
  } catch (err) {
    console.error('Exception:', err);
  }
}

// Run it
deleteAllMySQLMembers();
