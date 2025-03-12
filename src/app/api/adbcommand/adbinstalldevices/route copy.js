import { exec } from "child_process";
import path from "path";

export async function POST(req) {
  try {
    const devices = await req.json();

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: "กรุณาระบุข้อมูล IP และ existingFile" }),
        { status: 400 }
      );
    }

    const adbPath = path.join(process.cwd(), "src", "platform-tools", "adb");

    // ✅ ใช้ ReadableStream เพื่อส่งข้อมูลทีละบรรทัด
    const stream = new ReadableStream({
      async start(controller) {
        for (let device of devices) {
          const { ip, existingFile, version, currentversion } = device;
          const apkPath = path.join(
            process.cwd(),
            "src",
            "platform-tools",
            "adb",
            existingFile
          );

          // 🔹 ส่งข้อความสถานะเริ่มติดตั้ง
          controller.enqueue(
            JSON.stringify({
              ip,
              status: "กำลังติดตั้ง",
              message: `🌐 กำลังติดตั้ง APK ที่ ${apkPath} บนอุปกรณ์ที่มี IP: ${ip}`,
            }) + "\n"
          );

          await new Promise((resolve) => {
            exec(
              `${adbPath} -s ${ip} install ${apkPath}`,
              (err, stdout, stderr) => {
                let status = "ติดตั้งสำเร็จ";
                let message = `✅ ติดตั้ง APK ที่ ${apkPath} บนอุปกรณ์ ${ip} สำเร็จ`;
                let versionDevice = version;

                if (err || stderr) {
                  if ((stderr || err).includes("INSTALL_FAILED_VERSION_DOWNGRADE")) {
                    status = "เวอร์ชั่นต่ำกว่าที่มีอยู่";
                    message = `❌ เวอร์ชั่นของ APK ต่ำกว่าที่ติดตั้งอยู่บนอุปกรณ์ ${ip}`;
                    versionDevice = currentversion;
                  } else {
                    status = "ติดตั้งไม่สำเร็จ";
                    message = `❌ ไม่สามารถติดตั้ง APK บนอุปกรณ์ ${ip} ได้` + (stderr || err);
                    versionDevice = currentversion;
                  }
                }


                // 🔹 ส่งข้อมูลสถานะกลับไป
                controller.enqueue(
                  JSON.stringify({ ip, status, message, version: versionDevice }) + "\n"
                );

                resolve();
              }
            );
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "เกิดข้อผิดพลาดในการติดตั้ง APK",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
