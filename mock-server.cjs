const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Port 3000 is occupied!\n");
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

// ไม่ปิดเซิร์ฟเวอร์นี้ จนกว่าเราจะสั่งปิดเอง