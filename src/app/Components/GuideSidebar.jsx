import { useState } from 'react';

export default function GuideSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ปุ่มเปิดปิด - ปรับให้อยู่มุมบนซ้าย */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed left-0 top-0 z-50
          bg-blue-600 text-white px-4 py-2 rounded-r-lg
          shadow-md hover:bg-blue-700 transition-colors
          flex items-center gap-2
          mt-20
        `}
      >
        {isOpen ? (
          <>
            <span className="text-xl">✕</span>
            <span className="hidden sm:inline">ปิด</span>
          </>
        ) : (
          <>
            <span className="text-xl">🎮</span>
            <span className="hidden sm:inline">วิธีควบคุม</span>
          </>
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 bg-gray-50 shadow-xl z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          mt-0
        `}
      >
        <div className="p-6 overflow-y-auto h-full">
          <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center mt-20">วิธีควบคุม</h2>
          
          <div className="space-y-4">
            {/* ส่วนควบคุมพื้นฐาน */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-blue-500 mb-2">การควบคุมพื้นฐาน</h3>
              <ul className="space-y-2 pl-5 list-disc text-gray-700">
                <li><span className="font-medium">คลิกซ้าย</span> - สัมผัสหน้าจอ (Tap)</li>
                <li><span className="font-medium">คลิกขวา</span> - ปุ่ม Back</li>
                <li><span className="font-medium">คลิกกลาง</span> - ปุ่ม Home</li>
                <li><span className="font-medium">ลากเมาส์</span> - เลื่อนหน้าจอ (Scroll)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 z-30"
        />
      )}
    </>
  );
}