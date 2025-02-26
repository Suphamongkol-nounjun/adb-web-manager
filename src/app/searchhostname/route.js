import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    // ดึง hostname จาก body
    const { hostname } = await req.json();

    if (!hostname) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุ hostname' }),
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'src', 'app', 'json', 'scan_results.json');

    // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
    if (!fs.existsSync(filePath)) {
      return new Response(
        JSON.stringify({ message: 'ไม่พบไฟล์ scan_results.json' }),
        { status: 404 }
      );
    }

    // อ่านไฟล์ JSON
    const data = fs.readFileSync(filePath, 'utf-8');
    const results = JSON.parse(data);

    // ค้นหาข้อมูลที่มี hostname ใกล้เคียงจาก results
    const regex = new RegExp(hostname, 'i');  // 'i' ทำให้ค้นหาตัวอักษรไม่สนใจตัวเล็กตัวใหญ่

    const matchedResults = results.filter(device =>
      regex.test(device.hostname)  // ตรวจสอบว่า hostname ตรงกับ pattern หรือไม่
    );

    // ส่งผลลัพธ์กลับไป
    if (matchedResults.length > 0) {
      return new Response(
        JSON.stringify({ data: matchedResults }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ message: 'ไม่พบ hostname ที่ตรงกัน' }),
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการค้นหา hostname',
        error: error.message
      }),
      { status: 500 }
    );
  }
}
