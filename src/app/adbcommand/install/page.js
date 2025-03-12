"use client";  // ✅ จำเป็นสำหรับ Next.js Client Component

import { useState, useEffect } from "react";

export default function adbcommand() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingDevices, setLoadingDevices] = useState(true); // ✅ สร้าง state เช็คสถานะการโหลด
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [existingFile, setExistingFile] = useState("");
  const [versionName, setVersionName] = useState(""); // ✅ ใช้เก็บ versionName // ✅ ใช้เก็บ currentVersion
  const [packageName, setPackageName] = useState(""); // ✅ ใช้เก็บ packageName
  const [logMessage, setLogMessage] = useState(""); // ✅ ใช้เก็บ log
  const [devices, setDevices] = useState([]); // เพิ่ม state สำหรับอุปกรณ์
  const [installing, setInstalling] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [openingApps, setOpeningApps] = useState(false); 
  const [chunkSize, setChunkSize] = useState(1);
  const [uuid, setUuid] = useState("");

  // ฟังก์ชันดึงข้อมูลไฟล์ APK ที่มีอยู่
  const fetchFileStatus = async () => {
    try {

      const adbUuid = localStorage.getItem('adb-uuid');
      setUuid(adbUuid);
      const response = await fetch("/api/upload/uploadapkfile", {
        method: 'GET',
        headers: {
          'adb-uuid': adbUuid, // ส่งค่า adb-uuid ผ่าน HTTP headers
        },
      });
      const data = await response.json();
      
      //  console.log("File Status Response:", data);
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


  // ฟังก์ชันดึง versionName จาก existingFile
  const fetchVersionapk = async () => {
    try {
      if (!existingFile || existingFile === "ไม่มีไฟล์ในโฟลเดอร์") {
        console.error("กรุณาระบุไฟล์ APK");
        setLogMessage("กรุณาระบุไฟล์ APK");
        return;
      }

      const response = await fetch("/api/adbcommand/checkpackageapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'adb-uuid': uuid,
        },
        body: JSON.stringify({ fileName: existingFile }), // ✅ ส่ง existingFile ไป API
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลได้");
      }

      const data = await response.json();
      //  console.log("API Response:", data);
      setLogMessage(JSON.stringify(data, null, 2));

      if (data.versionName) {
        setVersionName(data.versionName);
        setPackageName(data.packageName);;
      } else {
        //  console.log("ไม่พบข้อมูล versionName");
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
  }, []);

  // ดึง versionName เมื่อ existingFile อัปเดต
  useEffect(() => {
    if (existingFile && existingFile !== "ไม่มีไฟล์ในโฟลเดอร์") {
      fetchVersionapk();
    }
  }, [existingFile]);

  const fetchCheckversion = async (allDevices) => {
    try {
      const response = await fetch("/api/adbcommand/checkpackagedevices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allDevices),
      });

      if (!response.ok) throw new Error("Error fetching device versions");

      const data = await response.json();
      const updatedDevices = allDevices.map((device) => {
        const deviceData = data.results.find((d) => d.ip === device.ip);
        return {
          ...device,
          version: deviceData ? deviceData.version : "N/A",
          status:
            deviceData && deviceData.version === "ไม่สามารถดึงข้อมูลเวอร์ชันได้"
              ? "ยังไม่ได้ติดตั้ง"
              : deviceData && deviceData.version > versionName
              ? "เวอร์ชั่นสูงกว่า"
              : deviceData && deviceData.version < versionName
              ? "เวอร์ชั่นต่ำกว่า"
              : "เวอร์ชั่นตรงกัน",
        };
      });
      //  console.log("Updated Devices:", updatedDevices);
      setDevices(updatedDevices);
    } catch (error) {
      console.error("Error fetching version name:", error);
    } finally {
      setLoadingDevices(false); // ✅ โหลดเสร็จแล้ว
    }
  };

  useEffect(() => {
    const storedDevices = localStorage.getItem("adbDevices");
    const adbUuid = localStorage.getItem('adb-uuid');
    setUuid(adbUuid);
    //  console.log("ADB UUID:", adbUuid);
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
          //  console.log("ADB Devices:", adbDevices);
  
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
                newStatus = "connect";
              }
              // ถ้าสถานะเป็น 'unauthorized' อัปเดตเป็น 'unauthorized'
              else if (adbDevice.status === "unauthorized") {
                newStatus = "unauthorized";
              }
              // ถ้าสถานะเป็น 'offline' คงเป็น 'offline'
              else if (adbDevice.status === "offline") {
                newStatus = "offline";
              }
  
              // อัปเดตสถานะใน devicesList
              device.deviceStatus = newStatus; // เพิ่มข้อมูลใหม่เป็น deviceStatus
            } else {
              // ถ้าไม่พบอุปกรณ์ใน adbDevices, ให้เปลี่ยนสถานะเป็น "offline"
              device.deviceStatus = "offline"; // อัปเดตสถานะเป็น offline
            }
          });
  
          //  console.log("Updated Devices List:", devicesList);
  
          if (packageName) {
            const Package = { packageName };
            const fileName = { existingFile };
            const allDevices = devicesList.map((device) => ({
              ...device,
              ...Package,
              ...fileName,
            }));
  

  
            fetchCheckversion(allDevices);
          } else {
            //  console.log("Package name ยังไม่พร้อม");
            setLoadingDevices(false); // ✅ โหลดเสร็จแล้ว
          }
        } catch (error) {
          console.error("Error fetching ADB devices:", error);
          setLoadingDevices(false); // ✅ โหลดเสร็จแล้ว
        }
      };
  
      fetchAdbDevices();
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
  formData.append('adb-uuid', uuid); // ส่งค่า adb-uuid ไปด้วย

  setUploading(true);
  setMessage("");

  try {
    const response = await fetch("/api/upload/uploadapkfile", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    //  console.log("Upload Response:", data);

    if (response.ok) {
      setMessage("อัพโหลดไฟล์สำเร็จ");
      setExistingFile(data.fileName); // อัปเดต existingFile
      window.location.reload();

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
  const deviceToInstall = devices
    .filter((device) => device.ip === deviceIp)
    .map((device) => ({
      ip: device.ip,
      existingFile: existingFile,
      version: versionName,
      currentversion: device.version,
    }));

  // ตรวจสอบว่าเลือกอุปกรณ์ที่ตรงหรือไม่
  if (deviceToInstall.length === 0) {
    setLogMessage("ไม่พบอุปกรณ์ที่ตรงกับ IP ที่เลือก");
    return;
  }

  try {
    // ส่งข้อมูลไปยัง API
    const response = await fetch("/api/adbcommand/adbinstalldevices", {
      method: "POST",
      body: JSON.stringify({ devices: deviceToInstall, chunkSize }),
      headers: { "Content-Type": "application/json",'adb-uuid': uuid, },
    });

    // ตรวจสอบสถานะ HTTP response
    if (!response.ok) {
      throw new Error(`API เกิดข้อผิดพลาด: ${response.statusText}`);
    }

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
          //  console.log("📢 ตอบกลับจาก API:", data);

          // อัปเดตสถานะของอุปกรณ์ที่ติดตั้ง
          setDevices((prevDevices) =>
            prevDevices.map((device) =>
              device.ip === data.ip
                ? { ...device, status: data.status, version: data.version }
                : device
            )
          );

          setLogMessage((prev) => prev + `\n${data.message}`);
        }
      });
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดขณะติดตั้ง:", error);
    setLogMessage(`ไม่สามารถติดตั้งแอพพลิเคชันให้กับอุปกรณ์ได้: ${error.message}`);
  }
};

const handleInstallAllDevices = async () => {
  if (devices.length === 0) {
    setLogMessage("ไม่พบอุปกรณ์ที่สามารถเชื่อมต่อได้");
    return;
  }

  // ตรวจสอบว่า existingFile และ versionName มีค่าหรือไม่
  if (!existingFile || !versionName) {
    setLogMessage("กรุณาเลือกไฟล์ APK และระบุเวอร์ชั่นก่อนดำเนินการ");
    return;
  }

  setInstalling(true);

  const devicesToInstall = devices.map((device) => ({
    ip: device.ip,
    existingFile: existingFile,
    version: versionName,
    currentversion: device.version,
  }));

  try {
    const response = await fetch("/api/adbcommand/adbinstalldevices", {
      method: "POST",
      body: JSON.stringify({ devices: devicesToInstall, chunkSize }),
      headers: { "Content-Type": "application/json",'adb-uuid': uuid },
    });

    // ตรวจสอบสถานะ HTTP response
    if (!response.ok) {
      throw new Error(`API เกิดข้อผิดพลาด: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const messages = decoder.decode(value).trim().split("\n");

      messages.forEach((msg) => {
        if (msg) {
          const data = JSON.parse(msg);
          //  console.log("📢 ตอบกลับจาก API:", data);

          // อัปเดตสถานะและเวอร์ชั่นของอุปกรณ์แต่ละตัว
          setDevices((prevDevices) =>
            prevDevices.map((device) =>
              device.ip === data.ip
                ? { ...device, status: data.status, version: data.version }
                : device
            )
          );

          setLogMessage((prev) => prev + `\n${data.message}`);
        }
      });
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดขณะติดตั้ง:", error);
    setLogMessage(`ไม่สามารถติดตั้งแอพพลิเคชั่นให้กับอุปกรณ์ทั้งหมดได้: ${error.message}`);
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
  const deviceToUninstall = devices
    .filter(device => device.ip === deviceIp)
    .map(device => ({
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
    const response = await fetch("/api/adbcommand/adbuninstalldevices", {
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
          //  console.log("📢 ตอบกลับจาก API:", data);

          // อัปเดตสถานะและลบเวอร์ชั่นของอุปกรณ์ที่ติดตั้ง
          setDevices(prevDevices =>
            prevDevices.map(device =>
              device.ip === data.ip
                ? { ...device, status: data.status, version: "" } // ลบ version เมื่อถอนการติดตั้ง
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
    packageName: device.packageName,
  }));

  try {
    const response = await fetch("/api/adbcommand/adbuninstalldevices", {
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
          //  console.log("📢 ตอบกลับจาก API:", data);

          // อัปเดตสถานะและลบเวอร์ชั่นของอุปกรณ์ทั้งหมดที่ถอนการติดตั้ง
          setDevices(prevDevices =>
            prevDevices.map(device =>
              device.ip === data.ip
                ? { ...device, status: data.status, version: "" } // ลบ version เมื่อถอนการติดตั้ง
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

const handleOpenApp = async (ip, packageName) => {
  try {
    // เรียก API เพื่อเปิดแอป
    const response = await fetch('/apiadbcommand/adbopenapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ ip, packageName }]), // ส่งข้อมูลเฉพาะอุปกรณ์หนึ่งเครื่อง
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

            {/* เลือกจำนวน Chunk Size */}
            <div className="mt-4">
        <label htmlFor="chunkSize" className="mr-2">เลือกจำนวนที่ต้องการติดตั้งพร้อมกัน:</label>
        <select
          id="chunkSize"
          value={chunkSize}
          onChange={(e) => setChunkSize(parseInt(e.target.value))}
          className="p-2 border rounded"
        >
          <option value="">-- กรุณาเลือก --</option>
          {[1, 2, 3, 4, 5].map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

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
            <th className="px-4 py-3">Open App</th>
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
                <td className="border px-4 py-3 text-center">{device.version || "N/A"}</td>
                <td className="border px-4 py-3 text-center">
                  <button
                    onClick={() => handleInstallDevice(device.ip, device.existingFile)}
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
                <td className="border px-4 py-3 text-center">
                  {/* ปุ่ม Openapp ที่ยังไม่ได้เชื่อมโยงฟังก์ชัน */}
                  <button
                    onClick={() => handleOpenApp(device.ip, device.packageName)} // เว้นฟังก์ชันเอาไว้
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
    onClick={handleInstallAllDevices}
    disabled={installing}
    className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
  >
    {installing ? "Installing..." : "Install all devices"}
  </button>

  <button
    onClick={handleUninstallAllDevices}
    disabled={uninstalling}
    className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
  >
    {uninstalling ? "Uninstalling..." : "Uninstall all devices"}
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
