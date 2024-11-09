const tracker = require('./tracker');
const bencode = require('bencode');
const torrentParser = require('./torrentParser');
const download = require('./download');
const peerServer = require('./server');
const {genPort} = require('./util');

const torrent = torrentParser.open('bluemew.torrent');


peerServer(genPort(),torrent);
console.log(torrent.info);
download(torrent, torrent.info.name + "1");
// while(1);