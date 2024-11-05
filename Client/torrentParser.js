const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');

module.exports.open = (filepath) => {
    return bencode.decode(fs.readFileSync(filepath));
};

module.exports.inforHash = torrent =>{
    const info = bencode.encode(torrent.info);
    console.log(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
}