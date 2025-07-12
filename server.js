const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Data file paths
const usersFile = path.join(__dirname, 'data', 'users.json');
const filesFile = path.join(__dirname, 'data', 'files.json');

// Ensure data directory exists
fs.ensureDirSync(path.join(__dirname, 'data'));

// Load data from JSON files
let users = [];
let files = [];

// Load users from JSON file
function loadUsers() {
    try {
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile, 'utf8');
            users = JSON.parse(data);
        } else {
            users = [];
            saveUsers();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        users = [];
    }
}

// Save users to JSON file
function saveUsers() {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

// Load files from JSON file
function loadFiles() {
    try {
        if (fs.existsSync(filesFile)) {
            const data = fs.readFileSync(filesFile, 'utf8');
            files = JSON.parse(data);
        } else {
            files = [];
            saveFiles();
        }
    } catch (error) {
        console.error('Error loading files:', error);
        files = [];
    }
}

// Save files to JSON file
function saveFiles() {
    try {
        fs.writeFileSync(filesFile, JSON.stringify(files, null, 2));
    } catch (error) {
        console.error('Error saving files:', error);
    }
}

// Initialize data
loadUsers();
loadFiles();

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// File storage configuration
const uploadDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Register user
app.post('/api/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

        // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
        id: uuidv4(),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
    };

    users.push(user);
    saveUsers();

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
app.post('/api/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

        // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload file
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { password, expiresIn } = req.body;
        
        // Validate required fields
        if (!password || password.trim() === '') {
            return res.status(400).json({ error: 'Password is required for file protection' });
        }
        
        if (!expiresIn || isNaN(expiresIn) || parseInt(expiresIn) <= 0) {
            return res.status(400).json({ error: 'Expiration time is required (minimum 1 hour)' });
        }
        
        if (parseInt(expiresIn) > 8760) {
            return res.status(400).json({ error: 'Expiration time cannot exceed 8760 hours (1 year)' });
        }
        
        const fileId = uuidv4();
        
        // Generate access token for file
        const fileAccessToken = crypto.randomBytes(32).toString('hex');
        
        const fileData = {
            id: fileId,
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadedBy: req.user.userId,
            uploadedAt: new Date(),
            password: bcrypt.hashSync(password, 10),
            accessToken: fileAccessToken,
            expiresAt: new Date(Date.now() + parseInt(expiresIn) * 1000),
            downloads: 0
        };

    files.push(fileData);
    saveFiles();

    res.json({
      message: 'File uploaded successfully',
      fileId,
      accessToken: fileAccessToken,
      downloadUrl: `/api/download/${fileId}`,
      shareUrl: `${req.protocol}://${req.get('host')}/share/${fileId}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Download file
app.get('/api/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { password, token } = req.query;

        const fileData = files.find(f => f.id === fileId);
    if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
    }

    // Check if file has expired
    if (fileData.expiresAt && new Date() > fileData.expiresAt) {
        files = files.filter(f => f.id !== fileId);
        saveFiles();
        return res.status(410).json({ error: 'File has expired' });
    }

        // Password is always required
    if (!password) {
        return res.status(401).json({ error: 'Password required' });
    }
    
    const isValidPassword = await bcrypt.compare(password, fileData.password);
    if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Check access token if provided
    if (token && token !== fileData.accessToken) {
      return res.status(403).json({ error: 'Invalid access token' });
    }

    // Increment download count
    fileData.downloads++;
    saveFiles();

    // Stream file
    res.download(fileData.path, fileData.originalName, (err) => {
      if (err) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// Get file info
app.get('/api/file/:fileId', (req, res) => {
  try {
        const { fileId } = req.params;
    const fileData = files.find(f => f.id === fileId);

    if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
    }

    // Check if file has expired
    if (fileData.expiresAt && new Date() > fileData.expiresAt) {
        files = files.filter(f => f.id !== fileId);
        saveFiles();
        return res.status(410).json({ error: 'File has expired' });
    }

        res.json({
        id: fileData.id,
        originalName: fileData.originalName,
        size: fileData.size,
        mimetype: fileData.mimetype,
        uploadedAt: fileData.uploadedAt,
        downloads: fileData.downloads,
        hasPassword: true, // All files now have passwords
        expiresAt: fileData.expiresAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's files
app.get('/api/files', authenticateToken, (req, res) => {
      try {
        const userFiles = files
            .filter(file => file.uploadedBy === req.user.userId)
            .map(file => ({
                id: file.id,
                originalName: file.originalName,
                size: file.size,
                uploadedAt: file.uploadedAt,
                downloads: file.downloads,
                expiresAt: file.expiresAt
            }));

        res.json(userFiles);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete file
app.delete('/api/file/:fileId', authenticateToken, async (req, res) => {
  try {
        const { fileId } = req.params;
    const fileData = files.find(f => f.id === fileId);

    if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
    }

    if (fileData.uploadedBy !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete file from filesystem
    await fs.remove(fileData.path);
    files = files.filter(f => f.id !== fileId);
    saveFiles();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Delete user account and all their files
app.delete('/api/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Remove user from users array
    users = users.filter(u => u.id !== userId);
    saveUsers();
    // Find and delete all files uploaded by this user
    const userFiles = files.filter(f => f.uploadedBy === userId);
    for (const file of userFiles) {
      try {
        await fs.remove(file.path);
      } catch (e) { /* ignore file not found */ }
    }
    files = files.filter(f => f.uploadedBy !== userId);
    saveFiles();
    res.json({ message: 'Account and all files deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// Serve share page
app.get('/share/:fileId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'share.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Secure File Sharing Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
}); 