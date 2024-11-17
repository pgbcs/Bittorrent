'use strict';

const tp = require('./torrentParser');

module.exports = class {
  constructor(torrent, fileInfoList,isSeeder) {
    function buildPiecesArray(isSeeder) {
      const nPieces = torrent.info.pieces.length / 20;
      const arr = new Array(nPieces).fill(null);
      return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(isSeeder));
    }

    this.fileInfoList = fileInfoList;
    this._requested = buildPiecesArray(isSeeder);
    this._received = buildPiecesArray(isSeeder);
    this._freq = new Array(torrent.info.pieces.length/20).fill(0) // use for rarest first
  }

  addRequested(pieceBlock) {
    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    this._requested[pieceBlock.index][blockIndex] = true;
  }

  addReceived(pieceBlock) {
    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    this._received[pieceBlock.index][blockIndex] = true;
  }

  needed(pieceBlock) {
    if (this._requested.every(blocks => blocks.every(i => i))) {
      this._requested = this._received.map(blocks => blocks.slice());
    }
    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    return !this._requested[pieceBlock.index][blockIndex];
  }
  havePiece(pieceIndex){
    return this._received[pieceIndex].every(block=> block);
  }
  receivedPiece(pieceIndex){
    this._received[pieceIndex].fill(true);  
    this._requested[pieceIndex].fill(true);
  }
  // isDone() {
  //   return this._received.every(blocks => blocks.every(i => i));
  // }
  isDone() {
    for (const fileInfo of this.fileInfoList) {
      const { startPiece, length, byteOffset } = fileInfo;
      const pieceLength = tp.BLOCK_LEN;
      let remainingLength = length;

      let offset = 0;

      // Kiểm tra tất cả các piece liên quan đến file
      while (remainingLength > 0) {
        const pieceIndex = startPiece + Math.floor((offset + byteOffset) / pieceLength);

        // Nếu chưa nhận đủ blocks của piece này thì chưa xong
        if (!this.havePiece(pieceIndex)) {
          return false;
        }
        const bytesInCurrentPiece = Math.min(remainingLength, pieceLength - ((offset + byteOffset) % pieceLength));
        offset += bytesInCurrentPiece;
        remainingLength -= bytesInCurrentPiece;
      }
    }

    return true;
  }
};