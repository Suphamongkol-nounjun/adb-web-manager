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

    console.log(`🌐 กำลังยกเลิกการเชื่อมต่อ ADB ไปที่ ${ip}`);

    const result = await new Promise((resolve) => {
      exec(`"${adbPath}" disconnect ${ip}`, (error, stdout, stderr) => {
        let status = 'disconnected'; // ค่าเริ่มต้นเป็นเชื่อมต่อสำเร็จ
        let message = `ยกเลิกการเชื่อมต่อ ADB กับ ${ip} สำเร็จ`;
        let meaagefromadb = `adb message: ${stdout}`;

        // ตรวจสอบ stdout ว่ามี "cannot connect to" หรือไม่
        if (stdout.includes('error: no such device')) {
          status = "This ip disconnect already";
          message = `ยกเลิกการเชื่อมต่อกับ ${ip} แล้ว`;
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
        message: 'เกิดข้อผิดพลาดในการยกเลิกเชื่อมต่อ ADB',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
