const tracker = require('./Client/tracker');
const torrentParser = require('./Client/torrentParser');
const download = require('./Client/download');
const {server, state} = require('./Server/server');
const {genPort, getIntervalForGetListPeer, setStatus, getStatus} = require('./Client/util');
const path = require('path');
const {processFiles } = require('./Client/readAndWritePieces');
const {selectFiles, displayFileList} = require('./Client/chooseFile');    

const {createProgressList } = require('./Client/properties');
const { createProgressBar } = require('./Client/progress');

module.exports.runProcess =  (torrentPath,args,win,ipcMain) => {
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
    tracker.scrape(torrent);

    let piecesBuffer, pieces;
    async function processFile() {
        try {
            [piecesBuffer, pieces] = await processFiles(fileInfoList, torrent);
            // console.log('pieces: ', pieces);
            const peerServer = server(genPort(torrent),torrent, pieces, piecesBuffer);

        if(args[0] == 'download'){
            (async () => {
                // await selectFiles(fileInfoList);
                // fileInfoList[0].selected = true;
                setTimeout(() => {
                    win.webContents.send('main-to-renderer', { fileInfoLst :fileInfoList })   
                },500)
              
                // console.log('\nKết quả sau khi chọn:');
                // displayFileList(fileInfoList);
                ipcMain.on("next",(event, data) => {
                    // console.log("Message received from renderer:", data);
                    // console.log(data)
                    win.loadFile(path.join(__dirname,'../../pages/down.html'));
                    setTimeout(() => {
                        win.webContents.send('main-to-renderer',data)   
                    },500)   
                    pieces.fileInfoList = data
                    setTimeout(()=>{
                        createProgressList(torrent, data);
                        download(torrent, pieces,piecesBuffer, data, state,win);
                    },1000)
                });
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
}

