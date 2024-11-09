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

module.exports.BLOCK_LEN = Math.pow(2, 14);

module.exports.size = (torrent) => {
  // Triển khai hàm size để tính tổng kích thước của torrent
  return torrent.info.files
    ? torrent.info.files.reduce((acc, file) => acc + file.length, 0)
    : torrent.info.length;
};

module.exports.pieceLen = (torrent, pieceIndex) => {
  const totalLength = BigInt(module.exports.size(torrent));
  const pieceLength = BigInt(torrent.info['piece length']);

  const lastPieceLength = totalLength % pieceLength;
  const lastPieceIndex = totalLength / pieceLength;

  return lastPieceIndex === BigInt(pieceIndex) ? Number(lastPieceLength) : Number(pieceLength);
};

module.exports.blocksPerPiece = (torrent, pieceIndex) => {
  const pieceLength = module.exports.pieceLen(torrent, pieceIndex);
  return Math.ceil(pieceLength / module.exports.BLOCK_LEN);
};

module.exports.blockLen = (torrent, pieceIndex, blockIndex) => {
  const pieceLength = module.exports.pieceLen(torrent, pieceIndex);

  const lastBlockLength = pieceLength % module.exports.BLOCK_LEN;
  const lastBlockIndex = Math.floor(pieceLength / module.exports.BLOCK_LEN);

  return blockIndex === lastBlockIndex ? lastBlockLength : module.exports.BLOCK_LEN;
};