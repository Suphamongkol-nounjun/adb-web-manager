import { getLocalIp, scanNetwork } from './scan.js'

const localIp = getLocalIp();
console.log(`IP เครื่องของคุณคือ: ${localIp}`);

// เรียกใช้งานฟังก์ชัน scanNetwork โดยส่ง IP เครื่องของคุณไป
scanNetwork("192.168.1.103");
