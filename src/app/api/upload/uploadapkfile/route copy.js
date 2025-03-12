import { NextResponse } from "next/server";
import path from "path";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";

export const GET = async () => {
    const directoryPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb');
  
    try {
      const filesInDirectory = await readdir(directoryPath);
  
      if (filesInDirectory.length === 0) {
        return NextResponse.json({
          message: "ไม่มีไฟล์ในโฟลเดอร์"
        });
      }
  
      // ส่งชื่อไฟล์ที่มีในโฟลเดอร์กลับไป
      return NextResponse.json({
        message: "มีไฟล์ในโฟลเดอร์",
        fileName: filesInDirectory[0], // เพราะมีไฟล์แค่ไฟล์เดียว
      });
    } catch (error) {
      console.log("Error occurred while reading directory: ", error);
      return NextResponse.json({ message: "ไม่สามารถอ่านโฟลเดอร์ได้" }, { status: 500 });
    }
  };

  export const POST = async (req, res) => {
    const formData = await req.formData();
  
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }
  
    // ตรวจสอบว่าไฟล์เป็น .apk หรือไม่
    const fileExtension = path.extname(file.name).toLowerCase();
    if (fileExtension !== ".apk") {
      return NextResponse.json({ error: "ไฟล์ต้องเป็น .apk เท่านั้น" }, { status: 400 });
    }
  
    const buffer = Buffer.from(await file.arrayBuffer());
    const directoryPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb');
    const filePath = path.join(directoryPath, file.name.replaceAll(" ", "_"));
  
    try {
      // ตรวจสอบและสร้างโฟลเดอร์ 'adb' ถ้ายังไม่มี
      await mkdir(directoryPath, { recursive: true });
  
      // เคลียร์ไฟล์เก่าก่อนการอัพโหลด
      const filesInDirectory = await readdir(directoryPath);
      for (const file of filesInDirectory) {
        const fileToDelete = path.join(directoryPath, file);
        await unlink(fileToDelete);
        console.log(`Deleted old file: ${fileToDelete}`);
      }
  
      // อัพโหลดไฟล์ใหม่
      console.log(`Uploading new file to: ${filePath}`);
      await writeFile(filePath, buffer);
  
      return NextResponse.json({
        Message: "Success",
        status: 201,
        fileName: file.name, // ส่งชื่อไฟล์ที่อัพโหลดกลับไป
      });
    } catch (error) {
      console.log("Error occurred ", error);
      return NextResponse.json({ Message: "Failed", status: 500 });
    }
  };
