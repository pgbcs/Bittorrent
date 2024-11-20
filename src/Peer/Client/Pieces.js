'use strict';

const tp = require('./torrentParser');

module.exports = class {
  constructor(torrent, fileInfoList,isSeeder) {
    function buildPiecesArray(isSeeder) {
      const nPieces = torrent.info.pieces.length / 20;
      const arr = new Array(nPieces).fill(null);
      return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(isSeeder));
    }
    this.torrent=torrent;
    this.fileInfoList = fileInfoList;
    // console.log("fileInfoList: ", this.fileInfoList); 
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
    // if (this._requested.every(blocks => blocks.every(i => i))) {
    //   this._requested = this._received.map(blocks => blocks.slice());
    // }
    console.log(this.fileInfoList)
    const fileInfo = this.fileInfoList.find(file => {
      if(file.selected == false) return false;
      // console.log("file: ", file.path);
      const startPiece = file.startPiece;
      const endPiece = startPiece + Math.floor((file.byteOffset + file.length - 1) / this.torrent.info['piece length']);
      // console.log("startPiece: ", startPiece);
      // console.log("endPiece: ", endPiece);
      for (let pieceIndex = startPiece; pieceIndex <= endPiece; pieceIndex++) {
        if (this._requested[pieceIndex].every(block => block)) {
            // Nếu tất cả các blocks của piece đã được yêu cầu, sao chép từ _received
            this._requested[pieceIndex] = this._received[pieceIndex].slice();
        }
      }
      return pieceBlock.index >= startPiece && pieceBlock.index <= endPiece;
    });
    console.log("have find:", fileInfo);
    if (!fileInfo || !fileInfo.selected) {
      console.log("dont need this piece");
      return false;
    }

    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    return !this._requested[pieceBlock.index][blockIndex];
  }
  havePiece(pieceIndex){
    // if(!this._received[pieceIndex].every(block=> block)) console.log(`piece Index: ${pieceIndex}:`,this._received[pieceIndex]);
    return this._received[pieceIndex].every(block=> block);
  }
  receivedPiece(pieceIndex){
    this._received[pieceIndex].fill(true);  
    this._requested[pieceIndex].fill(true);
  }
  // isDone() {
  //   return this._received.every(blocks => blocks.every(i => i));
  // }
  isDone(torrent) {
    const PIECE_SIZE = torrent.info['piece length'];
    for (const fileInfo of this.fileInfoList) {
      if(fileInfo.selected == false) continue;
      const { startPiece, length, byteOffset } = fileInfo;

      let remainingLength = length;

      let offset = 0;

      // Kiểm tra tất cả các piece liên quan đến file
      while (remainingLength > 0) {
        const pieceIndex = startPiece + Math.floor((offset + byteOffset) / PIECE_SIZE);
        // console.log(pieceIndex);

        if (!this.havePiece(pieceIndex)) {
          // console.log("thiếu piece: ", pieceIndex);
          return false;
        }
        const bytesInCurrentPiece = Math.min(remainingLength, PIECE_SIZE - ((offset + byteOffset) % PIECE_SIZE));
        offset += bytesInCurrentPiece;
        remainingLength -= bytesInCurrentPiece;
      }
    }

    return true;
  }
};