import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    // รับข้อมูลจาก body
    const devices = await req.json();  // ดึงข้อมูลทั้งหมดจาก body (รวมถึง ip และ packageName)
    
    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุข้อมูล IP และ packageName' }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb'); // พาธของ adb
    const results = [];

    // ลูปเปิดแอปบนอุปกรณ์ทุกตัว
    for (let device of devices) {
      const { ip, packageName } = device;  // ดึงค่า ip และ packageName จากแต่ละอุปกรณ์
      console.log(`🌐 กำลังเปิดแอป ${packageName} บนอุปกรณ์ที่มี IP: ${ip}`);  // แสดงข้อความขณะเปิดแอป

      const result = await new Promise((resolve) => {
        exec(`${adbPath} -s ${ip} shell monkey -p ${packageName} 1`, (err, stdout, stderr) => {
          let status = 'เปิดแอปสำเร็จ'; // ค่าดีฟอลต์เป็นเปิดแอปสำเร็จ
          let message = `เปิดแอป ${packageName} บนอุปกรณ์ที่ ${ip} สำเร็จ`;
          let adbMessage = `adb message: ${stdout}`;

          if (err) {
            status = 'เปิดแอปไม่สำเร็จ';
            message = `ไม่สามารถเปิดแอป ${packageName} บนอุปกรณ์ที่ ${ip} ได้`;
            adbMessage = `adb message stdout: ${stdout}`;
          }

          console.log(message);
          resolve({ ip, status, message, adbMessage });
        });
      });

      results.push(result);
    }

    // ส่งผลลัพธ์กลับไป
    return new Response(
      JSON.stringify({
        message: 'การเปิดแอปเสร็จสิ้น',
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
        message: 'เกิดข้อผิดพลาดในการเปิดแอป',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
