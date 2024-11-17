const tracker = require('./Client/tracker');
const torrentParser = require('./Client/torrentParser');
const download = require('./Client/download');
const {server, state} = require('./Server/server');
const {genPort} = require('./Client/util');
const path = require('path');
const {processFiles } = require('./Client/readAndWritePieces');
const {selectFiles, displayFileList} = require('./Client/chooseFile');    

const args = process.argv.slice(2);
// const torrentPath = 'bluemew.torrent';
const torrentPath = 'video.mkv.torrent';
// const torrentPath = 'Pic4rpCa.torrent';
const torrent = torrentParser.open(torrentPath);

const basePath = path.dirname(torrentPath);

let clientID ='';
if(args[0] == 'download'){
    clientID = args[1];
}
const fileInfoList = torrentParser.getFileInfo(torrent ,basePath,`received${clientID}/`);


let isSeeder = false;

if(args[0]=='seeder'){
    isSeeder =true;
}

let piecesBuffer, pieces;
async function processFile() {
    try {
        [piecesBuffer, pieces] = await processFiles(fileInfoList, torrent);
        // console.log('pieces: ', pieces);
        const peerServer = server(genPort(),torrent, pieces, piecesBuffer);

    if(args[0] == 'download'){
        (async () => {
            await selectFiles(fileInfoList);
        
            // console.log('\nKết quả sau khi chọn:');
            // displayFileList(fileInfoList);
            download(torrent, pieces,piecesBuffer, fileInfoList, state);
        })();
    }
    if(args[0] == 'seeder'){
        tracker.getPeers(torrent,()=>{});
    }
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

processFile();



