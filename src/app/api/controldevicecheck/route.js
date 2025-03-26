import { exec, spawn } from "child_process";
import path from "path";

let scrcpyProcess = null;

export async function POST(req) {
  try {
    const { ip } = await req.json();
    if (!ip) {
      return new Response(
        JSON.stringify({ message: "กรุณาระบุ IP" }),
        { status: 400 }
      );
    }

    // ใช้ path สำหรับ scrcpy CLI (ไม่มี .exe)
    const scrcpyPath = path.join(process.cwd(), 'src', 'scrcpy-win64-v3.1', 'scrcpy'); // ใช้ชื่อ scrcpy CLI

    console.log(`📡 เปิด scrcpy ไปยัง ${ip}`);
    
    // เชื่อมต่อกับมือถือผ่าน scrcpy CLI
    scrcpyProcess = spawn(scrcpyPath, ["-s", `${ip}:5555`], {
      stdio: "ignore"
    });

       // ส่งสถานะการปิด scrcpy กลับไปยัง frontend
       scrcpyProcess.on("exit", () => {
        console.log("❌ scrcpy ถูกปิด");
        scrcpyProcess = null;
        // ส่งข้อมูลสถานะกลับไปที่ frontend
        return new Response(
          JSON.stringify({
            status: "disconnected",
            message: `scrcpy ถูกปิดจากการเชื่อมต่อกับ ${ip}`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      });

    return new Response(
      JSON.stringify({
        status: "Connected",
        message: `เชื่อมต่อ scrcpy กับ ${ip} สำเร็จ`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "เกิดข้อผิดพลาดในการเปิด scrcpy",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}


export async function GET() {
    try {
      const result = await new Promise((resolve) => {
        exec("tasklist | findstr scrcpy", (err, stdout) => {
          resolve(stdout.includes("scrcpy") ? "Connected" : "Disconnected");
        });
      });
  
      return new Response(
        JSON.stringify({ status: result }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
  
    } catch (error) {
      console.error("❌ Error:", error);
      return new Response(
        JSON.stringify({ status: "error", message: "ไม่สามารถเช็คสถานะ scrcpy ได้", error: error.message }),
        { status: 500 }
      );
    }
  }