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
            console.log(`🔄 กำลังรีสตาร์ทอุปกรณ์ที่มี IP: ${ip}`);

            try {
              const result = await new Promise((resolve) => {
                exec(`"${adbPath}" -s ${ip} reboot`, (err, stdout, stderr) => {
                  let status = "รีสตาร์ทไม่สำเร็จ";
                  let message = `ไม่สามารถรีสตาร์ทอุปกรณ์ที่ ${ip} ได้`;
                  let adbMessage = `adb message: ${stdout || stderr}`;

                  if (!err) {
                    status = "รีสตาร์ทสำเร็จ";
                    message = `รีสตาร์ทอุปกรณ์ที่ ${ip} สำเร็จ`;
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
                    status: "รีสตาร์ทไม่สำเร็จ",
                    message: `ไม่สามารถรีสตาร์ทอุปกรณ์ที่ ${ip} ได้`,
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
        message: "เกิดข้อผิดพลาดในการรีสตาร์ทอุปกรณ์",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
