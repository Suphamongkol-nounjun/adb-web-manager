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

  const scan = new NmapScan(subnet, '-sV -p 5555 -n'); // -sn = Scan แบบ Ping Sweep, -n = ไม่ทำ DNS resolution

  // ใช้ Promise เพื่อรอให้สแกนเสร็จสมบูรณ์
  return new Promise((resolve, reject) => {
    scan.on('complete', function (data) {
      console.log("\n📌 ข้อมูลดิบจาก Nmap:");
      console.log(JSON.stringify(data, null, 2)); // log ข้อมูลทั้งหมด
      
      const results = data.map(device => {
        const portInfo = device.openPorts.find(p => p.port === 5555);  // ค้นหาข้อมูลที่ port = 5555
        return {
          ip: device.ip,
          mac: device.mac || 'ไม่พบ',
          vendor: device.vendor || 'ไม่พบ',
          port: portInfo ? portInfo.port : 'N/A',
          service: portInfo ? portInfo.service : 'N/A',
          details: portInfo ? portInfo.serviceDetail : 'N/A'
        };
      });
      
      // กรองเฉพาะที่มี service = 'adb'
      const adbDevices = results.filter(device => device.service === 'adb');
  
      console.log("\n✅ พบอุปกรณ์ที่มีบริการ ADB ในเครือข่าย:");
      adbDevices.forEach(result => {
        console.log(`- IP: ${result.ip}, MAC: ${result.mac}, Vendor: ${result.vendor}, Service: ${result.service}, Details: ${result.details}`);
      });
      
      resolve(adbDevices);  // คืนค่าเฉพาะอุปกรณ์ที่มีบริการ ADB
    });
    // กรณีเกิดข้อผิดพลาดจากการสแกน
    scan.on('error', function (error) {
      console.log('❌ Error:', error);
      reject(error);  // reject ถ้ามีข้อผิดพลาด
    });
  });
}
