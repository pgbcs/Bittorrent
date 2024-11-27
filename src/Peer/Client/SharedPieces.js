'use strict';

const tp = require('./torrentParser');

module.exports = class {
  constructor(torrent, fileInfoList, sharedReceived, sharedRequested, sharedFreq) {
    this.torrent=torrent;
    this.fileInfoList = fileInfoList;
    // console.log("fileInfoList: ", this.fileInfoList); 
    this._requested = sharedRequested;
    this._received = sharedReceived;
    this._freq = sharedFreq;// use for rarest first
    let numblocks =0;
    for(let i = 0; i < this._received.length; i++){
        numblocks += tp.blocksPerPiece(torrent ,i);
    }
    this._numblocks = numblocks;
  }

  addRequested(pieceBlock) {
    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    this._requested[pieceBlock.index*(tp.blocksPerPiece(this.torrent, 0))+blockIndex] = 1;
  }

  addReceived(pieceBlock) {
    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    // if(this._received[pieceBlock.index][blockIndex] == true) {
    //   console.log("duplicate block"); 
    // }
    this._received[pieceBlock.index*(tp.blocksPerPiece(this.torrent, 0))+blockIndex] = 1;
  }

  needed(pieceBlock) {
    // if (this._requested.every(blocks => blocks.every(i => i))) {
    //   this._requested = this._received.map(blocks => blocks.slice());
    // }
    this.fileInfoList.forEach(file => {
      if(file.selected == false) return;
      const startPiece = file.startPiece;
      const endPiece = startPiece + Math.floor((file.byteOffset + file.length - 1) / this.torrent.info['piece length']);
      // console.log("startPiece: ", startPiece);
      // console.log("endPiece: ", endPiece);
      for (let pieceIndex = startPiece; pieceIndex <= endPiece; pieceIndex++) {
        const offsetBegin = pieceIndex*tp.blocksPerPiece(this.torrent, 0);
        const offsetEnd = Math.min(offsetBegin + tp.blocksPerPiece(this.torrent, 0), this._numblocks);
        if (this._requested.slice(offsetBegin, offsetEnd).every(block => block==1)) {
            // Nếu tất cả các blocks của piece đã được yêu cầu, sao chép từ _received
            for(let i = offsetBegin; i < offsetEnd; i++){
                this._requested[i] = this._received[i];
            }
        }
      }
    });

    const fileInfo = this.fileInfoList.find(file => {
      if(file.selected == false) return false;
      // console.log("file: ", file.path);
      const startPiece = file.startPiece;
      const endPiece = startPiece + Math.floor((file.byteOffset + file.length - 1) / this.torrent.info['piece length']);

      return pieceBlock.index >= startPiece && pieceBlock.index <= endPiece;
    });
    // console.log("have find:", fileInfo);
    if (!fileInfo || !fileInfo.selected) {
      // console.log("dont need this piece");
      return false;
    }

    const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
    return !this._requested[pieceBlock.index*(tp.blocksPerPiece(this.torrent, 0))+blockIndex];
  }
  havePiece(pieceIndex){
    // if(!this._received[pieceIndex].every(block=> block)) console.log(`piece Index: ${pieceIndex}:`,this._received[pieceIndex]);
    const offsetBegin = pieceIndex*tp.blocksPerPiece(this.torrent, 0);
    const offsetEnd = Math.min(offsetBegin + tp.blocksPerPiece(this.torrent, 0), this._numblocks);
    // console.log(this._received.length);
    // console.log("offsetBegin: ", offsetBegin);
    // console.log("offsetEnd: ", offsetEnd);
    // console.log("received: ", this._received.slice(offsetBegin, offsetEnd));
    return this._received.slice(offsetBegin, offsetEnd).every(block=> block==1);
  }

  receivedPiece(pieceIndex){
    const offsetBegin = pieceIndex*tp.blocksPerPiece(this.torrent, 0);
    const offsetEnd = Math.min(offsetBegin + tp.blocksPerPiece(this.torrent, 0), this._numblocks);
    for(let i = offsetBegin; i < offsetEnd; i++){
        this._received[i] = 1;
        this._requested[i] = 1;
        this._freq[i]++;
    }
  }
  // isDone() {
  //   return this._received.every(blocks => blocks.every(i => i));
  // }
  isDone(torrent) {
    const PIECE_SIZE = this.torrent.info['piece length'];
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