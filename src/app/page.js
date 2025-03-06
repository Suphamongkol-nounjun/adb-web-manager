import Link from 'next/link';
import Navbar from './components/navbar';

export default function Homepage() {
  return (
    <div>
      <nav className="w-full p-4 bg-gray-800 text-white">
      <ul className="flex justify-start space-x-8"> {/* ปรับใช้ justify-start */}
        <li>
          <Link href="/" className="hover:text-yellow-300">
            Home
          </Link>
        </li>
        <li>
          <Link href="/adbcommand" className="hover:text-yellow-300">
            ADB Command
          </Link>
        </li>
      </ul>
    </nav>
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
              ADB Command
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
