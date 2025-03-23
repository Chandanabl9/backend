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

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

// API Route to Save User Info
app.post('/api/user', (req, res) => {
  const { Name, UsnEmpId, Department, VehicleNumber, MobileNumber } = req.body;
  
  // SQL query to insert user data into 'info' table
  const query = `
    INSERT INTO info (Name, USN_Emp_No, Department, Vehicle_No, Mobile_Number)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.query(query, [Name, UsnEmpId, Department, VehicleNumber, MobileNumber], (err, result) => {
    if (err) {
      console.error('Error saving user data:', err);
      return res.status(500).json({ message: 'Error saving data' });
    }
    res.status(200).json({ message: 'User data saved successfully' });
  });
});

// API Route to Search User Info by Vehicle Number (last 4 digits)
app.get('/api/search', (req, res) => {
  const searchTerm = req.query.vehicleNumber;

  if (!searchTerm || searchTerm.length !== 4) {
    return res.status(400).json({ message: 'Please enter the last 4 digits of the vehicle number.' });
  }

  const query = `SELECT * FROM info WHERE Vehicle_No LIKE ?`;
  db.query(query, [`%${searchTerm}`], (err, result) => {
    if (err) {
      console.error('Error fetching user data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'No matching vehicle found.' });
    }

    res.status(200).json(result[0]); // Return the first matched record
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT,"0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
