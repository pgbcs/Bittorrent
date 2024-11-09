const message = require('./message');

module.exports.msgHandler= function(msg, socket, pieces, queue) {
    if (isHandshake(msg)) {
        console.log('connect succesfully');
        socket.write(message.buildInterested());}
    else {
      const m = message.parse(msg);
  
      if (m.id === 0) chokeHandler();
      if (m.id === 1) unchokeHandler(socket, pieces,queue);
      if (m.id === 4) haveHandler(m.payload, socket, pieces, queue);
      if (m.id === 5) bitfieldHandler(m.payload);
      if (m.id === 7) pieceHandler(m.payload, socket, pieces, queue, file);
    }
  }
  
  
function isHandshake(msg) {
  return msg.length === msg.readUInt8(0) + 49 &&
      msg.slice(0,20).toString('utf8', 1) === 'BitTorrent protocol';
}
function chokeHandler() {
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
  const queueEmpty = queue.length === 0;
  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2) queue.queue(i * 8 + 7 - j);
      byte = Math.floor(byte / 2);
    }
  });
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function pieceHandler(payload, socket,pieces, queue){ 
  pieces.addReceived(pieceResp);

  //write peer to file
  const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
  fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => {});

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
    if (pieces.needed(pieceBlock)) {
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }
}