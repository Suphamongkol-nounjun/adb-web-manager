import { exec } from 'child_process';
import path from 'path';

export async function GET(req) {
  try {
    // กำหนดพาธของ adb
    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb');
    
    // แสดงพาธของ adb ที่ใช้
    console.log(`กำลังรันคำสั่ง adb ด้วยพาธ: ${adbPath}`);

    // รันคำสั่ง adb devices
    const result = await new Promise((resolve, reject) => {
      exec(`${adbPath} devices`, (error, stdout, stderr) => {
        if (error) {
          reject(`exec error: ${error}`);
        }

        // ตรวจสอบว่า stderr มีข้อความอะไรหรือไม่
        if (stderr) {
          reject(`stderr: ${stderr}`);
        }

        // แสดงผลลัพธ์จากคำสั่ง adb
        console.log(`ผลลัพธ์จากคำสั่ง adb devices:\n${stdout}`);
        resolve(stdout);
      });
    });

    // แยกข้อมูลจากผลลัพธ์ของ adb devices
    const devicesList = result.split('\n')
      .slice(1, -1)  // ตัดบรรทัดแรกและสุดท้ายออก
      .map(line => {
        const [deviceId, status] = line.trim().split('\t');
        return { deviceId, status };
      })
      .filter(device => device.deviceId);  // กรองเอาเฉพาะข้อมูลที่มี deviceId

    // แสดงรายการอุปกรณ์ที่เชื่อมต่อ
    console.log('รายการอุปกรณ์ที่เชื่อมต่อผ่าน ADB:', devicesList);

    // ส่งผลลัพธ์กลับไป
    return new Response(
      JSON.stringify({
        message: 'แสดงรายการอุปกรณ์ที่เชื่อมต่อผ่าน ADB',
        devices: devicesList,
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
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก ADB',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
