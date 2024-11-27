const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');

window.electronAPI.onLoginStatus((status) => {
    if (status.success) {
        console.log(status)
      // Hiển thị thông báo nếu đăng nhập thất bại
      notificationMessage.textContent = status.message;
      notification.classList.remove('hidden');
      // Ẩn thông báo sau 3 giây
      setTimeout(() => {
        notification.classList.add('hidden');
      }, 3000);
    }
});


document.getElementById('select-file').addEventListener('click', async () => {
    const result = await window.electronAPI.selectFile();
});

document.getElementById('seeder').addEventListener('click', async () => {
  const result = await window.electronAPI.seeder();
  console.log(result)
});