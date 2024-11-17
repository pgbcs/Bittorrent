'use strict';
const { PriorityQueue } = require('@datastructures-js/priority-queue');
const tp = require('./torrentParser');

module.exports = class {
  constructor(torrent) {
    this._torrent = torrent;
    const compareFunction = (a, b) => a.freq - b.req;
    this._queue = new PriorityQueue(compareFunction);
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
      this._queue.enqueue(pieceBlock);
    }
  }

  deque() { return this._queue.dequeue(); }

  peek() { return this._queue.peek(); }

  length() { return this._queue.size(); }
};