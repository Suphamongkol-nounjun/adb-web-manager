import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    // รับค่า IP จาก body
    const { ip } = await req.json();

    if (!ip) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุ IP' }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb'); // พาธของ adb

    console.log(`🌐 กำลังเชื่อมต่อ ADB ไปที่ ${ip}`);

    const result = await new Promise((resolve) => {
      exec(`${adbPath} connect ${ip}`, (error, stdout, stderr) => {
        let status = 'connected'; // ค่าเริ่มต้นเป็นเชื่อมต่อสำเร็จ
        let message = `เชื่อมต่อ ADB กับ ${ip} สำเร็จ`;
        let meaagefromadb = `adb message: ${stdout}`;

        // ตรวจสอบ stdout ว่ามี "cannot connect to" หรือไม่
        if (stdout.includes('cannot connect to')) {
          status = "can't connect";
          message = `ไม่สามารถเชื่อมต่อ ADB กับ ${ip}`;
          meaagefromadb = `adb message: ${stdout}`;
        }

        console.log(message);
        resolve({ ip, status, message, meaagefromadb });
      });
    });

    // ส่งผลลัพธ์กลับไป
    return new Response(
      JSON.stringify(result), // ส่งแค่ result ของเครื่องเดียว
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
