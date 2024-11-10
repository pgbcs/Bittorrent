const tracker = require('./Client/tracker');
const bencode = require('bencode');
const torrentParser = require('./Client/torrentParser');
const download = require('./Client/download');
const peerServer = require('./Server/server');
const {genPort} = require('./Client/util');
const Pieces = require('./Client/Pieces');
const fs = require('fs');

const args = process.argv.slice(2);
const torrent = torrentParser.open('bluemew.torrent');

let isSeeder = false;
if(args[0]=='seeder'){
    isSeeder =true;
}

const pieces = new Pieces(torrent, isSeeder);


const path = "D:/Nam3/Computer Networking/Assignment/Assignment1/Bittorrent/src/Peer/received/bluemew.jpg";

const PIECE_SIZE = 16384;

//create piece buffer
const piecesBuffer = []; // Danh sách các piece
let pieceCount = Math.ceil(torrent.info.length / PIECE_SIZE);
console.log(pieceCount);
for (let i = 0; i < pieceCount; i++) {
    const start = i * PIECE_SIZE;
    const end = Math.min((i + 1) * PIECE_SIZE, torrent.info.length);
    const piece = Buffer.alloc(end-start+1);
    piecesBuffer.push(piece);
}

// Đọc tệp dưới dạng buffer
fs.readFile(path, (err, data) => {
    if (err) {
        console.log('File cannot be opened or does not exist, skipping.'); 
        return;
    }
    
    console.log('File read successfully!');
    for (let i = 0; i < pieceCount; i++) {
        const start = i * PIECE_SIZE;
        const end = Math.min((i + 1) * PIECE_SIZE, data.length);
        data.slice(start, end).copy(piecesBuffer[i]);
        
        console.log(`Piece ${i + 1}:`, piecesBuffer[i]);
    }

    console.log(`Total pieces: ${piecesBuffer.length}`);
});




peerServer(genPort(),torrent,pieces,piecesBuffer);

if(args[0] == 'download'){
    download(torrent, pieces,piecesBuffer, path);
}
if(args[0] == 'seeder'){
    tracker.getPeers(torrent,()=>{});
}
// console.log(torrent.info);