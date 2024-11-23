const http = require('http');
const { inforHash } = require('../Peer/Client/torrentParser');

const hostname = '127.0.0.1'; // Server IP address
const port = 8888; // Server port
const timeOut = 15*1000; // 15 seconds
const maxPeerResponse = 30;
let downloadedForScrape = {};

const trackerDatabase={
    torrents:{}, 
};


const server = http.createServer((req, res) => {
    //parse param from url
    const parsedUrl = new URL(req.url, `http://${hostname}:${port}`);
    if (req.method === 'GET') {
        const paramsObj = JSON.parse(parsedUrl.searchParams.keys().next().value);
        const {action} = paramsObj;
        if(action =='announce'){
            const {peer_id, IP_address, port, compact, uploaded, downloaded, left, event, info_hash} = paramsObj;
            // console.log("received announce request from peer_id: ", peer_id);
            if(event === 'started'){
                const newPeer ={
                    peer_id,
                    IP_address,
                    port,
                    status: event,
                    uploaded,
                    downloaded,
                    left,
                    last_announce: Date.now(),
                };

                if(!trackerDatabase.torrents[info_hash.data]){
                    trackerDatabase.torrents[info_hash.data] = [];
                }
                
                trackerDatabase.torrents[info_hash.data].push(newPeer);
            }
            else if(event === 'stopped'){
                trackerDatabase.torrents[info_hash.data] = trackerDatabase.torrents[info_hash.data].filter(peer=>peer.peer_id !== peer_id);
            }
            else {
                trackerDatabase.torrents[info_hash.data].forEach(peer => {
                    if(Buffer.compare(Buffer.from(peer.peer_id),Buffer.from(peer_id.data))==0){
                        // console.log(event);
                        if(event === 'completed'&&peer.status !== 'completed'){
                            if(!downloadedForScrape[info_hash.data]){downloadedForScrape[info_hash.data] = 0;}
                            downloadedForScrape[info_hash.data]++;
                            // console.log("downloadedForScrape: ", downloadedForScrape);
                        }
                        peer.status = event;
                        peer.downloaded = downloaded;
                        peer.uploaded = uploaded;
                        peer.left = left;
                        peer.last_announce = Date.now();
                        // console.log("peer request: ", peer);
                    }
                    // else{
                    //     console.log("peer_id: ", peer_id.data);
                    //     console.log("peer.peer_id: ", peer.peer_id);
                    //     console.log(`peer with port ${port} not found`);
                    // }
                });
            }
            if(trackerDatabase){
                displayInfo(trackerDatabase,info_hash.data);
            }

            const respone = {
                interval: 10000,
                complete: trackerDatabase.torrents[info_hash.data].filter(peer=>peer.status === 'completed').length,//number of completed
                incomplete: trackerDatabase.torrents[info_hash.data].filter(peer=>peer.status !== 'completed').length,//number of incomplete
                peers: getRandomPeers(trackerDatabase.torrents[info_hash.data].map(peer=>({
                    peer_id: peer.peer_id,
                    IP_address: peer.IP_address,
                    port: peer.port,
                })), maxPeerResponse),
            };
            res.end(JSON.stringify(respone));
        } 
        else if(action === 'scrape'){
            const {info_hash} = paramsObj;
            // console.log("info_hash: ", info_hash.data);
            if(trackerDatabase.torrents[info_hash.data]){
                const respone = {
                    downloaded: downloadedForScrape[info_hash.data]||0,
                    complete: trackerDatabase.torrents[info_hash.data].filter(peer=>peer.status === 'completed').length,//number of completed
                    incomplete: trackerDatabase.torrents[info_hash.data].filter(peer=>peer.status !== 'completed').length,//number of incomplete
                };
                res.end(JSON.stringify(respone));
            }
            else{
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Not Found\n');
            }
        }
        else{
            res.statusCode = 400; // Bad Request
            res.setHeader('Content-Type', 'text/plain');
            res.end('Missing parameters.\n');
        }
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found\n');
    }
});

server.listen(port, hostname, () => {
    console.log(`Tracker running at http://${hostname}:${port}/`);
    setInterval(()=>{
       for(const torrent in trackerDatabase.torrents){
           trackerDatabase.torrents[torrent] = trackerDatabase.torrents[torrent].filter(peer=>Date.now()-peer.last_announce<timeOut);
           displayInfo(trackerDatabase, torrent);
       } 
    //    displayInfo(trackerDatabase,info_hash.data);
    }, timeOut);
});

function getRandomPeers(peers, maxPeers = 30) {
    // Xáo trộn mảng sử dụng Fisher-Yates Shuffle
    for (let i = peers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [peers[i], peers[j]] = [peers[j], peers[i]];
    }

    // Lấy tối đa `maxPeers` phần tử từ mảng đã xáo trộn
    return (peers.length> maxPeers)? peers.slice(0, maxPeers): peers;
}

const CliTable = require('cli-table3');

function displayInfo(trackerDatabase, info_hash) {
    // Xóa màn hình và đặt con trỏ về đầu
    process.stdout.write('\x1B[2J\x1B[0;0H');
    console.log(`==== TRACKER INFO ====`);

    const table = new CliTable({
        head: ['PORT', 'STATUS', 'UPLOADED', 'DOWNLOADED', 'LEFT', 'LAST ANNOUNCE'], // Tiêu đề cột
        colWidths: [10, 15, 15, 15, 10, 25] // Chiều rộng từng cột
    });

    // Thêm dữ liệu vào bảng
    trackerDatabase.torrents[info_hash].forEach((torrent) => {
        const { port, status, uploaded, downloaded, left, last_announce } = torrent;
        table.push([port, status, uploaded, downloaded, left, (new Date(last_announce)).toLocaleString()]);
    });

    // Hiển thị bảng
    console.log(table.toString());
}
