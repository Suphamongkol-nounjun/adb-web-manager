import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ตั้งค่าโฟลเดอร์ปลายทางสำหรับไฟล์ที่อัปโหลด
const uploadDir = path.join(process.cwd(), "src/platform-tool/apk/");

// ตรวจสอบว่ามีโฟลเดอร์หรือยัง ถ้าไม่มีให้สร้าง
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(req) {
  try {
    // ใช้ formData เพื่อดึงข้อมูลไฟล์จาก request
    const formData = await req.formData();
    const file = formData.get("apkFile"); // ชื่อฟิลด์ต้องตรงกับที่ส่งมาจาก Frontend

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    // ตรวจสอบชนิดไฟล์ .apk
    if (file.type !== "application/vnd.android.package-archive") {
      return NextResponse.json({ success: false, message: "Only .apk files are allowed!" }, { status: 400 });
    }

    // แปลงไฟล์เป็น buffer และบันทึก
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, file.name);

    // บันทึกไฟล์ลงในระบบ
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, message: "Upload success!", path: filePath });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
