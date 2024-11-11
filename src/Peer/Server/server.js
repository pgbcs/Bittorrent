const net = require('net');
const message = require('../util/message');
const { inforHash } = require('../Client/torrentParser');

// const Buffer = require('buffer').Buffer;

let chokedPeerList = []; //quản lý trạng thái choked how to định danh kết nối trong đây????

module.exports.server = (port, torrent, pieces, piecesBuffer) =>{
    const server = net.createServer((socket)=>{
        console.log('Một peer mới đã kết nối.');
        //timer
        const timeOutId = setTimeout(()=>{
            console.log("Đóng kết nối vì thời gian phản hồi của peer đã quá hạn.");
            socket.end();
        },1.5*60*1000);
        //handle data
        socket.on('data', (data)=>{
            console.log(data.toString());
            // socket.write(`Welcome to the BitTorrent peer! from server port: ${port}`);
            msgHandler(socket, data, torrent, pieces ,piecesBuffer, timeOutId);
        })


        // Xử lý khi một peer ngắt kết nối
        socket.on('end', () => {
            console.log('Một peer đã ngắt kết nối.');
        });
        
        socket.on('close', ()=>{
            clearTimeout(timeOutId);
        })
        // Xử lý lỗi
        socket.on('error', (err) => {
            console.error('Lỗi từ một peer:', err.message);
        });
        
        });
        
        server.listen(port, () => {
            console.log(`Peer lắng nghe tại cổng ${port}`);
        });
        return server;
};



function msgHandler(socket, msg, torrent, pieces, piecesBuffer, timeOutId){
    // console.log("msg :", msg);
    // console.log(msg.slice(0,20).toString('utf8', 1));
    if(isHandshake(msg)){
        const receivedMsg = parseHandshake(msg);
        if(receivedMsg.inforHash.equals(inforHash(torrent))){
            socket.write(message.buildHandshake(torrent));
            socket.write(message.buildBitfield(createBitfieldFromList(pieces)));
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
        if(m.size == 0) keepAliveHandler(socket, timeOutId);
        if(m.id == 2) interestedHandler(socket);
        if(m.id == 6) requestHandler(socket, m.payload, piecesBuffer);
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

function keepAliveHandler(socket, timeOutId){
    console.log("received keep alive msg");
    clearTimeout(timeOutId);
    timeOutId = setTimeout(()=>{
        console.log("Đóng kết nối vì thời gian phản hồi của peer đã quá hạn.");
        socket.end();
    },2*60*1000);
}

function interestedHandler(socket){
    //TODO: do logic something to decide unchoke or not
    socket.write(message.buildUnchoke());
}

function createBitfieldFromList(pieces){
    let bitfield = pieces._received.map(piece => piece.every(el=>el) ? '1' : '0').join('');
    //spare zero
    while (bitfield.length % 8 !== 0) { bitfield += '0'; }
    const byteArray = []; 
    for (let i = 0; i < bitfield.length; i += 8) {
        byteArray.push(parseInt(bitfield.slice(i, i + 8), 2)); 
    }
    const buffer = Buffer.from(byteArray);
    return buffer;
}


function requestHandler(socket, payload, piecesBuffer, torrent) {
    console.log(payload);
    const {index, begin, length: lengthRequested} = payload;
    
    // convert lenghtRequested from buffer to num
    const length =lengthRequested.readUInt32BE(0);

    console.log(`Received Request: index=${index}, begin=${begin}, length=${length}`);

    sendPiece(socket, index, begin, length, piecesBuffer, torrent);
}

function sendPiece(socket, index, begin, lengthRequested, piecesBuffer) {
    const pieceData = piecesBuffer[index]; // Lấy dữ liệu của phần tương ứng
    if (pieceData) {
        // Cắt dữ liệu đúng size bắt đầu từ begin
        const dataToSend = pieceData.slice(begin, begin + lengthRequested);
        if (dataToSend.length > 0) {
            // Gửi lại dữ liệu
            const responseMsg =Buffer.alloc(13+dataToSend.length);

            responseMsg.writeUInt32BE(dataToSend.length + 9, 0);
            responseMsg.writeUInt8(7, 4);
            responseMsg.writeUInt32BE(index, 5);
            responseMsg.writeUInt32BE(begin, 9);
            dataToSend.copy(responseMsg, 13);

            console.log("will response: ", responseMsg);
            socket.write(responseMsg);
            console.log(`Sent piece: index=${index}, begin=${begin}, length=${dataToSend.length}`);
        }
    } else {
        console.error(`Requested piece ${index} not found.`);
    }
}
