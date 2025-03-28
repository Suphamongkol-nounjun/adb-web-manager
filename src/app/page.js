"use client"; // เพิ่ม use client ด้านบนสุด

import { useState } from "react";
import { useRouter } from "next/navigation"; // ใช้ useRouter สำหรับการนำทาง

export default function Homepage() {
  const [licenseKey, setLicenseKey] = useState(""); // ใช้เพื่อเก็บ license ที่กรอก
  const [errorMessage, setErrorMessage] = useState(""); // ข้อความผิดพลาดจากการกรอก license
  const [isLicenseValid, setIsLicenseValid] = useState(false); // สถานะของ license ว่าถูกต้องหรือไม่
  const router = useRouter(); // ใช้สำหรับการนำทางไปยังหน้าอื่น

  // ฟังก์ชันตรวจสอบ License
  const handleLicenseSubmit = async () => {
    try {
      const response = await fetch("/api/auth/checklicense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ licenseKey }),
      });

      const data = await response.json();

      if (data.valid) {
        setErrorMessage(""); // เคลียร์ข้อความผิดพลาด
        setIsLicenseValid(true); // เปลี่ยนสถานะว่า license ถูกต้อง
        router.push("/adbcommand"); // นำทางไปหน้าอื่นหลังจากตรวจสอบ License
      } else {
        setErrorMessage(data.message); // ถ้า License ผิด ให้แสดงข้อความผิดพลาด
      }
    } catch (error) {
      setErrorMessage("เกิดข้อผิดพลาดในการตรวจสอบ License");
    }
  };

  // ฟังก์ชันสำหรับจับการกด Enter
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleLicenseSubmit();
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* ตัว modal หรือ overlay สำหรับกรอก License */}
      {!isLicenseValid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-md shadow-lg w-full max-w-lg">
            <h2 className="text-xl mb-4">กรุณากรอก Key</h2>
            <input
              type="password" // เปลี่ยนจาก text เป็น password เพื่อให้แสดงเป็น ***
              placeholder="Enter Key"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              onKeyDown={handleKeyDown} // เพิ่ม event listener สำหรับกด Enter
              className="p-3 mb-4 border border-gray-300 rounded-md w-full"
            />
            <button
              onClick={handleLicenseSubmit}
              className="w-full py-3 bg-blue-500 text-white rounded-md"
            >
              Submit
            </button>
            {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
