// ใน modalStyle.js
export const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600, // ขยายความกว้าง
  maxHeight: '90vh',
  overflowY: 'auto',
  bgcolor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  p: 4,
  zIndex: 1300,
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
