const message = require('../util/message');
const fs = require('fs');
const torrentParser = require('../Client/torrentParser');
const path = require('path');

let countdown = 1;




module.exports.msgHandler= function(msg, socket, pieces, queue, piecesBuffer, torrent, file, peer, bitfield, infoHash, parentPort) {
    if (isHandshake(msg)) {
        console.log('connect succesfully');
        // queue.choked = false;
        // console.log("requested: ",pieces._requested);
        // console.log("received: ",pieces._received);
    }
    else {
    
      const m = message.parse(msg);
      // console.log("message:", m);console.log(piecesBuffer);
      // console.log(piecesBuffer);
      // console.log(peer.peerId);
      // if(m.id!=7) console.log(`received msg from ${peer.port}:`, m);
      if (m.id === 0) chokeHandler(queue);
      if (m.id === 1) unchokeHandler(socket, pieces, queue, peer);
      if (m.id === 4) haveHandler(m.payload, socket, pieces, queue, peer, bitfield);
      if (m.id === 5) {bitfieldHandler(socket, pieces, queue, m.payload, peer, bitfield);}
      if (m.id === 7) pieceHandler(m.payload, socket, pieces, queue, piecesBuffer, torrent,file, peer, bitfield, parentPort);
    }
}
  
  
function isHandshake(msg) {
  return msg.length === msg.readUInt8(0) + 49 &&
      msg.slice(0,20).toString('utf8', 1) === 'BitTorrent protocol';
}
function chokeHandler(queue) {
  console.log("get choked");
  queue.choked = true;
}

function unchokeHandler(socket, pieces, queue, peer){
  console.log("get unchoked");
  //2
  if(queue.choked == true){
    queue.choked = false;
    requestPiece(socket, pieces, queue, peer);
  }
  
}
  
function haveHandler(payload, socket, pieces, queue, peer, bitfield) {
  // console.log("received have message");
  //update bitfield for re-download
  const pieceIndex = payload.readUInt32BE(0);
  setPieceInBitfield(bitfield, pieceIndex);
  const queueEmpty = queue.length() === 0;
  if(!pieces.havePiece(pieceIndex)) {queue.queue(pieceIndex, ++pieces._freq[pieceIndex]);}
  // console.log(`reeceived have message from peer have ${peer.port}`);
  // console.log(`queue for peer have socket ${peer.port}:`, queue._queue.size());
  // console.log('queue empty:', queueEmpty);
  if (queueEmpty) requestPiece(socket, pieces, queue, peer);
}

function setPieceInBitfield(bitfield, pieceIndex) {
  // Tính toán byteIndex và bitOffset
  const byteIndex = Math.floor(pieceIndex / 8);
  const bitOffset = pieceIndex % 8;

  // Cập nhật bit tương ứng thành 1
  bitfield.value[byteIndex] |= (1 << (7 - bitOffset)); // Đặt bit từ trái sang phải
}

function bitfieldHandler(socket, pieces, queue, payload, peer, bitfield) {
  // console.log("Tai bitfieldHandler",pieces.fileInfoList)
  const queueEmpty = queue.length() === 0;
  bitfield.value = payload;
  // console.log("bitfieldHandler: ", payload);
  let isInterested = false;
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2){
        // console.log(`queue piece ${i * 8 + 7 - j} from bitfield`);
        if(!pieces.havePiece(i * 8 + 7 - j)){
          queue.queue(i * 8 + 7 - j, ++pieces._freq[i * 8 + 7 - j]);

          isInterested = true;
        }
      }
      byte = Math.floor(byte / 2);
    }
  });
  // console.log(`queue for peer have socket ${peer.port}:`, queue);
  if (queueEmpty) requestPiece(socket, pieces, queue, peer);
  //send interested 
  if(isInterested){
    // socket.write(message.buildInterested());
    // console.log("send interested");
  }
  else{
    socket.write(message.buildUninterested());
  }
  // console.log("send interested");
}



function pieceHandler(payload, socket, pieces, queue, piecesBuffer, torrent, fileInfoList, peer, bitfield, parentPort){
  const blockIndex = payload.begin / torrentParser.BLOCK_LEN;
  // console.log(`blockIndex: ${blockIndex}`);
  // console.log("check:", payload.index*torrentParser.blocksPerPiece(torrent, 0) + blockIndex)
  if(pieces._received[payload.index*torrentParser.blocksPerPiece(torrent, 0) + blockIndex]) {
    // console.log("duplicate block");
    if(pieces.isDone()){
      queue._queue=[];
      socket.write(message.buildUninterested());
      return;
    }
    requestPiece(socket, pieces, queue, peer);
    return;
  }
  parentPort.postMessage({type: 'downloaded', payload: payload, peer});
  parentPort.postMessage({type: 'received', port: peer.port});
  pieces.addReceived(payload);

  // connectedPeer.find(obj => peer.port === obj.port).uploaded =true;



  
  
  // console.log("data received", piecesBuffer);
  /****************
  *Use for show download concurrently
    console.log(`Piece ${payload.index} received from peer have ${peer.port}`);
  // ****************/
  // console.log(`Piece ${payload.index} received from peer have ${peer.port}`);
  // write peer to file
  // const offset = payload.index * torrent.info['piece length'] + payload.begin;
  
  // payload.block.copy(piecesBuffer[payload.index], payload.begin);
  for(let i=0; i< payload.block.length; i++){
    piecesBuffer[payload.index*torrent.info['piece length']+payload.begin+i] = payload.block[i];
  }
  
  // fs.write(file, payload.block, 0, payload.block.length, offset, () => {});

  //annouce for every peer is connecting know about new piece block you have
  if(pieces.havePiece(payload.index)){
    parentPort.postMessage({type: 'have', payload: {index: payload.index, peer: peer}});
  }

  if (pieces.isDone(torrent)) {
    //spend slot for other peer
    // setStatus(torrent, "completed");
    socket.write(message.buildUninterested());
    writeFilesFromPieces(fileInfoList, piecesBuffer, torrent);
    // socket.end();
    console.log('DONE!');
    parentPort.postMessage({type: 'done'});
  
  } else {
    requestPiece(socket,pieces, queue, peer);
  }
}

function requestPiece(socket, pieces, queue, peer) {
  if (queue.length()>0&&queue.choked) {
    console.log("queue choked");
    socket.write(message.buildInterested());
    return;
  }
  // console.log("queue: ", queue._queue);
  while (queue.length()) {
    let pieceBlock = queue.deque();
    // while(pieceBlock.freq != pieces._freq[pieceBlock.index]){ // nếu block trong queue có freq khác với freq hiện tại thì phải cập nhật lại freq
    //   // console.log("pieceBlock freq: ", pieceBlock.freq)
    //   // console.log("current pieces freq: ", pieces._freq[pieceBlock.index]);
    //   pieceBlock._freq = pieces._freq[pieceBlock.index];
    //   queue.queue(pieceBlock.index, pieceBlock._freq);
    //   pieceBlock = queue.deque();
    //   // console.log("udpated freq");
    //   // break;
    // }
    
    // console.log(`request piece ${pieceBlock.index}: , ${pieces.needed(pieceBlock)}`);
  
    if (pieces.needed(pieceBlock)) {
      // console.log(`Request piece ${pieceBlock.index} begin ${pieceBlock.begin} from peer have ${peer.port}`);
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      // console.log(pieces._received);
      // console.log(pieces._requested);
      break;
    }
  }
  
}


/*
 * Ghi dữ liệu từ `piecesBuffer` vào các file dựa trên danh sách `fileInfoList`.
 * @param {Array} fileInfoList - Danh sách các file cần ghi.
 * @param {Buffer[]} piecesBuffer - Mảng chứa các pieces đã tải.
 * @param {Object} torrent - Thông tin torrent bao gồm độ dài mỗi piece.
 */
function writeFilesFromPieces(fileInfoList, piecesBuffer, torrent) {
  // console.log('Ghi dữ liệu vào file...');
  // console.log(fileInfoList);
  fileInfoList.forEach(fileInfo => {
      if(!fileInfo.selected) return;
      const { path: filePath, startPiece, byteOffset, length } = fileInfo;

      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        // console.log(`Thư mục đã được tạo: ${dirPath}`);
      }
      // Mở file để ghi
      const fileDescriptor = fs.openSync(filePath, 'w');

      // console.log(`Ghi vào file: ${filePath}`);

      let remainingLength = length;
      let offset = 0;

      while (remainingLength > 0) {
        
          const pieceIndex = startPiece + Math.floor((offset+byteOffset) / torrent.info['piece length']);
          const byteOffsetInPiece = (byteOffset + offset) % torrent.info['piece length'];
  
          // Kiểm tra nếu piece chưa tồn tại
          // if (!piecesBuffer[pieceIndex]) {
          //     console.log(`Piece ${pieceIndex} không tồn tại trong buffer.`);
          //     break;
          // }

          
          // Tính toán phần dữ liệu cần ghi
          const availableSpaceInPiece = torrent.info['piece length'] - byteOffsetInPiece;
          const bytesToWrite = Math.min(remainingLength, availableSpaceInPiece);
          // console.log(`Ghi piece ${pieceIndex}, offset ${offset}, bytes ${bytesToWrite}`);
          // console.log("byteOffsetInPiece: ", byteOffsetInPiece);
          // console.log(`slice length:`, piecesBuffer.slice(pieceIndex * torrent.info['piece length'] + byteOffsetInPiece, pieceIndex * torrent.info['piece length'] + byteOffsetInPiece + bytesToWrite));
          // console.log('Start:', pieceIndex * torrent.info['piece length'] + byteOffsetInPiece);
          // console.log('End:', pieceIndex * torrent.info['piece length'] + byteOffsetInPiece + bytesToWrite);
          // console.log('Buffer Length:', piecesBuffer.length);
          //   // Ghi dữ liệu từ piece vào file
            fs.writeSync(
                fileDescriptor,
                piecesBuffer.slice(pieceIndex * torrent.info['piece length'] + byteOffsetInPiece, pieceIndex * torrent.info['piece length'] + byteOffsetInPiece + bytesToWrite),
                0,
                bytesToWrite,
                offset
            );
          

          offset += bytesToWrite;
          remainingLength -= bytesToWrite;
      }

      // Đóng file sau khi ghi xong
      fs.closeSync(fileDescriptor);
      fileInfo.selected = false;
  });
}

