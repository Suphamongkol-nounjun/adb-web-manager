import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="w-full p-4 bg-gray-800 text-white">
      <ul className="flex justify-start space-x-8"> {/* ปรับใช้ justify-start */}
        <li>
          <Link href="/" className="hover:text-yellow-300">
            Home
          </Link>
        </li>
        <li>
          <Link href="/adbcommand" className="hover:text-yellow-300">
          ADB Connect Device
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
