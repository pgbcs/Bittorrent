const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');

const form = document.getElementById('loginForm');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Gửi dữ liệu qua IPC
    // window.electronAPI.sendFormData(email, password);
    window.electronAPI.sendFormData(email, password);
});

window.electronAPI.onLoginStatus((status) => {
    if (!status.success) {
        // console.log(status)
      // Hiển thị thông báo nếu đăng nhập thất bại
      notificationMessage.textContent = status.message;
      notification.classList.remove('hidden');
      // Ẩn thông báo sau 3 giây
      setTimeout(() => {
        notification.classList.add('hidden');
      }, 3000);
    }
  });


  document.getElementById('exitButton').addEventListener('click', () => {
    // Gửi thông điệp tới main process để đóng ứng dụng
    window.electronAPI.exitApp();
});