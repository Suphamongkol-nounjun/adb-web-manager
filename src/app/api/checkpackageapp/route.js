import path from 'path';
import { exec } from 'child_process';

export async function POST(req) {
  try {
    // รับข้อมูลจาก request body
    const { fileName } = await req.json();

    // สร้าง path สำหรับเครื่องมือ
    const buildtoolPath = path.join(process.cwd(), 'src', 'build-tools', 'aapt');
    const adbtoolPath = path.join(process.cwd(), 'src', 'platform-tools', 'adb');

    console.log("Build tool path: ", buildtoolPath);
    console.log("ADB tool path: ", adbtoolPath);

    // เรียกใช้คำสั่ง aapt dump badging และใช้ findstr เพื่อค้นหา versionName และ package
    const result = await new Promise((resolve, reject) => {
      exec(`${buildtoolPath} dump badging "${adbtoolPath}/${fileName}" | findstr /i "versionName package"`, (error, stdout, stderr) => {
        if (error) {
          reject(`exec error: ${error}`);
        }

        // ตรวจสอบว่า stderr มีข้อความอะไรหรือไม่
        if (stderr) {
          reject(`stderr: ${stderr}`);
        }

        // ดึงข้อมูล versionName และ packageName จาก stdout
        const versionNameMatch = stdout.match(/versionName='([^']+)'/);
        const packageNameMatch = stdout.match(/package: name='([^']+)'/);

        if (!versionNameMatch || !packageNameMatch) {
          reject("ไม่พบ versionName หรือ packageName ในไฟล์ APK");
        }

        const versionName = versionNameMatch[1];
        const packageName = packageNameMatch[1];

        console.log(`Version Name: ${versionName}`);
        console.log(`Package Name: ${packageName}`);

        resolve({ versionName, packageName });
      });
    });

    // ส่งผลลัพธ์กลับไป
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'คำสั่ง aapt สำเร็จ',
        versionName: result.versionName,
        packageName: result.packageName,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error:', error);

    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการประมวลผลคำสั่ง',
        error: error.message
      }),
      { status: 500 }
    );
  }
}
