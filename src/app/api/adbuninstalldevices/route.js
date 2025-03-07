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

    // สร้าง ReadableStream เพื่อส่งข้อมูลกลับไปยัง frontend แบบ real-time
    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          // ลูปถอนการติดตั้ง APK บนอุปกรณ์ทุกตัว
          for (let device of devices) {
            const { ip, packageName } = device;  // ดึงค่า ip และ packageName จากแต่ละอุปกรณ์
            console.log(`🌐 กำลังถอนการติดตั้ง APK ที่ ${packageName} บนอุปกรณ์ที่มี IP: ${ip}`);  // แสดงข้อความขณะถอนการติดตั้ง

            try {
              const result = await new Promise((resolve) => {
                exec(`${adbPath} -s ${ip} uninstall ${packageName}`, (err, stdout, stderr) => {
                  let status = 'ถอนการติดตั้งสำเร็จ'; // ค่าดีฟอลต์เป็นถอนการติดตั้งสำเร็จ
                  let message = `ถอนการติดตั้ง APK ที่ ${packageName} บนอุปกรณ์ที่ ${ip} สำเร็จ`;
                  let adbMessage = `adb message: ${stdout}`;

                  if (err) {
                    status = 'ถอนการติดตั้งไม่สำเร็จ';
                    message = `ไม่สามารถถอนการติดตั้ง APK ที่ ${packageName} บนอุปกรณ์ที่ ${ip} ได้`;
                    adbMessage = `adb message: ${stdout}`;
                  }
                  if (stderr) {
                    status = 'ถอนการติดตั้งไม่สำเร็จ';
                    message = `ไม่สามารถถอนการติดตั้ง APK ที่ ${packageName} บนอุปกรณ์ที่ ${ip} ได้`;
                    adbMessage = `adb message: ${stderr}`;
                  }

                  resolve({ ip, status, message, adbMessage });
                });
              });

              // ส่งข้อมูลไปยัง frontend ทันทีหลังจากการถอนการติดตั้งเสร็จ
              const messageToSend = JSON.stringify(result) + "\n";
              controller.enqueue(new TextEncoder().encode(messageToSend));  // ส่งข้อมูลเป็นบรรทัดๆ

            } catch (error) {
              console.error('❌ Error:', error);
              const errorMessage = JSON.stringify({
                ip: device.ip,
                status: 'ถอนการติดตั้งไม่สำเร็จ',
                message: `ไม่สามารถถอนการติดตั้ง APK ที่ ${packageName} บนอุปกรณ์ที่ ${ip} ได้`,
                adbMessage: `error: ${error.message}`,
              }) + "\n";
              controller.enqueue(new TextEncoder().encode(errorMessage));  // ส่งข้อความข้อผิดพลาดไปยัง frontend
            }
          }
          controller.close();  // เมื่อเสร็จสิ้นทั้งหมด
        })().catch((err) => {
          console.error('Stream error:', err);
          controller.error(err);
        });
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการถอนการติดตั้ง APK',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
