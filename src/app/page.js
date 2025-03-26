import Link from 'next/link';

export default function Homepage() {
  return (
    <div>

      {/* Main Content */}
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <div className="flex justify-center w-full"> {/* ใช้ flex เพื่อให้ปุ่มอยู่ตรงกลาง */}
          <Link href="/adbcommand">
            <button
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              ADB Connect Device
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
