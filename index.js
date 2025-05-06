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

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;
const axios = require("axios");

const file = fs.readFileSync('./swagger.yaml', 'utf-8');
const swaggerDocument = YAML.parse(file);

app.use(express.json());
app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// OpenAI Instance
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,  // ตรวจสอบว่าโหลดค่า API Key ถูกต้อง
});


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

const sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mariadb',
        port: 3306,  //พอร์ตของ MariaDB 
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
                //ถ้า existingUser มีข้อมูล แปลว่าเคยสมัครแล้ว
                replacements: [account_email],
                type: QueryTypes.SELECT
            }
        );
        //หากอีเมลนี้เคยมีอยู่แล้ว จะส่งกลับ error ไปยังฝั่งผู้ใช้
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // เข้ารหัสผ่านใช้ bcrypt เพื่อเข้ารหัสรหัสผ่านก่อนเก็บลงฐานข้อมูล
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
        //ถ้าไม่พบผู้ใช้ จะส่ง error กลับไปทันทีว่า “Invalid credentials” (ข้อมูลล็อกอินไม่ถูกต้อง)
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // ตรวจสอบรหัสผ่านใช้ bcrypt.compare() เพื่อเปรียบเทียบรหัสผ่านที่ผู้ใช้กรอกกับรหัสผ่านที่ถูกเข้ารหัสไว้ในฐานข้อมูล
        const isMatch = await bcrypt.compare(account_password, user.account_password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // สร้าง JWT Token
        const token = jwt.sign(
            { account_id: user.account_id, account_email: user.account_email,account_name:user.account_name,account_picture:user.account_picture },
            //ใช้ JWT_SECRET จาก .env เป็นกุญแจลับในการเข้ารหัส
            process.env.JWT_SECRET,
            { expiresIn: '30 m' }  // กำหนดเวลาให้ token หมดอายุใน 30 นาที
        );
        //หากเข้าสู่ระบบสำเร็จ ระบบจะส่ง token กลับไปให้ client เพื่อยืนยันตัวตนในการเรียก API
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

// ----------------------------- qa_value ----------------------------- //

app.get('/qa_value' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT value_id  , value_money FROM qa_value', { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})


// ----------------------------- qa_activity ----------------------------- //

app.get('/qa_activity' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT activity_id , activity_name FROM qa_activity', { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// ----------------------------- qa_emotional ----------------------------- //

app.get('/qa_emotional' , async (req,res) => {
    try {
        await checkConnection();
        const results = await sequelize.query('SELECT emotional_id , emotional_name FROM qa_emotional', { type: QueryTypes.SELECT });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})


// ----------------------------- province ----------------------------- //

app.get('/province/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await checkConnection(); 

        const results = await sequelize.query(
            `SELECT * FROM (
                SELECT 
                    lr.place_id, 
                    lr.place_theme, 
                    lr.place_name, 
                    lr.place_picture, 
                    lr.place_map, 
                    tp.province_th, 
                    tp.geography_id, 
                    ROW_NUMBER() OVER (PARTITION BY tp.geography_id ORDER BY RAND()) AS result 
                FROM location_region lr 
                JOIN thai_provinces tp ON lr.province_id = tp.province_id 
                JOIN qa_transaction qt ON qt.qa_transaction_id = (
                    SELECT MAX(qa_transaction_id) FROM qa_transaction
                ) 
                JOIN qa_activity qa ON FIND_IN_SET(
                    qa.activity_id,
                    REPLACE(SUBSTRING(qt.activity_interest_id, 2, LENGTH(qt.activity_interest_id) - 2), ' ', '')
                ) > 0 
                WHERE TRIM(LOWER(lr.place_theme)) = TRIM(LOWER(qa.activity_name)) 
                AND tp.geography_id = ?
            ) AS ranked 
            WHERE result <= 6 
            ORDER BY geography_id, result;
            `,
            {
                replacements: [Number(id)],
                type: QueryTypes.SELECT 
            }
        );

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
        const { latitude = null, longitude = null, postcode = null, radius = 200 } = req.query;

        const response = await axios.get("https://search.longdo.com/smartsearch/json/search", {
            params: {
                key: process.env.LONGDO_API_KEY,
                lon: longitude, 
                lat: latitude,
                lat: latitude,
                postcode: postcode,
                limit: 5,
                span: radius, 
                keyword: "food",
                locale: 'th',
                extendedtype: 'findplacefromtext'
            },
        });
        console.log(response)
        res.json(response.data);
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
});

// ✅Test2 OpenAI
async function getRecommendedPlaces(data) {
    // ฟังก์ชันช่วยแปลงข้อมูลจากตัวเลขเป็นข้อความ
    function translateChoice(choice, type) {
        // (ไม่มีการเปลี่ยนแปลงในส่วนนี้)
        switch (type) {
            case 'trip_id':
                switch (choice) {
                    case 1: return 'เดินทางคนเดียว';
                    case 2: return 'เดินทางกับครอบครัว';
                    case 3: return 'เดินทางกับแฟน';
                    case 4: return 'เดินทางกับเพื่อน';
                    case 5: return 'เดินทางกับเพื่อนร่วมงาน';
                    case 6: return 'เดินทางกับเด็ก/ผู้สูงอายุ';
                    case 7: return 'เดินทางกับสัตว์เลี้ยง';
                    default: return 'ไม่ระบุ';
                }
            case 'distance_id':
                switch (choice) {
                    case 1: return '0-50 กิโลเมตร';
                    case 2: return '51-100 กิโลเมตร';
                    case 3: return '101-200 กิโลเมตร';
                    case 4: return 'มากกว่า 200 กิโลเมตร';
                    default: return 'ไม่ระบุ';
                }
            case 'location_interest_id':
                switch (choice) {
                    case 1: return 'คาเฟ่และกิจกรรมต่างๆ';
                    case 2: return 'สวนสาธารณะ';
                    case 3: return 'สวนสนุกและสวนน้ำ';
                    case 4: return 'งานศิลปะและนิทรรศการ';
                    case 5: return 'ธรรมชาติ';
                    case 6: return 'กิจกรรมและผญจภัย';
                    case 7: return 'ตลาดนัดและถนนคนเดิน';
                    case 8: return 'วัดและสถานที่โบราณ';
                    default: return 'ไม่ระบุ';
                }
            case 'activity_id':
                if (!Array.isArray(choice)) return 'ไม่ระบุ';
                return choice.map(activity => {
                    switch (activity) {
                        case 1: return 'ชิมอาหารริมทางและช้อปปิ้งในตลาด';
                        case 2: return 'กิจกรรมผ่อนคลายและฟื้นฟูร่างกาย';
                        case 3: return 'กิจกรรมผจญภัย';
                        case 4: return 'กิจกรรมสำรวจธรรมชาติ';
                        case 5: return 'กิจกรรมทางวัฒนธรรม';
                        case 6: return 'กิจกรรมทางน้ำ';
                        default: return 'ไม่ระบุ';
                    }
                }).join(', ');
            case 'emotional_id':
                switch (choice) {
                    case 1: return 'รู้สึกมีความรัก';
                    case 2: return 'รู้สึกมีความสุข';
                    case 3: return 'รู้สึกสบายๆ';
                    case 4: return 'รู้สึกเศร้า';
                    case 5: return 'รู้สึกเหนื่อยล้า';
                    case 6: return 'รู้สึกหิว';
                    case 7: return 'รู้สึกเซ็ง';
                    case 8: return 'รู้สึกโกรธ';
                    case 9: return 'รู้สึกเบื่อ';
                    case 10: return 'รู้สึกเพิ่งเสร็จงาน';
                    default: return 'ไม่ระบุ';
                }
            case 'value_id':
                switch (choice) {
                    case 1: return '100-500 บาท';
                    case 2: return '550-1,000 บาท';
                    case 3: return '1,500-2,000 บาท';
                    case 4: return '5,500-10,000 บาท';
                }
            default:
                return choice || 'ไม่ระบุ';
        }
    }

    // แปลงข้อมูลที่ผู้ใช้เลือกจากตัวเลขเป็นข้อความ
    const translatedData = {
        trip_id: translateChoice(data.trip_id, 'trip_id'),
        distance_id: translateChoice(data.distance_id, 'distance_id'),
        value_id: translateChoice(data.value_id, 'value_id'),
        location_interest_id: translateChoice(data.location_interest_id, 'location_interest_id'),
        activity_id: translateChoice(data.activity_id, 'activity_id'),
        emotional_id: translateChoice(data.emotional_id, 'emotional_id'),
    };

    // ฟังก์ชันแปลงชื่อสถานที่จากภาษาไทยเป็นภาษาอังกฤษ
    async function translateToEnglish(thaiName) {
        try {
            // ใช้ OpenAI API เพื่อแปลชื่อสถานที่
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ 
                    role: "user", 
                    content: `แปลชื่อสถานที่ท่องเที่ยวในประเทศไทยนี้เป็นภาษาอังกฤษ (ให้ตอบเฉพาะชื่อภาษาอังกฤษเท่านั้น ไม่ต้องมีข้อความอื่น): ${thaiName}` 
                }],
                max_tokens: 1000
            });
            
            // ดึงคำตอบและตัดช่องว่าง
            const englishName = response.choices[0].message?.content?.trim() || thaiName;
            console.log(`Translated: ${thaiName} -> ${englishName}`);
            return englishName;
        } catch (error) {
            console.error("Error translating place name:", error);
            return thaiName; // หากแปลไม่สำเร็จ ให้ใช้ชื่อเดิม
        }
    }

    // ฟังก์ชันดึงรูปภาพจาก Wikimedia API
    async function getWikimediaImage(placeName) {
        try {
            // แปลชื่อสถานที่เป็นภาษาอังกฤษก่อน
            const englishName = await translateToEnglish(placeName);
            
            // สร้างคำค้นหาที่เฉพาะเจาะจงมากขึ้น
            const searchTerms = [
                `${englishName} Bangkok Thailand`,
                `${englishName} Thailand tourism`,
                `${englishName} Thailand`,
                englishName
            ];
            
            // ลองค้นหาด้วยคำค้นหาต่างๆ จนกว่าจะพบรูปภาพ
            for (const searchTerm of searchTerms) {
                // สร้าง URL สำหรับ API request
                const encodedSearchTerm = encodeURIComponent(searchTerm);
                const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodedSearchTerm}&srnamespace=6&format=json&origin=*`;
                
                // ส่ง request ไปยัง Wikimedia API
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                // ตรวจสอบว่ามีผลลัพธ์หรือไม่
                if (data.query && data.query.search && data.query.search.length > 0) {
                    // ดึงชื่อไฟล์ภาพจากผลลัพธ์แรก
                    const fileName = data.query.search[0].title.replace('File:', '');
                    
                    // ตรวจสอบความเกี่ยวข้องของรูปภาพ
                    if (fileName.toLowerCase().includes(englishName.toLowerCase()) || 
                        englishName.toLowerCase().includes(fileName.toLowerCase()) ||
                        searchTerm.toLowerCase().includes(fileName.toLowerCase())) {
                        // สร้าง URL สำหรับรูปภาพ (ดึงข้อมูล URL จริงของรูปภาพ)
                        const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
                        
                        const imageResponse = await fetch(imageInfoUrl);
                        const imageData = await imageResponse.json();
                        
                        // ดึง URL ของรูปภาพ
                        const pages = imageData.query.pages;
                        const pageId = Object.keys(pages)[0];
                        
                        if (pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
                            console.log(`Found image for ${placeName} using search term: ${searchTerm}`);
                            return pages[pageId].imageinfo[0].url;
                        }
                    }
                }
            }
            
            // หากไม่พบรูปภาพในทุกคำค้นหา ให้ใช้รูปภาพตัวอย่าง
            console.log(`No image found for ${placeName}`);
            return `https://f.ptcdn.info/187/024/000/1412581961-PantipPatr-o.jpg`;
        } catch (error) {
            console.error("Error fetching Wikimedia image:", error);
            // กรณีเกิดข้อผิดพลาด ให้ใช้รูปภาพตัวอย่าง
            return `https://f.ptcdn.info/187/024/000/1412581961-PantipPatr-o.jpg`;
        }
    }

    // เก็บรูปภาพที่ใช้แล้วเพื่อป้องกันการซ้ำซ้อน
    const usedImages = new Set();

    // สร้าง prompt เพื่อขอคำแนะนำจาก OpenAI แบบเป็นกันเองมากขึ้น
    const prompt = `
    สวัสดี! ฉันกำลังหาที่เที่ยวสนุกๆ ในเมืองไทยอยู่พอดีเลย✨

    วันนี้ฉันรู้สึก${translatedData.emotional_id}มากๆ เลยอยากออกไปเที่ยวเปลี่ยนบรรยากาศสักหน่อย ตอนนี้ฉันอยู่ที่พิกัด ละติจูด ${data.latitude}, ลองจิจูด ${data.longitude} และอยากออกไปเที่ยวแบบ${translatedData.trip_id} ซึ่งฉันไม่อยากไปไกลมาก อยากไปในระยะ${translatedData.distance_id} ด้วยงบประมาณ${translatedData.value_id} ที่มีอยู่

    ฉันชอบที่เที่ยวแนว${translatedData.location_interest_id} และมองหากิจกรรมแบบ${translatedData.activity_id} เป็นพิเศษ

    ช่วยแนะนำ 5 สถานที่ที่คิดว่าเหมาะกับฉันที่สุดในตอนนี้หน่อยได้มั้ย? แต่ช่วยตอบแบบมีข้อมูลให้ฉันครบถ้วนเลยนะ ทั้งชื่อสถานที่ รายละเอียดน่าสนใจ ที่ตั้ง วันและเวลาเปิด-ปิด รวมถึงระยะทางจากฉันด้วย 

    อ้อ! และเพื่อให้ฉันจัดการข้อมูลง่ายขึ้น ช่วยจัดรูปแบบให้เป็นแบบนี้นะ:

    ชื่อสถานที่ (event_name): [ชื่อ]
    รายละเอียดสั้นๆ (event_description): [ข้อมูลสั้นๆ ที่น่าสนใจ]
    ที่ตั้ง (results_location): [สถานที่ตั้ง]
    วันเปิด (open_day): [วันที่เปิดให้บริการ]
    เวลาเปิด-ปิด (time_schedule): [เวลาทำการ]
    ระยะทางจากฉัน (distance): [ระยะทางโดยประมาณ]

    (แล้วก็ช่วยเว้นบรรทัดระหว่างแต่ละสถานที่ด้วยนะ)

    แนะนำมา 5 ที่เท่านั้นนะ ไม่มากกว่าหรือน้อยกว่า และฉันขอเฉพาะสถานที่ในประเทศไทยที่อยู่ในระยะทางที่ฉันบอกไว้เท่านั้น และช่วยตอบเฉพาะข้อมูลตามรูปแบบด้านบนนะ ไม่ต้องเกริ่นนำหรือสรุปอะไรเพิ่มเติม ขอบคุณมากๆ เลย! 🙏💕
    `;
    console.log("Prompt sent to OpenAI:", prompt); // ตรวจสอบ prompt ที่ส่งไป

    try {
        // เรียกใช้ OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 5000
        });
    
        // ตรวจสอบ response ก่อนใช้
        if (!response.choices || response.choices.length === 0) {
            throw new Error("No response from OpenAI API");
        }
    
        // ดึงคำตอบจาก API
        const recommendation = response.choices[0].message?.content?.trim() || "ไม่พบคำแนะนำ";
        console.log("OpenAI Response:", recommendation);
    
        // แยกคำแนะนำออกเป็น 5 สถานที่
        const recommendations = recommendation.split('\n\n').filter(rec => rec.trim() !== '');
    
        // สร้างผลลัพธ์สำหรับแต่ละสถานที่
        const results = [];
        
        // แก้ไขรูปแบบการแยกวิเคราะห์ให้แม่นยำขึ้น
        for (let i = 0; i < Math.min(recommendations.length, 5); i++) {
            const rec = recommendations[i];
            const placeInfo = {};
            
            // แยกข้อมูลแต่ละบรรทัดด้วยวิธีที่แม่นยำกว่า
            const lines = rec.split('\n');
            
            // ประมวลผลแต่ละบรรทัด
            for (const line of lines) {
                // ใช้ regex เพื่อแยกชื่อฟิลด์และค่า
                const match = line.match(/^(.+?)\s*:\s*(.+)$/);
                if (match) {
                    const fullField = match[1].trim();
                    const value = match[2].trim();
                    
                    // แยกชื่อฟิลด์จากวงเล็บ
                    const fieldMatch = fullField.match(/^(.+?)\s*\((.+?)\)$/);
                    if (fieldMatch) {
                        const fieldName = fieldMatch[2]; // เช่น event_name, event_description
                        placeInfo[fieldName] = value;
                    }
                }
            }
            
            // หากไม่พบชื่อสถานที่ จัดการข้อมูลตามแบบเดิม
            if (!placeInfo.event_name) {
                console.log("ไม่พบรูปแบบที่ถูกต้อง สำหรับสถานที่ที่", i + 1, "ข้อมูล:", rec);
                
                // ใช้วิธีการเดิมเป็น fallback
                const eventName = lines[0]?.split(': ')[1]?.trim();
                const eventDescription = lines[1]?.split(': ')[1]?.trim();
                const resultsLocation = lines[2]?.split(': ')[1]?.trim();
                const openDay = lines[3]?.split(': ')[1]?.trim();
                const timeSchedule = lines[4]?.split(': ')[1]?.trim();
                const distance = lines[5]?.split(': ')[1]?.trim();
                
                // ใส่ข้อมูลที่ได้กลับเข้าไปใน placeInfo
                if (eventName) placeInfo.event_name = eventName;
                if (eventDescription) placeInfo.event_description = eventDescription;
                if (resultsLocation) placeInfo.results_location = resultsLocation;
                if (openDay) placeInfo.open_day = openDay;
                if (timeSchedule) placeInfo.time_schedule = timeSchedule;
                if (distance) placeInfo.distance = distance;
            }
            
            // ตรวจสอบว่ายังมีข้อมูลไม่ครบหรือไม่ และใส่ค่าเริ่มต้น
            const eventName = placeInfo.event_name || "";
            const eventDescription = placeInfo.event_description || "ไม่มีรายละเอียด";
            const resultsLocation = placeInfo.results_location || "ไม่ระบุที่ตั้ง";
            const openDay = placeInfo.open_day || "เปิดบริการทุกวัน";
            const timeSchedule = placeInfo.time_schedule || "10:00-22:00";
            const distance = placeInfo.distance || translatedData.distance_id;
            
            // ตรวจสอบว่ามีชื่อสถานที่หรือไม่
            if (!eventName || eventName === "") {
                console.log(`สถานที่ที่ ${i + 1} ไม่มีชื่อ ข้าม...`);
                continue; // ข้ามสถานที่ที่ไม่มีชื่อ
            }

            // ดึงรูปภาพจาก Wikimedia API โดยใช้ชื่อสถานที่
            let resultsImgUrl = await getWikimediaImage(eventName);
            
            // ตรวจสอบว่ารูปภาพนี้ถูกใช้แล้วหรือไม่
            let attemptCount = 0;
            while (usedImages.has(resultsImgUrl) && attemptCount < 3) {
                console.log(`Image duplicate detected for ${eventName}, trying alternative...`);
                // ลองค้นหาอีกครั้งโดยเพิ่มคำอื่นๆ
                resultsImgUrl = await getWikimediaImage(eventName + " attraction " + attemptCount);
                attemptCount++;
            }
            
            // เพิ่มรูปภาพที่ใช้แล้วเข้าไปในเซต
            usedImages.add(resultsImgUrl);
    
            // กำหนดข้อมูลแต่ละสถานที่
            results.push({
                results_id: i + 1,
                event_name: eventName, // ใช้ชื่อจริงที่ได้จาก AI
                event_description: eventDescription,
                open_day: openDay,
                time_schedule: timeSchedule,
                results_location: resultsLocation,
                results_img_url: resultsImgUrl,
                distance: distance
            });
        }

        // ตรวจสอบว่าได้ข้อมูลอย่างน้อย 1 สถานที่
        if (results.length === 0) {
            console.error("ไม่พบข้อมูลสถานที่ที่ถูกต้องจาก API");
            throw new Error("Invalid place data format received from OpenAI API");
        }

        // จำกัดให้มีเฉพาะ 5 สถานที่
        if (results.length > 5) {
            results.splice(5); // ตัดให้เหลือเพียง 5 สถานที่
        }
        
        // ล็อกข้อมูลก่อนส่งกลับ เพื่อตรวจสอบ
        console.log("Final results:", JSON.stringify(results, null, 2));
        
        return results;
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        throw error;
    }
}

// ✅ฟังก์ชันบันทึกผลลัพธ์ลงใน qa_results
async function saveResultsToDb(results, account_id, transaction) {
    // ตรวจสอบว่ามีผลลัพธ์หรือไม่
    if (!results || results.length === 0) {
        console.log("No results to save.");
        return; // ถ้าไม่มีผลลัพธ์ให้บันทึกเลย
    }

    const query = `
        INSERT INTO qa_results 
        (account_id, event_name, event_description, open_day, results_location, time_schedule, results_img_url, distance)
        VALUES (:account_id, :event_name, :event_description, :open_day, :results_location, :time_schedule, :results_img_url, :distance)
    `;

    try {
        for (const result of results) {
            // ใส่การจัดการ error เฉพาะการบันทึกแต่ละ record เพื่อไม่ให้ error ของการบันทึกครั้งเดียวทำให้ทั้งหมดล้มเหลว
            try {
                await sequelize.query(query, {
                    replacements: {
                        account_id,
                        event_name: result.event_name || null,
                        event_description: result.event_description || null,
                        open_day: result.open_day || null,
                        results_location: result.results_location || null,
                        time_schedule: result.time_schedule || null,
                        results_img_url: result.results_img_url || null,
                        distance: result.distance || null
                    },
                    type: Sequelize.QueryTypes.INSERT,
                    transaction // ใช้ transaction ในการบันทึก
                });
            } catch (error) {
                console.error(`Error saving result: ${result.event_name || "Unknown"}`, error);
                // คุณสามารถเลือกที่จะข้ามหรือบันทึกต่อไปเมื่อพบ error ของผลลัพธ์บางอัน
                // หรือจะโยน error ออกไปให้ฟังก์ชันที่เรียกใช้งานจัดการต่อ
            }
        }
        console.log("Results saved successfully!");
    } catch (error) {
        console.error("Error saving results to database:", error);
        throw error; // ปล่อยให้ error ถูกจัดการในระดับสูง
    }
}

// ✅ดึงข้อมูล qa_transaction
app.get('/qa_transaction', async (req, res) => {
    try {
        const query = `
            SELECT
                qa_transaction.qa_transaction_id,
                qa_transaction.account_id,
                qa_traveling.traveling_choice,
                qa_distance.distance_km,
                qa_value.value_money,
                qa_picture.theme AS location_interest,
                GROUP_CONCAT(qa_activity.activity_name ORDER BY qa_activity.activity_name) AS activity_interest,
                qa_emotional.emotional_name,
                qa_transaction.longitude,
                qa_transaction.latitude
            FROM qa_transaction
            LEFT JOIN qa_traveling ON qa_transaction.trip_id = qa_traveling.traveling_id
            LEFT JOIN qa_distance ON qa_transaction.distance_id = qa_distance.distance_id
            LEFT JOIN qa_picture ON qa_transaction.location_interest_id = qa_picture.picture_id
            LEFT JOIN qa_activity 
                ON FIND_IN_SET(qa_activity.activity_id, REPLACE(REPLACE(qa_transaction.activity_id, '[', ''), ']', ''))
            LEFT JOIN qa_emotional ON qa_transaction.emotional_id = qa_emotional.emotional_id
            LEFT JOIN qa_value ON qa_transaction.value_id = qa_value.value_id
            GROUP BY
                qa_transaction.qa_transaction_id,
                qa_transaction.account_id,
                qa_traveling.traveling_choice,
                qa_distance.distance_km,
                qa_value.value_money,
                qa_picture.theme,
                qa_emotional.emotional_name,
                qa_transaction.longitude,
                qa_transaction.latitude;
        `;

        const results = await sequelize.query(query, {
            type: Sequelize.QueryTypes.SELECT
        });

        res.json({ success: true, data: results });

    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ success: false, error: "Database query failed" });
    }
});


// ✅บันทึกข้อมูลคำตอบของ QA จาก User
app.post('/qa_transaction', async (req, res) => {
    const transaction = await sequelize.transaction(); // Use transaction for the initial query
    try {
        console.log("🟢 Start Transaction");

        const { latitude, longitude, trip_id, distance_id, value_id, location_interest_id, activity_id, emotional_id } = req.body;

        if (!latitude || !longitude || !trip_id || !distance_id || !value_id || !location_interest_id || !Array.isArray(activity_id), !emotional_id) {
            return res.status(400).json({ success: false, message: "Missing or invalid required fields." });
        }

        console.log("🟢 Data validated:", req.body);

        const activityInterestJSON = JSON.stringify(activity_id);
        let account_id = 0;

        // ✅ Insert the main transaction data
        const sql = `
            INSERT INTO qa_transaction (account_id, latitude, longitude, trip_id, distance_id, value_id, location_interest_id, activity_id, emotional_id) 
            VALUES (:account_id, :latitude, :longitude, :trip_id, :distance_id, :value_id, :location_interest_id, :activity_id, :emotional_id)
        `;

        const [result] = await sequelize.query(sql, {
            replacements: { account_id, latitude, longitude, trip_id, distance_id, value_id, location_interest_id, activity_id: activityInterestJSON, emotional_id },
            type: Sequelize.QueryTypes.INSERT,
            transaction
        });

        if (result) {
            account_id = result; // Get the account_id from the insert result

            // ✅ Update account_id in transaction
            const updateSql = `UPDATE qa_transaction SET account_id = :account_id WHERE qa_transaction_id = :qa_transaction_id`;
            await sequelize.query(updateSql, {
                replacements: { account_id, qa_transaction_id: account_id },
                type: Sequelize.QueryTypes.UPDATE,
                transaction
            });

            // ✅ Commit the transaction for the main transaction insertion
            await transaction.commit();
            console.log("Transaction committed.");

            // ✅ Now, handle OpenAI results separately
            try {
                const openAIResults = await getRecommendedPlaces({
                    latitude,
                    longitude,
                    trip_id,
                    distance_id,
                    value_id,
                    location_interest_id,
                    activity_id,
                    emotional_id
                });

                // You can use a separate transaction here if you want to keep the OpenAI results atomic
                const newTransaction = await sequelize.transaction();

                try {
                    await saveResultsToDb(openAIResults, account_id, newTransaction);
                    await newTransaction.commit(); // Commit the new transaction for OpenAI results
                    console.log("OpenAI results saved and transaction committed.");
                } catch (aiError) {
                    console.error("Error saving OpenAI results:", aiError);
                    await newTransaction.rollback(); // Rollback if OpenAI processing fails
                }

            } catch (aiError) {
                console.error("OpenAI processing error:", aiError);
            }

            // ✅ Send the response
            res.json({
                success: true,
                message: "Transaction saved and account_id updated successfully!",
                data: { account_id, latitude, longitude, trip_id, distance_id, value_id, location_interest_id, activity_id, emotional_id}
            });
        } else {
            await transaction.rollback(); // Rollback if the main transaction fails
            res.status(500).json({ success: false, message: "Failed to save transaction." });
        }

    } catch (error) {
        await transaction.rollback();
        console.error("Error saving transaction:", error);
        res.status(500).json({ success: false, error: "Internal server error." });
    }
});

// ✅ดึงข้อมูล qa_results
app.get('/qa_results', async (req, res) => {
    try {
        const query = `SELECT * FROM qa_results`;

        // ใช้ async/await และ QueryTypes.SELECT
        const results = await sequelize.query(query, { type: Sequelize.QueryTypes.SELECT });

        res.json(results);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database query failed" });
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});