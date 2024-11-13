const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');
const { genID,genPort } = require('./util');
const message = require('../util/message');
const {msgHandler} = require('./messageHandler');
const Queue = require('./Queue');

// let pieces = {};

const minimumPeerNeed = 2;

let connectedPeer = [];

module.exports = (torrent, pieces,piecesBuffer,file, state) => {
  let timerID = null;
  tracker.getPeers(torrent, (peers) => {
    peers.forEach(peer => download(peer, torrent, pieces, piecesBuffer, file, state, timerID));
  });

  timerID = setInterval(() => {
    if(connectedPeer.length<minimumPeerNeed){
      console.log("get list peers again");
      tracker.getPeers(torrent, (peers) => {
        peers.forEach(peer => download(peer, torrent, pieces, piecesBuffer, file, state, timerID));
      });
    }
  },10000);

};

function download(peer,torrent, pieces, piecesBuffer, file, state, timerID) {
  if (genPort()==peer.port) {
    console.log("Skip myself");
    return;
  }

  const queue = new Queue(torrent);
  

  //check if u have connected to this peer
  if(!connectedPeer.find(obj => obj.port === peer.port)){
    const socket = net.Socket();
    

    //keep connection
    const timer = setInterval(()=>{
      socket.write(message.buildKeepAlive());
    }, 1.5*60*1000)

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      //remove peer from connectedPeer if error
      connectedPeer = connectedPeer.filter(obj => obj.port !== peer.port);
      clearInterval(timer); // Xóa timer khi có lỗi
    });

    socket.on('close', ()=>{
      clearInterval(timer);
      //remove peer from connectedPeer if close
      connectedPeer = connectedPeer.filter(obj => obj.port !== peer.port);
      console.log("list connected after closed connection: ", connectedPeer);
      console.log("cleared timer");
    })

    socket.connect(peer.port, peer.ip, () => {
      socket.write(message.buildHandshake(torrent));
      //push peer to connectedPeer if connected
      const peerConnection = peer;
  
      connectedPeer.push(peerConnection);
    });


    onWholeMsg(socket,msg => msgHandler(msg, socket, pieces, queue, piecesBuffer, torrent, file, state, timerID, peer));
  } 
}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on('data', recvBuf => {// need check
    // callback(recvBuf);
    // return;
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
