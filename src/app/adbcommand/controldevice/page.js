"use client";  // ✅ จำเป็นสำหรับ Next.js Client Component

import { useState, useEffect } from "react";
import { Modal, Box, Button, Typography } from '@mui/material';
import { modalStyle, modalbuttonStyle,modalhoverButtonStyle } from "./modalStyle"
import AdbCommandGroup from "@/app/Components/ADBCommandGroup";
import useDeviceStatus from "hook/useDeviceStatus";
import GuideSidebar from "@/app/Components/GuideSidebar";

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
  const [refreshing, setRefreshing] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [openingApps, setOpeningApps] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [searchTerm, setSearchTerm] = useState(""); // ตัวแปรสำหรับเก็บคำค้นหา
  const [modaldeviceIp, setModalDeviceIp] = useState('');
  const [status, setStatus] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null);


  const fetchCheckversion = async (allDevices) => {
    try {
        
      // const response = await fetch("/api/adbcommand/checkpackagedevices", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(allDevices),
      // });
  
      // if (!response.ok) throw new Error("Error fetching device versions");
  
      // const data = await response.json();
      // console.log("Response Data fetchCheckversion:", data); // ✅ ตรวจสอบข้อมูลจาก API
  
      const updatedDevices = allDevices.map((device) => {
        // const deviceData = data.results.find((d) => d.ip === device.ip);
        // console.log("Device Data:", deviceData); // ✅ ตรวจสอบข้อมูล deviceData
  
        return {
          ...device,
          status: "", // ✅ กำหนดให้ status เป็นค่าว่าง
        };
      });
  
      console.log("Updated Devices:", updatedDevices); // ✅ แสดงข้อมูล updatedDevices
      // setDevices(updatedDevices); // ✅ อัปเดต state
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
  
      } else {
        console.log("❌ ไม่มีข้อมูลแพ็กเกจ");
      }
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลแพ็กเกจ:", error);
    }
  };
  
  const fetchCheckscrcpy = async (allDevices) => {
    try {
      
      const response = await fetch("/api/controldevicecheck", {
        method: "GET"
      });
      const data = await response.json();
     console.log("Response Data:", data,allDevices);

     const updatedDevices = allDevices.map((device) => {

      return {
        ...device,
        status: data.status, // ✅ กำหนดให้ status เป็นค่าว่าง
      };
    });

    console.log("aftercheckscrcpy: ", updatedDevices)
    setDevices(updatedDevices)
    setLoadingDevices(false);

    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
    }
  }

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
        await fetchCheckscrcpy(devicesList);
      };
  
      fetchData(); // เรียกฟังก์ชันที่รวมทั้งสองอย่างเข้าด้วยกัน
      
    } else {
      setLoadingDevices(false); // ✅ ไม่มีข้อมูลใน localStorage
    }
  }, []);
  


  // const connectdevice = async (deviceIp) =>{
  //   try {
  //     const response = await fetch("/api/controldevice", {
  //       method: "POST",
  //       body: JSON.stringify({ ip: deviceIp }),
  //       headers: { "Content-Type": "application/json" },
  //     });
  
  //     const data = await response.json();
  //     console.log("Connect Device Response:", data);
  
  //     if (response.status === 200) {
  //       const updatedDevices = devices.map((device) =>
  //         device.ip === deviceIp
  //           ? { ...device, status: data.status === "can't connect" ? "Disconnected" : "Connected" }
  //           : device
  //       );
  //       // fetchCheckscrcpy(updatedDevices)
  //       setDevices(updatedDevices);
  //       setLogMessage(JSON.stringify(data, null, 2));
  //     } else {
  //       setLogMessage(`ไม่สามารถเชื่อมต่ออุปกรณ์ ${deviceIp}`);
  //     }
  //   } catch (error) {
  //     console.error("Error occurred while connecting device: ", error);
  //     setLogMessage(`ไม่สามารถเชื่อมต่ออุปกรณ์ ${deviceIp}`);
  //   }
  // };
    // ใช้ Hook สำหรับติดตามสถานะ
    useDeviceStatus(setDevices);

    const connectdevice = async (deviceIp) => {
      try {
        const response = await fetch("/api/controldevice", {
          method: "POST",
          body: JSON.stringify({ ip: deviceIp }),
          headers: { "Content-Type": "application/json" },
        });
    
        const data = await response.json();
        console.log("Connect Device Response:", data);
    
        if (response.status === 200) {
          setLogMessage(`กำลังเชื่อมต่อกับ ${deviceIp}...`);
        } else {
          setLogMessage(`ไม่สามารถเชื่อมต่ออุปกรณ์ ${deviceIp}`);
        }
      } catch (error) {
        console.error("Error occurred while connecting device: ", error);
        setLogMessage(`เกิดข้อผิดพลาดในการเชื่อมต่อ ${deviceIp}`);
      }
    };

  const handleRefresh = () => {
    // รีเฟรชหน้าเว็บ
    window.location.reload();
  };

  useEffect(() => {
    const eventSource = new EventSource('/api/controldevice');
    
    eventSource.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      console.log('Scrcpy Status Update:', data);
      setStatus(data.status);
      setLastUpdate(data.timestamp);
      setLogMessage(data.message)
    });

    return () => {
      eventSource.close();
    };
  }, []);



return (
  <div>
    <GuideSidebar />
    <main className="flex flex-col items-center justify-start min-h-screen p-8 gap-7 sm:p-10">
    <div className="relative">
      {/* ส่วนเนื้อหาอื่นๆ */}
    </div>
    <h2 className="text-3xl font-semibold text-center text-blue-600 mb-6">
 Control Device
</h2>
<div className="alert-message text-center mb-4 text-yellow-600 font-medium">
<p>
  ⚠️ คำแนะนำ: การเชื่อมต่อและควบคุมอุปกรณ์ Android ทีละเครื่อง<br></br>จะช่วยลดความเสี่ยงที่อาจเกิดขึ้นจากการทำงานของหลายอุปกรณ์พร้อมกัน.<br></br>
  ควรเลือกเชื่อมต่อทีละเครื่องเพื่อให้แน่ใจว่าไม่มีปัญหาหรือผลกระทบกับการทำงานของแอปพลิเคชัน.
</p>
</div>
      {/* ตารางแสดงอุปกรณ์ */}
      <h2 className="font-semibold text-lg mt-4">📋 อุปกรณ์ที่พบ:</h2>
      <table className="w-full max-w-4xl border-collapse shadow-lg rounded-lg overflow-hidden mt-4">
        <thead>
          <tr className="bg-blue-500 text-white text-center">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">IP Address</th>
            <th className="px-4 py-3">Device Status</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Connect</th>
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
                      onClick={() => {
                        if (device.status === "Disconnected") {
                          connectdevice(device.ip);
                        }
                      }}
                      disabled={device.status === "Connected"}
                      className={`px-4 py-2 rounded text-white transition
                        ${device.status === "Connected" ? "bg-gray-400 cursor-not-allowed opacity-50" : "bg-green-500 hover:bg-green-600"}
                      `}
                    >
                      {device.status === "Connected" ? "Connected" : "Connect"}
                    </button>
                </td>
              </tr>
            ))
          ) : null}
        </tbody>
      </table>

{/*     
<div className="flex justify-center gap-4 mt-8">
  <button
    onClick={handleRefresh}
    disabled={refreshing}
    className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
  >
    {refreshing ? "refreshing..." : "Refresh Page"}
  </button>

</div> */}

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
      📱 หน้านี้ช่วยให้คุณสามารถเชื่อมต่อกับอุปกรณ์ Android ผ่าน ADB และเปิดหน้าจอสำหรับการควบคุมอุปกรณ์นั้นได้.<br />
      <strong>ขั้นตอนการทำงาน:</strong><br />
      1. ตราบใดที่คุณเชื่อมต่ออุปกรณ์ Android ผ่าน ADB, ระบบจะตรวจสอบและแสดงรายการ IP ที่เชื่อมต่ออยู่ในตาราง.<br />
      2. คุณสามารถกดปุ่ม <strong>Connect</strong> เพื่อเปิดหน้าจอของอุปกรณ์ Android ที่คุณต้องการควบคุม.<br />
      3. เมื่อเปิดหน้าจอแล้ว คุณสามารถควบคุมเครื่อง Android ผ่านหน้าจอนี้ได้.<br />
      โปรดระมัดระวังในการเลือกอุปกรณ์ที่ต้องการควบคุมเพื่อหลีกเลี่ยงข้อผิดพลาดในการเชื่อมต่อ.
    </p>
  </div>
</div>
  </div>
);

}
