const net = require('net');
const message = require('./message');
const { inforHash } = require('./torrentParser');
const fs = require('fs');
const path = require('path');
// const Buffer = require('buffer').Buffer;

let chokedPeerList = []; //quản lý trạng thái choked how to định danh kết nối trong đây????


/*--------
-----------
-------*/
const PIECE_SIZE = 16384;

const pieces = []; // Danh sách các piece

// Đường dẫn tới tệp JPG
const filePath = path.join(__dirname, 'bluemew.jpg');

// Đọc tệp dưới dạng buffer
fs.readFile(filePath, (err, data) => {
    if (err) {
        return console.error('Error reading file:', err);
    }
    
    console.log('File read successfully!');
    
    // Chia tệp thành các pieces và thêm vào danh sách
    let pieceCount = Math.ceil(data.length / PIECE_SIZE);
    for (let i = 0; i < pieceCount; i++) {
    const start = i * PIECE_SIZE;
    const end = Math.min((i + 1) * PIECE_SIZE, data.length);
    const piece = data.slice(start, end);
    
    pieces.push(piece);  // Thêm piece vào danh sách
    console.log(`Piece ${i + 1}:`, piece);
    }

    console.log(`Total pieces: ${pieces.length}`);
});
/*--------
-----------
-------*/



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

            //init state is choked
            chokedPeerList.push({
                peerId: receivedMsg.peerId,
                choked: true,
            })
        }
        else{
            console.log('Info hash does not match, terminating connection.');
            socket.end();
        }
    }
    else{
        const m = message.parse(msg);
        if(m.id == 2) interestedHandler(socket);
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

function interestedHandler(socket){
    //TODO: do logic something to decide unchoke or not
    socket.write(message.buildUnchoke());
}
