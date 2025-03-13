# ใช้ Node.js เวอร์ชันที่ต้องการ (เช่น 18)
FROM node:18

# กำหนดโฟลเดอร์ทำงานใน container
WORKDIR /usr/src/app

# คัดลอกไฟล์ package.json และติดตั้ง dependencies
COPY package*.json ./
RUN npm install

# คัดลอกไฟล์ทั้งหมดเข้า container
COPY . .

# กำหนดพอร์ตที่ต้องการใช้
EXPOSE 3000

# คำสั่งรันเซิร์ฟเวอร์
CMD ["npm", "start"]
