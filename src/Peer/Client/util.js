const crypto = require('crypto');
let id = null;
let port = null;
let uploaded = 0;
let downloaded = 0;
let status = 'started';
let interval = 10000;
// Generate ID: http://www.bittorrent.org/beps/bep_0020.html
module.exports.genID = () => {
    if (!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-BT0001-').copy(id, 0);
    }
    return id;
};


module.exports.genPort=()=>{
    if (!port) {
        const min = 6000;
        const max = 7000;
        port= Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return port;
}

module.exports.updateUploaded = (value) => {
    uploaded += value;
}
module.exports.updateDownloaded = (value) => {
    downloaded += value;
}
module.exports.getUploaded = () => {
    return uploaded;
}
module.exports.getDownloaded = () => {  
    return downloaded;
}

module.exports.getLeft=(torrent)=>{
    return torrent.info.length - downloaded;
}

module.exports.setStatus=(value)=>{
    status = value;
}

module.exports.getStatus=()=>{
    return status;
}

module.exports.getIntervalForGetListPeer=()=>{
    return interval;
}
module.exports.setIntervalForGetListPeer=(value)=>{    
    interval = value;
}