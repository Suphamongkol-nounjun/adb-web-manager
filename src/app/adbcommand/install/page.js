"use client";  // ✅ จำเป็นสำหรับ Next.js Client Component

import { useState, useEffect } from "react";
import Navbar from "@/app/components/navbar";

export default function adbcommand() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingFile, setExistingFile] = useState("");
  const [versionName, setVersionName] = useState(""); // ✅ ใช้เก็บ versionName
  const [packageName, setPackageName] = useState(""); // ✅ ใช้เก็บ packageName
  const [localIp, setLocalIp] = useState("");
  const [logMessage, setLogMessage] = useState(""); // ✅ ใช้เก็บ log
  const [devices, setDevices] = useState([]); // เพิ่ม state สำหรับอุปกรณ์

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

   // ดึงข้อมูลอุปกรณ์จาก localStorage และเช็ค version จาก API
   useEffect(() => {
    const storedDevices = localStorage.getItem("adbDevices");
    if (storedDevices) {
      const devicesList = JSON.parse(storedDevices);

      // กรองเฉพาะอุปกรณ์ที่มีสถานะเป็น 'connect' (แปลงเป็นตัวพิมพ์เล็ก)
      const connectedDevices = devicesList.filter(device => device.status.toLowerCase() === "connect");
      console.log("Connected Devices:", connectedDevices);

      // ทำการดึงข้อมูล version จาก api/checkpackagedevices
      connectedDevices.forEach(async (device) => {
        const { ip } = device; // ดึงข้อมูล ip

        if (packageName) {  // ใช้ packageName ที่ได้จาก fetchVersionapk
          try {
            const response = await fetch("/api/checkpackagedevices", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ip, packageName }), // ส่ง packageName ไปที่ API
            });
            console.log("Response for device:", response);

            // if (response.ok) {
            //   const data = await response.json();
            //   console.log(`Version for device ${ip}:`, data.versionName);

            //   // อัปเดต devices ใหม่ให้มี currentVersion
            //   device.currentVersion = data.versionName || "N/A";
            // } else {
            //   console.error("Failed to fetch version for device:", ip);
            //   device.currentVersion = "N/A";
            // }
          } catch (error) {
            console.error("Error fetching version for device:", error);
            device.currentVersion = "N/A";
          }
        }
      });

      setDevices(connectedDevices); // อัปเดตข้อมูลอุปกรณ์
    }
  }, [packageName]); // ใช้ packageName ใน dependency ของ useEffect

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
      
      console.log("Upload Response:", data);
      setLogMessage(JSON.stringify(data, null, 2));

      if (response.ok && data.Message === "Success") {
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

  // ฟังก์ชันสำหรับติดตั้งและถอนการติดตั้งอุปกรณ์ทั้งหมด
  const handleInstallAllDevices = () => {
    console.log("Install all devices");
  };

  const handleUninstallAllDevices = () => {
    console.log("Uninstall all devices");
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
            {devices.length > 0 ? (
              devices.map((device, index) => {
                return (
                  <tr key={index} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} hover:bg-gray-200`}>
                    <td className="border px-4 py-3 text-center">{index + 1}</td>
                    <td className="border px-4 py-3 text-center">{device.ip}</td>
                    <td className="border px-4 py-3 text-center">{device.status}</td>
                    <td className="border px-4 py-3 text-center">{device.version || "N/A"}</td>
                    <td className="border px-4 py-3 text-center">
                      <button className="px-4 py-2 rounded text-white bg-green-500 hover:bg-green-600">
                        Install
                      </button>
                    </td>
                    <td className="border px-4 py-3 text-center">
                      <button className="px-4 py-2 rounded text-white bg-red-500 hover:bg-red-600">
                        Uninstall
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-4">ไม่พบอุปกรณ์ที่เชื่อมต่อ</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ปุ่ม Install all devices และ Uninstall all devices */}
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={handleInstallAllDevices} className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">
            Install all devices
          </button>
          <button onClick={handleUninstallAllDevices} className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600">
            Uninstall all devices
          </button>
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
