const express = require('express');
const mysql = require('mysql2');
const app = express();
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const YAML = require('yaml');
const file = fs.readFileSync('./swagger.yaml', 'utf-8');
const swaggerDocument = YAML.parse(file);
const bodyParser = require('body-parser');
const port = 3000;

app.use(express.json()); // Middleware to parse JSON request bodies
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'traval_app',
});

//------------------------------ register ------------------------------//

app.get('/register', (req, res) => {
    connection.query('SELECT * FROM register_account', function(err, results) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results);
        }
    });
});

app.post('/register', (req, res) => {
    const { 
        account_email, 
        account_password, 
        account_name, 
        account_gender, 
        account_birthday, 
        account_picture, 
        account_telephone, 
        latitude, 
        longitude, 
    } = req.body;

function convertToThailandTime(utcDate) {
    const date = new Date(utcDate);
    const thailandOffset = 7 * 60; // UTC+7 in minutes
    const thailandDate = new Date(date.getTime() + thailandOffset * 60000); // Convert to Thailand time
    return thailandDate.toISOString().replace("Z", "+07:00"); // Ensure it has the correct timezone offset
}

const created_at_utc = "2025-01-28T10:00:00Z";
const updated_at_utc = "2025-01-28T10:00:00Z";

// Convert to UTC+7 (Thailand)
const created_at = convertToThailandTime(created_at_utc);
const updated_at = convertToThailandTime(updated_at_utc);

console.log(created_at, updated_at);

    connection.query(
        'INSERT INTO register_account (account_email, account_password, account_name, account_gender, account_birthday, account_picture, account_telephone, latitude, longitude, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [ 
            account_email, 
            account_password, 
            account_name, 
            account_gender, 
            account_birthday, 
            account_picture, 
            account_telephone, 
            latitude, 
            longitude, 
            created_at, 
            updated_at 
        ], 
        function(err, results) {
            if (err) {
                console.error('SQL Error:', err);
                res.status(500).json({ error: 'Database error', details: err });
            } else {
                res.status(201).json({ message: 'User registered successfully', data: results });
            }
        }
    )
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
