import { useEffect } from 'react';

export default function useDeviceStatus(setDevices) {
  useEffect(() => {
    const eventSource = new EventSource('/api/controldevice');
    
    const handleStatusUpdate = (e) => {
      const data = JSON.parse(e.data);
      console.log('Device Status Update:', data);
      console.log('สถานะ:', data.status);
      console.log('ข้อความ:', data.message);
      
      setDevices(prevDevices => 
        prevDevices.map(device =>
          device.ip === data.ip
            ? { 
                ...device, 
                status: data.status === 'connected' ? 'Connected' : 'Disconnected',
                message: data.message
              }
            : device
        )
      );
    };

    eventSource.addEventListener('status', handleStatusUpdate);

    return () => {
      eventSource.removeEventListener('status', handleStatusUpdate);
      eventSource.close();
    };
  }, [setDevices]);
}