const tracker = require('./tracker');
const bencode = require('bencode');
const torrentParser = require('./torrentParser');
const download = require('./download');

const torrent = torrentParser.open('sample.torrent');


tracker.getPeers(torrent, peers => {
    console.log('list of peers: ', peers);
});