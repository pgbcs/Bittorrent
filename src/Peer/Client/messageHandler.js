const message = require('../util/message');
const fs = require('fs');

module.exports.msgHandler= function(msg, socket, pieces, queue, piecesBuffer, torrent, file, state, timerID, peer) {
    if (isHandshake(msg)) {
        console.log('connect succesfully');
    }
    else {
      const m = message.parse(msg);
      // console.log("message:", m);
      if (m.id === 0) chokeHandler(socket);
      if (m.id === 1) unchokeHandler(socket, pieces,queue);
      if (m.id === 4) haveHandler(m.payload, socket, pieces, queue, peer);
      if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload, peer);
      if (m.id === 7) pieceHandler(m.payload, socket, pieces, queue, piecesBuffer, torrent,file, state, timerID, peer);
    }
  }
  
  
function isHandshake(msg) {
  return msg.length === msg.readUInt8(0) + 49 &&
      msg.slice(0,20).toString('utf8', 1) === 'BitTorrent protocol';
}
function chokeHandler(socket) {
  socket.end();
}

function unchokeHandler(socket, pieces, queue) { 
  console.log("get unchoked");
  queue.choked = false;
  //2
  requestPiece(socket, pieces, queue);
}
  
function haveHandler(payload, socket, pieces, queue, peer) {
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length() === 0;
  queue.queue(pieceIndex, ++pieces._freq[pieceIndex]);
  
  // console.log(`queue for peer have socket ${peer.port}:`, queue._queue);
  if (queueEmpty) requestPiece(socket, pieces, queue);
}
  
function bitfieldHandler(socket, pieces, queue, payload, peer) {
  console.log("receive bitfield");
  const queueEmpty = queue.length() === 0;
  console.log("bitfieldHandler: ", payload);
  const isInterested = false;
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2){
        queue.queue(i * 8 + 7 - j, ++pieces._freq[i * 8 + 7 - j]);
        isIntersted = true;
      }
      byte = Math.floor(byte / 2);
    }
  });
  console.log(`queue for peer have socket ${peer.port}:`, queue._queue.size());
  if (queueEmpty) requestPiece(socket, pieces, queue);
  //send interested 
  socket.write(message.buildInterested());
  console.log("send interested");
}



function pieceHandler(payload, socket, pieces, queue, piecesBuffer, torrent, file, state, timerID, peer){ 
  pieces.addReceived(payload);
  // console.log("data received", payload);
  console.log(`Piece ${payload.index} received from peer have ${peer.port}`);
  //write peer to file
  // const offset = payload.index * torrent.info['piece length'] + payload.begin;
  payload.block.copy(piecesBuffer[payload.index], payload.begin);
  // fs.write(file, payload.block, 0, payload.block.length, offset, () => {});

  //annouce for every peer is connecting know about new piece block you have
  if(pieces.havePiece(payload.index)){
    state.connections.forEach((connect)=>{
      connect.write(message.buildHave(payload.index));
    })
  }
  

  if (pieces.isDone()) {
    const fileDescriptor = fs.openSync(file, 'w');
    piecesBuffer.forEach((piece, index)=>{
      fs.writeSync(fileDescriptor, piece, 0, piece.length, index * torrent.info['piece length']);
    })
    fs.closeSync(fileDescriptor);
    socket.end();
    console.log('DONE!');
    if(timerID){
      clearInterval(timerID);
      console.log("cleared timer for get list peers");
    }
  } else {
    requestPiece(socket,pieces, queue);
  }
}

function requestPiece(socket, pieces, queue) {
  if (queue.choked) return null;

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
    
    // console.log("PieceBlock request: ", pieceBlock);

    if (pieces.needed(pieceBlock)) {
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }
}