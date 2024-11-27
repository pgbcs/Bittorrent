'use strict';
const { PriorityQueue } = require('@datastructures-js/priority-queue');
const tp = require('./torrentParser');

module.exports = class {
  constructor(torrent) {
    this._torrent = torrent;
    // const compareFunction = (a, b) => a.freq - b.req;
    this._queue = [];
    this.choked = true;
  }

  queue(pieceIndex, freq) {
    const nBlocks = tp.blocksPerPiece(this._torrent, pieceIndex);
    // console.log("nBlocks: ", nBlocks);
    for (let i = 0; i < nBlocks; i++) {
      const pieceBlock = {
        index: pieceIndex,
        begin: i * tp.BLOCK_LEN,
        length: tp.blockLen(this._torrent, pieceIndex, i),
        freq
      };
      // console.log("pieceBlock: ", pieceBlock);
      this._queue.push(pieceBlock);
    }
  }

  deque() { 
    const randomIndex = Math.floor(Math.random() * this._queue.length);
    const removedElement = this._queue.splice(randomIndex, 1)[0];
    return removedElement;}

  // peek() { return this._queue.peek(); }

  length() { return this._queue.length; }
};