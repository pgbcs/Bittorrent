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
    const selectAllCheckbox = document.getElementById("select-all");

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
        });

        row.appendChild(selectCell);
    
        tableBody.appendChild(row);
    });
    

    selectAllCheckbox.addEventListener("change", (e) => {        
        const isChecked = e.target.checked;
        files.forEach((file, index) => {
            file.selected = isChecked;
            const checkbox = document.querySelector(`input[data-index="${index}"]`);
            checkbox.checked = isChecked;
        });
    })
}

window.electronAPI.onMainMessage((event, data) => {
    filesList = data.fileInfoLst
    console.log(filesList)
    handileFile(filesList)
});

const buttonNext = document.getElementById("next")
if(buttonNext){
    buttonNext.addEventListener("click",() => {
        window.electronAPI.sendMessage(filesList);
    })
}


window.electronAPI.progress((event, data) => {
    console.log(data)
});

const buttonNext2 = document.getElementById("next2")
if(buttonNext2){
    buttonNext2.addEventListener("click",() => {
        window.electronAPI.sendMessage2(filesList);
    })
}

