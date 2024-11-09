const net = require('net');
const message = require('./message');

module.exports = port =>{
    const server = net.createServer((socket)=>{
        console.log('Một peer mới đã kết nối.');
    
    //handle data
    socket.on('data', (data)=>{
        console.log(data.toString());
        socket.write(`Welcome to the BitTorrent peer! from server port: ${port}`);
    })


    // Xử lý khi một peer ngắt kết nối
    socket.on('end', () => {
        console.log('Một peer đã ngắt kết nối.');
    });
    
    
    // Xử lý lỗi
    socket.on('error', (err) => {
        console.error('Lỗi từ một peer:', err.message);
    });
    
    });
    server.listen(port, () => {
        console.log(`Peer lắng nghe tại cổng ${port}`);
    });   


}



