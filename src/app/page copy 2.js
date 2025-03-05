"use client";  // ✅ จำเป็นสำหรับ Next.js Client Component

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingFile, setExistingFile] = useState("");
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [localIp, setLocalIp] = useState("");
  const [logMessage, setLogMessage] = useState(""); // สำหรับแสดง log ข้อความ

  useEffect(() => {
    const fetchFileStatus = async () => {
      try {
        const response = await fetch("/api/uploadapkfile");
        const data = await response.json();
        
        console.log("File Status Response:", data); // log ข้อความจาก API
        setLogMessage(JSON.stringify(data, null, 2)); // แสดง JSON ที่ได้รับจาก API
        
        if (data.message === "ไม่มีไฟล์ในโฟลเดอร์") {
          setExistingFile("ไม่มีไฟล์ในโฟลเดอร์");
        } else if (data.fileName) {
          setExistingFile(`มีไฟล์: ${data.fileName}`);
        }
      } catch (error) {
        console.error("Error fetching file status: ", error);
        setLogMessage("ไม่สามารถตรวจสอบไฟล์ได้");
      }
    };

    const fetchLocalIp = async () => {
      try {
        const response = await fetch("/api/scanadbnetwork");
        const data = await response.json();
        console.log("Local IP Response:", data); // log ข้อความจาก API
        setLogMessage(JSON.stringify(data, null, 2)); // แสดง JSON ที่ได้รับจาก API
        if (data.ip) {
          setLocalIp(data.ip);
        }
      } catch (error) {
        console.error("Error fetching local IP: ", error);
      }
    };

    fetchFileStatus();
    fetchLocalIp();
  }, []);

  const scanNetwork = async () => {
    if (!localIp) {
      setLogMessage("ไม่พบ IP เครื่องของคุณ กรุณารีเฟรช");
      return;
    }
  
    setScanning(true);
    try {
      // เรียก API สำหรับการสแกน Network
      const response = await fetch("/api/scanadbnetwork", {
        method: "POST",
        body: JSON.stringify({ ip: localIp }),
        headers: { "Content-Type": "application/json" },
      });
  
      const networkData = await response.json();
      console.log("Scan Network Response:", networkData);
  
      if (response.status !== 200) {
        setLogMessage("เกิดข้อผิดพลาดในการสแกน");
        return;
      }
  
      // เรียก API เพื่อเช็คอุปกรณ์ที่เชื่อมต่อผ่าน ADB
      const adbResponse = await fetch("/api/adbdevices");
      const adbData = await adbResponse.json();
      console.log("ADB Devices Response:", adbData);
  
      // ดึงรายการ deviceId จาก ADB Devices เพื่อเปรียบเทียบ
      const adbDevicesMap = new Map(adbData.devices.map((adb) => [adb.deviceId, adb.status]));
  
      // อัปเดตสถานะของอุปกรณ์ที่พบจาก scanadbnetwork
      const updatedDevices = networkData.results.map((device) => {
        const deviceIp = `${device.ip}:5555`; // แปลง IP ให้ตรงกับ ADB
        const adbStatus = adbDevicesMap.get(deviceIp);
  
        return {
          ...device,
          status: adbStatus === "device" ? "Connect" 
                 : adbStatus === "unauthorized" ? "Unauthorized"
                 : "Disconnect", // ถ้าไม่มีข้อมูลให้เป็น Disconnect
        };
      });
  
      // ตรวจสอบว่ามีอุปกรณ์ ADB ไหนที่ไม่มีใน Network Scan หรือไม่
      adbData.devices.forEach((adbDevice) => {
        if (!updatedDevices.some((device) => `${device.ip}:5555` === adbDevice.deviceId)) {
          updatedDevices.push({
            ip: adbDevice.deviceId,
            status: adbDevice.status === "device" ? "Connect" 
                   : adbDevice.status === "unauthorized" ? "Unauthorized"
                   : "Disconnect",
          });
        }
      });
  
      setDevices(updatedDevices);
      setLogMessage(JSON.stringify({ networkDevices: networkData, adbDevices: adbData }, null, 2));
  
    } catch (error) {
      console.error("Error occurred: ", error);
      setLogMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setScanning(false);
    }
  };
  
  
  

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("กรุณาเลือกไฟล์ APK ก่อน");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);
    setMessage("");

    try {
      const response = await fetch("/api/uploadapkfile", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      console.log("Upload Response:", data); // log ข้อความจาก API
      setLogMessage(JSON.stringify(data, null, 2)); // แสดง JSON ที่ได้รับจาก API

      if (response.ok && data.Message === "Success") {
        setMessage("อัพโหลดไฟล์สำเร็จ");
        setExistingFile(`มีไฟล์: ${data.fileName}`);
      } else {
        setMessage(`อัพโหลดไฟล์ไม่สำเร็จ: ${data.message || "ไม่ทราบข้อผิดพลาด"}`);
      }
    } catch (error) {
      console.error("Error occurred during upload: ", error);
      setMessage("เกิดข้อผิดพลาดในการอัพโหลดไฟล์");
    } finally {
      setUploading(false);
    }
  };

  const connectDevice = async (deviceIp) => {
    try {
      const response = await fetch("/api/adbconnect", {
        method: "POST",
        body: JSON.stringify({ ip: deviceIp }),
        headers: { "Content-Type": "application/json" },
      });
  
      const data = await response.json();
      console.log("Connect Device Response:", data);
  
      if (response.status === 200) {
        const updatedDevices = devices.map((device) =>
          device.ip === deviceIp
            ? { ...device, status: "Connect" }
            : device
        );
        setDevices(updatedDevices);
        setLogMessage(JSON.stringify(data, null, 2)); // แสดง JSON ที่ได้รับจาก API
      } else {
        setLogMessage(`ไม่สามารถเชื่อมต่ออุปกรณ์ ${deviceIp}`);
      }
    } catch (error) {
      console.error("Error occurred while connecting device: ", error);
      setLogMessage(`ไม่สามารถเชื่อมต่ออุปกรณ์ ${deviceIp}`);
    }
  };
  
  const disconnectDevice = async (deviceIp) => {
    try {
      const response = await fetch("/api/adbdisconnect", {
        method: "POST",
        body: JSON.stringify({ ip: deviceIp }),
        headers: { "Content-Type": "application/json" },
      });
  
      const data = await response.json();
      console.log("Disconnect Device Response:", data);
  
      if (response.status === 200) {
        const updatedDevices = devices.map((device) =>
          device.ip === deviceIp
            ? { ...device, status: "Disconnect" }
            : device
        );
        setDevices(updatedDevices);
        setLogMessage(JSON.stringify(data, null, 2)); // แสดง JSON ที่ได้รับจาก API
      } else {
        setLogMessage(`ไม่สามารถตัดการเชื่อมต่ออุปกรณ์ ${deviceIp}`);
      }
    } catch (error) {
      console.error("Error occurred while disconnecting device: ", error);
      setLogMessage(`ไม่สามารถตัดการเชื่อมต่ออุปกรณ์ ${deviceIp}`);
    }
  };
  const connectAllDevices = async () => {
    if (devices.length === 0) {
      setLogMessage("ไม่พบอุปกรณ์ที่สามารถเชื่อมต่อได้");
      return;
    }
  
    const devicesToConnect = devices.map(device => ({
      ip: device.ip,
      mac: device.mac,
      vendor: device.vendor,
      port: device.port,
      service: device.service,
    }));
  
    try {
      const response = await fetch("/api/adbconnectall", {
        method: "POST",
        body: JSON.stringify(devicesToConnect),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
      console.log("Connect All Devices Response:", data); // log ข้อความจาก API
      setLogMessage(JSON.stringify(data, null, 2)); // แสดง JSON ที่ได้รับจาก API
  
      if (response.status === 200) {
        const updatedDevices = devices.map(device => ({
          ...device,
          status: "Connect",
        }));
        setDevices(updatedDevices);
      } else {
        setLogMessage("เกิดข้อผิดพลาดในการเชื่อมต่ออุปกรณ์");
      }
    } catch (error) {
      console.error("Error occurred while connecting all devices: ", error);
      setLogMessage("ไม่สามารถเชื่อมต่ออุปกรณ์ทั้งหมดได้");
    }
  };
  
  const disconnectAllDevices = async () => {
    const devicesToDisconnect = devices.map(device => ({
      ip: device.ip,
      mac: device.mac,
      vendor: device.vendor,
      port: device.port,
      service: device.service,
    }));
  
    try {
      const response = await fetch("/api/adbdisconnectall", {
        method: "POST",
        body: JSON.stringify(devicesToDisconnect),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
      console.log("Disconnect All Devices Response:", data); // log ข้อความจาก API
      setLogMessage(JSON.stringify(data, null, 2)); // แสดง JSON ที่ได้รับจาก API
  
      if (response.status === 200) {
        const updatedDevices = devices.map(device => ({
          ...device,
          status: "Disconnect",
        }));
        setDevices(updatedDevices);
      } else {
        setLogMessage("เกิดข้อผิดพลาดในการตัดการเชื่อมต่ออุปกรณ์");
      }
    } catch (error) {
      console.error("Error occurred while disconnecting all devices: ", error);
      setLogMessage("ไม่สามารถตัดการเชื่อมต่ออุปกรณ์ทั้งหมดได้");
    }
  };
    

  useEffect(() => {
    console.log("Log message:", logMessage); // ตรวจสอบค่า logMessage
  }, [logMessage]); // ทำงานทุกครั้งที่ logMessage เปลี่ยนแปลง

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />
  
        <p className="font-semibold">{existingFile}</p>
  
        <input type="file" accept=".apk" onChange={(e) => setSelectedFile(e.target.files[0])} className="p-2 border rounded" />
        {selectedFile && <p>📂 เลือกไฟล์: {selectedFile.name}</p>}
  
        <button
          onClick={() => handleUpload()}
          disabled={uploading}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {uploading ? "กำลังอัพโหลด..." : "อัพโหลดไฟล์"}
        </button>
  
        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
  
        <button
          onClick={scanNetwork}
          disabled={scanning}
          className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {scanning ? "กำลังสแกน..." : "สแกน Network"}
        </button>
  
        <p className="mt-2 text-gray-600">📍 IP ของคุณ: {localIp || "กำลังโหลด..."}</p>
  
        <h2 className="mt-4 font-semibold text-lg">📋 อุปกรณ์ที่พบ:</h2>
        <table className="w-full max-w-4xl border-collapse shadow-lg rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-blue-500 text-white text-center">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">MAC Address</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Port</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.length > 0 ? (
              devices.map((device, index) => {
                const isIpValid = /^\d+\.\d+\.\d+\.\d+$/.test(device.ip); // ตรวจสอบว่าเป็น IP จริงหรือไม่
                
                return (
                  <tr key={index} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} hover:bg-gray-200`}>
                    <td className="border px-4 py-3 text-center">{index + 1}</td>
                    <td className="border px-4 py-3 text-center">{device.ip}</td>
                    <td className="border px-4 py-3 text-center">{device.mac}</td>
                    <td className="border px-4 py-3 text-center">{device.vendor}</td>
                    <td className="border px-4 py-3 text-center">{device.port}</td>
                    <td className="border px-4 py-3 text-center">{device.service}</td>
                    <td className="border px-4 py-3 text-center">{device.status || "Disconnect"}</td>
                    <td className="border px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          if (device.status === "Connect") {
                            disconnectDevice(device.ip);
                          } else {
                            connectDevice(device.ip);
                          }
                        }}
                        disabled={!isIpValid} // ปิดการใช้งานปุ่มถ้าไม่ใช่ IP จริง
                        className={`px-4 py-2 rounded text-white 
                          ${device.status === "Connect" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
                          ${!isIpValid ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400" : ""}`} // ถ้า disable จะเป็นสีเทา
                      >
                        {isIpValid ? (device.status === "Connect" ? "Disconnect" : "Connect") : "Connect"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="8" className="text-center p-4">ไม่พบอุปกรณ์</td></tr>
            )}
          </tbody>
        </table>
  
        {/* ปุ่ม Connect all devices และ Disconnect all devices */}
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={connectAllDevices} className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">
            Connect all devices
          </button>
          <button onClick={disconnectAllDevices} className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600">
            Disconnect all devices
          </button>
        </div>
  
        {/* Log ข้อความ */}
        <div className="mt-4 text">
          <p className="font-semibold">Log ข้อความจาก API:</p>
          <pre className="text-sm bg-gray-100 p-6 rounded-lg border border-gray-300 shadow-lg w-full max-w-4xl overflow-auto">
            {logMessage}
          </pre>
        </div>
      </main>
    </div>
  );
}