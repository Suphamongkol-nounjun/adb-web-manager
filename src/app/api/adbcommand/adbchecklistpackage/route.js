import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    // รับข้อมูลจาก body
    const devices = await req.json();

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุข้อมูล IP' }),
        { status: 400 }
      );
    }

    // พาธของ adb
    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb');
    const results = [];

    // ลูปดึงแพ็กเกจจากทุกอุปกรณ์
    for (let device of devices) {
      const { ip } = device; // ดึงแค่ IP จากแต่ละอุปกรณ์
      console.log(`🌐 กำลังดึงแพ็กเกจจากอุปกรณ์ ${ip}`); // แสดงข้อความขณะดึงข้อมูล

      const result = await new Promise((resolve) => {
        exec(`${adbPath} -s ${ip} shell pm list packages`, (error, stdout, stderr) => {
          let status = 'success'; // ตั้งค่าเริ่มต้นเป็นสำเร็จ
          let packagesList = [];
          let message = `ดึงข้อมูลแพ็กเกจจาก ${ip} สำเร็จ`;

          // ตรวจสอบว่ามีข้อผิดพลาดหรือไม่
          if (error || stderr) {
            status = 'failed';
            message = `เกิดข้อผิดพลาดในการดึงแพ็กเกจจาก ${ip}`;
            console.error(`❌ Error: ${stderr || error.message}`);
          } else {
            // แยกข้อมูลจากผลลัพธ์ของ adb
            packagesList = stdout
              .split('\n')
              .filter((line) => line) // กรองเอาเฉพาะบรรทัดที่ไม่ว่าง
              .map((line) => line.replace('package:', '').replace('\r', '')); // ลบคำว่า "package:" และ \r ออก

            console.log(`✅ ผลลัพธ์จาก ADB (${ip}):`, packagesList);
          }

          resolve({ ip, status, message, packages: packagesList });
        });
      });

      results.push(result);
    }

    // ส่งผลลัพธ์กลับไป
    return new Response(
      JSON.stringify({
        message: 'ดึงแพ็กเกจจากอุปกรณ์เสร็จสิ้น',
        results: results, // ส่งผลลัพธ์ทั้งหมดกลับไป
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
