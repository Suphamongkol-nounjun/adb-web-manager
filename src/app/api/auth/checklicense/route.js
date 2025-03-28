import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    // ดึง License Key จาก body
    const { licenseKey } = await req.json();

    if (!licenseKey) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุ License Key' }),
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'src', 'license.json');  // เปลี่ยนเป็น path ของ license.json
    console.log("License file path: ", filePath);

    // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
    if (!fs.existsSync(filePath)) {
      return new Response(
        JSON.stringify({ message: 'ไม่พบไฟล์ license.json' }),
        { status: 404 }
      );
    }

    // อ่านไฟล์ JSON
    const data = fs.readFileSync(filePath, 'utf-8');
    const licenseData = JSON.parse(data);

    // ตรวจสอบว่า License Key ที่ส่งมามีอยู่ในไฟล์หรือไม่
    if (licenseData.licenses.includes(licenseKey)) {
      return new Response(
        JSON.stringify({ valid: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ valid: false, message: 'License Key ไม่ถูกต้อง' }),
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการตรวจสอบ License Key',
        error: error.message
      }),
      { status: 500 }
    );
  }
}
