
window.electronAPI.progress((event, data) => {
    const tableBody = document.querySelector("tbody");

    Object.keys(data).forEach((path) => {
        const downloaded = data[path];

       
        const row = Array.from(tableBody.querySelectorAll("tr")).find(
            (tr) => {
                const pathOfRow =  tr.querySelector("td").getAttribute("value")
                return pathOfRow === path
            }
        );

        if (!row) {
            return;
        }

        
        const length = parseFloat(row.children[2].getAttribute("value"));

        const percent = Math.min((downloaded / length) * 100, 100); 

        const progressBar = row.querySelector(".bg-blue-600");
        const progressText = row.querySelector(".bg-blue-600 span");

        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent.toFixed(1)}%`;

        if (percent === 100) {
            row.children[4].textContent = "Completed"; 
        }
    });
});



function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
}

window.electronAPI.onMainMessage((event, data) => {
    console.log(data)
    const tableBody = document.querySelector("tbody");
    data.forEach((file, index) => {
        if(!file.selected){
            return;
        }
        const name = file.path.substring(file.path.lastIndexOf("\\") + 1);
        
        const number = index + 1;
        const size = formatBytes(file.length);
        const done = `<div class="relative w-full">
                        <div class="relative bg-gray-200 rounded-full h-6">
                            <div
                                class="absolute top-0 left-0 h-6 bg-blue-600 rounded-full text-white text-center"
                                style="width: 0%;"
                            >
                            <span>0%</span>
                            </div>
                        </div>
                      </div>`;
        const status = "Downloading";
        const downloadingFrom = "-";
        const downSpeed = "-";
    
        const row = `
            <tr>
                <td class="border border-gray-300 px-4 py-2" value="${file.path}" >${name}</td>
                <td class="border border-gray-300 px-4 py-2">${number}</td>
                <td class="border border-gray-300 px-4 py-2" value=${file.length}>${size}</td>
                <td class="border border-gray-300 py-2">${done}</td>
                <td class="border border-gray-300 px-4 py-2">${status}</td>
                <td class="border border-gray-300 px-4 py-2">${downloadingFrom}</td>
                <td class="border border-gray-300 px-4 py-2">${downSpeed}</td>
            </tr>
        `;
    
        tableBody.innerHTML += row;
})
})




