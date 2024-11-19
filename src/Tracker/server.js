const { time } = require('console');
const http = require('http');

const hostname = '127.0.0.1'; // Server IP address
const port = 8888; // Server port
const timeOut = 15*1000; // 15 seconds
const maxPeerResponse = 30;
let downloadedForScrape =0;

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
                        if(event === 'completed'&&peer.status !== 'completed'){
                            downloadedForScrape++;
                        }
                        peer.status = event;
                        peer.downloaded = downloaded;
                        peer.uploaded = uploaded;
                        peer.left = left;
                        peer.last_announce = Date.now();
                    }
                    // else{
                    //     console.log("peer_id: ", peer_id.data);
                    //     console.log("peer.peer_id: ", peer.peer_id);
                    //     console.log(`peer with port ${port} not found`);
                    // }
                });
            }
            console.log('trackerDatabase:', trackerDatabase);

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
                    downloaded: downloadedForScrape,
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
        //    console.log(`tracker after clear: `, trackerDatabase);
       } 
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
