import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'skillgauge',
  user: 'skillgauge',
  password: 'skillgauge'
});

const updates = [
  { phone: '+66853334444', hash: '$2a$10$ayx0DPLBCM19zlDKFuVBBOAe9yxq1wTLxBkNBrkhKUpPsis/XNRRK', role: 'PM' },
  { phone: '+66861234567', hash: '$2a$10$Uvvw6T3A8k57J1CY5Ar7IO1jejCxC9h6UWj1OBq3/9Rv9yp3Wc3iS', role: 'FM' },
  { phone: '+66869876543', hash: '$2a$10$mJfJoA6ty62i4eJWEfLlu.q9h4jGcr1ljS1Dw1fvdUiZreQRbLPI6', role: 'WK' }
];

(async () => {
  try {
    for (const { phone, hash, role } of updates) {
      const result = await pool.query(
        'UPDATE users SET password_hash = $1 WHERE phone = $2',
        [hash, phone]
      );
      console.log(`✓ Updated ${role} (${phone}) - ${result.rowCount} row(s)`);
    }
    console.log('\n=== Login Credentials ===');
    console.log('Admin: 0863125891 / 0863503381');
    console.log('PM: +66853334444 / pm123456');
    console.log('FM: +66861234567 / fm123456');
    console.log('WK: +66869876543 / wk123456');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
