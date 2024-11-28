const tracker = require('./Client/tracker');
const torrentParser = require('./Client/torrentParser');
const download = require('./Client/download');
const {server, state} = require('./Server/server');
const {genPort, getIntervalForGetListPeer, setStatus, getStatus, updateDownloaded, getDownloaded} = require('./Client/util');
const path = require('path');
const {processFiles } = require('./Client/readAndWritePieces');
const {selectFiles, displayFileList} = require('./Client/chooseFile');    

const {createProgressList ,setTimer} = require('./Client/properties');

// let countDown = 1;
module.exports.runProcess =  (torrentPath,args,win,ipcMain) => {
    const torrent = torrentParser.open(torrentPath);

    const basePath = path.dirname(torrentPath);

    let clientID ='';
    if(args[0] == 'download'){
        clientID = args[1];
    }
    
    let fileInfoList = torrentParser.getFileInfo(torrent ,basePath,`received${clientID}/`);

    let isSeeder = false;

    if(args[0]=='seeder'){
        isSeeder =true;
    }
    tracker.scrape(torrent);

    // let piecesBuffer, pieces;
    async function processFile() {
        try {
            const [pieces, sharedPieceBuffer, sharedReceivedBuffer, sharedRequestedBuffer, sharedFreqBuffer] = await processFiles(fileInfoList, torrent);
            // console.log('pieces: ', pieces);
            const peerServer = server(genPort(torrentParser.inforHash(torrent)),torrent, pieces, sharedPieceBuffer);

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
                    win.loadFile(path.join(__dirname,'../../pages/dashboard.html'));

                    // console.log(`Next ${countDown}`,data)
                    // countDown +=1;

                    setTimeout(() => {
                        win.webContents.send('main-to-renderer',data)   
                    },500)  

                    ipcMain.on("continue",(event,data)=>{
                        win.loadFile(path.join(__dirname,'../../pages/select2.html'));
                        // console.log("con cac",data)
                        setTimeout(() => {
                            win.webContents.send('main-to-renderer',{ fileInfoLst :data })   
                        },500)
                    })

                    fileInfoList = data
                    pieces.fileInfoList = data
                    // fileInfoList = data

                    setTimeout(()=>{    
                        createProgressList(torrent, data);
                        setTimer(torrent, new Date());
                        download(torrent, sharedPieceBuffer, sharedReceivedBuffer, sharedRequestedBuffer, sharedFreqBuffer, fileInfoList, state,win);
                    },1000)

                });
            })();
        }
        if(args[0] == 'seeder'){
            
            getDownloaded(torrent);

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

