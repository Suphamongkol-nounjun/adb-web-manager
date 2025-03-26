import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    const devices = await req.json(); // รับข้อมูลจาก body

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: "กรุณาระบุข้อมูล IP และ packageName" }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb'); // พาธของ adb

    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          for (let device of devices) {
            const { ip, packageName } = device; // ดึงค่า ip และ packageName
            console.log(`🔍 กำลังตรวจสอบสถานะแอป ${packageName} บนอุปกรณ์ที่มี IP: ${ip}`);

            try {
              const result = await new Promise((resolve) => {
                exec(
                  `"${adbPath}" -s ${ip} shell pm list packages -d`,
                  (err, stdout, stderr) => {
                    if (err) {
                      return resolve({
                        ip,
                        packageName,
                        status: "Error",
                        message: "เกิดข้อผิดพลาดในการตรวจสอบแอป",
                        error: stderr || err.message,
                      });
                    }

                    // ตรวจสอบว่า packageName อยู่ในรายการ disabled หรือไม่
                    const isDisabled = stdout.includes(`package:${packageName}`);

                    resolve({
                      ip,
                      packageName,
                      status: isDisabled ? "Disabled" : "Enabled",
                      message: isDisabled
                        ? `แอป ${packageName} ถูกปิดการใช้งานอยู่`
                        : `แอป ${packageName} เปิดใช้งานอยู่`,
                    });
                  }
                );
              });

              const messageToSend = JSON.stringify(result) + "\n";
              controller.enqueue(new TextEncoder().encode(messageToSend));
            } catch (error) {
              console.error("❌ Error:", error);
              const errorMessage = JSON.stringify({
                ip: device.ip,
                packageName: device.packageName,
                status: "Error",
                message: `เกิดข้อผิดพลาดในการตรวจสอบแอป ${packageName} บนอุปกรณ์ที่ ${ip}`,
                adbMessage: `error: ${error.message}`,
              }) + "\n";
              controller.enqueue(new TextEncoder().encode(errorMessage));
            }
          }
          controller.close();
        })().catch((err) => {
          console.error("Stream error:", err);
          controller.error(err);
        });
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "เกิดข้อผิดพลาดในการตรวจสอบสถานะแอป",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
