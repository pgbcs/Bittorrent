const tracker = require('./Client/tracker');
const torrentParser = require('./Client/torrentParser');
const download = require('./Client/download');
const {server, state} = require('./Server/server');
const {genPort, getIntervalForGetListPeer, setStatus, getStatus} = require('./Client/util');
const path = require('path');
const {processFiles } = require('./Client/readAndWritePieces');
const {selectFiles, displayFileList} = require('./Client/chooseFile');    
const { createProgressBar } = require('./Client/progress');



const args = process.argv.slice(2);
// const torrentPath = 'bluemew.torrent';
// const torrentPath = 'video.mkv.torrent';
const torrentPath = 'drive-download-20241105T125636Z-001.torrent';
// const torrentPath = 'Pic4rpCa.torrent';
const torrent = torrentParser.open(torrentPath);

// console.log("torrent:", torrent);
// console.log("torrent info:", torrent.info);

const basePath = path.dirname(torrentPath);

let clientID ='';
if(args[0] == 'download'){
    clientID = args[1];
}


const fileInfoList = torrentParser.getFileInfo(torrent ,basePath,`received${clientID}/`);
// createProgressBar(fileInfoList, torrent);


let isSeeder = false;

if(args[0]=='seeder'){
    isSeeder =true;
}
tracker.scrape(torrent);

let piecesBuffer, pieces;
async function processFile() {
    try {
        [piecesBuffer, pieces] = await processFiles(fileInfoList, torrent);

        // console.log('pieces: ', pieces);
        const peerServer = server(genPort(torrent),torrent, pieces, piecesBuffer);

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
        
        setStatus(torrent,'completed');
        // console.log('status:',getStatus(torrent));
        // console.log(getIntervalForGetListPeer(torrent));
        setInterval(()=>{
            tracker.getPeers(torrent,()=>{});
        },getIntervalForGetListPeer(torrent));
    }
    } catch (error) {
        console.error('Error processing files:', error);
    }
}
processFile();