let filesList = []

const handileFile = (files) => {

    const formatSize = (sizeInBytes) => {
        if (sizeInBytes >= 1024 * 1024) {
            return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
        } else if (sizeInBytes >= 1024) {
            return `${(sizeInBytes / 1024).toFixed(2)} KB`;
        } else {
            return `${sizeInBytes} Bytes`;
        }
    };
    
    const tableBody = document.getElementById("file-table");
    
    files.forEach((file,index) => {
        const row = document.createElement("tr");
        row.classList.add("hover:bg-gray-50");
    
        // File path
        const pathCell = document.createElement("td");
        pathCell.classList.add("px-4", "py-2", "border", "border-gray-300");
        pathCell.textContent = file.path.substring(file.path.lastIndexOf('/') + 1);
        row.appendChild(pathCell);
    
        // File size
        const sizeCell = document.createElement("td");
        sizeCell.classList.add("px-4", "py-2", "border", "border-gray-300", "text-right");
        sizeCell.textContent = formatSize(file.length);
        row.appendChild(sizeCell);
    
        // Selected checkbox
        const selectCell = document.createElement("td");
        selectCell.classList.add("px-4", "py-2", "border", "border-gray-300", "text-center");
    
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = file.selected;
        checkbox.classList.add("form-checkbox", "h-5", "w-5", "text-blue-600");
        checkbox.dataset.index = index; // Add index to checkbox for easy identification
        selectCell.appendChild(checkbox);
        
        checkbox.addEventListener("change", (e) => {
            files[e.target.dataset.index].selected = e.target.checked;
            // Check if all checkboxes are selected
            const allSelected = files.every((file) => file.selected);
            document.getElementById("select-all").checked = allSelected;
            console.log(files)
        });

        row.appendChild(selectCell);
    
        tableBody.appendChild(row);
    });
}


window.electronAPI.onMainMessage((event, data) => {
    filesList = data.fileInfoLst
    handileFile(filesList)
});

const buttonNext = document.getElementById("next")
buttonNext.addEventListener("click",() => {
    window.electronAPI.sendMessage(filesList);
})