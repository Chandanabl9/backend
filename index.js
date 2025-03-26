const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection (Using Connection Pooling)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 100,  // Maximum concurrent connections
  queueLimit: 0
});

// Convert pool to Promise-based API
const db = pool.promise();

// ✅ Check Database Connection Before Starting Server
async function checkDBConnection() {
  try {
    await db.query('SELECT 1'); // Test query
    console.log('✅ Connected to the MySQL database');
    
    // Start the Server after successful DB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1); // Exit process if DB connection fails
  }
}

checkDBConnection();

// API Route to Save User Info
app.post('/api/user', async (req, res) => {
  const { Name, UsnEmpId, Department, VehicleNumber, MobileNumber } = req.body;

  try {
    const query = `
      INSERT INTO info (Name, USN_Emp_No, Department, Vehicle_No, Mobile_Number)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(query, [Name, UsnEmpId, Department, VehicleNumber, MobileNumber]);

    res.status(200).json({ message: 'User data saved successfully' });
  } catch (err) {
    console.error('Error saving user data:', err);
    res.status(500).json({ message: 'Error saving data' });
  }
});

// API Route to Search User Info by Vehicle Number (last 4 digits)
app.get('/api/search', async (req, res) => {
  const searchTerm = req.query.vehicleNumber;

  if (!searchTerm || searchTerm.length !== 4) {
    return res.status(400).json({ message: 'Please enter the last 4 digits of the vehicle number.' });
  }

  try {
    const query = `SELECT * FROM info WHERE Vehicle_No LIKE ?`;
    const [result] = await db.query(query, [`%${searchTerm}`]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No matching vehicle found.' });
    }

    res.status(200).json(result[0]); // Return the first matched record
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// Server Health Check Route
app.get('/', (req, res) => {
  res.send('API is running...');
});
