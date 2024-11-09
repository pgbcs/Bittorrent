const net = require('net');
const message = require('./message');
const { inforHash } = require('./torrentParser');
// const Buffer = require('buffer').Buffer;

module.exports = (port, torrent) =>{
    const server = net.createServer((socket)=>{
        console.log('Một peer mới đã kết nối.');
    
    //handle data
    socket.on('data', (data)=>{
        console.log(data.toString());
        // socket.write(`Welcome to the BitTorrent peer! from server port: ${port}`);
        msgHandler(socket, data, torrent);
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



function msgHandler(socket, msg, torrent){
    // console.log("msg :", msg);
    // console.log(msg.slice(0,20).toString('utf8', 1));
    if(isHandshake(msg)){
        const receivedMsg = parseHandshake(msg);
        if(receivedMsg.inforHash.equals(inforHash(torrent))){
            socket.write(message.buildHandshake(torrent));
        }
        else{
            console.log('Info hash does not match, terminating connection.');
            socket.end();
        }
    }
    else{
        console.log("not is handshake");
    }
}

function parseHandshake(msg){
    return {
        peerId: msg.slice(48, 68),
        inforHash: msg.slice(28, 48),
    }
}

function isHandshake(msg) {
    return (msg.length === msg.readUInt8(0) + 49) &&
           msg.slice(0,20).toString('utf8', 1) === 'BitTorrent protocol';
}