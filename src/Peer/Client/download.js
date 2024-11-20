const net = require('net');
const Buffer = require('buffer').Buffer;
const tracker = require('./tracker');
const { genID,genPort, getIntervalForGetListPeer, setStatus } = require('./util');
const message = require('../util/message');
const {msgHandler} = require('./messageHandler');
const Queue = require('./Queue');
const { inforHash } = require('./torrentParser');


// let pieces = {};

const minimumPeerNeed = 2;

let connectedPeer = {}

module.exports = (torrent, pieces,piecesBuffer,fileInfoList, state) => {
  // console.log(piecesBuffer)
  if(!connectedPeer[inforHash(torrent)]){ 
    connectedPeer[inforHash(torrent)] = [];
  }
  let timerID = null;
  setStatus(torrent, 'started');
  tracker.getPeers(torrent, (peers) => {
    peers.forEach(peer => download(peer, torrent, pieces, piecesBuffer, fileInfoList, state, timerID));
  });
  setStatus(torrent,'downloading');
  timerID = setInterval(() => {
    let callback=(peers) => {
      console.log("handle list peer");
      peers.forEach(peer => download(peer, torrent, pieces, piecesBuffer, fileInfoList, state, timerID));
    };

    if(connectedPeer[inforHash(torrent)].length>=minimumPeerNeed){
      callback =()=>{};
    }

    tracker.getPeers(torrent, callback);

  },10000);

};

function download(peer,torrent, pieces, piecesBuffer, fileInfoList, state, timerID) {
  if (genPort(torrent)==peer.port) {
    console.log("Skip myself");
    return;
  }
  
  const queue = new Queue(torrent);
  const bitfield = {};// cập nhật lại bitfield khi nhận được have msg 
  //check if u have connected to this peer
  if(!connectedPeer[inforHash(torrent)].find(obj => obj.port === peer.port)){
    const socket = net.Socket();

    //keep connection
    const timer = setInterval(()=>{
      socket.write(message.buildKeepAlive());
    }, 1.5*60*1000)

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      //remove peer from connectedPeer if error
      connectedPeer[inforHash(torrent)] = connectedPeer[inforHash(torrent)].filter(obj => obj.port !== peer.port);
      clearInterval(timer); // Xóa timer khi có lỗi
    });

    socket.on('close', ()=>{
      clearInterval(timer);
      //remove peer from connectedPeer if close
      connectedPeer[inforHash(torrent)] = connectedPeer[inforHash(torrent)].filter(obj => obj.port !== peer.port);
      // console.log("list connected after closed connection: ", connectedPeer);
      console.log("cleared timer");
    })

    socket.connect(peer.port, peer.ip, () => {
      socket.write(message.buildHandshake(torrent));
      //push peer to connectedPeer if connected
      const peerConnection = peer;
  
      connectedPeer[inforHash(torrent)].push(peerConnection);
    });

    onWholeMsg(socket,msg => msgHandler(msg, socket, pieces, queue, piecesBuffer, torrent, fileInfoList, state, timerID, peer, bitfield));
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
