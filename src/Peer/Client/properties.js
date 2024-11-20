const { updateProgressBar } = require("./progress");
const { inforHash } = require("./torrentParser");

/*
    sizeList={
        <<info_hash1 (torrent1)>>:{
            path1: size1,
            path2: size2,
        }
        ,...
    }
    progressList={
        <<info_hash (torrent1)>>:{
            path1: num1,
            path2: num2,
        }
    }

    numPeerConnected={
        <<info_hash (torrent1)>>: num1,
    }

    numPeerDownloadingd={
        <<info_hash (torrent1)>>: num1,
    }
*/
const sizeList = {};


const progressList={};

const numPeerConnected={};

const numPeerDownloading={};

module.exports.createProgressList = (torrent, fileInfoList) =>{
    if(!progressList[inforHash(torrent)]){
        progressList[inforHash(torrent)] = {};
    }
    if(!sizeList[inforHash(torrent)]){
        sizeList[inforHash(torrent)] = {};
    }
    fileInfoList.forEach(fileInfo => {
        sizeList[inforHash(torrent)][fileInfo.path] = fileInfo.length;
        if(fileInfo.selected) progressList[inforHash(torrent)][fileInfo.path] = 0;
    });
};

module.exports.updateProgressList = (torrent, payload, fileInfoList) => {
    const { index: pieceIndex,begin: byteBegin} = payload;
    const length = payload.block.length;

    // Giả định mỗi piece có kích thước cố định (ví dụ: 16KB)
    const pieceSize = torrent.info['piece length'];

    // Tính vị trí byte tuyệt đối của block
    const absoluteOffset = pieceIndex * pieceSize + byteBegin;
    const absoluteEnd = absoluteOffset + length;
    // console.log(`absoluteOffset: ${absoluteOffset}, absoluteEnd: ${absoluteEnd}`);
    // Duyệt qua danh sách file để xác định file chứa block
    for (let file of fileInfoList) {
        if (!file.selected) continue; // Bỏ qua file không được chọn

        // Tính byte bắt đầu và kết thúc của file
        const fileStart = file.startPiece * pieceSize + file.byteOffset;
        const fileEnd = fileStart + file.length;
        // console.log(`fileStart: ${fileStart}, fileEnd: ${fileEnd}`);
        // Nếu block nằm trong phạm vi của file này
        if (!(absoluteEnd<=fileStart || absoluteOffset>=fileEnd)) {
            const writeLength = Math.min(absoluteEnd, fileEnd) - Math.max(absoluteOffset, fileStart);
            progressList[inforHash(torrent)][file.path] += writeLength;
            // updateProgressBar(torrent, file.path, writeLength);
        }
    }

    // console.log("progressList: ", progressList[inforHash(torrent)]);
};

module.exports.updateNumPeerConnected = (torrent, num) =>{
    if(!numPeerConnected[inforHash(torrent)]){
        numPeerConnected[inforHash(torrent)] = 0;
    }
    numPeerConnected[inforHash(torrent)] = num;
};

module.exports.getNumPeerConnected = (torrent) =>{
    if(!numPeerConnected[inforHash(torrent)]){
        numPeerConnected[inforHash(torrent)] = 0;
    }
    return numPeerConnected[inforHash(torrent)];
}

module.exports.updateNumPeerDownloading = (torrent, num) =>{
    if(!numPeerDownloading[inforHash(torrent)]){
        numPeerDownloading[inforHash(torrent)] = 0;
    }
    numPeerDownloading[inforHash(torrent)] = num;
};

module.exports.getNumPeerDownloading = (torrent) =>{
    if(!numPeerDownloading[inforHash(torrent)]){
        numPeerDownloading[inforHash(torrent)] = 0;
    }
    return numPeerDownloading[inforHash(torrent)];
}