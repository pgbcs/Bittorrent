const crypto = require('crypto');
const { inforHash } = require('./torrentParser');

let id = {};
let port = {};
let uploaded = {};
let downloaded = {};
let status = {};
let interval = {};
let timerForGetListPeer = {};

// Generate ID: http://www.bittorrent.org/beps/bep_0020.html
module.exports.genID = (torrent) => {
    if (!id[inforHash(torrent)]) {
        id[inforHash(torrent)] = crypto.randomBytes(20);
        Buffer.from('-BT0001-').copy(id[inforHash(torrent)], 0);
    }
    return id[inforHash(torrent)];
};


module.exports.genPort=(infoHash)=>{
    // console.log("infoHash called: ", infoHash);
    if (!port[infoHash]) {
        const min = 6000;
        const max = 7000;
        port[infoHash]= Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return port[infoHash];
}

module.exports.updateUploaded = (torrent,value) => {
    uploaded[inforHash(torrent)] += value;
}
module.exports.updateDownloaded = (torrent,value) => {
    downloaded[inforHash(torrent)] += value;
}
module.exports.getUploaded = (torrent) => {
    if(!uploaded[inforHash(torrent)]){
        uploaded[inforHash(torrent)] = 0;
    }
    return uploaded[inforHash(torrent)];
}
module.exports.getDownloaded = (torrent) => { 
    if(!downloaded[inforHash(torrent)]){
        downloaded[inforHash(torrent)] = 0;
    } 
    return downloaded[inforHash(torrent)];
}

module.exports.getLeft=(torrent)=>{
    return torrent.info.length - downloaded[inforHash(torrent)];
}

module.exports.setStatus=(torrent, value)=>{
    status[inforHash(torrent)] = value;
}

module.exports.getStatus=(torrent)=>{
    return status[inforHash(torrent)];
}

module.exports.getIntervalForGetListPeer=(torrent)=>{
    if(!interval[inforHash(torrent)]){
        interval[inforHash(torrent)] = 10000;
    }
    // console.log("interval: ", interval[inforHash(torrent)]);
    return interval[inforHash(torrent)];
}
module.exports.setIntervalForGetListPeer=(torrent,value)=>{    
    interval[inforHash(torrent)] = value;
}

module.exports.setTimerForGetListPeer=(torrent,value)=>{
    timerForGetListPeer[inforHash(torrent)] = value;
}

module.exports.getTimerForGetListPeer=(torrent)=>{
    return timerForGetListPeer[inforHash(torrent)];
}