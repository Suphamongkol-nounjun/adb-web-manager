import React from "react";

function AdbCommandGroup() {
  return (
    <div className="mt-8 w-full max-w-4xl border p-6 rounded-lg border-gray-300 shadow-lg">
      <h3 className="font-semibold text-xl mb-4 text-center">ADB Command</h3>
      <div className="flex flex-wrap justify-center gap-4">
        <a
          href="/adbcommand/install"
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
        >
          Install / Uninstall / Open App
        </a>
        <a
          href="/adbcommand/openforceclear"
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
        >
          Open App / Force Stop / Clear Data
        </a>
        <a
          href="/adbcommand/disable"
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
        >
          Disable / Enable
        </a>
        {/* ปุ่มสุดท้ายจะไปอยู่แถวใหม่ */}
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/adbcommand/reboot-shutdown"
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reboot / Shutdown
          </a>
          <a
            href="/adbcommand/controldevice"
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Control Device 
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdbCommandGroup;
