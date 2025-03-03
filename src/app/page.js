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
        if (data.message === "ไม่มีไฟล์ในโฟลเดอร์") {
          setExistingFile("ไม่มีไฟล์ในโฟลเดอร์");
        } else if (data.fileName) {
          setExistingFile(`มีไฟล์: ${data.fileName}`);
        }
      } catch (error) {
        console.error("Error fetching file status: ", error);
        setExistingFile("ไม่สามารถตรวจสอบไฟล์ได้");
      }
    };

    const fetchLocalIp = async () => {
      try {
        const response = await fetch("/api/scanadbnetwork");
        const data = await response.json();
        console.log("Local IP Response:", data); // log ข้อความจาก API
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
      setMessage("ไม่พบ IP เครื่องของคุณ กรุณารีเฟรช");
      return;
    }

    setScanning(true);
    try {
      const response = await fetch("/api/scanadbnetwork", {
        method: "POST",
        body: JSON.stringify({ ip: localIp }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      
      console.log("Scan Network Response:", data); // log ข้อความจาก API

      if (response.status === 200) {
        setDevices(data.results);
      } else {
        setMessage("เกิดข้อผิดพลาดในการสแกน");
      }
    } catch (error) {
      console.error("Error occurred: ", error);
      setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setScanning(false);
    }
  };

  const connectAllDevices = async () => {
    if (devices.length === 0) {
      setMessage("ไม่พบอุปกรณ์ที่สามารถเชื่อมต่อได้");
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

      if (response.status === 200) {
        // อัพเดต status ให้เป็น "Connect"
        const updatedDevices = devices.map(device => ({
          ...device,
          status: "Connect",
        }));
        setDevices(updatedDevices);
        setMessage("เชื่อมต่ออุปกรณ์ทั้งหมดสำเร็จ");
      } else {
        setMessage("เกิดข้อผิดพลาดในการเชื่อมต่ออุปกรณ์");
      }
    } catch (error) {
      console.error("Error occurred while connecting all devices: ", error);
      setMessage("ไม่สามารถเชื่อมต่ออุปกรณ์ทั้งหมดได้");
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

      if (response.status === 200) {
        // อัพเดต status ให้เป็น "Disconnect"
        const updatedDevices = devices.map(device => ({
          ...device,
          status: "Disconnect",
        }));
        setDevices(updatedDevices);
        setMessage("ตัดการเชื่อมต่ออุปกรณ์ทั้งหมดสำเร็จ");
      } else {
        setMessage("เกิดข้อผิดพลาดในการตัดการเชื่อมต่ออุปกรณ์");
      }
    } catch (error) {
      console.error("Error occurred while disconnecting all devices: ", error);
      setMessage("ไม่สามารถตัดการเชื่อมต่ออุปกรณ์ทั้งหมดได้");
    }
  };

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
              devices.map((device, index) => (
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
                        const updatedDevices = devices.map((dev) => 
                          dev.ip === device.ip ? { ...dev, status: dev.status === "Connect" ? "Disconnect" : "Connect" } : dev
                        );
                        setDevices(updatedDevices);
                      }}
                      className={`px-4 py-2 rounded ${
                        device.status === "Connect" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                      } text-white`}
                    >
                      {device.status === "Connect" ? "Disconnect" : "Connect"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="text-center p-4">ไม่พบอุปกรณ์</td></tr>
            )}
          </tbody>
        </table>

        {/* Log ข้อความ */}
        <div className="mt-4 text-center">
          <p className="font-semibold">Log ข้อความจาก API:</p>
          <pre className="text-sm bg-gray-100 p-4 rounded">{logMessage}</pre>
        </div>

        {/* ปุ่ม Connect all devices และ Disconnect all devices */}
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={connectAllDevices} className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600">
            Connect all devices
          </button>
          <button onClick={disconnectAllDevices} className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600">
            Disconnect all devices
          </button>
        </div>
      </main>
    </div>
  );
}
