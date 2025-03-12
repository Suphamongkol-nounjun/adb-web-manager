import { getLocalIp, scanNetwork } from './scan.js' // ปรับพาธตามที่เก็บไฟล์
import fs from 'fs';
import path from 'path';

// ฟังก์ชันสำหรับการจัดการ GET Request
export async function GET(req, res) {
  try {
    const localIp = getLocalIp();  // ดึง IP ของเครื่องที่ใช้
    console.log(`IP ของเครื่องที่ใช้: ${localIp}`);

    // ส่งผลลัพธ์กลับไป
    return new Response(JSON.stringify({
        message: `IP ของเครื่องที่ใช้: ${localIp}`,
        ip: localIp,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });

  } catch (error) {
    console.error('❌ Error in GET request:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสแกน IP', error: error.message });
  }
}

export async function POST(req) {
    try {
      const { ip } = await req.json();  // ดึง IP ที่ส่งมาจาก body
  
      if (!ip) {
        return new Response(
          JSON.stringify({ message: 'กรุณาระบุ IP ในการสแกน' }), 
          { status: 400 }
        );
      }
  
      // เรียกฟังก์ชันสแกน IP ในเครือข่ายและรอให้เสร็จสมบูรณ์
      const results = await scanNetwork(ip);  // รอให้การสแกนเสร็จสมบูรณ์และคืนค่า results
  
      // สร้างไฟล์ JSON ใน app โดยใช้ results
      const jsonPath = path.join(process.cwd(), 'src', 'app', 'json', 'scan_results.json');
      
      // ตรวจสอบว่าโฟลเดอร์ json มีอยู่หรือไม่ หากไม่ให้สร้างใหม่
      const jsonDir = path.dirname(jsonPath);
      if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
      }
  
      // ใช้ Promise เพื่อรอให้การเขียนไฟล์เสร็จสมบูรณ์
      await new Promise((resolve, reject) => {
        fs.writeFile(jsonPath, JSON.stringify(results, null, 2), 'utf-8', (err) => {
          if (err) {
            reject(err);  // ถ้ามีข้อผิดพลาดให้ reject
          } else {
            console.log(`📁 บันทึกข้อมูลลงไฟล์: ${jsonPath}`);
            resolve();  // ถ้าทำสำเร็จให้ resolve
          }
        });
      });
  
      // ส่งผลลัพธ์กลับไปหลังจากการสร้างไฟล์เสร็จ
      const response = new Response(
        JSON.stringify({
          message: 'สร้างไฟล์ json เรียบร้อย',
          results: results  // ส่งผลลัพธ์ที่ได้จากการสแกนไปด้วย
        }), 
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      return response;
  
    } catch (error) {
      console.error('❌ Error in POST request:', error);
      return new Response(
        JSON.stringify({ message: 'เกิดข้อผิดพลาดในการสร้างไฟล์ json', error: error.message }),
        { status: 500 }
      );
    }
  }
