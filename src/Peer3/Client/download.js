const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');
const { genID,genPort } = require('./util');
const message = require('../util/message');
const {msgHandler} = require('./messageHandler');
const Pieces = require('./Pieces');
const Queue = require('./Queue');
const fs = require('fs');
// let pieces = {};

module.exports = (torrent, pieces,piecesBuffer,file) => {
  tracker.getPeers(torrent, (peers) => {
    peers.forEach(peer => download(peer, torrent, pieces, piecesBuffer, file));
  });
};

function download(peer,torrent, pieces, piecesBuffer, file) {
  const queue = new Queue(torrent);
  if (genPort()==peer.port) {
    console.log('it"s you');
    return;
  }
  const socket = net.Socket();

  //keep connection
  const timer = setInterval(()=>{
    socket.write(message.buildKeepAlive());
  }, 1.5*60*1000);

  socket.on('error', (err) => {
    console.error('Socket error:', err);
    clearInterval(timer); // Xóa timer khi có lỗi
  });

  socket.on('close', ()=>{
    clearInterval(timer);
    console.log("cleared timer");
  })
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });


  onWholeMsg(socket,msg => msgHandler(msg, socket, pieces, queue, piecesBuffer, torrent,file));
}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on('data', recvBuf => {
    // console.log(recvBuf.toString());
    // msgLen calculates the length of a whole message
    const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  });
}
