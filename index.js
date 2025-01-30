const express = require('express');
const { Sequelize, QueryTypes } = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const YAML = require('yaml');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

const file = fs.readFileSync('./swagger.yaml', 'utf-8');
const swaggerDocument = YAML.parse(file);

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        dialectOptions: { connectTimeout: 60000 },
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
        retry: { match: [/SequelizeConnectionError/], max: 5 }
    }
);

const checkConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection is alive.');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
};
setInterval(checkConnection, 60000);

function convertToThailandTime(utcDate) {
    const date = new Date(utcDate);
    const thailandOffset = 7 * 60;
    const thailandDate = new Date(date.getTime() + thailandOffset * 60000);
    return thailandDate.toISOString().replace("Z", "+07:00");
}

app.get('/profile', async (req, res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT * FROM register_account', { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await checkConnection();

        const results = await sequelize.query(
            'SELECT * FROM register_account WHERE account_id = ?', 
            { 
                replacements: [id],  
                type: QueryTypes.SELECT 
            }
        );

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/profile', async (req, res) => {
    try {
        const {
            account_email,
            account_password,
            account_name,
            account_gender,
            account_birthday,
            account_picture,
            account_telephone,
            latitude,
            longitude
        } = req.body;

        const hashedPassword = await bcrypt.hash(account_password, saltRounds);
        const created_at = convertToThailandTime(new Date());
        const updated_at = convertToThailandTime(new Date());

        await sequelize.query(
            `INSERT INTO register_account 
                (account_email, account_password, account_name, account_gender, account_birthday, 
                 account_picture, account_telephone, latitude, longitude, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
                replacements: [
                    account_email,
                    hashedPassword,
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
                type: QueryTypes.INSERT
            }
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.put('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            account_email, 
            account_password, 
            account_name, 
            account_gender, 
            account_birthday, 
            account_picture, 
            account_telephone, 
            latitude, 
            longitude
        } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const updated_at = convertToThailandTime(new Date());

        const [results, metadata] = await sequelize.query(
            `UPDATE register_account 
             SET account_email = ?, 
                 account_password = ?, 
                 account_name = ?, 
                 account_gender = ?, 
                 account_birthday = ?, 
                 account_picture = ?, 
                 account_telephone = ?, 
                 latitude = ?, 
                 longitude = ?, 
                 updated_at = ?
             WHERE account_id = ?`,
            {
                replacements: [
                    account_email, 
                    account_password, 
                    account_name, 
                    account_gender, 
                    account_birthday, 
                    account_picture, 
                    account_telephone, 
                    latitude, 
                    longitude, 
                    updated_at, 
                    id
                ],
                type: QueryTypes.UPDATE
            }
        );

        // Check if metadata is available and has affected rows
        if (!metadata || metadata.affectedRows === 0 || metadata.changedRows === 0) {
            return res.status(404).json({ error: 'User not found or no changes made' });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);  // Log the error for debugging
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});



app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});