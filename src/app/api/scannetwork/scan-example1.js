import pkg from 'node-nmap';
import fs from 'fs';
import path from 'path';
import os from 'os';  // ใช้เพื่อดึง IP ของเครื่องตัวเอง

const { NmapScan } = pkg;

// ฟังก์ชันเพื่อค้นหา IP ของเครื่องตัวเอง
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  let ipAddress = '';
  for (let interfaceName in interfaces) {
    for (let interfaceDetails of interfaces[interfaceName]) {
      if (interfaceDetails.family === 'IPv4' && !interfaceDetails.internal) {
        ipAddress = interfaceDetails.address;
        break;
      }
    }
  }
  return ipAddress;
}

// ฟังก์ชันเพื่อสแกน IP ในเครือข่ายที่เครื่องใช้งานอยู่
async function scanNetwork() {
  const localIp = getLocalIp(); // ดึง IP ของเครื่องตัวเอง
  const subnet = localIp.substring(0, localIp.lastIndexOf('.')) + '.0/24'; // คำนวณ subnet จาก IP ของเครื่องตัวเอง
  
  console.log(`🌐 กำลังสแกนในเครือข่าย: ${subnet}`);

  const scan = new NmapScan(subnet, '-sn -n'); // -sn = Scan แบบ Ping Sweep, -n = ไม่ทำ DNS resolution

  scan.on('complete', function (data) {
    const results = data.map(device => ({
      ip: device.ip,
      mac: device.mac || 'ไม่พบ',  // ดึงข้อมูล MAC address
      hostname: device.hostname || 'ไม่พบ'
    }));

    // แสดงผลลัพธ์ที่มี IP, MAC address, และ Hostname
    console.log('✅ พบอุปกรณ์ในเครือข่าย:');
    results.forEach(result => {
      console.log(`- IP: ${result.ip}, MAC: ${result.mac}, Hostname: ${result.hostname}`);
    });

    // กำหนดพาธที่ต้องการบันทึกไฟล์ใน json ที่อยู่ใน src/app/
    const dirPath = path.join(process.cwd(), '..', 'json', 'scan_results.json');
    const jsonPath = path.join(process.cwd(), '..', 'json');

    // ตรวจสอบว่าโฟลเดอร์ json มีอยู่หรือไม่ หากไม่ให้สร้างใหม่
    if (!fs.existsSync(jsonPath)) {
      fs.mkdirSync(jsonPath, { recursive: true });
    }

    // บันทึกข้อมูลผลการสแกนลงไฟล์ JSON
    fs.writeFile(dirPath, JSON.stringify(results, null, 2), 'utf-8', (err) => {
      if (err) {
        console.error('❌ เกิดข้อผิดพลาดในการบันทึกไฟล์:', err);
      } else {
        console.log(`📁 บันทึกข้อมูลลงไฟล์: ${dirPath}`);
      }
    });
  });

  scan.on('error', function (error) {
    console.log('❌ Error:', error);
  });

  scan.start();
}

scanNetwork();
