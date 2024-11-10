const message = require('./message');
const fs = require('fs');

module.exports.msgHandler= function(msg, socket, pieces, queue, file, torrent) {
    if (isHandshake(msg)) {
        console.log('connect succesfully');
    }
    else {
      const m = message.parse(msg);
    
      if (m.id === 0) chokeHandler(socket);
      if (m.id === 1) unchokeHandler(socket, pieces,queue);
      if (m.id === 4) haveHandler(m.payload, socket, pieces, queue);
      if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload);
      if (m.id === 7) pieceHandler(m.payload, socket, pieces, queue, file, torrent);
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
  
function haveHandler(socket, pieces, queue, payload) {
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length === 0;
  queue.queue(pieceIndex);
  if (queueEmpty) requestPiece(socket, pieces, queue);
}
  
function bitfieldHandler(socket, pieces, queue, payload) {
  const queueEmpty = queue.length() === 0;
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2) queue.queue(i * 8 + 7 - j);
      byte = Math.floor(byte / 2);
    }
  });
  console.log('queue: ', queue._queue);
  if (queueEmpty) requestPiece(socket, pieces, queue);
  //send interested 
  socket.write(message.buildInterested());
}



function pieceHandler(payload, socket, pieces, queue, file,torrent){ 
  pieces.addReceived(payload);
  console.log("data received", payload);
  //write peer to file
  const offset = payload.index * torrent.info['piece length'] + payload.begin;
  
  fs.write(file, payload.block, 0, payload.block.length, offset, () => {});

  if (pieces.isDone()) {
    socket.end();
    console.log('DONE!');
  } else {
    requestPiece(socket,pieces, queue);
  }
}

function requestPiece(socket, pieces, queue) {
  if (queue.choked) return null;

  while (queue.length()) {
    const pieceBlock = queue.deque();
    console.log("PieceBlock: ", pieceBlock);
    if (pieces.needed(pieceBlock)) {
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }
}