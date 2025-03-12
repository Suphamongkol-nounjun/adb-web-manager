import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    // รับข้อมูลจาก body
    const devices = await req.json();

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
          try {
            for (const device of devices) {
              const { ip, packageName } = device;

              // ตรวจสอบว่ามีข้อมูล ip และ packageName หรือไม่
              if (!ip || !packageName) {
                const errorMessage = JSON.stringify({
                  ip: ip || "ไม่ทราบ IP",
                  status: 'ถอนการติดตั้งไม่สำเร็จ',
                  message: 'ข้อมูล IP หรือ Package Name ไม่ถูกต้อง',
                }) + "\n";
                controller.enqueue(new TextEncoder().encode(errorMessage));
                continue;
              }

              console.log(`🌐 กำลังถอนการติดตั้ง APK ที่ ${packageName} บนอุปกรณ์ที่มี IP: ${ip}`);

              try {
                const result = await new Promise((resolve) => {
                  exec(`${adbPath} -s ${ip} uninstall ${packageName}`, (err, stdout, stderr) => {
                    let status = 'ถอนการติดตั้งสำเร็จ';
                    let message = `ถอนการติดตั้ง APK ที่ ${packageName} บนอุปกรณ์ที่ ${ip} สำเร็จ`;
                    let adbMessage = `adb message: ${stdout || stderr}`;

                    if (err || stderr) {
                      status = 'ถอนการติดตั้งไม่สำเร็จ';
                      message = `ไม่สามารถถอนการติดตั้ง APK ที่ ${packageName} บนอุปกรณ์ที่ ${ip} ได้`;
                    }

                    resolve({ ip, status, message, adbMessage });
                  });
                });

                // ส่งข้อมูลไปยัง frontend
                const messageToSend = JSON.stringify(result) + "\n";
                controller.enqueue(new TextEncoder().encode(messageToSend));
              } catch (execError) {
                console.error('❌ Exec Error:', execError);
                const errorMessage = JSON.stringify({
                  ip,
                  status: 'ถอนการติดตั้งไม่สำเร็จ',
                  message: `ไม่สามารถถอนการติดตั้ง APK ที่ ${packageName} บนอุปกรณ์ที่ ${ip} ได้`,
                  adbMessage: `error: ${execError.message}`,
                }) + "\n";
                controller.enqueue(new TextEncoder().encode(errorMessage));
              }
            }
            controller.close();
          } catch (streamError) {
            console.error('❌ Stream Error:', streamError);
            controller.error(streamError);
          }
        })().catch((err) => {
          console.error('❌ Unhandled Error:', err);
          controller.error(err);
        });
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ API Error:', error);
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
