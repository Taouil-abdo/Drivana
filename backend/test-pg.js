const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/drivana'
});

client.connect()
  .then(() => {
    console.log('SUCCESS: Connected to PostgreSQL successfully!');
    client.end();
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Reason: Connection refused. PostgreSQL is likely not running on port 5432.');
    } else if (err.code === '28P01') {
      console.error('Reason: Password authentication failed for user "postgres". The password might be different.');
    } else if (err.code === '3D000') {
      console.error('Reason: Database "drivana" does not exist. You need to create the database first.');
    } else {
      console.error('Detailed Error:', err);
    }
    client.end();
  });
