const tracker = require('./tracker');
const bencode = require('bencode');
const torrentParser = require('./torrentParser');
const download = require('./download');
const peerServer = require('./server');
const {genPort} = require('./util');

const torrent = torrentParser.open('sample.torrent');

peerServer(genPort(),torrent);

download(torrent);
// while(1);