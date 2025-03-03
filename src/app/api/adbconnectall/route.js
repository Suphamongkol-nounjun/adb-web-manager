import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    // รับข้อมูลจาก body
    const devices = await req.json();  // ดึงข้อมูลทั้งหมดจาก body (รวมถึง ip, mac, hostname)
    
    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุข้อมูล IP' }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb'); // พาธของ adb

    const results = [];

    // ลูปเชื่อมต่อทุก IP ที่ได้รับ
    for (let device of devices) {
      const { ip } = device;  // ดึงแค่ ip จากแต่ละอุปกรณ์
      console.log(`🌐 กำลังเชื่อมต่อ ADB ไปที่ ${ip}`);  // แสดงข้อความขณะเชื่อมต่อ

      const result = await new Promise((resolve) => {
        exec(`${adbPath} connect ${ip}`, (error, stdout, stderr) => {
          let status = 'connected'; // ตั้งค่าดีฟอลต์เป็นเชื่อมต่อสำเร็จ
          let message = `เชื่อมต่อ ADB กับ ${ip} สำเร็จ`;
          let meaagefromadb = `adb message: ${stdout}`;

          // ตรวจสอบว่า stdout มีคำว่า "cannot connect to" หรือไม่
          if (stdout.includes('cannot connect to')) {
            status = "can't connect";
            message = `ไม่สามารถเชื่อมต่อ ADB กับ ${ip} ได้`;
            meaagefromadb = `adb message: ${stdout}`;
          }
          if (stdout.includes('failed to authenticate')) {
            status = "can't connect";
            message = `ไม่สามารถเชื่อมต่อ ADB กับ ${ip} ได้`;
            meaagefromadb = `adb message: ${stdout}`;
          }

          console.log(message);
          resolve({ ip, status, message, meaagefromadb });
        });
      });

      results.push(result);
    }

    // ส่งผลลัพธ์กลับไป
    return new Response(
      JSON.stringify({
        message: 'การเชื่อมต่อ ADB เสร็จสิ้น',
        results: results,  // ส่งผลลัพธ์ทั้งหมดกลับไป
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ ADB',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
