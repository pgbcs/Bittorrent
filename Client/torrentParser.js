const fs = require('fs');
const bencode = require('bencode');


module.exports.open = (filepath) => {
    return bencode.decode(fs.readFileSync(filepath));
};

module.exports.inforHash = torrent =>{
    return torrent.infor;
}