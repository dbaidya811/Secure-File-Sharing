// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// DOM elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const dashboard = document.getElementById('dashboard');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const filesList = document.getElementById('filesList');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const loadingOverlay = document.getElementById('loadingOverlay');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const notificationClose = document.getElementById('notificationClose');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');

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

// API functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// Authentication functions
async function login(email, password) {
    try {
        const data = await apiRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showNotification('Login successful!');
        showDashboard();
        loadUserFiles();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function register(username, email, password) {
    try {
        const data = await apiRequest('/api/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showNotification('Registration successful!');
        showDashboard();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    showLoginForm();
    showNotification('Logged out successfully');
}

// UI functions
function showLoginForm() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    dashboard.classList.add('hidden');
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
}

function showRegisterForm() {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    dashboard.classList.add('hidden');
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
}

function showDashboard() {
    dashboard.classList.remove('hidden');
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    
    if (currentUser) {
        userName.textContent = currentUser.username;
    }
}

// File management functions
async function uploadFile(file, password, expiresIn) {
    try {
        showLoading();
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('password', password);
        formData.append('expiresIn', expiresIn);
        
        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }
        
        showNotification('File uploaded successfully!');
        loadUserFiles();
        uploadForm.reset();
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadUserFiles() {
    try {
        const files = await apiRequest('/api/files');
        displayFiles(files);
    } catch (error) {
        showNotification('Failed to load files', 'error');
    }
}

function displayFiles(files) {
    filesList.innerHTML = '';
    
    if (files.length === 0) {
        filesList.innerHTML = '<p style="text-align: center; color: #666;">No files uploaded yet.</p>';
        return;
    }
    
    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const shareUrl = `${window.location.origin}/share/${file.id}`;
        
        fileItem.innerHTML = `
            <div class="file-header">
                <div class="file-info">
                    <h4>${file.originalName}</h4>
                    <div class="file-meta">
                        Size: ${formatFileSize(file.size)} | 
                        Uploaded: ${formatDate(file.uploadedAt)} | 
                        Downloads: ${file.downloads} | 
                        Expires: ${formatDate(file.expiresAt)}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-success btn-sm share-btn" data-url="${shareUrl}">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${file.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div class="file-url">
                <strong>Share URL:</strong> ${shareUrl}
                <br><small style="color: #00d4ff;">🔒 Password Protected | ⏰ Auto-Expires</small>
            </div>
        `;
        
        filesList.appendChild(fileItem);
    });

    // Attach event listeners for share and delete buttons
    filesList.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            copyToClipboard(this.getAttribute('data-url'));
        });
    });
    filesList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteFile(this.getAttribute('data-id'));
        });
    });
}

async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }
    
    try {
        await apiRequest(`/api/file/${fileId}`, {
            method: 'DELETE'
        });
        
        showNotification('File deleted successfully');
        loadUserFiles();
    } catch (error) {
        console.error('Delete error:', error);
        showNotification(error.message, 'error');
    }
}

async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This will remove all your files and cannot be undone.')) {
        return;
    }
    try {
        showLoading();
        await apiRequest('/api/account', { method: 'DELETE' });
        showNotification('Account deleted successfully!');
        logout();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Share URL copied to clipboard!');
    }).catch((err) => {
        console.error('Clipboard error:', err);
        showNotification('Failed to copy URL', 'error');
    });
}

// Event listeners
loginBtn.addEventListener('click', showLoginForm);
registerBtn.addEventListener('click', showRegisterForm);

loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await login(email, password);
});

registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    await register(username, email, password);
});

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const file = fileInput.files[0];
    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }
    
    const password = document.getElementById('filePassword').value;
    const expiresIn = document.getElementById('expiresIn').value;
    
    // Validate required fields
    if (!password || password.trim() === '') {
        showNotification('Password is required for file protection', 'error');
        return;
    }
    
    if (!expiresIn || expiresIn <= 0) {
        showNotification('Expiration time is required (minimum 1 hour)', 'error');
        return;
    }
    
    if (expiresIn > 8760) {
        showNotification('Expiration time cannot exceed 8760 hours (1 year)', 'error');
        return;
    }
    
    await uploadFile(file, password, expiresIn);
});

logoutBtn.addEventListener('click', logout);
notificationClose.addEventListener('click', hideNotification);

if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', deleteAccount);
}

// File input drag and drop
const fileInputLabel = document.querySelector('.file-input-label');

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileInputLabel.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name}</span>
        `;
    }
});

// Drag and drop functionality
fileInputLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileInputLabel.style.borderColor = '#764ba2';
    fileInputLabel.style.background = '#f8f9ff';
});

fileInputLabel.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileInputLabel.style.borderColor = '#667eea';
    fileInputLabel.style.background = 'white';
});

fileInputLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    fileInputLabel.style.borderColor = '#667eea';
    fileInputLabel.style.background = 'white';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        fileInputLabel.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${files[0].name}</span>
        `;
    }
});

// Initialize app
function initApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (authToken && savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
        loadUserFiles();
    } else {
        showLoginForm();
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', initApp); 