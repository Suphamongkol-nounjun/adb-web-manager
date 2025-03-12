import pkg from 'node-nmap';
import fs from 'fs';
import path from 'path';
import os from 'os';  // ใช้เพื่อดึง IP ของเครื่องตัวเอง

const { NmapScan } = pkg;

// ฟังก์ชันเพื่อค้นหา IP ของเครื่องตัวเอง
export function getLocalIp() {
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
export async function scanNetwork(localIp) {
  const subnet = localIp.substring(0, localIp.lastIndexOf('.')) + '.0/24'; // คำนวณ subnet จาก IP ที่ส่งมาจาก argument

  console.log(`🌐 กำลังสแกนในเครือข่าย: ${subnet}`);

  const scan = new NmapScan(subnet, '-sn -n'); // -sn = Scan แบบ Ping Sweep, -n = ไม่ทำ DNS resolution

  // ใช้ Promise เพื่อรอให้สแกนเสร็จสมบูรณ์
  return new Promise((resolve, reject) => {
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
      })
      resolve(results);
    });
    // กรณีเกิดข้อผิดพลาดจากการสแกน
    scan.on('error', function (error) {
      console.log('❌ Error:', error);
      reject(error);  // reject ถ้ามีข้อผิดพลาด
    });
  });
}
