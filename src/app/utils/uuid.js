"use client";

// utils/uuid.js
import { v4 as uuidv4 } from "uuid";

export function getOrCreateUUID() {
  let uuid = localStorage.getItem("adb-uuid");
  if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem("adb-uuid", uuid);
    console.log("🔑 สร้าง UUID ใหม่:", uuid);
  } else {
    console.log("✅ UUID มีอยู่แล้ว:", uuid);
  }
  return uuid;
}