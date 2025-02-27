"use client";  // ✅ เพิ่มบรรทัดนี้

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={180} height={38} priority />

        <input type="file" accept=".apk" onChange={handleFileChange} />
        {selectedFile && <p>📂 เลือกไฟล์: {selectedFile.name}</p>}
      </main>
    </div>
  );
}
