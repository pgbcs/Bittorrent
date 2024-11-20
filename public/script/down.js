const progressBar = document.getElementById('progress-bar');
const progressInfo = document.getElementById('progress-info');
const peerInfo = document.getElementById('peer-info');

// Dữ liệu ban đầu
let downloaded = 0; // MB đã tải
const totalSize = 80.0; // MB tổng
const dlSpeed = 1.68; // MB/s
const ulSpeed = 0; // KB/s
const peers = 1; // peers hiện tại

let isDownloading = true; // Cờ trạng thái tải

// Hàm cập nhật thanh tiến trình
function updateProgress() {
    if (!isDownloading) return; // Nếu không tải, dừng cập nhật

    // Tăng lượng tải dựa trên tốc độ tải
    downloaded += dlSpeed;

    // Đảm bảo không vượt quá tổng dung lượng
    if (downloaded > totalSize) {
    downloaded = totalSize;
    }

    // Tính toán phần trăm tiến trình
    const percent = (downloaded / totalSize) * 100;

    // Cập nhật thanh tiến trình và thông tin
    progressBar.style.width = `${percent}%`;
    progressInfo.textContent = `${downloaded.toFixed(2)} MB of ${totalSize} MB (${percent.toFixed(
    1
    )}%) - ${Math.max(0, ((totalSize - downloaded) / dlSpeed / 60).toFixed(1))} minutes remaining`;
    peerInfo.textContent = `Downloading from ${peers} of ${peers} peers - DL: ${dlSpeed} MB/s, UL: ${ulSpeed} KB/s`;

    // Dừng khi tải xong
    if (downloaded >= totalSize) {
    clearInterval(progressInterval);
    isDownloading = false; // Cập nhật trạng thái
    peerInfo.textContent = "Đã tải xong";
    }
}
// Cập nhật tiến trình mỗi giây
const progressInterval = setInterval(updateProgress,100);