"use client";  // ✅ จำเป็นสำหรับ Next.js Client Component

import { useState, useEffect } from "react";
import Navbar from "@/app/components/navbar";
import { version } from "os";

export default function adbcommand() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingDevices, setLoadingDevices] = useState(true); // ✅ สร้าง state เช็คสถานะการโหลด
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingFile, setExistingFile] = useState("");
  const [versionName, setVersionName] = useState(""); // ✅ ใช้เก็บ versionName
  const [packageName, setPackageName] = useState(""); // ✅ ใช้เก็บ packageName
  const [localIp, setLocalIp] = useState("");
  const [logMessage, setLogMessage] = useState(""); // ✅ ใช้เก็บ log
  const [devices, setDevices] = useState([]); // เพิ่ม state สำหรับอุปกรณ์
  const [installing, setInstalling] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);

  // ฟังก์ชันดึงข้อมูลไฟล์ APK ที่มีอยู่
  const fetchFileStatus = async () => {
    try {
      const response = await fetch("/api/uploadapkfile");
      const data = await response.json();
      
      console.log("File Status Response:", data);
      setLogMessage(JSON.stringify(data, null, 2)); 

      if (data.message === "ไม่มีไฟล์ในโฟลเดอร์") {
        setExistingFile("ไม่มีไฟล์ในโฟลเดอร์");
        setVersionName(""); // ล้าง versionName ถ้าไม่มีไฟล์
        setPackageName("");
      } else if (data.fileName) {
        setExistingFile(data.fileName);
      }
    } catch (error) {
      console.error("Error fetching file status: ", error);
      setLogMessage("ไม่สามารถตรวจสอบไฟล์ได้");
    }
  };

  // ฟังก์ชันดึง IP เครื่อง
  const fetchLocalIp = async () => {
    try {
      const response = await fetch("/api/scanadbnetwork");
      const data = await response.json();
      console.log("Local IP Response:", data);
      setLogMessage(JSON.stringify(data, null, 2));
      if (data.ip) {
        setLocalIp(data.ip);
      }
    } catch (error) {
      console.error("Error fetching local IP: ", error);
    }
  };

  // ฟังก์ชันดึง versionName จาก existingFile
  const fetchVersionapk = async () => {
    try {
      if (!existingFile || existingFile === "ไม่มีไฟล์ในโฟลเดอร์") {
        console.error("กรุณาระบุไฟล์ APK");
        setLogMessage("กรุณาระบุไฟล์ APK");
        return;
      }

      const response = await fetch("/api/checkpackageapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: existingFile }), // ✅ ส่ง existingFile ไป API
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลได้");
      }

      const data = await response.json();
      console.log("API Response:", data);
      setLogMessage(JSON.stringify(data, null, 2));

      if (data.versionName) {
        setVersionName(data.versionName);
        setPackageName(data.packageName);
      } else {
        console.log("ไม่พบข้อมูล versionName");
        setVersionName("ไม่พบ versionName");
        setPackageName("ไม่พบ packageName");
      }
    } catch (error) {
      console.error("Error fetching version name: ", error);
      setLogMessage("เกิดข้อผิดพลาดในการดึงข้อมูล versionName");
    }
  };

  // ดึงข้อมูลเมื่อ Component โหลดครั้งแรก
  useEffect(() => {
    fetchFileStatus();
    fetchLocalIp();
  }, []);

  // ดึง versionName เมื่อ existingFile อัปเดต
  useEffect(() => {
    if (existingFile && existingFile !== "ไม่มีไฟล์ในโฟลเดอร์") {
      fetchVersionapk();
    }
  }, [existingFile]);

  useEffect(() => {
    const storedDevices = localStorage.getItem("adbDevices");
    if (storedDevices) {
      let devicesList = JSON.parse(storedDevices);
      
      setLoadingDevices(true); // ✅ เริ่มโหลดข้อมูล
      
      let connectedDevices = devicesList.filter(device => device.status.toLowerCase() === "connect");
  
      if (packageName) {
        const Package = { packageName };
        const fileName = {existingFile}
        connectedDevices = connectedDevices.map(device => ({
          ...device,
          ...Package,
          ...fileName
        }));
        console.log("Connected Devices:", connectedDevices);
        const fetchCheckversion = async () => {
          try {
            const response = await fetch("/api/checkpackagedevices", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(connectedDevices),
            });
  
            if (!response.ok) throw new Error("Error fetching device versions");
  
            const data = await response.json();
            const updatedDevices = connectedDevices.map(device => {
              const deviceData = data.results.find(d => d.ip === device.ip);
              return {
                ...device,
                version: deviceData ? deviceData.version : "N/A",
                status: deviceData && deviceData.version === "ไม่สามารถดึงข้อมูลเวอร์ชันได้"
                ? "ยังไม่ได้ติดตั้ง"
                : deviceData && deviceData.version > versionName
                ? "เวอร์ชั่นสูงกว่า"
                : deviceData && deviceData.version < versionName
                ? "เวอร์ชั่นต่ำกว่า"
                : "เวอร์ชั่นตรงกัน",
              };
            });
            // return console.log("Updated Devices:", updatedDevices);
            setDevices(updatedDevices);
          } catch (error) {
            console.error("Error fetching version name:", error);
          } finally {
            setLoadingDevices(false); // ✅ โหลดเสร็จแล้ว
          }
        };
  
        fetchCheckversion();
      } else {
        console.log("Package name ยังไม่พร้อม");
        setLoadingDevices(false); // ✅ โหลดเสร็จแล้ว
      }
    } else {
      setLoadingDevices(false); // ✅ ไม่มีข้อมูลใน localStorage
    }
  }, [packageName]);
  
  // ฟังก์ชันอัปโหลดไฟล์
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
      
      console.log("Upload Response:", data.fileName);
      setLogMessage(JSON.stringify(data, null, 2));

      if (response.ok) {
        setMessage("อัพโหลดไฟล์สำเร็จ");
        setExistingFile(data.fileName); // อัปเดต existingFile
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

  const handleInstallDevice = async (deviceIp) => {
    // ตรวจสอบว่าอุปกรณ์มีข้อมูลหรือไม่
    if (devices.length === 0) {
      setLogMessage("ไม่พบอุปกรณ์ที่สามารถเชื่อมต่อได้");
      return;
    }
  
    // คัดเลือกอุปกรณ์ที่มี IP ตรงกับ deviceIp
    const deviceToInstall = devices.filter(device => device.ip === deviceIp).map(device => ({
      ip: device.ip,
      existingFile: device.existingFile,
      version: versionName,
    }));
     return console.log("Device to Install:", deviceToInstall);
  
    // ตรวจสอบว่าเลือกอุปกรณ์ที่ตรงหรือไม่
    if (deviceToInstall.length === 0) {
      setLogMessage("ไม่พบอุปกรณ์ที่ตรงกับ IP ที่เลือก");
      return;
    }
  
    try {
      // ส่งข้อมูลไปยัง API
      const response = await fetch("/api/adbinstalldevices", {
        method: "POST",
        body: JSON.stringify(deviceToInstall),
        headers: { "Content-Type": "application/json" },
      });
  
      // อ่านข้อมูลที่ตอบกลับจาก API
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const messages = decoder.decode(value).trim().split("\n");
  
        // ทำงานกับข้อมูลที่ได้รับจาก API
        messages.forEach((msg) => {
          if (msg) {
            const data = JSON.parse(msg);
            console.log("📢 ตอบกลับจาก API:", data);
  
            // อัปเดตสถานะของอุปกรณ์ที่ติดตั้ง
            setDevices(prevDevices =>
              prevDevices.map(device =>
                device.ip === data.ip
                  ? { ...device, status: data.status, version: data.version }
                  : device
              )
            );
  
            setLogMessage(prev => prev + `\n${data.message}`);
          }
        });
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะติดตั้ง:", error);
      setLogMessage("ไม่สามารถติดตั้งแอพพลิเคชันให้กับอุปกรณ์ได้");
    }
  };
  

  // ฟังก์ชันสำหรับติดตั้งและถอนการติดตั้งอุปกรณ์ทั้งหมด
  const handleInstallAllDevices = async () => {
    if (devices.length === 0) {
      setLogMessage("ไม่พบอุปกรณ์ที่สามารถเชื่อมต่อได้");
      return;
    }
  
    setInstalling(true);
  
    const devicesToInstall = devices.map(device => ({
      ip: device.ip,
      existingFile: device.existingFile,
    }));
  
    try {
      const response = await fetch("/api/adbinstalldevices", {
        method: "POST",
        body: JSON.stringify(devicesToInstall),
        headers: { "Content-Type": "application/json" },
      });
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const messages = decoder.decode(value).trim().split("\n");
  
        messages.forEach((msg) => {
          if (msg) {
            const data = JSON.parse(msg);
            console.log("📢 ตอบกลับจาก API:", data);
  
            // 🔹 อัปเดตสถานะของอุปกรณ์แต่ละตัว
            setDevices(prevDevices =>
              prevDevices.map(device =>
                device.ip === data.ip
                  ? { ...device, status: data.status }
                  : device
              )
            );
  
            setLogMessage(prev => prev + `\n${data.message}`);
          }
        });
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะติดตั้ง:", error);
      setLogMessage("ไม่สามารถติดตั้งแอพพลิเคชั่นให้กับอุปกรณ์ทั้งหมดได้");
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstallDevice = async (deviceIp) => {
    // ตรวจสอบว่าอุปกรณ์มีข้อมูลหรือไม่
    if (devices.length === 0) {
      setLogMessage("ไม่พบอุปกรณ์ที่สามารถเชื่อมต่อได้");
      return;
    }
  
  
    // คัดเลือกอุปกรณ์ที่มี IP ตรงกับ deviceIp
    const deviceToUninstall = devices.filter(device => device.ip === deviceIp).map(device => ({
      ip: device.ip,
      packageName: device.packageName,
    }));
  
    // ตรวจสอบว่าเลือกอุปกรณ์ที่ตรงหรือไม่
    if (deviceToUninstall.length === 0) {
      setLogMessage("ไม่พบอุปกรณ์ที่ตรงกับ IP ที่เลือก");
      return;
    }
  
    try {
      // ส่งข้อมูลไปยัง API
      const response = await fetch("/api/adbuninstalldevices", {
        method: "POST",
        body: JSON.stringify(deviceToUninstall),
        headers: { "Content-Type": "application/json" },
      });
  
      // อ่านข้อมูลที่ตอบกลับจาก API
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const messages = decoder.decode(value).trim().split("\n");
  
        // ทำงานกับข้อมูลที่ได้รับจาก API
        messages.forEach((msg) => {
          if (msg) {
            const data = JSON.parse(msg);
            console.log("📢 ตอบกลับจาก API:", data);
  
            // อัปเดตสถานะของอุปกรณ์ที่ติดตั้ง
            setDevices(prevDevices =>
              prevDevices.map(device =>
                device.ip === data.ip
                  ? { ...device, status: data.status }
                  : device
              )
            );
  
            setLogMessage(prev => prev + `\n${data.message}`);
          }
        });
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะลบ:", error);
      setLogMessage("ไม่สามารถลบแอพพลิเคชันให้กับอุปกรณ์ได้");
    }
  };
  

  const handleUninstallAllDevices = async () => {
    if (devices.length === 0) {
      setLogMessage("ไม่พบอุปกรณ์ที่สามารถเชื่อมต่อได้");
      return;
    }
  
    setUninstalling(true);
  
    const devicesToUninstall = devices.map(device => ({
      ip: device.ip,
      packageName: device.packageName
    }));
  
    try {
      const response = await fetch("/api/adbuninstalldevices", {
        method: "POST",
        body: JSON.stringify(devicesToUninstall),
        headers: { "Content-Type": "application/json" },
      });
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const messages = decoder.decode(value).trim().split("\n");
  
        messages.forEach((msg) => {
          if (msg) {
            const data = JSON.parse(msg);
            console.log("📢 ตอบกลับจาก API:", data);
  
            // 🔹 อัปเดตสถานะของอุปกรณ์แต่ละตัว
            setDevices(prevDevices =>
              prevDevices.map(device =>
                device.ip === data.ip
                  ? { ...device, status: data.status }
                  : device
              )
            );
  
            setLogMessage(prev => prev + `\n${data.message}`);
          }
        });
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะลบ:", error);
      setLogMessage("ไม่สามารถลบแอพพลิเคชั่นให้กับอุปกรณ์ทั้งหมดได้");
    } finally {
      setUninstalling(false);
    }
  };

  

  return (
    <div>
      <Navbar />
      <main className="flex flex-col items-center justify-start min-h-screen p-4 gap-5 sm:p-10 mt-[80px]">
        
        {/* ข้อความไฟล์ที่มีอยู่ */}
        <p className="font-semibold">📂 ไฟล์ APK: {existingFile}</p>
        
        {/* แสดง versionName ที่ดึงมาได้ */}
        <p className="text-green-600">📌 Version: {versionName}</p>

        {/* แสดง packageName ที่ดึงมาได้ */}
        <p className="text-green-600">📌 Package: {packageName}</p>

        {/* ฟอร์มเลือกไฟล์ */}
        <input 
          type="file" 
          accept=".apk" 
          onChange={(e) => setSelectedFile(e.target.files[0])} 
          className="p-2 border rounded" 
        />
        
        {/* แสดงชื่อไฟล์ที่เลือก */}
        {selectedFile && <p>📂 เลือกไฟล์: {selectedFile.name}</p>}
        
        {/* ปุ่มอัปโหลดไฟล์ */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {uploading ? "กำลังอัพโหลด..." : "อัพโหลดไฟล์"}
        </button>

        {/* ข้อความแสดงผล */}
        {message && <p className="mt-4 text-center text-red-500">{message}</p>}

        {/* ตารางแสดงอุปกรณ์ */}
        <h2 className="font-semibold text-lg mt-4">📋 อุปกรณ์ที่พบ:</h2>
        <table className="w-full max-w-4xl border-collapse shadow-lg rounded-lg overflow-hidden mt-4">
    <thead>
      <tr className="bg-blue-500 text-white text-center">
        <th className="px-4 py-3">#</th>
        <th className="px-4 py-3">IP Address</th>
        <th className="px-4 py-3">Status</th>
        <th className="px-4 py-3">Current Version</th>
        <th className="px-4 py-3">Install</th>
        <th className="px-4 py-3">Uninstall</th>
      </tr>
    </thead>
    <tbody>
      {loadingDevices ? (
        <tr>
          <td colSpan="6" className="text-center p-4">กำลังโหลดข้อมูล...</td>
        </tr>
      ) : devices.length > 0 ? (
        devices.map((device, index) => (
          <tr key={index} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} hover:bg-gray-200`}>
            <td className="border px-4 py-3 text-center">{index + 1}</td>
            <td className="border px-4 py-3 text-center">{device.ip}</td>
            <td className="border px-4 py-3 text-center">{device.status}</td>
            <td className="border px-4 py-3 text-center">{device.version || "N/A"}</td>
            <td className="border px-4 py-3 text-center">
            <button
                onClick={() => handleInstallDevice(device.ip,device.existingFile)}
                className="px-4 py-2 rounded text-white bg-green-500 hover:bg-green-600"
              >
                Install
              </button>
            </td>
            <td className="border px-4 py-3 text-center">
            <button
  onClick={() => handleUninstallDevice(device.ip, device.packageName)}
  className="px-4 py-2 rounded text-white bg-red-500 hover:bg-red-600"
>
  Uninstall
</button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="6" className="text-center p-4">ไม่พบอุปกรณ์</td>
        </tr>
      )}
    </tbody>
  </table>

        {/* ปุ่ม Install all devices และ Uninstall all devices */}
         <div className="flex justify-center gap-4 mt-8">
          {/* <button onClick={handleInstallAllDevices} className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">
            Install all devices
          </button> */} 
                {/* ปุ่มติดตั้ง APK */}
      <button
        onClick={handleInstallAllDevices}
        disabled={installing}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {installing ? "Installing..." : "Install all devices"}
      </button>
      <button
        onClick={handleUninstallAllDevices}
        disabled={uninstalling}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {uninstalling ? "Uninstalling..." : "Uninstall all devices"}
      </button>
          {/* <button onClick={handleUninstallAllDevices} className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600">
            Uninstall all devices
          </button> */}
        </div>

        {/* Log ข้อความจาก API */}
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
