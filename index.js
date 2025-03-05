const express = require('express');
const { Sequelize, QueryTypes } = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const YAML = require('yaml');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

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

const filePath = path.join(__dirname, 'swagger.yaml');
const file = fs.readFileSync(filePath, 'utf-8'); // เปิดไฟล์ที่ถูกต้อง
const swaggerDocument = YAML.parse(file); // แปลงไฟล์ 
console.log(`Reading Swagger file from: ${filePath}`);



app.use(express.json());
app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// กำหนดที่เก็บไฟล์
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // เก็บไฟล์ไว้ในโฟลเดอร์ uploads
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ใหม่
    }
});

const upload = multer({ storage: storage });
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
            { account_id: user.account_id, account_email: user.account_email,account_name:user.account_name,account_picture:user.account_picture },
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

app.get('/accounts_list/:id', async (req, res) => {
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

// ----------------------------- register_account ----------------------------- //

app.put('/profile/:id', async (req, res) => {
    try {
        console.log(req.body); // ตรวจสอบค่าที่ส่งเข้ามา
        const { id } = req.params;
        const {
            account_email, 
            account_name, 
            account_gender, 
            account_birthday, 
            account_picture, 
            account_telephone, 
        } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const updated_at = convertToThailandTime(new Date());

        const [results, metadata] = await sequelize.query(
            `UPDATE register_account 
            SET account_email = ?, 
                account_name = ?, 
                account_gender = ?, 
                account_birthday = ?, 
                account_picture = ?, 
                account_telephone = ?, 
                updated_at = ?
            WHERE account_id = ?`,
            {
                replacements: [
                    account_email, 
                    account_name, 
                    account_gender, 
                    account_birthday, 
                    account_picture, 
                    account_telephone, 
                    updated_at, 
                    id
                ],
                type: QueryTypes.UPDATE
            }
        );

        if (!metadata || metadata.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or no changes made' });
        }

        // ดึงค่าล่าสุดจากฐานข้อมูลเพื่อยืนยัน
        const [updatedUser] = await sequelize.query(
            `SELECT account_picture FROM register_account WHERE account_id = ?`,
            {
                replacements: [id],
                type: QueryTypes.SELECT
            }
        );

        res.json({ message: 'Profile updated successfully', account_picture: updatedUser?.account_picture || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});


app.post('/profile_location/:id', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const { id } = req.params;

        console.log("Received ID:", id); //ตรวจสอบค่าที่รับมา

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const [user] = await sequelize.query(
            `SELECT account_id FROM register_account WHERE account_id = ?`,
            {
                replacements: [id],
                type: QueryTypes.SELECT
            }
        );

        console.log("User Found:", user); //ดูว่าพบ user หรือไม่

        if (user) {
            await sequelize.query(
                `UPDATE register_account SET latitude = ?, longitude = ? WHERE account_id = ?`,
                {
                    replacements: [latitude, longitude, id],
                    type: QueryTypes.UPDATE
                }
            );
            return res.status(200).json({ message: "Location updated successfully" });
        } else {
            await sequelize.query(
                `INSERT INTO register_account (account_id, latitude, longitude) VALUES (?, ?, ?)`,
                {
                    replacements: [id, latitude, longitude],
                    type: QueryTypes.INSERT
                }
            );
            return res.status(201).json({ message: "Location saved successfully" });
        }

    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

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

// ----------------------------- qa_activity ----------------------------- //

app.get('/qa_activity' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT picture_id , theme FROM qa_picture', { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// ----------------------------- province ----------------------------- //

app.get('/province/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await checkConnection(); // ตรวจสอบว่าอันนี้จำเป็นหรือไม่
        
        const results = await sequelize.query(
            'SELECT place_id, place_name, place_picture, place_map, province_th, geography_id FROM location_region INNER JOIN thai_provinces ON location_region.Province_id = thai_provinces.Province_id WHERE geography_id = ?',
            {
                replacements: [Number(id)], // แปลง id เป็นตัวเลข
                type: QueryTypes.SELECT
            }
        );

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------- province central ----------------------------- //
/*
app.get('/province_central' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT place_id , place_name , place_picture , place_map ,province_th , geography_id FROM `location_region` INNER JOIN thai_provinces ON location_region.Province_id = thai_provinces.Province_id WHERE geography_id = 2'
        , { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// ----------------------------- province Northern ----------------------------- //

app.get('/province_northern' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT place_id , place_name , place_picture , place_map ,province_th , geography_id FROM `location_region` INNER JOIN thai_provinces ON location_region.Province_id = thai_provinces.Province_id WHERE geography_id = 1'
        , { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// ----------------------------- province Northeast ----------------------------- //

app.get('/province_northeast' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT place_id , place_name , place_picture , place_map ,province_th , geography_id FROM `location_region` INNER JOIN thai_provinces ON location_region.Province_id = thai_provinces.Province_id WHERE geography_id = 3'
        , { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// ----------------------------- province South ----------------------------- //

app.get('/province_south' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT place_id , place_name , place_picture , place_map ,province_th , geography_id FROM `location_region` INNER JOIN thai_provinces ON location_region.Province_id = thai_provinces.Province_id WHERE geography_id = 6'
        , { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})
*/

// ----------------------------- qa_traveling ----------------------------- //

app.get('/qa_traveling' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT * FROM qa_traveling', { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// ----------------------------- qa_distance ----------------------------- //

app.get('/qa_distance' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT * FROM qa_distance', { type: QueryTypes.SELECT });
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
                tag: "สวนสาธารณะ" // ระบุประเภทสถานที่
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