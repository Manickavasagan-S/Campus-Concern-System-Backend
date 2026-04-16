const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const setup = async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    console.log('Creating tables...');
    await pool.query(schema);

    console.log('Seeding Principal...');
    const hashedPassword = await bcrypt.hash('1234567890', 10);
    await pool.query(
      'INSERT INTO users (name, roll_number, password, department, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (roll_number) DO NOTHING',
      ['Principal', 'principal_admin', hashedPassword, 'None', 'principal']
    );

    console.log('Database setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
};

setup();
