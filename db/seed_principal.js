const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedPrincipal() {
  try {
    const hashedPassword = await bcrypt.hash('1234567890', 10);
    const query = `
      INSERT INTO users (name, roll_number, password, department, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (roll_number) DO UPDATE
      SET password = EXCLUDED.password;
    `;
    await pool.query(query, ['Principal', 'principal_admin', hashedPassword, 'None', 'principal']);
    console.log('Principal account created/updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding principal:', err.message);
    process.exit(1);
  }
}

seedPrincipal();
