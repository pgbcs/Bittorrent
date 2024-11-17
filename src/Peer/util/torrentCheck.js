const crypto = require('crypto');

function hashPiece(pieceBuffer) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(pieceBuffer);
    return sha1.digest();
}

// Hàm để kiểm tra hash của piece với hash từ file torrent
function verifyPiece(pieceBuffer, pieceIndex, torrent) {
    const expectedHash = torrent.info['pieces'].slice(pieceIndex * 20, (pieceIndex + 1) * 20); // Mỗi hash dài 20 byte (SHA-1)
    const pieceHash = hashPiece(pieceBuffer);

    // So sánh hash tính được với hash từ torrent
    if (Buffer.compare(pieceHash, expectedHash) === 0) {
        // console.log(`Piece ${pieceIndex} hợp lệ.`);
        return true;
    } else {
        // console.log(`Piece ${pieceIndex} không hợp lệ.`);
        return false;
    }
}

module.exports = {verifyPiece, hashPiece};