// downloadWorker.js
const { parentPort, workerData } = require('worker_threads');
const net = require('net');
const message = require('../util/message');
const { msgHandler } = require('./messageHandler');
const Queue = require('./Queue');

const SharedPieces = require('./SharedPieces');

let {torrent, sharedReceivedBuffer, sharedRequestedBuffer, sharedFreqBuffer, sharedPieceBuffer,fileInfoList, connectedPeer, peer, inforHash, serverPort, yourID} = workerData;

const sharedReceived = new Uint8Array(sharedReceivedBuffer);
const sharedRequested = new Uint8Array(sharedRequestedBuffer);
const sharedFreq = new Uint8Array(sharedFreqBuffer);
const sharedPieces = new Uint8Array(sharedPieceBuffer);



const pieces = new SharedPieces(torrent, fileInfoList,sharedReceived, sharedRequested, sharedFreq);
// console.log(torrentParser.BLOCK_LEN);
// console.log(torrentParser.blocksPerPiece(torrent, 0));
// console.log(torrentParser.blockLen(torrent, 0, 0));
// console.log(torrentParser.size(torrent, 0));   
// console.log(torrentParser.pieceLen(torrent, 0));
// console.log("shared Pieces:",pieces);

downloadPeer(peer, torrent, pieces, sharedPieces, fileInfoList, parentPort, Buffer.from(inforHash, 'hex'));  

parentPort.postMessage({ success: true, peer });


function  downloadPeer(peer, torrent, pieces, piecesBuffer, fileInfoList,  parentPort, inforHash) {
  if(peer.port === serverPort){
      console.log("skip myself");
      return;

  }

    const queue = new Queue(torrent);
    const bitfield = {};
    // console.log("inforHash: ", inforHash);
    
    const socket = net.Socket();

    const timer = setInterval(() => {
      socket.write(message.buildKeepAlive());
    }, 1.5 * 60 * 1000);

    socket.on('error', (err) => {
      // console.error('Socket error:', err);
      clearInterval(timer);
    });

    socket.on('close', () => {
      // console.log('clear timer for alive msg');
      clearInterval(timer);
      parentPort.postMessage({ type: 'peerDisconnect', peer });
    });

    socket.connect(peer.port, peer.ip, () => {
      socket.write(message.buildHandshake(torrent, inforHash, Buffer.from(yourID)));
    });

    onWholeMsg(socket,msg => msgHandler(msg, socket, pieces, queue, piecesBuffer, torrent, fileInfoList, peer, bitfield, inforHash, parentPort));

}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on('data', recvBuf => {
    const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  });
}