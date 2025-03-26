import { exec } from 'child_process';
import path from 'path';

export async function POST(req) {
  try {
    const devices = await req.json(); // รับข้อมูลจาก body

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: 'กรุณาระบุข้อมูล IP' }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb'); // พาธของ adb

    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          for (let device of devices) {
            const { ip } = device; // ดึงค่า ip
            console.log(`🌐 กำลังตรวจสอบสถานะ Bluetooth บนอุปกรณ์ที่มี IP: ${ip}`);

            try {
              // ตรวจสอบสถานะ Bluetooth ด้วยคำสั่ง dumpsys
              const bluetoothStatus = await new Promise((resolve, reject) => {
                exec(
                  `"${adbPath}" -s ${ip} shell dumpsys bluetooth_manager`,
                  (err, stdout, stderr) => {
                    if (err || stderr) {
                      reject(`ไม่สามารถดึงข้อมูล Bluetooth จากอุปกรณ์ที่ ${ip}`);
                    }
                    resolve(stdout);
                  }
                );
              });

              // ตรวจสอบว่า Bluetooth ถูกปิดหรือไม่
              if (bluetoothStatus.includes('enabled: false')) {
                const message = `Bluetooth บนอุปกรณ์ที่ ${ip} ถูกปิดแล้ว ข้ามไปเครื่องนี้`;
                console.log(message);
                const result = { ip, status: 'Bluetooth ปิดแล้ว', message };
                controller.enqueue(new TextEncoder().encode(JSON.stringify(result) + "\n"));
                continue; // ข้ามเครื่องนี้ไป
              }

              // ถ้า Bluetooth เปิดอยู่ ให้ปิด Bluetooth
              console.log(`🌐 กำลังปิด Bluetooth บนอุปกรณ์ที่มี IP: ${ip}`);

              // คำสั่งปิด Bluetooth
              const result = await new Promise((resolve) => {
                exec(
                  `"${adbPath}" -s ${ip} shell am start -a android.bluetooth.adapter.action.REQUEST_DISABLE`,
                  (err, stdout, stderr) => {
                    let status = 'ปิด Bluetooth ไม่สำเร็จ';
                    let message = `ไม่สามารถปิด Bluetooth บนอุปกรณ์ที่ ${ip} ได้`;
                    let adbMessage = `adb message: ${stdout}`;

                    if (!err) {
                      status = 'ปิด Bluetooth สำเร็จ';
                      message = `ปิด Bluetooth บนอุปกรณ์ที่ ${ip} สำเร็จ`;
                    }

                    resolve({ ip, status, message, adbMessage });
                  }
                );
              });

              // กดปุ่ม "Enter" เพื่อยืนยันการปิด Bluetooth
              exec(
                `"${adbPath}" -s ${ip} shell input keyevent KEYCODE_ENTER`,
                (err, stdout, stderr) => {
                  if (err) {
                    console.error('❌ Error: ', stderr);
                  }
                }
              );

              const messageToSend = JSON.stringify(result) + "\n";
              controller.enqueue(new TextEncoder().encode(messageToSend));
            } catch (error) {
              console.error('❌ Error:', error);
              const errorMessage = JSON.stringify({
                ip: device.ip,
                status: 'ปิด Bluetooth ไม่สำเร็จ',
                message: `ไม่สามารถปิด Bluetooth บนอุปกรณ์ที่ ${ip} ได้`,
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
        message: 'เกิดข้อผิดพลาดในการปิด Bluetooth',
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
