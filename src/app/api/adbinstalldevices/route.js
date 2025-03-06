import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    // รับข้อมูลจาก body
    const devices = await req.json();  // ดึงข้อมูลทั้งหมดจาก body (รวมถึง ip และ existingFile)
    
    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุข้อมูล IP และ existingFile' }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb'); // พาธของ adb
    const results = [];

    // ลูปติดตั้ง APK บนอุปกรณ์ทุกตัว
    for (let device of devices) {
      const { ip, existingFile } = device;  // ดึงค่า ip และ existingFile จากแต่ละอุปกรณ์
      const apkPath = path.join(process.cwd(), 'src', 'platform-tools','adb', existingFile); // เส้นทางของไฟล์ APK
      console.log(`🌐 กำลังติดตั้ง APK ที่ ${apkPath} บนอุปกรณ์ที่มี IP: ${ip}`);  // แสดงข้อความขณะติดตั้ง

      const result = await new Promise((resolve) => {
        exec(`${adbPath} -s ${ip} install ${apkPath}`, (err, stdout, stderr) => {
          let status = 'ติดตั้งสำเร็จ'; // ค่าดีฟอลต์เป็นติดตั้งสำเร็จ
          let message = `ติดตั้ง APK ที่ ${apkPath} บนอุปกรณ์ที่ ${ip} สำเร็จ`;
          let adbMessage = `adb message: ${stdout}`;

          if (err) {
            status = 'ติดตั้งไม่สำเร็จ';
            message = `ไม่สามารถติดตั้ง APK บนอุปกรณ์ที่ ${ip} ได้`;
            adbMessage = `adb message: ${stdout}`;
          }
          if (stderr) {
            status = 'ติดตั้งไม่สำเร็จ';
            message = `ไม่สามารถติดตั้ง APK บนอุปกรณ์ที่ ${ip} ได้`;
            adbMessage = `adb message: ${stderr}`;
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
        message: 'การติดตั้ง APK เสร็จสิ้น',
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
        message: 'เกิดข้อผิดพลาดในการติดตั้ง APK',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
