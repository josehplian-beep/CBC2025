import mysql from 'mysql2/promise';

async function deleteAllMySQLMembers() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    
    // MySQL connection details - try different hosts
    const MYSQL_HOSTS = [
      'mysql.hostinger.com',
      'srv1132.hstgr.io',
      '153.92.15.3',
      'localhost'
    ];
    const MYSQL_PASSWORD = 'h?4GJYB4$yI';
    
    let lastError;
    for (const MYSQL_HOST of MYSQL_HOSTS) {
      try {
        console.log(`Trying host: ${MYSQL_HOST}...`);
    
        connection = await mysql.createConnection({
          host: MYSQL_HOST,
          user: 'u915808430_cbc2025',
          password: MYSQL_PASSWORD,
          database: 'u915808430_cbc2025',
          connectTimeout: 10000
        });
        
        console.log(`✓ Connected to MySQL at ${MYSQL_HOST}!`);
        break;
      } catch (err) {
        console.log(`✗ Failed to connect to ${MYSQL_HOST}: ${err.message}`);
        lastError = err;
        continue;
      }
    }
    
    if (!connection) {
      throw new Error('Could not connect to any MySQL host. Error: ' + lastError.message);
    }
    
    // Get current count
    const [countRows] = await connection.query('SELECT COUNT(*) as count FROM members');
    const memberCount = countRows[0].count;
    console.log(`Found ${memberCount} members in MySQL database`);
    
    if (memberCount === 0) {
      console.log('No members to delete!');
      await connection.end();
      return;
    }
    
    // Delete all members
    console.log('Deleting all members...');
    const [result] = await connection.query('DELETE FROM members');
    console.log(`Deleted ${result.affectedRows} members`);
    
    // Verify deletion
    const [verifyRows] = await connection.query('SELECT COUNT(*) as count FROM members');
    const remainingCount = verifyRows[0].count;
    console.log(`Remaining members: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('✅ SUCCESS! All members deleted from MySQL!');
    } else {
      console.log(`⚠️  Warning: ${remainingCount} members still remain`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('MySQL connection closed');
    }
  }
}

deleteAllMySQLMembers();
