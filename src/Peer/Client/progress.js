const cliProgress = require('cli-progress');
const { inforHash } = require('./torrentParser');


// // create a new progress bar instance and use shades_classic theme
// const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

// // start the progress bar with a total value of 200 and start value of 0
// bar1.start(200, 0);

// // update the current value in your application..
// // bar1.update(100);
// const timer = setInterval(() => {
//     bar1.increment();
//     if (bar1.value >= 200) {
//         bar1.stop();
//         clearInterval(timer);
//     }
// }, 10);


barList = {}

module.exports.createProgressBar = (fileInfoList, torrent) => {
    if(!barList[inforHash(torrent)]){
        barList[inforHash(torrent)] = {};
    }
    fileInfoList.forEach((fileInfo, index) => {
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar.start(fileInfo.length, 0);
        barList[inforHash(torrent)][fileInfo.path] = bar;
    });
};

module.exports.updateProgressBar = (torrent, filePath, length) => {
    barList[inforHash(torrent)][filePath].increment(length);
};