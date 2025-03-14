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
            const { ip, packageName } = device; // ดึงค่า ip และ packageName
            console.log(`🧼 กำลัง Clear Data แอป ${packageName} บนอุปกรณ์ที่มี IP: ${ip}`);

            try {
              const result = await new Promise((resolve) => {
                exec(
                  `"${adbPath}" -s ${ip} shell pm clear ${packageName}`,
                  (err, stdout, stderr) => {
                    let status = 'Clear Data ไม่สำเร็จ';
                    let message = `ไม่สามารถ Clear Data แอป ${packageName} บนอุปกรณ์ที่ ${ip} ได้`;
                    let adbMessage = `adb message: ${stdout}`;

                    if (stderr.includes("Unknown package")) {
                      status = 'แอปยังไม่ได้ติดตั้ง';
                      message = `ไม่พบแอป ${packageName} บนอุปกรณ์ที่ ${ip}`;
                    } else if (!err) {
                      status = 'Clear Data สำเร็จ';
                      message = `Clear Data แอป ${packageName} บนอุปกรณ์ที่ ${ip} สำเร็จ`;
                    }

                    resolve({ ip, status, message, adbMessage });
                  }
                );
              });

              const messageToSend = JSON.stringify(result) + "\n";
              controller.enqueue(new TextEncoder().encode(messageToSend));
            } catch (error) {
              console.error('❌ Error:', error);
              const errorMessage = JSON.stringify({
                ip: device.ip,
                status: 'Clear Data ไม่สำเร็จ',
                message: `ไม่สามารถ Clear Data แอป ${packageName} บนอุปกรณ์ที่ ${ip} ได้`,
                adbMessage: `error: ${error.message}`,
              }) + "\n";
              controller.enqueue(new TextEncoder().encode(errorMessage));
            }
          }
          controller.close();
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
        message: 'เกิดข้อผิดพลาดในการ Clear Data แอป',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
