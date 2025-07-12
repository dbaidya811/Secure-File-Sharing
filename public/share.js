// DOM elements
const fileDetails = document.getElementById('fileDetails');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileUploaded = document.getElementById('fileUploaded');
const fileDownloads = document.getElementById('fileDownloads');
const fileExpires = document.getElementById('fileExpires');
const fileExpiresDate = document.getElementById('fileExpiresDate');
const downloadForm = document.getElementById('downloadForm');
const passwordForm = document.getElementById('passwordForm');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingOverlay = document.getElementById('loadingOverlay');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const notificationClose = document.getElementById('notificationClose');

// Get file ID from URL
const urlParams = new URLSearchParams(window.location.search);
const pathSegments = window.location.pathname.split('/');
const fileId = pathSegments[pathSegments.length - 1];

// API base URL
const API_BASE = window.location.origin;

// Utility functions
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

function hideNotification() {
    notification.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    downloadForm.classList.add('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
    downloadForm.classList.remove('hidden');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
}

// Load file information
async function loadFileInfo() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/api/file/${fileId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load file information');
        }
        
        // Display file information
        fileName.textContent = data.originalName;
        fileSize.textContent = formatFileSize(data.size);
        fileUploaded.textContent = formatDate(data.uploadedAt);
        fileDownloads.textContent = data.downloads;
        
        fileExpiresDate.textContent = formatDate(data.expiresAt);
        
        fileDetails.classList.remove('hidden');
        
        // All files now require password protection
        downloadForm.innerHTML = `
            <h3>Enter Password to Download</h3>
            <p style="color: #00d4ff; margin-bottom: 20px;">
                <i class="fas fa-shield-alt"></i> This file is password protected for security
            </p>
            <form id="passwordForm">
                <div class="form-group">
                    <label for="password">Password <span style="color: #ff6b6b;">*</span></label>
                    <input type="password" id="password" placeholder="Enter the file password" required>
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-download"></i> Download File
                </button>
            </form>
        `;
        // Attach event listener to the new form
        const newPasswordForm = document.getElementById('passwordForm');
        const newPasswordInput = document.getElementById('password');
        if (newPasswordForm) {
            newPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = newPasswordInput.value;
                if (!password) {
                    showNotification('Please enter a password', 'error');
                    return;
                }
                await downloadFile(password);
            });
        }
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Download file
async function downloadFile(password = '') {
    try {
        showLoading();
        
        let downloadUrl = `${API_BASE}/api/download/${fileId}`;
        const params = new URLSearchParams();
        
        if (password) {
            params.append('password', password);
        }
        
        if (params.toString()) {
            downloadUrl += '?' + params.toString();
        }
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Download started successfully!');
        
    } catch (error) {
        showNotification('Download failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Handle password form submission
passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = passwordInput.value;
    if (!password) {
        showNotification('Please enter a password', 'error');
        return;
    }
    
    await downloadFile(password);
});

// Handle notification close
notificationClose.addEventListener('click', hideNotification);

// Initialize page
async function initPage() {
    if (!fileId) {
        showError('Invalid file ID');
        return;
    }
    
    await loadFileInfo();
}

// Start the page
document.addEventListener('DOMContentLoaded', initPage); 