// modalStyle.js

export const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'white',
  borderRadius: '8px', // ทำมุมให้โค้ง
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // ใช้เงาที่นุ่มนวล
  p: 4,
  transition: 'transform 0.3s ease', // เพิ่มการเคลื่อนไหว
  zIndex: 1300, // ให้ Modal อยู่บนสุด
};

// ปุ่ม: style ของปุ่ม
export const modalbuttonStyle = {
  borderRadius: '5px',
  padding: '8px 20px',
  transition: 'background-color 0.3s, transform 0.2s',
};

// hover effect: เปลี่ยนสีและขยายเมื่อ hover
export const modalhoverButtonStyle = {
  '&:hover': {
    backgroundColor: '#3d8fff', // สีเปลี่ยนเมื่อ hover
    transform: 'scale(1.05)', // ขยายปุ่มเมื่อ hover
  },
};
