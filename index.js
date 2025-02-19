const express = require('express');
const { Sequelize, QueryTypes } = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const YAML = require('yaml');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');

/*
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
});
*/
    
const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;
const axios = require("axios");
const file = fs.readFileSync('./swagger.yaml', 'utf-8');
const swaggerDocument = YAML.parse(file);

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const LONGDO_API_KEY = process.env.LONGDO_API_KEY;

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
        console.log('Database connection is alive.');
    } catch (error) {
        console.error('Database connection failed:', error.message);
    }
};
setInterval(checkConnection, 60000);

function convertToThailandTime(utcDate) {
    const date = new Date(utcDate);
    const thailandOffset = 7 * 60;
    const thailandDate = new Date(date.getTime() + thailandOffset * 60000);
    return thailandDate.toISOString().replace("Z", "+07:00");
}

// ----------------------------- signup ----------------------------- //

app.post('/signup', async (req, res) => {
    try {
        const { account_email, account_password, confirm_password } = req.body;
        
        // ตรวจสอบว่ารหัสผ่านกับยืนยันรหัสผ่านตรงกันหรือไม่
        if (account_password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        
        // ตรวจสอบว่า email มีอยู่ในฐานข้อมูลแล้วหรือยัง
        const [existingUser] = await sequelize.query(
            `SELECT * FROM register_account WHERE account_email = ?`,
            {
                replacements: [account_email],
                type: QueryTypes.SELECT
            }
        );
        
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(account_password, saltRounds);
        
        // สร้างเวลาในรูปแบบเวลาประเทศไทย
        const created_at = convertToThailandTime(new Date());
        const updated_at = convertToThailandTime(new Date());
        
        // บันทึกข้อมูลลงในฐานข้อมูล (เก็บแค่ email และ password)
        await sequelize.query(
            `INSERT INTO register_account 
            (account_email, account_password, created_at, updated_at) 
            VALUES (?, ?, ?, ?)`,
            {
                replacements: [
                    account_email,
                    hashedPassword,
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

/*app.get('/signup', async (req, res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT * FROM register_account', { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});*/

// ----------------------------- signin ----------------------------- //

app.post('/signin', async (req, res) => {
    try {
        const { account_email, account_password } = req.body;
        
        // ค้นหาผู้ใช้จากฐานข้อมูล
        const [user] = await sequelize.query(
            `SELECT * FROM register_account WHERE account_email = ?`,
            {
                replacements: [account_email],
                type: QueryTypes.SELECT
            }
        );

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // ตรวจสอบรหัสผ่าน
        const isMatch = await bcrypt.compare(account_password, user.account_password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // สร้าง JWT Token
        const token = jwt.sign(
            { account_id: user.account_id, account_email: user.account_email },
            process.env.JWT_SECRET,
            { expiresIn: '30 m' }  // กำหนดเวลาให้ token หมดอายุใน 30 นาที
        );
        
        res.status(200).json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ----------------------------- admin ----------------------------- //

app.get('/accounts_list', async (req, res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT * FROM register_account', { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------- profile ----------------------------- //

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

/*app.post('/profile', async (req, res) => {
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
});*/
// ----------------------------- qa_picture ----------------------------- //

app.get('/qa_picture' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT * FROM qa_picture', { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// ----------------------------- province ----------------------------- //

app.get('/province' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT thai_amphures.id, thai_tambons.zip_code, thai_tambons.name_th AS tambon_name, thai_amphures.name_th AS amphure_name, thai_provinces.province_th AS province_name, thai_geographies.name AS geography_name FROM thai_tambons JOIN thai_amphures ON thai_tambons.amphure_id = thai_amphures.id JOIN thai_provinces ON thai_amphures.province_id = thai_provinces.id JOIN thai_geographies ON thai_provinces.geography_id = thai_geographies.id'
        , { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})


// ----------------------------- Test longdo ----------------------------- //

app.get("/search_nearby", async (req, res) => {
    try {
        const { postcode , radius } = req.query; // รับค่าพิกัดและระยะทาง
        if ( !postcode || !radius) {
            return res.status(400).json({ error: "Missing required parameters" });
        }
        
        // เรียก API Longdo Map ค้นหาสถานที่รอบๆ จุดที่กำหนด
        const response = await axios.get("https://api.longdo.com/POIService/json/search", {
            params: {
                key: LONGDO_API_KEY,
                postcode, 
                limit: 5, // จำนวนผลลัพธ์สูงสุด
                span: radius, // ระยะทางค้นหา (เมตร)
                tag: "park" // ระบุประเภทสถานที่
            },
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


/*const completion = openai.chat.completions.create({
// ----------------------------- Open AI ----------------------------- //

    model: "gpt-4o-mini",
    store: true,
    messages: [
        {"role": "user", "content": "ฉันชอบเดินทาง เเนะนำสถานที่เที่ยวหน่อยเเค่ 5 สถานที่ในกรุงเทพ"},
        ],
        max_tokens: 400,
        });
        
        
        completion.then((result) => console.log(result.choices[0].message)
        );
*/

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});