import { exec } from "child_process";
import path from "path";

export async function POST(req) {
  try {
    const devices = await req.json();

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: "กรุณาระบุข้อมูล IP ของอุปกรณ์" }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), "src", "platform-tools", "adb");

    const stream = new ReadableStream({
      start(controller) {
        (async () => {
          for (let device of devices) {
            const { ip } = device;
            console.log(`🔴 กำลังปิดเครื่องอุปกรณ์ที่มี IP: ${ip}`);

            try {
              const result = await new Promise((resolve) => {
                exec(`"${adbPath}" -s ${ip} shell reboot -p`, (err, stdout, stderr) => {
                  let status = "ปิดเครื่องไม่สำเร็จ";
                  let message = `ไม่สามารถปิดเครื่องอุปกรณ์ที่ ${ip} ได้`;
                  let adbMessage = `adb message: ${stdout || stderr}`;

                  if (!err) {
                    status = "ปิดเครื่องสำเร็จ";
                    message = `ปิดเครื่องอุปกรณ์ที่ ${ip} สำเร็จ`;
                  }

                  resolve({ ip, status, message, adbMessage });
                });
              });

              controller.enqueue(new TextEncoder().encode(JSON.stringify(result) + "\n"));
            } catch (error) {
              console.error("❌ Error:", error);
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    ip,
                    status: "ปิดเครื่องไม่สำเร็จ",
                    message: `ไม่สามารถปิดเครื่องอุปกรณ์ที่ ${ip} ได้`,
                    adbMessage: `error: ${error.message}`,
                  }) + "\n"
                )
              );
            }
          }
          controller.close();
        })().catch((err) => {
          console.error("Stream error:", err);
          controller.error(err);
        });
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "เกิดข้อผิดพลาดในการปิดเครื่องอุปกรณ์",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
