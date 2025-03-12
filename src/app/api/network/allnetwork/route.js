import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(),'src','app', 'json', 'scan_results.json');
    
    // สร้าง JSON response ที่บอกพาธของไฟล์
    // const response = {
    //   status: 'success',
    //   message: 'ไฟล์ JSON ตั้งอยู่ที่',
    //   filePath: filePath
    // };

    // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
    if (!fs.existsSync(filePath)) {
      response.status = 'error';
      response.message = 'ไม่พบไฟล์';
      return new Response(JSON.stringify(response), { status: 404 });
    }

    // อ่านไฟล์ JSON
    const data = fs.readFileSync(filePath, 'utf-8');
    const results = JSON.parse(data);

    return new Response(JSON.stringify({
      data: results,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการอ่านไฟล์',
      error: error.message 
    }), { status: 500 });
  }
}
