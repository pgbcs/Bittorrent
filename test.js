const fs = require('fs');

const filePath = './src/Peer/received/bluemew.jpg';

// Mở tệp để ghi
// const fd1 = fs.openSync(filePath, 'w'); // Mở để ghi (file descriptor 1)
// console.log('File opened for writing with descriptor:', fd1);

// Mở tệp để ghi hoặc đọc
const fd2 = fs.openSync(filePath, 'r'); // Mở tệp để đọc (file descriptor 2)
console.log('File opened for reading with descriptor:', fd2);
try {
    // Lấy thông tin về tệp
    const stats = fs.statSync(filePath);

    // In ra thông tin thống kê
    console.log('Thông tin thống kê từ tệp:');
    console.log(`- Kích thước: ${stats.size} bytes`);
    console.log(`- Thời gian tạo: ${stats.birthtime}`);
    console.log(`- Thời gian sửa đổi: ${stats.mtime}`);
    console.log(`- Thời gian truy cập: ${stats.atime}`);
    console.log(`- Có phải là tệp không: ${stats.isFile()}`);
    console.log(`- Có phải là thư mục không: ${stats.isDirectory()}`);
} catch (err) {
    console.error('Lỗi:', err.message);
}
// Đừng quên đóng các file descriptor
// fs.closeSync(fd1);
fs.closeSync(fd2);