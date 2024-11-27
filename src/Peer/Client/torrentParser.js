const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');
const path = require('path');
const { get } = require('http');

module.exports.open = (filepath) => {
    return bencode.decode(fs.readFileSync(filepath));
};

module.exports.getFileInfo = function(torrent,basePath ,yourLocation='') {
  // BLOCK_LEN = torrent.info['piece length']/4;
  // console.log(torrent.info['files']);

  const info = torrent.info;
  const pieceLength = info['piece length'];
  const files = info['files'] || [];
  // const pieces = info['pieces'];

  const fileInfoList = [];

  if (files.length > 0) {
      let offset = 0;
      files.forEach(file => {
          const filePath = yourLocation + torrent.info['name'].toString()+"/"+file['path'].map(segment => segment.toString()).join(`/`);
          const fileLength = file['length'];
          const absolutePath = path.resolve(basePath, filePath);

          // Tính toán vị trí của các piece
          const startPiece = Math.floor(offset / pieceLength);
          const byteOffsetInPiece = offset % pieceLength;

          fileInfoList.push({
              path: absolutePath,
              startPiece: startPiece,
              byteOffset: byteOffsetInPiece,
              length: fileLength,
              selected: false
          });

          offset += fileLength;
      });
  } else {
      // Trường hợp torrent chỉ có một file
      const filePath =yourLocation+'/'+ info['name'].toString();
      
      const absolutePath = path.resolve(basePath, filePath);
      const fileLength = info['length'];
      const startPiece = 0;
      const byteOffsetInPiece = 0;

      fileInfoList.push({
          path: absolutePath,
          startPiece: startPiece,
          byteOffset: byteOffsetInPiece,
          length: fileLength,
          selected: false
      });
  }

  return fileInfoList;
}


module.exports.inforHash = torrent =>{
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
}


module.exports.BLOCK_LEN = Math.pow(2, 14);
;

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