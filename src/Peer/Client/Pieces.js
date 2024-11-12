'use strict';

const tp = require('./torrentParser');

module.exports = class {
  constructor(torrent,  isSeeder) {
    function buildPiecesArray(isSeeder) {
      const nPieces = torrent.info.pieces.length / 20;
      const arr = new Array(nPieces).fill(null);
      return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(isSeeder));
    }

    this._requested = buildPiecesArray(isSeeder);
    this._received = buildPiecesArray(isSeeder);
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
  isDone() {
    return this._received.every(blocks => blocks.every(i => i));
  }
};