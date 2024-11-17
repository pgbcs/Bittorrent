const path = require('path');
const readline = require('readline');   

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
// Hàm hiển thị cấu trúc thư mục
function displayFileList(fileInfoList) {
    console.log('Danh sách file:');
    fileInfoList.forEach((fileInfo, index) => {
        const relativePath = path.relative(process.cwd(), fileInfo.path);
        console.log(`[${index + 1}] ${relativePath} ${fileInfo.selected ? '(Đã chọn)' : ''}`);
    });
}

// Hàm chọn file
function selectFiles(fileInfoList) {
    return new Promise((resolve) => {
        displayFileList(fileInfoList);

        rl.question('Nhập số thứ tự của file cần chọn (cách nhau bởi dấu phẩy, ví dụ: 1,3,5): ', (answer) => {
            const selections = answer.split(',').map(num => parseInt(num.trim(), 10) - 1);

            // Cập nhật thuộc tính `selected` cho các file đã chọn
            selections.forEach(index => {
                if (index >= 0 && index < fileInfoList.length) {
                    fileInfoList[index].selected = true;
                }
            });

            rl.close();
            resolve();
        });
    });
}


module.exports = {selectFiles, displayFileList};