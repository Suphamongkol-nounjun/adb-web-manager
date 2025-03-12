"use client";  // ✅ จำเป็นสำหรับ Next.js Client Component

import { useState, useEffect } from "react";
import Navbar from "../Components/Navbartab";

export default function Home() {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [localIp, setLocalIp] = useState("");
  const [logMessage, setLogMessage] = useState(""); // สำหรับแสดง log ข้อความ

  useEffect(() => {

    const fetchLocalIp = async () => {
      try {
        const response = await fetch("/api/network/scanadbnetwork");
        const data = await response.json();
        //  console.log("Local IP Response:", data); // log ข้อความจาก API
        setLogMessage(JSON.stringify(data, null, 2)); // แสดง JSON ที่ได้รับจาก API
        if (data.ip) {
          setLocalIp(data.ip);
        }
      } catch (error) {
        console.error("Error fetching local IP: ", error);
      }
    };

    fetchLocalIp();
  }, []);

  useEffect(() => {
    // โหลดข้อมูลจาก localStorage ตอนเปิดหน้า
    const savedDevices = localStorage.getItem("adbDevices");
    if (savedDevices) {
      let devicesList = JSON.parse(savedDevices);
      setDevices(devicesList);
      fetchAdbDevices(devicesList); // ส่ง devicesList ไปให้ฟังก์ชัน fetchAdbDevices
    }
  }, []); // ✅ ทำงานเมื่อโหลดหน้า
  
  const fetchAdbDevices = async (devicesList) => {
    try {
      const response = await fetch("/api/adbcommand/adbdevices", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) throw new Error("Error fetching ADB devices");
  
      const data = await response.json();
      const adbDevices = data.devices;
  
      // อัปเดตสถานะของอุปกรณ์จาก API โดยไม่ต้อง map ใหม่ทั้งหมด
      const updatedDevicesList = devicesList.map((device) => {
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
            newStatus = "Disconnect";
          }
          else if (adbDevice.status === "Disconnect") {
            newStatus = "Disconnect";
          }
          else if (adbDevice.status === "") {
            newStatus = "Disconnect";
          }
  
          // อัปเดตสถานะใน devicesList
          return { ...device, status: newStatus }; // อัปเดตสถานะ
        } else {
          // ถ้าไม่พบอุปกรณ์ใน adbDevices, ให้เปลี่ยนสถานะเป็น "offline"
          return { ...device, status: "Disconnect" }; // อัปเดตสถานะเป็น offline
        }
      });
  
      // อัปเดต devices
      setDevices(updatedDevicesList);
      updateLocalStorage(updatedDevicesList); // อัปเดต localStorage
      //  console.log("Updated Devices List:", updatedDevicesList);
    } catch (error) {
      console.error("Error fetching ADB devices:", error);
    }
  };
  

  const scanNetwork = async () => {
    if (!localIp) {
      setLogMessage("ไม่พบ IP เครื่องของคุณ กรุณารีเฟรช");
      return;
    }
  
    setScanning(true);
    try {
      // เรียก API สำหรับการสแกน Network
      const response = await fetch("/api/network/scanadbnetwork", {
        method: "POST",
        body: JSON.stringify({ ip: localIp }),
        headers: { "Content-Type": "application/json" },
      });
  
      const networkData = await response.json();
      //  console.log("Scan Network Response:", networkData);
  
      if (response.status !== 200) {
        setLogMessage("เกิดข้อผิดพลาดในการสแกน");
        return;
      }
  
      // เรียก API เพื่อเช็คอุปกรณ์ที่เชื่อมต่อผ่าน ADB
      const adbResponse = await fetch("/api/adbcommand/adbdevices");
      const adbData = await adbResponse.json();
      //  console.log("ADB Devices Response:", adbData);
  
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
      localStorage.setItem("adbDevices", JSON.stringify(updatedDevices));
      setLogMessage(JSON.stringify({ networkDevices: networkData, adbDevices: adbData }, null, 2));
  
    } catch (error) {
      console.error("Error occurred: ", error);
      setLogMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setScanning(false);
    }
  };

  const updateLocalStorage = (updatedDevices) => {
    localStorage.setItem("adbDevices", JSON.stringify(updatedDevices));
  };
  
  const connectDevice = async (deviceIp) => {
    try {
      const response = await fetch("/api/adbcommand/adbconnect", {
        method: "POST",
        body: JSON.stringify({ ip: deviceIp }),
        headers: { "Content-Type": "application/json" },
      });
  
      const data = await response.json();
      //  console.log("Connect Device Response:", data);
  
      if (response.status === 200) {
        const updatedDevices = devices.map((device) =>
          device.ip === deviceIp
            ? { ...device, status: data.status === "can't connect" ? "Disconnect" : "Connect" }
            : device
        );
        setDevices(updatedDevices);
        updateLocalStorage(updatedDevices); // อัปเดต localStorage
        setLogMessage(JSON.stringify(data, null, 2));
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
      const response = await fetch("/api/adbcommand/adbdisconnect", {
        method: "POST",
        body: JSON.stringify({ ip: deviceIp }),
        headers: { "Content-Type": "application/json" },
      });
  
      const data = await response.json();
      //  console.log("Disconnect Device Response:", data);
  
      if (response.status === 200) {
        const updatedDevices = devices.map((device) =>
          device.ip === deviceIp ? { ...device, status: "Disconnect" } : device
        );
        setDevices(updatedDevices);
        updateLocalStorage(updatedDevices); // อัปเดต localStorage
        setLogMessage(JSON.stringify(data, null, 2));
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
      const response = await fetch("/api/adbcommand/adbconnectall", {
        method: "POST",
        body: JSON.stringify(devicesToConnect),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
      //  console.log("Connect All Devices Response:", data);
      setLogMessage(JSON.stringify(data, null, 2));
  
      if (response.status === 200) {
        const updatedDevices = devices.map(device => ({
          ...device,
          status: "Connect",
        }));
        setDevices(updatedDevices);
        updateLocalStorage(updatedDevices); // อัปเดต localStorage
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
      const response = await fetch("/api/adbcommand/adbdisconnectall", {
        method: "POST",
        body: JSON.stringify(devicesToDisconnect),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
      //  console.log("Disconnect All Devices Response:", data);
      setLogMessage(JSON.stringify(data, null, 2));
  
      if (response.status === 200) {
        const updatedDevices = devices.map(device => ({
          ...device,
          status: "Disconnect",
        }));
        setDevices(updatedDevices);
        updateLocalStorage(updatedDevices); // อัปเดต localStorage
      } else {
        setLogMessage("เกิดข้อผิดพลาดในการตัดการเชื่อมต่ออุปกรณ์");
      }
    } catch (error) {
      console.error("Error occurred while disconnecting all devices: ", error);
      setLogMessage("ไม่สามารถตัดการเชื่อมต่ออุปกรณ์ทั้งหมดได้");
    }
  };
  
    

  useEffect(() => {
    //  console.log("Log message:", logMessage); // ตรวจสอบค่า logMessage
  }, [logMessage]); // ทำงานทุกครั้งที่ logMessage เปลี่ยนแปลง

  return (
    <div>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-7 sm:p-20">
        {/* ปุ่ม Scan Network */}
        <button
          onClick={scanNetwork}
          disabled={scanning}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {scanning ? "กำลังสแกน..." : "สแกน Network"}
        </button>

        <p className="text-gray-600">📍 IP ของคุณ: {localIp || "กำลังโหลด..."}</p>

        <h2 className="font-semibold text-lg mt-4">📋 อุปกรณ์ที่พบ:</h2>
        
        {/* ตารางแสดงอุปกรณ์ */}
        <table className="w-full max-w-4xl border-collapse shadow-lg rounded-lg overflow-hidden mt-4">
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
                const isIpValid = /^\d+\.\d+\.\d+\.\d+$/.test(device.ip);
                return (
                  <tr key={index} className={`${index % 2 === 0 ? "bg-gray-100" : "bg-white"} hover:bg-gray-200`}>
                    <td className="border px-4 py-3 text-center">{index + 1}</td>
                    <td className="border px-4 py-3 text-center">{device.ip}</td>
                    <td className="border px-4 py-3 text-center">{device.mac || "-"}</td>
                    <td className="border px-4 py-3 text-center">{device.vendor || "-"}</td>
                    <td className="border px-4 py-3 text-center">{device.port || "-"}</td>
                    <td className="border px-4 py-3 text-center">{device.service || "-"}</td>
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
                        disabled={!isIpValid}
                        className={`px-4 py-2 rounded text-white 
                          ${device.status === "Connect" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
                          ${!isIpValid ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400" : ""}`}
                      >
                        {isIpValid ? (device.status === "Connect" ? "Disconnect" : "Connect") : "Connect"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="text-center p-4">ไม่พบอุปกรณ์</td>
              </tr>
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
{/* Adb command group button */}
<div className="mt-8 w-full max-w-4xl border p-6 rounded-lg border-gray-300 shadow-lg">
  <h3 className="font-semibold text-xl mb-4 text-center">ADB Command</h3>
  <div className="flex flex-wrap justify-center gap-4">
    <a href="/adbcommand/install" className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-center">
      Install / Uninstall / Open App
    </a>
    <a href="/adbcommand/openforceclear" className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-center">
      Open App / Force Stop / Clear Data
    </a>
    <a href="/disable-bluetooth" className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-center">
      Disable App
    </a>
    {/* ปุ่มสุดท้ายจะไปอยู่แถวใหม่ */}
    <div className="w-full text-center">
      <a href="/disable-bluetooth" className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">
        Disable App
      </a>
    </div>
  </div>
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