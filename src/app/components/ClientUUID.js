// components/ClientUUID.js
"use client";

import { useEffect } from "react";
import { getOrCreateUUID } from "../utils/uuid";

export default function ClientUUID() {
  useEffect(() => {
    getOrCreateUUID(); // เรียกใช้ฟังก์ชันเมื่อเริ่มโหลดหน้า
  }, []);

  return null; // ไม่ต้องแสดงอะไรบน UI
}