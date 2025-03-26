"use client";  // ✅ จำเป็นสำหรับ Next.js Client Component

import { useState, useEffect } from "react";
import { Modal, Box, Button, Typography } from '@mui/material';
import { modalStyle, modalbuttonStyle,modalhoverButtonStyle } from "../openforceclear/modalStyle";
import AdbCommandGroup from "@/app/Components/ADBCommandGroup";

export default function adbcommand() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingDevices, setLoadingDevices] = useState(true); // ✅ สร้าง state เช็คสถานะการโหลด
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingFile, setExistingFile] = useState("");
  const [versionName, setVersionName] = useState(""); // ✅ ใช้เก็บ versionName // ✅ ใช้เก็บ currentVersion
  const [packageName, setPackageName] = useState(""); // ✅ ใช้เก็บ packageName
  const [packageNameall, setPackageNameall] = useState([]); // ✅ ใช้เก็บ packageName
  const [logMessage, setLogMessage] = useState(""); // ✅ ใช้เก็บ log
  const [devices, setDevices] = useState([]); // เพิ่ม state สำหรับอุปกรณ์
  const [installing, setInstalling] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [openingApps, setOpeningApps] = useState(false); 
  const [forcingApps, setforcingApps] = useState(false);
  const [clearingApps, setclearingApps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [searchTerm, setSearchTerm] = useState(""); // ตัวแปรสำหรับเก็บคำค้นหา
  const [modaldeviceIp, setModalDeviceIp] = useState('');

  const handleOpen = (action, ip) => {
    setActionType(action);
    setModalDeviceIp(ip)
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleConfirm = () => {
    if (actionType === 'Force Stop') {
      handleForceStopDevice(modaldeviceIp);
    } else if (actionType === 'Clear Data') {
      handleClearDataDevice(modaldeviceIp);
    } else if (actionType === 'Clear Data All') {
      handleClearDataAllDevices();
    } else if (actionType === 'Force Stop All') {
      handleForceStopAllDevices();
    }
     else {
      console.warn(`Unknown action type: ${actionType}`);
    }
  
    setOpen(false); // ปิด Modal หลังจากยืนยัน
  };


  const fetchCheckversion = async (allDevices) => {
    try {
        
      const response = await fetch("/api/adbcommand/checkpackagedevices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allDevices),
      });
  
      if (!response.ok) throw new Error("Error fetching device versions");
  
      const data = await response.json();
    //   console.log("Response Data:", data); // ✅ ตรวจสอบข้อมูลจาก API
  
      const updatedDevices = allDevices.map((device) => {
        // const deviceData = data.results.find((d) => d.ip === device.ip);
        // console.log("Device Data:", deviceData); // ✅ ตรวจสอบข้อมูล deviceData
  
        return {
          ...device,
          status: "", // ✅ กำหนดให้ status เป็นค่าว่าง
        };
      });
  
      console.log("Updated Devices:", updatedDevices); // ✅ แสดงข้อมูล updatedDevices
      setDevices(updatedDevices); // ✅ อัปเดต state
    } catch (error) {
      console.error("Error fetching version name:", error);
    } finally {
      setLoadingDevices(false); // ✅ โหลดเสร็จแล้ว
    }
  };
  
  const fetchPackages = async (devicesList) => {
    try {
      const response = await fetch("/api/adbcommand/adbchecklistpackage", {
        method: "POST",
        body: JSON.stringify(devicesList),
      });
  
      const data = await response.json();
      console.log("Response Data:", data); // ✅ ตรวจสอบข้อมูลจาก API
  
      if (data.results && data.results.length > 0) {
        // คำนวณ allPackages
        const allPackages = data.results.reduce((acc, device) => {
          if (device.packages) {
            device.packages.forEach(pkg => {
              if (!acc.includes(pkg)) {
                acc.push(pkg); // เพิ่มแพ็กเกจใหม่ที่ยังไม่มีในรายการ
              }
            });
          }
          return acc;
        }, []);
  
        console.log("📦 รายการแพ็กเกจทั้งหมด:", allPackages);
        setPackageNameall(allPackages); // อัปเดต allPackages
  
        // Map ข้อมูลจาก data.results และเพิ่ม package ไปใน devicesList
        const updatedDevicesList = devicesList.map((device) => {
          const deviceData = data.results.find((d) => {
            return device.ip === d.ip; // เปรียบเทียบ IP โดยตรง
          });
  
          if (deviceData && deviceData.packages) {
            // เพิ่มข้อมูล package เข้าไปในอุปกรณ์
            device.packages = deviceData.packages;
          } else {
            // ถ้าไม่พบอุปกรณ์ใน data.results ก็ให้เป็น empty array หรือค่าอื่นๆ
            device.packages = [];
          }
  
          return device; // ส่งกลับข้อมูลอุปกรณ์ที่อัปเดตแล้ว
        });
  
        console.log("Updated Devices List with Packages:", updatedDevicesList);
        setDevices(updatedDevicesList); // อัปเดต devices state
        setLoadingDevices(false);
  
      } else {
        console.log("❌ ไม่มีข้อมูลแพ็กเกจ");
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลแพ็กเกจ:", error);
    }
  };
  
  

  useEffect(() => {
    const storedDevices = localStorage.getItem("adbDevices");
    if (storedDevices) {
      let devicesList = JSON.parse(storedDevices);
  
      setLoadingDevices(true); // ✅ เริ่มโหลดข้อมูล
  
      const fetchAdbDevices = async () => {
        try {
          const response = await fetch("/api/adbcommand/adbdevices", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
  
          if (!response.ok) throw new Error("Error fetching ADB devices");
  
          const data = await response.json();
          const adbDevices = data.devices;
          console.log("ADB Devices:", adbDevices);
  
          // อัปเดตสถานะของอุปกรณ์จาก API โดยไม่ต้อง map ใหม่ทั้งหมด
          devicesList.forEach((device) => {
            // ตัดพอร์ตออกจาก IP ก่อนการเปรียบเทียบ
            const deviceIp = device.ip.split(":")[0]; // ถ้าเป็น 192.168.2.166:5555 จะได้ 192.168.2.166
  
            const adbDevice = adbDevices.find((d) => {
              const adbDeviceIp = d.deviceId.split(":")[0]; // ตัดพอร์ตออกจาก adbDevice.deviceId
              return adbDeviceIp === deviceIp; // เปรียบเทียบแค่ IP
            });
  
            if (adbDevice) {
              let newStatus = device.status; // คงสถานะเดิม
  
              // ถ้าสถานะเป็น 'device' อัปเดตเป็น 'connect'
              if (adbDevice.status === "device") {
                newStatus = "Connect";
              }
              // ถ้าสถานะเป็น 'unauthorized' อัปเดตเป็น 'unauthorized'
              else if (adbDevice.status === "unauthorized") {
                newStatus = "Unauthorized";
              }
              // ถ้าสถานะเป็น 'offline' คงเป็น 'offline'
              else if (adbDevice.status === "offline") {
                newStatus = "Offline";
              }
  
              // อัปเดตสถานะใน devicesList
              device.deviceStatus = newStatus; // เพิ่มข้อมูลใหม่เป็น deviceStatus
            } else {
              // ถ้าไม่พบอุปกรณ์ใน adbDevices, ให้เปลี่ยนสถานะเป็น "offline"
              device.deviceStatus = "offline"; // อัปเดตสถานะเป็น offline
            }
          });
  
          console.log("Updated Devices List:", devicesList);
  
          if (devicesList) {
            
  

           console.log("All Devices:", devicesList);    
            //  fetchCheckversion(devicesList);
          } else {
            console.log("Package name ยังไม่พร้อม");
            setLoadingDevices(false); // ✅ โหลดเสร็จแล้ว
          }
        } catch (error) {
          console.error("Error fetching ADB devices:", error);
          setLoadingDevices(false); // ✅ โหลดเสร็จแล้ว
        }
      };
  
      const fetchData = async () => {
        await fetchAdbDevices(); // เรียก fetchAdbDevices ให้เสร็จก่อน
        await fetchPackages(devicesList); // เรียก fetchPackages หลังจาก fetchAdbDevices เสร็จ
      };
  
      fetchData(); // เรียกฟังก์ชันที่รวมทั้งสองอย่างเข้าด้วยกัน
      
    } else {
      setLoadingDevices(false); // ✅ ไม่มีข้อมูลใน localStorage
    }
  }, []);
  

const handleForceStopDevice = async (ip) => {
  try {
    // ตรวจสอบว่า packageName ถูกกำหนดไว้หรือยัง
    if (!packageName) {
      setLogMessage('กรุณาเลือกแพ็กเกจก่อน');
      return;
    }

    // เรียก API เพื่อเปิดแอป
    const response = await fetch('/api/adbcommand/adbforcestop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ ip, packageName: packageName }]), // ส่งข้อมูล IP และ package ที่เลือก
    });

    // ตรวจสอบว่าคำขอสำเร็จหรือไม่
    if (!response.ok) {
      setLogMessage('เกิดข้อผิดพลาดในการเปิดแอป');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let value = '';

    // อ่านข้อมูลแบบ streaming
    while (!done) {
      const { done: doneReading, value: chunk } = await reader.read();
      done = doneReading;
      value += decoder.decode(chunk, { stream: true });

      // แยกข้อความที่ได้รับออกเป็นหลายบรรทัด
      const messages = value.trim().split("\n");

      // ประมวลผลข้อความแต่ละบรรทัด
      messages.forEach((msg) => {
        if (msg) {
          const data = JSON.parse(msg);
          console.log("📢 ตอบกลับจาก API:", data);

          // อัปเดตแค่ status ของอุปกรณ์ที่ตรงกับ IP
          setDevices(prevDevices =>
            prevDevices.map(device => 
              device.ip === data.ip ? { ...device, status: data.status } : device
            )
          );
          setLogMessage(prev => prev + `\n${data.ip} ${data.status}\n${data.adbMessage}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
    setLogMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }
  };
  


const handleForceStopAllDevices = async () => {
  setforcingApps(true); // เริ่มการติดตั้ง
  const devicesData = devices.map(device => ({
    ip: device.ip,
    packageName: packageName, // เพิ่ม packageName เข้าไปใน JSON
  }));

  const response = await fetch('/api/adbcommand/adbforcestop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(devicesData), // ส่งเฉพาะ ip ของอุปกรณ์
  });

  // ตรวจสอบว่าคำขอสำเร็จ
  if (!response.ok) {
    setLogMessage('เกิดข้อผิดพลาด');
    setOpeningApps(false);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let value = '';

  // อ่านข้อมูลแบบ streaming
  while (!done) {
    const { done: doneReading, value: chunk } = await reader.read();
    done = doneReading;
    value += decoder.decode(chunk, { stream: true });

    // แยกข้อความที่ได้รับออกเป็นหลายบรรทัด
    const messages = value.trim().split("\n");

    // ประมวลผลข้อความแต่ละบรรทัด
    messages.forEach((msg) => {
      if (msg) {
        const data = JSON.parse(msg);
        console.log("📢 ตอบกลับจาก API:", data);

        // อัปเดตแค่ status ของอุปกรณ์ที่ตรงกับ IP
        setDevices(prevDevices =>
          prevDevices.map(device => 
            device.ip === data.ip ? { ...device, status: data.status } : device
          )
        );
        setLogMessage(prev => prev + `\n${data.ip} ${data.status}\n${data.adbMessage}`);
      }
    });
  }

  setforcingApps(false); // เสร็จสิ้น
};


const handleClearDataDevice = async (ip) => {
  try {
    // ตรวจสอบว่า packageName ถูกกำหนดไว้หรือยัง
    if (!packageName) {
      setLogMessage('กรุณาเลือกแพ็กเกจก่อน');
      return;
    }

    // เรียก API เพื่อเปิดแอป
    const response = await fetch('/api/adbcommand/adbcleardata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ ip, packageName: packageName }]), // ส่งข้อมูล IP และ package ที่เลือก
    });

    // ตรวจสอบว่าคำขอสำเร็จหรือไม่
    if (!response.ok) {
      setLogMessage('เกิดข้อผิดพลาดในการเปิดแอป');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let value = '';

    // อ่านข้อมูลแบบ streaming
    while (!done) {
      const { done: doneReading, value: chunk } = await reader.read();
      done = doneReading;
      value += decoder.decode(chunk, { stream: true });

      // แยกข้อความที่ได้รับออกเป็นหลายบรรทัด
      const messages = value.trim().split("\n");

      // ประมวลผลข้อความแต่ละบรรทัด
      messages.forEach((msg) => {
        if (msg) {
          const data = JSON.parse(msg);
          console.log("📢 ตอบกลับจาก API:", data);

          // อัปเดตแค่ status ของอุปกรณ์ที่ตรงกับ IP
          setDevices(prevDevices =>
            prevDevices.map(device => 
              device.ip === data.ip ? { ...device, status: data.status } : device
            )
          );
          setLogMessage(prev => prev + `\n${data.ip} ${data.status}\n${data.adbMessage}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
    setLogMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }
};

const handleClearDataAllDevices = async () => {
  setclearingApps(true); // เริ่มการติดตั้ง
  const devicesData = devices.map(device => ({
    ip: device.ip,
    packageName: packageName, // เพิ่ม packageName เข้าไปใน JSON
  }));

  const response = await fetch('/api/adbcommand/adbcleardata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(devicesData), // ส่งเฉพาะ ip ของอุปกรณ์
  });

  // ตรวจสอบว่าคำขอสำเร็จ
  if (!response.ok) {
    setLogMessage('เกิดข้อผิดพลาด');
    setOpeningApps(false);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let value = '';

  // อ่านข้อมูลแบบ streaming
  while (!done) {
    const { done: doneReading, value: chunk } = await reader.read();
    done = doneReading;
    value += decoder.decode(chunk, { stream: true });

    // แยกข้อความที่ได้รับออกเป็นหลายบรรทัด
    const messages = value.trim().split("\n");

    // ประมวลผลข้อความแต่ละบรรทัด
    messages.forEach((msg) => {
      if (msg) {
        const data = JSON.parse(msg);
        console.log("📢 ตอบกลับจาก API:", data);

        // อัปเดตแค่ status ของอุปกรณ์ที่ตรงกับ IP
        setDevices(prevDevices =>
          prevDevices.map(device => 
            device.ip === data.ip ? { ...device, status: data.status } : device
          )
        );
        setLogMessage(prev => prev + `\n${data.ip} ${data.status}\n${data.adbMessage}`);
      }
    });
  }

  setclearingApps(false); // เสร็จสิ้น
};

const handleOpenApp = async (ip) => {
    try {
      // ตรวจสอบว่า packageName ถูกกำหนดไว้หรือยัง
      if (!packageName) {
        setLogMessage('กรุณาเลือกแพ็กเกจก่อน');
        return;
      }
  
      // เรียก API เพื่อเปิดแอป
      const response = await fetch('/api/adbcommand/adbopenapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ ip, packageName: packageName }]), // ส่งข้อมูล IP และ package ที่เลือก
      });
  
      // ตรวจสอบว่าคำขอสำเร็จหรือไม่
      if (!response.ok) {
        setLogMessage('เกิดข้อผิดพลาดในการเปิดแอป');
        return;
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let value = '';
  
      // อ่านข้อมูลแบบ streaming
      while (!done) {
        const { done: doneReading, value: chunk } = await reader.read();
        done = doneReading;
        value += decoder.decode(chunk, { stream: true });
  
        // แยกข้อความที่ได้รับออกเป็นหลายบรรทัด
        const messages = value.trim().split("\n");
  
        // ประมวลผลข้อความแต่ละบรรทัด
        messages.forEach((msg) => {
          if (msg) {
            const data = JSON.parse(msg);
            console.log("📢 ตอบกลับจาก API:", data);
  
            // อัปเดตแค่ status ของอุปกรณ์ที่ตรงกับ IP
            setDevices(prevDevices =>
              prevDevices.map(device => 
                device.ip === data.ip ? { ...device, status: data.status } : device
              )
            );
            setLogMessage(prev => prev + `\n${data.ip} ${data.status}\n${data.adbMessage}`);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setLogMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };
  

const handleOpenAllApps = async () => {
  setOpeningApps(true); // เริ่มการติดตั้ง
  const devicesData = devices.map(device => ({
    ip: device.ip,
    packageName: packageName, // เพิ่ม packageName เข้าไปใน JSON
  }));

  const response = await fetch('/api/adbcommand/adbopenapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(devicesData), // ส่งเฉพาะ ip ของอุปกรณ์
  });

  // ตรวจสอบว่าคำขอสำเร็จ
  if (!response.ok) {
    setLogMessage('เกิดข้อผิดพลาด');
    setOpeningApps(false);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let value = '';

  // อ่านข้อมูลแบบ streaming
  while (!done) {
    const { done: doneReading, value: chunk } = await reader.read();
    done = doneReading;
    value += decoder.decode(chunk, { stream: true });

    // แยกข้อความที่ได้รับออกเป็นหลายบรรทัด
    const messages = value.trim().split("\n");

    // ประมวลผลข้อความแต่ละบรรทัด
    messages.forEach((msg) => {
      if (msg) {
        const data = JSON.parse(msg);
        console.log("📢 ตอบกลับจาก API:", data);

        // อัปเดตแค่ status ของอุปกรณ์ที่ตรงกับ IP
        setDevices(prevDevices =>
          prevDevices.map(device => 
            device.ip === data.ip ? { ...device, status: data.status } : device
          )
        );
        setLogMessage(prev => prev + `\n${data.ip} ${data.status}\n${data.adbMessage}`);
      }
    });
  }

  setOpeningApps(false); // เสร็จสิ้น
};

useEffect(() => {

    if (packageName) {
      // หากมีการเลือก packageName
      console.log(`เลือกแพ็กเกจ: ${packageName}`);
      setLogMessage(`เลือกแพ็กเกจ: ${packageName}`);
      
      // ดึงข้อมูลจาก devices ตาม ip
      devices.forEach((device) => {
        console.log(`ข้อมูลของ IP: ${device.ip}`);
        
        // หากต้องการแสดงรายละเอียดของ package ในแต่ละ device
        const selectedPackage = device.packages.find(pkg => pkg === packageName);
        if (selectedPackage) {
          console.log(`มีแพ็กเกจที่เลือก: ${selectedPackage} สำหรับ IP: ${device.ip}`);
          setLogMessage(prev => prev + `\nมีแพ็กเกจ ${packageName} สำหรับ IP: ${device.ip}`);
          device.status = "มีแพ็กเกจ";
        } else {
          console.log(`ไม่มีแพ็กเกจ ${packageName} สำหรับ IP: ${device.ip}`);
          setLogMessage(prev => prev + `\nไม่มีแพ็กเกจ ${packageName} สำหรับ IP: ${device.ip}`);
          device.status = "ไม่มีแพ็กเกจ";
        }
      });
      setDevices([...devices]);
    }
  }, [packageName]); // useEffect จะทำงานเมื่อ packageName หรือ devices เปลี่ยนแปลง
  
  const handleSelectChange = (event) => {
    setPackageName(event.target.value);
  };

  const filteredPackages = packageNameall.filter(pkg =>
    pkg.toLowerCase().includes(searchTerm.toLowerCase()) // ค้นหาคำในทุกตำแหน่ง
  );
  

return (


  <div>
    <main className="flex flex-col items-center justify-start min-h-screen p-8 gap-7 sm:p-20">
            {/* ข้อความเตือนเกี่ยวกับการเลือกแอปพลิเคชัน */}
            <div className="alert-message text-center mb-4 text-yellow-600 font-medium">
            <h2 className="text-3xl font-semibold text-center text-blue-600 mb-6">
   Open App / Force Stop / Clear Data
</h2>
        <p>
          ⚠️ การกด <strong>Force Stop</strong> หรือ <strong>Clear Data</strong> <br></br>อาจทำให้เครื่องมีปัญหาหรือเกิดผลกระทบกับการทำงานของแอปพลิเคชัน ควรเลือกเฉพาะแอปที่ต้องการเท่านั้น
        </p>
      </div>

      <div className="package-dropdown mt-8 w-full max-w-4xl border p-6 rounded-lg border-gray-300 shadow-lg">
      <h3 className="font-semibold text-xl mb-4 text-center">เลือกแพ็กเกจที่ต้องการ</h3>
      <div className="relative">
        <input
          type="text"
          placeholder="ค้นหาแพ็กเกจ..."
          value={searchTerm} // ค่าที่จะพิมพ์ในช่องค้นหา
          onChange={(e) => setSearchTerm(e.target.value)} // ฟังก์ชันที่ใช้ในการอัปเดตคำค้นหา
          className="block w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={packageName} // ค่าที่เลือกจะถูกเก็บใน packageName
          onChange={handleSelectChange} // ฟังก์ชันที่ใช้จัดการการเลือกค่า
          className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">เลือกแพ็กเกจ</option>
          {filteredPackages.length > 0 ? (
            filteredPackages.map((pkg) => (
              <option key={pkg} value={pkg} className="hover:bg-gray-200">
                {pkg} {/* แสดงแพ็กเกจที่ผ่านการกรอง */}
              </option>
            ))
          ) : (
            <option disabled>ไม่มีข้อมูล</option> // ถ้าไม่พบข้อมูลจากการค้นหา
          )}
        </select>

        {/* แสดงชื่อแพ็กเกจที่เลือก */}
        {packageName && (
          <div className="mt-2 text-center text-green-500">
            <p>แพ็กเกจที่เลือก: {packageName}</p>
          </div>
        )}
      </div>
    </div>

      {/* ตารางแสดงอุปกรณ์ */}
      <h2 className="font-semibold text-lg mt-4">📋 อุปกรณ์ที่พบ:</h2>
      <table className="w-full max-w-4xl border-collapse shadow-lg rounded-lg overflow-hidden mt-4">
        <thead>
          <tr className="bg-blue-500 text-white text-center">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">IP Address</th>
            <th className="px-4 py-3">Device Status</th>
            <th className="px-4 py-3 min-w-[220px]">Status</th>
            <th className="px-4 py-3 min-w-[150px]">Force Stop</th>
            <th className="px-4 py-3 min-w-[150px]">Clear Data</th>
            <th className="px-4 py-3 min-w-[150px]">Open App</th>
          </tr>
        </thead>
        <tbody>
          {loadingDevices ? (
            <tr>
  <td colSpan="7" className="text-center p-4 align-middle">กำลังโหลดข้อมูล...</td>
</tr>
          ) : devices.length > 0 ? (
            devices.map((device, index) => (
              <tr key={index} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} hover:bg-gray-200`}>
                <td className="border px-4 py-3 text-center">{index + 1}</td>
                <td className="border px-4 py-3 text-center">{device.ip}</td>
                <td className="border px-4 py-3 text-center">
                  {/* ตรวจสอบและแสดงสถานะจาก device.deviceStatus */}
                  {device.deviceStatus === "offline"
                    ? "Offline"
                    : device.deviceStatus === "unauthorized"
                    ? "Unauthorized"
                    : device.deviceStatus}
                </td>
                <td className="border px-4 py-3 text-center">{device.status || "N/A"}</td>
                <td className="border px-4 py-3 text-center">
                  <button
                    onClick={() => handleOpen('Force Stop', device.ip)}
                    sx={{ ...modalbuttonStyle, ...modalhoverButtonStyle, backgroundColor: '#f57c00', color: 'white' }}
                    className="px-4 py-2 rounded text-white bg-orange-500 hover:bg-orange-600"
                  >
                    Force Stop
                  </button>
                </td>
                <td className="border px-4 py-3 text-center">
                  <button
                    onClick={() => handleOpen('Clear Data', device.ip)}
                    sx={{ ...modalbuttonStyle, ...modalhoverButtonStyle, backgroundColor: '#d32f2f', color: 'white' }}
                    className="px-4 py-2 rounded text-white bg-red-500 hover:bg-red-600"
                  >
                    Clear Data
                  </button>
                </td>
                <td className="border px-4 py-3 text-center">
                  {/* ปุ่ม Openapp ที่ยังไม่ได้เชื่อมโยงฟังก์ชัน */}
                  <button
                    onClick={() => handleOpenApp(device.ip)} // เว้นฟังก์ชันเอาไว้
                    className="px-4 py-2 rounded text-white bg-yellow-500 hover:bg-yellow-600"
                  >
                    Open App
                  </button>
                </td>
              </tr>
            ))
          ) : (
<tr>
  <td colSpan="7" className="text-center p-4 align-middle">เลือกแพ็กเกจที่ต้องการก่อน</td>
</tr>
          )}
        </tbody>
      </table>

{/* ปุ่ม Install all devices, Uninstall all devices และ Open all apps */}
<div className="flex justify-center gap-4 mt-8">
  <button
    onClick={() => handleOpen('Force Stop All')}
    sx={{ ...modalbuttonStyle, ...modalhoverButtonStyle, backgroundColor: '#f57c00', color: 'white' }}
    disabled={forcingApps}
    className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
  >
    {forcingApps ? "Force Stopping..." : "Force Stop all devices"}
  </button>

  <button
    onClick={() => handleOpen('Clear Data All')}
    sx={{ ...modalbuttonStyle, ...modalhoverButtonStyle, backgroundColor: '#d32f2f', color: 'white' }}
    disabled={clearingApps}
    className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
  >
    {clearingApps ? "Clearing data..." : "Clear Data all devices"}
  </button>

  {/* ปุ่ม Open all apps */}
  <button
    onClick={handleOpenAllApps}
    disabled={openingApps}
    className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
  >
    {openingApps ? "Opening..." : "Open all apps"}
  </button>
</div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={modalStyle}>
          <Typography
            id="modal-title"
            variant="h6"
            component="h2"
            sx={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}
          >
            ยืนยันการดำเนินการ
          </Typography>
          <Typography
            id="modal-description"
            sx={{
              mt: 2,
              color: '#666',
              textAlign: 'center',
              fontSize: '16px',
              lineHeight: '1.5',
            }}
          >
            คุณต้องการยืนยันการ {actionType} หรือไม่?
          </Typography>
          <div className="flex justify-center gap-4 mt-4">
            <Button
              onClick={handleConfirm}
              sx={{
                ...modalbuttonStyle,
                backgroundColor: '#388e3c',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#2e7d32',
                },
              }}
            >
              ยืนยัน
            </Button>
            <Button
              onClick={handleClose}
              sx={{
                ...modalbuttonStyle,
                backgroundColor: '#757575',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#616161',
                },
              }}
            >
              ยกเลิก
            </Button>
          </div>
        </Box>
      </Modal>

      <AdbCommandGroup />

      {/* Log ข้อความจาก API */}
      <div className="mt-4 text">
        <p className="font-semibold">Log ข้อความจาก API:</p>
        <pre className="text-sm bg-gray-100 p-6 rounded-lg border border-gray-300 shadow-lg w-full max-w-4xl overflow-auto">
          {logMessage}
        </pre>
      </div>

    </main>
    <div className="footer-instructions bg-gray-100 text-blue-600 font-medium py-4 mt-6">
      <div className="max-w-3xl mx-auto text-left">
    <p>
      📱 หน้านี้ช่วยให้คุณสามารถจัดการแอปพลิเคชันที่ติดตั้งในอุปกรณ์ที่เชื่อมต่อผ่าน ADB ได้ โดยสามารถจัดการกับแอปพลิเคชันได้หลากหลายฟังก์ชัน เช่น Force Stop, Clear Data และเปิดแอป.<br />
      <strong>ขั้นตอนการทำงาน:</strong><br />
      1. เลือก <strong>ชื่อ Package</strong> ที่ต้องการจากรายการ.<br />
      2. คุณสามารถพิมพ์ค้นหาในช่องค้นหาเพื่อให้แสดงรายการแอปที่ตรงกับคำที่พิมพ์.<br />
      3. ระบบจะเช็คในตารางว่าแอปพลิเคชันที่เลือกมีอยู่ในอุปกรณ์ที่เชื่อมต่อหรือไม่.<br />
      4. หลังจากเลือกแอปแล้ว คุณสามารถเลือกการดำเนินการต่าง ๆ ได้แก่ <strong>Force Stop</strong>, <strong>Clear Data</strong>, หรือ <strong>Open App</strong>.<br />
      5. คุณสามารถเลือกที่จะดำเนินการกับแอปบนอุปกรณ์เฉพาะเครื่อง หรือทำการดำเนินการกับอุปกรณ์ทั้งหมดที่เชื่อมต่อ.<br />
      โปรดระมัดระวังในการเลือกแอปที่ต้องการจัดการ เพื่อหลีกเลี่ยงผลกระทบต่อการทำงานของอุปกรณ์.
    </p>
  </div>
</div>
  </div>
);

}
