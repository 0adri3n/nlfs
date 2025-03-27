const themeToggle = document.getElementById("themeToggle")
const body = document.body


const savedTheme = localStorage.getItem("theme")
if (savedTheme) {
  body.className = savedTheme
}

themeToggle.addEventListener("click", () => {
  if (body.classList.contains("dark-mode")) {
    body.classList.remove("dark-mode")
    body.classList.add("light-mode")
    localStorage.setItem("theme", "light-mode")
  } else {
    body.classList.remove("light-mode")
    body.classList.add("dark-mode")
    localStorage.setItem("theme", "dark-mode")
  }
})


function showToast(message) {
  const toast = document.getElementById("toast")
  toast.textContent = message
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}


const fileInput = document.getElementById("fileInput")
const uploadButton = document.getElementById("uploadButton")
const dropArea = document.getElementById("dropArea")


;["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false)
  document.body.addEventListener(eventName, preventDefaults, false)
})

function preventDefaults(e) {
  e.preventDefault()
  e.stopPropagation()
}

;["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, highlight, false)
})
;["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, unhighlight, false)
})

function highlight() {
  dropArea.classList.add("drag-over")
}

function unhighlight() {
  dropArea.classList.remove("drag-over")
}


dropArea.addEventListener("drop", handleDrop, false)

function handleDrop(e) {
  const dt = e.dataTransfer
  const files = dt.files

  if (files.length > 0) {
    fileInput.files = files
    const fileName = files[0].name
    showToast(`File "${fileName}" selected`)
  }
}


fileInput.addEventListener("change", () => {
  if (fileInput.files.length == 1) {
    const fileName = fileInput.files[0].name
    showToast(`File "${fileName}" selected.`)
  }
  else {
    showToast(`Files selected.`)
  }
})

uploadButton._clickHandler = uploadFile;


uploadButton.addEventListener("click", uploadButton._clickHandler);

async function uploadFile() {
  if (fileInput.files.length === 0) {
    showToast("Please select at least one file");
    return;
  }

  const formData = new FormData();

  // Add all selected files to the FormData
  for (let i = 0; i < fileInput.files.length; i++) {
    formData.append("files", fileInput.files[i]); // 'files' is the field expected on the server side
  }

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      showToast("Files uploaded successfully");
      fileInput.value = "";  // Reset the input
      loadFiles(); // Refresh the list of files
    } else {
      showToast("Error during the upload");
    }
  } catch (error) {
    showToast("Connection error");
    console.error("Upload error:", error);
  }
}


async function deleteFile(fileUuid, listItem) {
  try {
    console.log(fileUuid)
    const response = await fetch(`/delete?fileUuid=${fileUuid}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showToast("Fichier supprimé avec succès");
    } else {
      const errorData = await response.json();
      showToast(errorData.message || "Erreur lors de la suppression du fichier");
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier:", error);
    showToast("Erreur lors de la suppression du fichier");
  }
}



const searchInput = document.getElementById("searchInput")
const clearSearch = document.getElementById("clearSearch")
const noResults = document.getElementById("noResults")

searchInput.addEventListener("input", () => {
  filterFiles()
})

clearSearch.addEventListener("click", () => {
  searchInput.value = ""
  filterFiles()
})

function filterFiles() {
  const searchTerm = searchInput.value.toLowerCase()
  const fileItems = document.querySelectorAll("#fileList li")
  let hasResults = false

  fileItems.forEach((item) => {
    const fileName = item.querySelector(".file-name").textContent.toLowerCase()
    if (fileName.includes(searchTerm)) {
      item.style.display = "flex"
      hasResults = true
    } else {
      item.style.display = "none"
    }
  })

  const emptyState = document.getElementById("emptyState")

  if (fileItems.length === 0) {
    emptyState.style.display = "flex"
    noResults.style.display = "none"
  } else if (!hasResults) {
    emptyState.style.display = "none"
    noResults.style.display = "flex"
  } else {
    emptyState.style.display = "none"
    noResults.style.display = "none"
  }
}


function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}


function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}


async function loadFiles() {
  try {
    const response = await fetch("/files");
    const files = await response.json();

    const fileList = document.getElementById("fileList");
    const emptyState = document.getElementById("emptyState");
    
    fileList.innerHTML = "";

    if (files.length === 0) {
      emptyState.style.display = "flex";
      noResults.style.display = "none";
      return;
    }

    emptyState.style.display = "none";
    noResults.style.display = "none";

    files.forEach(file => {
      const li = document.createElement("li");
      
      const fileExtension = file.originalname.split(".").pop().toLowerCase();
      let iconPath = "";
      
      if (["jpg", "jpeg", "png", "gif", "svg"].includes(fileExtension)) {
        iconPath = '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
      } else if (["pdf", "doc", "docx", "txt"].includes(fileExtension)) {
        iconPath = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
      } else if (["mp3", "wav", "ogg"].includes(fileExtension)) {
        iconPath = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
      } else if (["mp4", "avi", "mov"].includes(fileExtension)) {
        iconPath = '<svg viewBox="0 0 24 24" width="24" height="24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>';
      } else {
        iconPath = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
      }
      
      const fileSize = formatFileSize(file.size || 0);
      
      li.innerHTML = `
        <div class="file-info">
          <span class="file-icon">${iconPath}</span>
          <div class="file-details">
            <span class="file-name">${file.originalname}</span>
            <div class="file-meta">
              <span>
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                ${fileExtension.toUpperCase()}
              </span>
              <span>
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                ${fileSize}
              </span>
            </div>
          </div>
        </div>
        <span class="file-uuid" data-id="${file.uuid}"></span>
        <a href="${file.path}" download class="download-button">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </a>
        <button class="delete-button" data-id="${file.filename}">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M6 18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"></path>
            <path d="M9 2v1h6V2H9z"></path>
            <path d="M3 6h18V5H3z"></path>
          </svg> Delete
        </button>
      `;
      
      const deleteButton = li.querySelector(".delete-button");
      deleteButton.addEventListener("click", async () => {
        await deleteFile(file.uuid);
      });

      fileList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading files:', error);
  }
}



function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}


if (isMobileDevice()) {
  const dropArea = document.getElementById("dropArea")
  dropArea.style.padding = "1rem"

  
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      uploadButton.focus()
    }
  })
}


async function loadQRCode() {
  try {
    const response = await fetch("/qrcode")
    const data = await response.json()

    if (data.qr) {
      document.getElementById("qrCode").src = data.qr
      document.getElementById("serverLink").text = data.url
    }
  } catch (error) {
    console.error("Error loading QR code:", error)
  }
}


setInterval(loadFiles, 5000)


window.onload = () => {
  loadQRCode()
  loadFiles()
}
