const fs = require('fs');
const verifyPiece = require('../util/torrentCheck').verifyPiece;
const SharedPieces = require('./SharedPieces');
const tp = require('./torrentParser');

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

                // console.log(`Ghi vào piece ${pieceIndex} từ offset ${byteOffsetInPiece} với chiều dài ${bytesToWrite}`);
                // Ghi dữ liệu vào piece
                // data.copy(
                //     piecesBuffer[pieceIndex],
                //     byteOffsetInPiece,
                //     offset,
                //     offset + bytesToWrite
                // );
                
                piecesBuffer.set(data.slice(offset, offset + bytesToWrite),PIECE_SIZE*pieceIndex + byteOffsetInPiece);

                // console.log("verifyPiece: ", verifyPiece(piecesBuffer[pieceIndex], pieceIndex, torrent));
                if(verifyPiece(piecesBuffer.slice(PIECE_SIZE*pieceIndex,Math.min(PIECE_SIZE*pieceIndex + PIECE_SIZE, tp.size(torrent))), pieceIndex, torrent)){
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
    let pieceCount = Math.ceil(torrent.info['pieces'].length/20);
    let numblocks = 0;
    for(let i = 0; i < pieceCount; i++){
        numblocks += tp.blocksPerPiece(torrent ,i);
    }

    const requestedSharedBufferSize = numblocks;
    const receivedSharedBufferSize = numblocks;

    const sharedReceivedBuffer = new SharedArrayBuffer(receivedSharedBufferSize);
    const sharedReceived =  new Uint8Array(sharedReceivedBuffer);
    const sharedRequestedBuffer = new SharedArrayBuffer(requestedSharedBufferSize);
    const sharedRequested = new Uint8Array(sharedRequestedBuffer);
    
    const sharedFreqBuffer = new SharedArrayBuffer(requestedSharedBufferSize);
    const sharedFreq = new Uint8Array(sharedFreqBuffer);

    let piecesBufferSize = tp.size(torrent);

    const sharedPieceBuffer = new SharedArrayBuffer(piecesBufferSize);
    const sharedPieceBufferView = new Uint8Array(sharedPieceBuffer);

    const pieces = new SharedPieces(torrent, fileInfoList, sharedReceived, sharedRequested, sharedFreq);
    // console.log("pieces: ", pieces._requested);
    

    const readPromises = fileInfoList.map(fileInfo => readFileAndWritePieces(fileInfo, torrent, sharedPieceBufferView, pieces, pieceCount)); 
    await Promise.all(readPromises);
    // console.log("pieces: ", pieces._received);
    // console.log("piecesBuffer: ", sharedPieceBufferView);
    return [pieces, sharedPieceBuffer, sharedReceivedBuffer, sharedRequestedBuffer, sharedFreqBuffer];
}
