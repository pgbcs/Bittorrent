const fs = require('fs');
const Pieces = require('./Pieces');
const verifyPiece = require('../util/torrentCheck').verifyPiece;

function readFileAndWritePieces(fileInfo, torrent, piecesBuffer, pieces, pieceCount) {
    const PIECE_SIZE = torrent.info['piece length'];
    
    return new Promise((resolve, reject) => {
        fs.readFile(fileInfo.path, (err, data) => {
            if (err) {
                console.log(`Không thể mở file: ${fileInfo.path}, bỏ qua.`);
                return resolve();
            }

            console.log(`Đọc file thành công: ${fileInfo.path}`);

            let offset = 0;
            let remainingLength = fileInfo.length;

            while (remainingLength > 0) {
                // console.log("offset: ", offset);
                const pieceIndex = fileInfo.startPiece + Math.floor((offset + fileInfo.byteOffset) / PIECE_SIZE);
                // console.log("pieceIndex: ", pieceIndex);
                const byteOffsetInPiece = (fileInfo.byteOffset + offset) % PIECE_SIZE;

                // Tính toán phần dữ liệu còn lại cần đọc
                const availableSpaceInPiece = PIECE_SIZE - byteOffsetInPiece;
                const bytesToWrite = Math.min(remainingLength, availableSpaceInPiece);
                // console.log("bytesToWrite: ", bytesToWrite);
                // Nếu piece chưa tồn tại trong mảng, khởi tạo nó
                if (!piecesBuffer[pieceIndex]) {
                    if(pieceCount - 1 == pieceIndex) piecesBuffer[pieceIndex] = Buffer.alloc(bytesToWrite);
                    else piecesBuffer[pieceIndex] = Buffer.alloc(PIECE_SIZE);
                }

                // console.log(`Ghi vào piece ${pieceIndex} từ offset ${byteOffsetInPiece} với chiều dài ${bytesToWrite}`);
                // Ghi dữ liệu vào piece
                data.copy(
                    piecesBuffer[pieceIndex],
                    byteOffsetInPiece,
                    offset,
                    offset + bytesToWrite
                );
                
                if(verifyPiece(piecesBuffer[pieceIndex], pieceIndex, torrent)){
                    pieces.receivedPiece(pieceIndex);
                }

                offset += bytesToWrite;
                remainingLength -= bytesToWrite;
            }
            resolve();
        });
    });
}

module.exports.processFiles = async function (fileInfoList, torrent) {
    const pieces = new Pieces(torrent, fileInfoList, false);
    // console.log("pieces: ", pieces._requested);
    let pieceCount = Math.ceil(torrent.info['pieces'].length/20);
    const piecesBuffer = new Array(pieceCount).fill(null);

    const readPromises = fileInfoList.map(fileInfo => readFileAndWritePieces(fileInfo, torrent, piecesBuffer, pieces, pieceCount)); 
    await Promise.all(readPromises);
    return [piecesBuffer, pieces];
}
