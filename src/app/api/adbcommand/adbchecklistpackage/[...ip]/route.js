import { exec } from 'child_process';
import path from 'path';

export async function GET(request, { params }) {
  try {
    // รับค่า IP จาก params
    const { ip } = params; // ไม่ต้องใช้ await เพราะ params มาแล้ว

    if (!ip) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'กรุณาระบุ IP ของอุปกรณ์',
        }),
        { status: 400 }
      );
    }

    // กำหนดพาธของ adb
    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb');

    // แสดงพาธของ adb ที่ใช้
    // console.log(`กำลังรันคำสั่ง adb ด้วยพาธ: ${adbPath}`);

    // รันคำสั่ง adb -s เพื่อดึงรายชื่อแพ็กเกจทั้งหมดจากอุปกรณ์
    const result = await new Promise((resolve, reject) => {
      exec(`${adbPath} -s ${ip} shell pm list packages`, (error, stdout, stderr) => {
        if (error) {
          reject(`exec error: ${error}`);
        }

        // ตรวจสอบว่า stderr มีข้อความอะไรหรือไม่
        if (stderr) {
          reject(`stderr: ${stderr}`);
        }

        // แสดงผลลัพธ์จากคำสั่ง adb
        // console.log(`ผลลัพธ์จากคำสั่ง adb pm list packages:\n${stdout}`);
        resolve(stdout);
      });
    });

    // แยกข้อมูลจากผลลัพธ์ของ adb
      const packagesList = result.split('\n')
      .filter(line => line)  // กรองเอาเฉพาะบรรทัดที่ไม่ว่าง
      .map(line => line.replace('package:', '').replace('\r', '')); // ลบคำว่า "package:" และ \r ออก

      // แสดงรายการแพ็กเกจที่ติดตั้งในอุปกรณ์
      // console.log('รายการแพ็กเกจที่ติดตั้งในอุปกรณ์:', packagesList);

    // ส่งผลลัพธ์กลับไป
    return new Response(
      JSON.stringify({
        message: 'แสดงรายการแพ็กเกจจากอุปกรณ์',
        packages: packagesList,
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
