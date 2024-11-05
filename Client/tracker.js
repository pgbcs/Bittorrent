const http = require('http');
const torrentParser = require('./torrentParser');
const {genID} = require('./util')

module.exports.getPeers =async (torrent, callback)=>{
    try {
        const resp = await httpGET('127.0.0.1', 3000, buildConnReq());
        console.log('Data received:', resp); 
        if(respType(resp) === "connect"){
            const connResp = parseConnResp(resp);
            const announceReq = buildAnnounceReq(connResp.connection_id, torrent);
            httpGET('127.0.0.1', 3000, announceReq);
        }
        else if(respType(resp)==='announce'){

        }
    } catch (error) {
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

function buildConnReq(){
    return {
        connection_id: 0x41727101980,
        action: 'connect',
        transaction_id: 0x88,
    }
}


function respType(resp){
    const {action} = JSON.parse(resp);
    return action;
}

function parseConnResp(resp){
    return JSON.parse(resp);
}

function buildAnnounceReq(connection_id, torrent, port=6881){
    return {
        connection_id,
        action: "announce",
        info_hash: torrentParser.inforHash(torrent),
        peer_id: genID(),
        event: '',
        downloaded: 0,
        left,
        uploaded: 0,
        IP_address,
        port,
        num_want:-1,
    }
}