const crypto = require('crypto');
let id = null;
let port = null;

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