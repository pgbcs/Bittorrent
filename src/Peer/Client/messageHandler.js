const message = require('../util/message');
const fs = require('fs');
const torrentParser = require('../Client/torrentParser');
const path = require('path');
const readline = require('readline');
const { selectFiles } = require('./chooseFile');
const { updateDownloaded, setStatus } = require('./util');
const { updateProgressBar } = require('./progress');
const { updateProgressList, removeCountDownloading } = require('./properties');



module.exports.msgHandler= function(msg, socket, pieces, queue, piecesBuffer, torrent, file, state, timerID, peer, bitfield,connectedPeer) {
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
      if (m.id === 0) chokeHandler(queue);
      if (m.id === 1) unchokeHandler(socket, pieces,queue);
      if (m.id === 4) haveHandler(m.payload, socket, pieces, queue, peer, bitfield);
      if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload, peer, bitfield);
      if (m.id === 7) pieceHandler(m.payload, socket, pieces, queue, piecesBuffer, torrent,file, state, timerID, peer, bitfield, connectedPeer);
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

function unchokeHandler(socket, pieces, queue){
  console.log("get unchoked");
  //2
  if(queue.choked == true){
    queue.choked = false;
    requestPiece(socket, pieces, queue);
  }
}
  
function haveHandler(payload, socket, pieces, queue, peer, bitfield) {
  // console.log("received have message");
  //update bitfield for re-download
  const pieceIndex = payload.readUInt32BE(0);
  setPieceInBitfield(bitfield, pieceIndex);
  console.log(`have piece ${pieceIndex} from peer have ${peer.port}`);
  const queueEmpty = queue.length() === 0;
  queue.queue(pieceIndex, ++pieces._freq[pieceIndex]);
  
  // console.log(`queue for peer have socket ${peer.port}:`, queue._queue.size());
  // console.log('queue empty:', queueEmpty);
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function setPieceInBitfield(bitfield, pieceIndex) {
  // Tính toán byteIndex và bitOffset
  const byteIndex = Math.floor(pieceIndex / 8);
  const bitOffset = pieceIndex % 8;

  // Cập nhật bit tương ứng thành 1
  bitfield.value[byteIndex] |= (1 << (7 - bitOffset)); // Đặt bit từ trái sang phải
}

function bitfieldHandler(socket, pieces, queue, payload, peer, bitfield) {
  const queueEmpty = queue.length() === 0;
  bitfield.value = payload;
  // console.log("bitfieldHandler: ", payload);
  let isInterested = false;
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2){
        queue.queue(i * 8 + 7 - j, ++pieces._freq[i * 8 + 7 - j]);
        isInterested = true;
      }
      byte = Math.floor(byte / 2);
    }
  });
  // console.log(`queue for peer have socket ${peer.port}:`, queue._queue.size());
  if (queueEmpty) requestPiece(socket, pieces, queue);
  //send interested 
  if(isInterested){
    // socket.write(message.buildInterested());
  }
  else{
    socket.write(message.buildUninterested());
  }
  // console.log("send interested");
}



function pieceHandler(payload, socket, pieces, queue, piecesBuffer, torrent, fileInfoList, state, timerID, peer, bitfield, connectedPeer){
  updateDownloaded(torrent, payload.block.length);
  connectedPeer.forEach((peer)=>{
    peer.uploaded = true;
  });
  // updateProgressBar(fileInfoList, payload.block.length, torrent);
  pieces.addReceived(payload);

  updateProgressList(torrent, payload, fileInfoList);
  
  // console.log("data received", piecesBuffer);
  /****************
  *Use for show download concurrently
    console.log(`Piece ${payload.index} received from peer have ${peer.port}`);
  ****************/
  // console.log(`Piece ${payload.index} received from peer have ${peer.port}`);
  //write peer to file
  // const offset = payload.index * torrent.info['piece length'] + payload.begin;
  if(!piecesBuffer[payload.index]){
    piecesBuffer[payload.index] = Buffer.alloc(torrentParser.pieceLen(torrent, payload.index));
  }
  payload.block.copy(piecesBuffer[payload.index], payload.begin);
  // fs.write(file, payload.block, 0, payload.block.length, offset, () => {});

  //annouce for every peer is connecting know about new piece block you have
  if(pieces.havePiece(payload.index)){
    state[torrentParser.inforHash(torrent)].forEach((st)=>{
      st.connection.write(message.buildHave(payload.index));
    })
    // console.log(`Piece ${payload.index} received from peer have ${peer.port}`);
  }
  //use for measure upload speed with this socket
  const PeerUpload = state[torrentParser.inforHash(torrent)].find(obj => Buffer.compare(obj.peerId, Buffer.from(peer.peer_id.data))===0);
  if(PeerUpload){
    PeerUpload.uploaded += payload.block.length;
  }
  if (pieces.isDone(torrent)) {
    //spend slot for other peer
    setStatus(torrent, "completed");
    socket.write(message.buildUninterested());

    writeFilesFromPieces(fileInfoList, piecesBuffer, torrent);
    // socket.end();
    console.log('DONE!');
    removeCountDownloading(torrent);
    //should send not interested peer
    const rl1 = readline.createInterface({
      input: process.stdin,  
      output: process.stdout 
    });
    rl1.question('Do you want to download more? (y/n)', (answer) => {
      if(answer === 'y'){
        // console.log("bitfield: ", bitfield);
        rl1.close();
        async function run(fileInfoList, bitfieldHandler, socket, pieces, queue, payload, peer, bitfield) {
          await selectFiles(fileInfoList); // Đợi người dùng nhập liệu xong
          bitfieldHandler(socket, pieces, queue, payload, peer, bitfield.value); // Gọi `bitfieldHandler` sau khi hoàn tất
        }
        run(fileInfoList, bitfieldHandler, socket, pieces, queue, bitfield.value, peer, bitfield);
      }
      else if(answer === 'n'){
        if(timerID){
          clearInterval(timerID);
          console.log("cleared timer for get list peers");
          removeCountDownloading(torrent);
        }
        socket.end();
        rl1.close();
      } 
    });
  } else {
    requestPiece(socket,pieces, queue);
  }
}

function requestPiece(socket, pieces, queue) {
  if (queue.length()>0&&queue.choked) {
    console.log("queue choked");
    socket.write(message.buildInterested());
    return;
  }
  // console.log("queue: ", queue._queue);
  while (queue.length()) {
    let pieceBlock = queue.deque();

    while(pieceBlock.freq != pieces._freq[pieceBlock.index]){ // nếu block trong queue có freq khác với freq hiện tại thì phải cập nhật lại freq
      // console.log("pieceBlock freq: ", pieceBlock.freq)
      // console.log("current pieces freq: ", pieces._freq[pieceBlock.index]);
      pieceBlock._freq = pieces._freq[pieceBlock.index];
      queue.queue(pieceBlock.index, pieceBlock._freq);
      pieceBlock = queue.deque();
      // console.log("udpated freq");
      // break;
    }
    
    // console.log(`request piece ${pieceBlock.index}: , ${pieces.needed(pieceBlock)}`);
    if (pieces.needed(pieceBlock)) {
      // console.log(`Request piece ${pieceBlock.index} begin ${pieceBlock.begin} from peer`);
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
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
          if (!piecesBuffer[pieceIndex]) {
              console.log(`Piece ${pieceIndex} không tồn tại trong buffer.`);
              break;
          }

          
          // Tính toán phần dữ liệu cần ghi
          const availableSpaceInPiece = torrent.info['piece length'] - byteOffsetInPiece;
          const bytesToWrite = Math.min(remainingLength, availableSpaceInPiece);
            // Ghi dữ liệu từ piece vào file
            fs.writeSync(
                fileDescriptor,
                piecesBuffer[pieceIndex],
                byteOffsetInPiece,
                bytesToWrite,
                offset
            );
          // console.log(`Ghi piece ${pieceIndex}, offset ${offset}, bytes ${bytesToWrite}`);

          offset += bytesToWrite;
          remainingLength -= bytesToWrite;
      }

      // Đóng file sau khi ghi xong
      fs.closeSync(fileDescriptor);
      fileInfo.selected = false;
  });
}