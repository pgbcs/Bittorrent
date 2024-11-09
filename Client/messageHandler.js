const message = require('./message');

module.exports.msgHandler= function(msg, socket) {
    if (isHandshake(msg)) {
        console.log('connect succesfully');
        socket.write(message.buildInterested());}
    else {
      const m = message.parse(msg);
  
      if (m.id === 0) chokeHandler();
      if (m.id === 1) unchokeHandler();
      if (m.id === 4) haveHandler(m.payload);
      if (m.id === 5) bitfieldHandler(m.payload);
      if (m.id === 7) pieceHandler(m.payload);
    }
  }
  
  
  function isHandshake(msg) {
    return msg.length === msg.readUInt8(0) + 49 &&
        msg.slice(0,20).toString('utf8', 1) === 'BitTorrent protocol';
  }
  function chokeHandler() {  }
  
  function unchokeHandler() {  }
  
  function haveHandler(payload) {  }
  
  function bitfieldHandler(payload) {  }
  
  function pieceHandler(payload) {  }