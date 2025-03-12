import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    const devices = await req.json(); // รับข้อมูลจาก body

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุข้อมูล IP และ packageName' }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb'); // พาธของ adb

    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          for (let device of devices) {
            const { ip, packageName } = device; // ดึงค่า ip และ packageName จากแต่ละอุปกรณ์
            console.log(`🌐 กำลังเปิดแอป ${packageName} บนอุปกรณ์ที่มี IP: ${ip}`); // แสดงข้อความขณะเปิดแอป

            try {
              const result = await new Promise((resolve) => {
                exec(`${adbPath} -s ${ip} shell monkey -p ${packageName} 1`, (err, stdout, stderr) => {
                  let status = 'เปิดแอปไม่สำเร็จ';
                  let message = `ไม่สามารถเปิดแอป ${packageName} บนอุปกรณ์ที่ ${ip} ได้`;
                  let adbMessage = `adb message: ${stdout}`;

                  // ตรวจสอบ stdout ว่าเปิดแอปสำเร็จหรือไม่
                  if (stdout.includes("Events injected")) {
                    status = 'เปิดแอปสำเร็จ';
                    message = `เปิดแอป ${packageName} บนอุปกรณ์ที่ ${ip} สำเร็จ`;
                  } else if (stdout.includes("No activities found to run")) {
                    status = 'แอปยังไม่ได้ติดตั้ง';
                    message = `ไม่พบแอป ${packageName} บนอุปกรณ์ที่ ${ip}`;
                  }

                  // ตรวจสอบ error message
                  if (err) {
                    adbMessage = `adb message stdout: ${stdout}`;
                  }

                  if (stderr) {
                    adbMessage = `adb message stderr: ${stderr}`;
                  }

                  resolve({ ip, status, message, adbMessage });
                });
              });

              // ส่งข้อมูลไปยัง frontend ทันทีหลังจากการเปิดแอปเสร็จ
              const messageToSend = JSON.stringify(result) + "\n";
              controller.enqueue(new TextEncoder().encode(messageToSend)); // ส่งข้อมูลเป็นบรรทัดๆ
            } catch (error) {
              console.error('❌ Error:', error);
              const errorMessage = JSON.stringify({
                ip: device.ip,
                status: 'เปิดแอปไม่สำเร็จ',
                message: `ไม่สามารถเปิดแอป ${packageName} บนอุปกรณ์ที่ ${ip} ได้`,
                adbMessage: `error: ${error.message}`,
              }) + "\n";
              controller.enqueue(new TextEncoder().encode(errorMessage)); // ส่งข้อความข้อผิดพลาดไปยัง frontend
            }
          }
          controller.close(); // เมื่อเสร็จสิ้นทั้งหมด
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
        message: 'เกิดข้อผิดพลาดในการเปิดแอป',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
