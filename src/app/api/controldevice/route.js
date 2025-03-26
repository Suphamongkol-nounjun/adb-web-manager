import { PassThrough } from 'stream';
import { spawn } from 'child_process';
import path from 'path';

const clients = new Set();
let scrcpyProcess = null;

export async function GET() {
  const stream = new PassThrough();
  
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };

  clients.add(stream);

  // Heartbeat เพื่อรักษาการเชื่อมต่อ
  const heartbeat = setInterval(() => {
    stream.write(': heartbeat\n\n');
  }, 15000);

  // เมื่อ Client ปิดการเชื่อมต่อ
  stream.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(stream);
  });

  return new Response(stream, { headers });
}

export async function POST(request) {
  const { ip } = await request.json();
  
  if (!ip) {
    return new Response(
      JSON.stringify({ error: 'IP address is required' }),
      { status: 400 }
    );
  }

  const scrcpyPath = path.join(process.cwd(), 'src', 'scrcpy-win64-v3.1', 'scrcpy');

  // ปิดการเชื่อมต่อเก่าหากมี
  if (scrcpyProcess) {
    scrcpyProcess.kill();
  }

  scrcpyProcess = spawn(scrcpyPath, ["-s", `${ip}:5555`], {
    stdio: "ignore"
  });

  // เมื่อ Scrcpy เริ่มทำงาน
  scrcpyProcess.on('spawn', () => {
    broadcastStatus({
      status: 'connected',
      ip,
      message: `เชื่อมต่ออุปกรณ์ ${ip} สำเร็จ`
    });
  });

  // เมื่อ Scrcpy ปิด
  scrcpyProcess.on('exit', (code) => {
    const exitMessage = code === 0 
      ? `อุปกรณ์ ${ip} ถูกตัดการเชื่อมต่ออย่างปกติ`
      : `อุปกรณ์ถูกตัดการเชื่อมต่อด้วยรหัสข้อผิดพลาด: ${code}`;
    
    broadcastStatus({
      status: 'disconnected',
      ip,
      message: exitMessage
    });
    
    scrcpyProcess = null;
  });

  // เมื่อเกิดข้อผิดพลาด
  scrcpyProcess.on('error', (err) => {
    broadcastStatus({
      status: 'error',
      ip,
      message: `เกิดข้อผิดพลาด: ${err.message}`
    });
  });

  return new Response(
    JSON.stringify({ 
      success: true, 
      status: 'connecting',
      message: 'กำลังเริ่มกระบวนการเชื่อมต่อ...'
    }),
    { status: 200 }
  );
}

function broadcastStatus({ status, ip, message = '' }) {
  const eventData = {
    status,
    ip,
    message, // เพิ่ม message ในข้อมูลที่ส่ง
    timestamp: new Date().toISOString()
  };

  const sseMessage = `event: status\ndata: ${JSON.stringify(eventData)}\n\n`;

  clients.forEach(client => {
    if (client.writable) {
      client.write(sseMessage);
    }
  });
}