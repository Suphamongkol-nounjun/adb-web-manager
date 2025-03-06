"use client";  // ✅ จำเป็นสำหรับ Next.js Client Component

import { useState, useEffect } from "react";
import Navbar from "@/app/components/navbar";

export default function adbcommand() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingFile, setExistingFile] = useState("");
  const [versionName, setVersionName] = useState(""); // ✅ ใช้เก็บ versionName
  const [localIp, setLocalIp] = useState("");
  const [logMessage, setLogMessage] = useState(""); // ✅ ใช้เก็บ log

  // ✅ ฟังก์ชันดึงข้อมูลไฟล์ APK ที่มีอยู่
  const fetchFileStatus = async () => {
    try {
      const response = await fetch("/api/uploadapkfile");
      const data = await response.json();
      
      console.log("File Status Response:", data);
      setLogMessage(JSON.stringify(data, null, 2)); 

      if (data.message === "ไม่มีไฟล์ในโฟลเดอร์") {
        setExistingFile("ไม่มีไฟล์ในโฟลเดอร์");
        setVersionName(""); // ล้าง versionName ถ้าไม่มีไฟล์
      } else if (data.fileName) {
        setExistingFile(data.fileName);
      }
    } catch (error) {
      console.error("Error fetching file status: ", error);
      setLogMessage("ไม่สามารถตรวจสอบไฟล์ได้");
    }
  };

  // ✅ ฟังก์ชันดึง IP เครื่อง
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

  // ✅ ฟังก์ชันดึง versionName จาก existingFile
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
      } else {
        console.log("ไม่พบข้อมูล versionName");
        setVersionName("ไม่พบ versionName");
      }
    } catch (error) {
      console.error("Error fetching version name: ", error);
      setLogMessage("เกิดข้อผิดพลาดในการดึงข้อมูล versionName");
    }
  };

  // ✅ ดึงข้อมูลเมื่อ Component โหลดครั้งแรก
  useEffect(() => {
    fetchFileStatus();
    fetchLocalIp();
  }, []);

  // ✅ ดึง versionName เมื่อ existingFile อัปเดต
  useEffect(() => {
    if (existingFile && existingFile !== "ไม่มีไฟล์ในโฟลเดอร์") {
      fetchVersionapk();
    }
  }, [existingFile]);

  // ✅ ฟังก์ชันอัปโหลดไฟล์
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
        setExistingFile(data.fileName); // ✅ อัปเดต existingFile
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

  useEffect(() => {
    const storedDevices = localStorage.getItem("devices");
    if (storedDevices) {
      setDevices(JSON.parse(storedDevices)); // แปลงข้อมูลจาก localStorage มาเก็บใน state
    }
  }, []);

  const handleInstalldevice = (ip) => {
    console.log("Install this device");
  };

  const handleUnistalldevice = (ip) => {
    console.log("Uninstall this device");
  };

  // ฟังก์ชันสำหรับติดตั้งหรือถอนการติดตั้งอุปกรณ์ทั้งหมด
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
        {versionName && <p className="text-green-600">📌 Version: {versionName}</p>}

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
