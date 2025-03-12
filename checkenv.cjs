// checkEnv.js
const dotenv = require('dotenv');

// โหลดค่าจากไฟล์ .env
dotenv.config();

function checkEnv() {
  // ตรวจสอบค่า NEXT_PUBLIC_ENV
  const environment = process.env.NEXT_PUBLIC_ENV || 'dev'; 
  console.log(`Environment: ${environment}`); // พิมพ์ค่า environment ที่ได้รับ
  return environment; // ส่งค่ากลับ
}

// ส่งฟังก์ชันออกมาให้ใช้งานในไฟล์อื่นๆ
module.exports = { checkEnv };
