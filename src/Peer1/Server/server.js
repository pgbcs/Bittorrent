const net = require('net');
const message = require('../util/message');
const { inforHash } = require('../Client/torrentParser');
const fs = require('fs');
const path = require('path');
// const Buffer = require('buffer').Buffer;

let chokedPeerList = []; //quản lý trạng thái choked how to định danh kết nối trong đây????


/*--------
// -----------
// -------*/
// const PIECE_SIZE = 16384;

// const pieces = []; // Danh sách các piece

// // Đường dẫn tới tệp JPG
// const filePath = path.join(__dirname, 'bluemew.jpg');

// // Đọc tệp dưới dạng buffer
// fs.readFile(filePath, (err, data) => {
//     if (err) {
//         return console.error('Error reading file:', err);
//     }
    
//     console.log('File read successfully!');
    
//     // Chia tệp thành các pieces và thêm vào danh sách
//     let pieceCount = Math.ceil(data.length / PIECE_SIZE);
//     for (let i = 0; i < pieceCount; i++) {
//     const start = i * PIECE_SIZE;
//     const end = Math.min((i + 1) * PIECE_SIZE, data.length);
//     const piece = data.slice(start, end);
    
//     pieces.push(piece);  // Thêm piece vào danh sách
//     console.log(`Piece ${i + 1}:`, piece);
//     }

//     console.log(`Total pieces: ${pieces.length}`);
// });
// /*--------
// -----------
// -------*/



module.exports = (port, torrent, pieces, piecesBuffer) =>{
    const server = net.createServer((socket)=>{
        console.log('Một peer mới đã kết nối.');
    
    //handle data
    socket.on('data', (data)=>{
        console.log(data.toString());
        // socket.write(`Welcome to the BitTorrent peer! from server port: ${port}`);
        msgHandler(socket, data, torrent, pieces ,piecesBuffer);
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



function msgHandler(socket, msg, torrent, pieces, piecesBuffer){
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
    // const PIECE_SIZE = torrent.info['piece length'];
    
    // const startPosition = (index * PIECE_SIZE) + begin;
    // const dataToSend = Buffer.alloc(lengthRequested); 

    // try {
    //     // Mở tệp để đọc
    //     const fileDescriptor = fs.openSync(file, 'r'); 

    //     // Đọc dữ liệu từ tệp
    //     const bytesRead = fs.readSync(fileDescriptor, dataToSend, 0, lengthRequested, startPosition);

    //     if (bytesRead > 0) {
    //         // Gửi lại dữ liệu
    //         const responseMsg = Buffer.alloc(13 + bytesRead); // 13 byte cho header cộng với dữ liệu đã đọc

    //         // Viết thông tin vào gói tin phản hồi
    //         responseMsg.writeUInt32BE(bytesRead + 9, 0); // Chiều dài của gói (data length + message id length)
    //         responseMsg.writeUInt8(7, 4); // ID của thông điệp (7 = "piece")
    //         responseMsg.writeUInt32BE(index, 5); // Chỉ số phần
    //         responseMsg.writeUInt32BE(begin, 9); // Vị trí bắt đầu trong phần
    //         dataToSend.copy(responseMsg, 13); // Sao chép dữ liệu vào từ vị trí 13

    //         // Gửi gói tin qua socket
    //         socket.write(responseMsg);
    //         console.log(`Sent piece: index=${index}, begin=${begin}, length=${bytesRead}`);
    //     } else {
    //         console.error(`No data read from file for index ${index}.`);
    //     }

    //     // Đóng tệp sau khi hoàn tất
    //     fs.closeSync(fileDescriptor);
    // } catch (err) {
    //     console.error(`Error in sending piece: ${err.message}`);
    // }

    const pieceData = piecesBuffer[index]; // Lấy dữ liệu của phần tương ứng
    if (pieceData) {
        // Cắt dữ liệu đúng size bắt đầu từ begin
        const dataToSend = pieceData.slice(begin, begin + lengthRequested);
        console.log('data will send: ', typeof(dataToSend));
        if (dataToSend.length > 0) {
            // Gửi lại dữ liệu
            const responseMsg =Buffer.alloc(13+dataToSend.length);

            responseMsg.writeUInt32BE(dataToSend.length + 9, 0);
            responseMsg.writeUInt8(7, 4);
            responseMsg.writeUInt32BE(index, 5);
            responseMsg.writeUInt32BE(begin, 9);
            dataToSend.copy(responseMsg, 13);

            // const responsePacket = Buffer.concat([
            //     Buffer.alloc(4).writeUInt32BE(dataToSend.length + 9, 0), // chiều dài gói mới
            //     Buffer.alloc(1).writeUInt8(7, 0), // id=7 cho message "piece"
            //     Buffer.alloc(4).writeUInt32BE(index, 0), // index
            //     Buffer.alloc(4).writeUInt32BE(begin, 0), // begin
            //     dataToSend // dữ liệu phần
            // ]);
            console.log("will response: ", responseMsg);
            socket.write(responseMsg);
            console.log(`Sent piece: index=${index}, begin=${begin}, length=${dataToSend.length}`);
        }
    } else {
        console.error(`Requested piece ${index} not found.`);
    }
}


//     const pieceData = pieces[index]; // Lấy dữ liệu của phần tương ứng
//     if (pieceData) {
//         // Cắt dữ liệu đúng size bắt đầu từ begin
//         const dataToSend = pieceData.slice(begin, begin + lengthRequested);
//         console.log('data will send: ', typeof(dataToSend));
//         if (dataToSend.length > 0) {
//             // Gửi lại dữ liệu
//             const responseMsg =Buffer.alloc(13+dataToSend.length);

//             responseMsg.writeUInt32BE(dataToSend.length + 9, 0);
//             responseMsg.writeUInt8(7, 4);
//             responseMsg.writeUInt32BE(index, 5);
//             responseMsg.writeUInt32BE(begin, 9);
//             dataToSend.copy(responseMsg, 13);

//             // const responsePacket = Buffer.concat([
//             //     Buffer.alloc(4).writeUInt32BE(dataToSend.length + 9, 0), // chiều dài gói mới
//             //     Buffer.alloc(1).writeUInt8(7, 0), // id=7 cho message "piece"
//             //     Buffer.alloc(4).writeUInt32BE(index, 0), // index
//             //     Buffer.alloc(4).writeUInt32BE(begin, 0), // begin
//             //     dataToSend // dữ liệu phần
//             // ]);
//             console.log("will response: ", responseMsg);
//             socket.write(responseMsg);
//             console.log(`Sent piece: index=${index}, begin=${begin}, length=${dataToSend.length}`);
//         }
//     } else {
//         console.error(`Requested piece ${index} not found.`);
//     }
// }