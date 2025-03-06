import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    // รับข้อมูลจาก body
    const devices = await req.json();  // ดึงข้อมูลทั้งหมดจาก body (รวมถึง ip, packageName)
    
    if (!Array.isArray(devices) || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุข้อมูล IP และ packageName อย่างถูกต้อง' }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb'); // พาธของ adb

    const results = [];

    // ลูปเช็คเวอร์ชันจาก IP และ packageName ที่ได้รับ
    for (let device of devices) {
      const { ip, packageName } = device;  // ดึงแค่ ip และ packageName จากแต่ละอุปกรณ์
      console.log(`🌐 กำลังตรวจสอบเวอร์ชันของ package ${packageName} ที่ติดตั้งใน ${ip}`);  // แสดงข้อความขณะตรวจสอบ

      const result = await new Promise((resolve) => {
        exec(`${adbPath} -s ${ip} shell dumpsys package ${packageName} | findstr versionName`, (err, stdout, stderr) => {
          let version = 'ไม่พบเวอร์ชัน';  // ค่าดีฟอลต์เป็น "ไม่พบเวอร์ชัน"

          if (err) {
            version = 'ไม่สามารถดึงข้อมูลเวอร์ชันได้';
          } else {
            // ดึง versionName จากผลลัพธ์ของ dumpsys
            const versionMatch = stdout.match(/versionName=(\S+)/);
            if (versionMatch && versionMatch[1]) {
              version = versionMatch[1];  // ถ้ามีการจับคู่ versionName
            }
          }

          resolve({ ip, packageName, currentVersion });
        });
      });

      results.push(result);
    }

    // ส่งผลลัพธ์กลับไป
    return new Response(
      JSON.stringify({
        message: 'การตรวจสอบเวอร์ชันเสร็จสิ้น',
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
        message: 'เกิดข้อผิดพลาดในการตรวจสอบเวอร์ชัน',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
