const tracker = require('./Client/tracker');
const bencode = require('bencode');
const torrentParser = require('./Client/torrentParser');
const download = require('./Client/download');
const {server, state} = require('./Server/server');
const {genPort} = require('./Client/util');
const Pieces = require('./Client/Pieces');
const fs = require('fs');
const path = require('path');
const {processFiles } = require('./Client/readAndWritePieces');

const args = process.argv.slice(2);
const torrentPath = 'bluemew.torrent';
// const torrentPath = 'video.torrent';
// const torrentPath = 'Pic4rpCa.torrent';
const torrent = torrentParser.open(torrentPath);

const basePath = path.dirname(torrentPath);

let clientID ='';
if(args[0] == 'download'){
    clientID = args[1];
}
const fileInfoList = torrentParser.getFileInfo(torrent ,basePath,`received${clientID}/`);

// fileInfoList.forEach(fileInfo => {
//     console.log(`Đường dẫn: ${fileInfo.path}`);
//     console.log(`Piece bắt đầu: ${fileInfo.startPiece}`);
//     console.log(`Byte bắt đầu trong piece: ${fileInfo.byteOffset}`);
//     console.log(`Chiều dài file: ${fileInfo.length}`);
//     console.log('----------------------------------');
// });


let isSeeder = false;

if(args[0]=='seeder'){
    isSeeder =true;
}

let piecesBuffer, pieces;
async function processFile() {
    try {
        [piecesBuffer, pieces] = await processFiles(fileInfoList, torrent);
        console.log('pieces: ', pieces);
        const peerServer = server(genPort(),torrent, pieces, piecesBuffer);

    if(args[0] == 'download'){
        download(torrent, pieces,piecesBuffer, fileInfoList, state);
    }
    if(args[0] == 'seeder'){
        tracker.getPeers(torrent,()=>{});
    }
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

processFile();



