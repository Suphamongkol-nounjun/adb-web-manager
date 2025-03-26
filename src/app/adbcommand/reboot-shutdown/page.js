"use client";  // ✅ จำเป็นสำหรับ Next.js Client Component

import AdbCommandGroup from "@/app/Components/ADBCommandGroup";
import { useState, useEffect } from "react";

export default function adbcommand() {
  const [loadingDevices, setLoadingDevices] = useState(true); // ✅ สร้าง state เช็คสถานะการโหลด
  const [packageName, setPackageName] = useState(""); // ✅ ใช้เก็บ packageName
  const [logMessage, setLogMessage] = useState(""); // ✅ ใช้เก็บ log
  const [devices, setDevices] = useState([]); // เพิ่ม state สำหรับอุปกรณ์
  const [rebooting, setRebooting] = useState(false);
  const [shutdowning, setShutdowning] = useState(false);
  const [openingApps, setOpeningApps] = useState(false); 


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
  
          // ใช้ .map() เพื่อคืนค่าอาร์เรย์ใหม่
          const updatedDevicesList = devicesList.map((device) => {
            const deviceIp = device.ip.split(":")[0];

            const adbDevice = adbDevices.find((d) => {
              const adbDeviceIp = d.deviceId.split(":")[0];
              return adbDeviceIp === deviceIp;
            });

            if (adbDevice) {
              let newStatus = device.status;

              if (adbDevice.status === "device") newStatus = "connect";
              else if (adbDevice.status === "unauthorized") newStatus = "unauthorized";
              else if (adbDevice.status === "offline") newStatus = "offline";

              return { ...device, deviceStatus: newStatus };
            } else {
              return { ...device, deviceStatus: "offline" };
            }
          });

          console.log("Updated Devices List:", updatedDevicesList);
          setDevices(updatedDevicesList);

        } catch (error) {
          console.error("Error fetching ADB devices:", error);
          setLoadingDevices(false);
        }
      };

      fetchAdbDevices();
      setLoadingDevices(false);
    } else {
      setLoadingDevices(false);
    }
}, []);
useEffect(() => {
  console.log("📌 Devices Updated in State:", devices);
}, [devices]); // ตรวจสอบการเปลี่ยนแปลง

const handlRebootDevice = async (ip) =>{
try {
  // เรียก API เพื่อเปิดแอป
  const response = await fetch('/api/adbcommand/adbreboot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ ip }]), // ส่งข้อมูล IP และ package ที่เลือก
  });

  // ตรวจสอบว่าคำขอสำเร็จหรือไม่
  if (!response.ok) {
    setLogMessage('เกิดข้อผิดพลาดในการรีบูท');
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
    setLogMessage('เกิดข้อผิดพลาดในการรีบูท');
}
}
const handlRebootAllDevices = async (ip) =>{
  setRebooting(true); // เริ่มการติดตั้ง

  const response = await fetch('/api/adbcommand/adbreboot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(devices), // ส่งเฉพาะ ip ของอุปกรณ์
  });

  // ตรวจสอบว่าคำขอสำเร็จ
  if (!response.ok) {
    setLogMessage('เกิดข้อผิดพลาด');
    setRebooting(false);
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
        //  console.log("📢 ตอบกลับจาก API:", data);

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

  setRebooting(false); // เสร็จสิ้น
  }

const handlShutdownDevice = async (ip) =>{
    try {
      // เรียก API เพื่อเปิดแอป
    const response = await fetch('/api/adbcommand/adbshutdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ ip}]), // ส่งข้อมูล IP และ package ที่เลือก
    });

    // ตรวจสอบว่าคำขอสำเร็จหรือไม่
    if (!response.ok) {
      setLogMessage('เกิดข้อผิดพลาดในการปิดเครื่อง');
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
        setLogMessage('เกิดข้อผิดพลาดในการปิดเครื่อง');
    }

  }
  const handlShutdownAllDevices = async () =>{
    setShutdowning(true); // เริ่มการติดตั้ง

  const response = await fetch('/api/adbcommand/adbshutdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(devices), // ส่งเฉพาะ ip ของอุปกรณ์
  });

  // ตรวจสอบว่าคำขอสำเร็จ
  if (!response.ok) {
    setLogMessage('เกิดข้อผิดพลาด');
    setShutdowning(false);
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
        //  console.log("📢 ตอบกลับจาก API:", data);

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

  setShutdowning(false); // เสร็จสิ้น

  }


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

  const response = await fetch('/api/adbcommand/adbopenapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(devices), // ส่งเฉพาะ ip ของอุปกรณ์
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
        //  console.log("📢 ตอบกลับจาก API:", data);

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

  

return (
  <div>
    <main className="flex flex-col items-center justify-start min-h-screen p-8 gap-7 sm:p-20">
    <h2 className="text-3xl font-semibold text-center text-blue-600 mb-6">
  Reboot / Shutdown
</h2>

      {/* ตารางแสดงอุปกรณ์ */}
      <h2 className="font-semibold text-lg mt-4">📋 อุปกรณ์ที่พบ:</h2>
      <table className="w-full max-w-4xl border-collapse shadow-lg rounded-lg overflow-hidden mt-4">
        <thead>
          <tr className="bg-blue-500 text-white text-center">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">IP Address</th>
            <th className="px-4 py-3">Device Status</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Reboot</th>
            <th className="px-4 py-3">Shutdown</th>
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
                    : device.status}
                </td>
                <td className="border px-4 py-3 text-center">{device.status || "N/A"}</td>
                <td className="border px-4 py-3 text-center">
                  <button
                    onClick={() => handlRebootDevice(device.ip)}
                    className="px-4 py-2 rounded text-white bg-green-500 hover:bg-green-600"
                  >
                    Reboot
                  </button>
                </td>
                <td className="border px-4 py-3 text-center">
                  <button
                    onClick={() => handlShutdownDevice(device.ip)}
                    className="px-4 py-2 rounded text-white bg-red-500 hover:bg-red-600"
                  >
                    Shutdown
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
  <td colSpan="7" className="text-center p-4 align-middle">ไม่พบอุปกรณ์</td>
</tr>
          )}
        </tbody>
      </table>

{/* ปุ่ม Install all devices, Uninstall all devices และ Open all apps */}
<div className="flex justify-center gap-4 mt-8">
  <button
    onClick={handlRebootAllDevices}
    disabled={rebooting}
    className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
  >
    {rebooting ? "Rebooting..." : "Reboot all devices"}
  </button>

  <button
    onClick={handlShutdownAllDevices}
    disabled={shutdowning}
    className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
  >
    {shutdowning ? "Shutdowning..." : "Shutdown all devices"}
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

          <AdbCommandGroup />
      {/* Log ข้อความจาก API */}
      <div className="mt-4 text">
        <p className="font-semibold">Log ข้อความจาก API:</p>
        <pre className="text-sm bg-gray-100 p-6 rounded-lg border border-gray-300 shadow-lg w-full max-w-4xl overflow-auto">
          {logMessage}
        </pre>
      </div>

    </main>
{/* Footer สำหรับคำอธิบายขั้นตอน */}
<div className="footer-instructions bg-gray-100 text-blue-600 font-medium py-4 mt-6">
  <div className="max-w-3xl mx-auto text-left">
    <p>
      ⚙️ หน้านี้ช่วยให้คุณสามารถรีบูตหรือปิดเครื่องอุปกรณ์ Android ที่เชื่อมต่อผ่าน ADB ได้.<br />
      <strong>ขั้นตอนการทำงาน:</strong><br />
      1. เลือกอุปกรณ์ที่ต้องการรีบูตหรือปิดเครื่อง.<br />
      2. สามารถเลือกรีบูตหรือปิดเครื่องทีละเครื่องหรือทั้งหมดก็ได้.<br />
      3. เมื่อคุณกดปุ่ม <strong>Reboot</strong> หรือ <strong>Shutdown</strong>, ระบบจะทำการสั่งรีบูตหรือปิดเครื่องอุปกรณ์ที่เลือก.<br />
      4. โปรดระมัดระวังในการเลือกเครื่องที่ต้องการรีบูตหรือปิดเครื่อง เพื่อหลีกเลี่ยงผลกระทบต่อการทำงานของอุปกรณ์.<br />
      5. หากเลือกหลายเครื่อง, การดำเนินการจะเกิดขึ้นกับทุกเครื่องที่เลือก.
    </p>
  </div>
</div>
  </div>
  
);

}
