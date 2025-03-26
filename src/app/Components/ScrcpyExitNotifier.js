import { useEffect } from 'react';

export default function ScrcpyExitNotifier() {
  useEffect(() => {
    const eventSource = new EventSource('/api/controldevice');
    
    // ฟังก์ชันนี้จะทำงานเมื่อได้รับ event ชื่อ 'exit' เท่านั้น
    eventSource.addEventListener('exit', (e) => {
      const data = JSON.parse(e.data);
      console.log('Scrcpy ปิดการทำงานแล้ว:', data);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return null; // Component นี้ไม่มีการแสดงผล UI
}