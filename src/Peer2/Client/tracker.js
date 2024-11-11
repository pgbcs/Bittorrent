const http = require('http');
const torrentParser = require('./torrentParser');
const {genID, genPort} = require('./util')
const net = require('net');


module.exports.getPeers =async (torrent, callback)=>{
    try{
        const announceReq = buildAnnounceReq(torrent);
        const resp = await httpGET('127.0.0.1', 3000, announceReq);
        console.log('Data received: ',resp);

        callback(JSON.parse(resp));
    }catch (error){
        console.error('Error occurred:', error);
    }
}

function httpGET(hostname, port, param) {
    const jsonParam = JSON.stringify(param);
    const url = `http://${hostname}:${port}/?${encodeURIComponent(jsonParam)}`;

    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk; // Get data from server
            });

            res.on('end', () => {
                resolve(responseData);
            });
        }).on('error', (error) => {
            console.log(`Problem with error: ${error.message}`);
            reject(error); 
        });
    });
}

//gen port do chạy cùng máy
function buildAnnounceReq(torrent, port=genPort()){
    return {
        connection_id: 0x41727101980,
        action: "announce",
        info_hash: torrentParser.inforHash(torrent),
        peer_id: genID(),
        event: '',
        downloaded: 0,
        left: 0,
        uploaded: 0,
        IP_address: '127.0.0.1',
        port,
        num_want:-1,
        transaction_id: 0x88,
        compact: 0,
    }
}