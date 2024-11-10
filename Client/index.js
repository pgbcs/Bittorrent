const tracker = require('./tracker');
const bencode = require('bencode');
const torrentParser = require('./torrentParser');
const download = require('./download');
const peerServer = require('./server');
const {genPort} = require('./util');

const torrent = torrentParser.open('bluemew.torrent');

function createBitfieldFromList(piecesList) {
    const numPieces = piecesList.length; // Số lượng phần
    const bitfieldSize = Math.ceil(numPieces / 8); // Kích thước buffer

    // Tạo buffer rỗng
    const bitfield = Buffer.alloc(bitfieldSize);

    // Điền bitfield theo danh sách
    for (let i = 0; i < numPieces; i++) {
        if (piecesList[i]) {
            // Nếu peer sở hữu phần i, đặt bit tương ứng thành 1
            bitfield[Math.floor(i / 8)] |= (1 << (7 - (i % 8)));
        }
    }

    return bitfield;
}

// Sử dụng hàm để tạo bitfield
const piecesList = [true, false, true, true, false, true, false, false]; // 8 phần
const bitfield = createBitfieldFromList(piecesList);

// Kiểm tra giá trị của bitfield
console.log("Generated Bitfield:", bitfield);


peerServer(genPort(),torrent);
// console.log(torrent.info);
download(torrent, "D:/Nam3/Computer Networking/Assignment/Assignment1/Bittorrent/Client/received/bluemew.jpg");
// while(1);