const crypto = require('crypto');
let id = null;
// Generate ID: http://www.bittorrent.org/beps/bep_0020.html
module.exports.genID = () => {
    if (!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-BT0001-').copy(id, 0);
    }
    return id;
};