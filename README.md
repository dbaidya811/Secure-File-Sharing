# Secure File Sharing Web App

A modern, secure file sharing web application built with Node.js, Express, and vanilla JavaScript. This application provides a secure way to upload, share, and download files with password protection and expiration features.

## 🚀 Features

### Security Features
- **JWT Authentication**: Secure user authentication with JSON Web Tokens
- **Password Protection**: Optional password protection for shared files
- **File Expiration**: Set automatic expiration times for files
- **Rate Limiting**: Protection against abuse with request rate limiting
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Protection**: Configurable Cross-Origin Resource Sharing
- **Helmet Security**: HTTP headers security with Helmet middleware

### File Management
- **Drag & Drop Upload**: Modern drag and drop file upload interface
- **Multiple File Types**: Support for images, documents, PDFs, and more
- **File Size Limits**: Configurable file size limits (default: 50MB)
- **Download Tracking**: Track number of downloads for each file
- **File Metadata**: Display file size, upload date, and download count

### User Interface
- **Modern Design**: Beautiful, responsive UI with gradient backgrounds
- **Real-time Notifications**: Toast notifications for user feedback
- **Loading States**: Visual feedback during operations
- **Mobile Responsive**: Works perfectly on all device sizes
- **Dark Mode Ready**: CSS prepared for dark mode implementation

## 📋 Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- Modern web browser

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-file-sharing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 🚀 Usage

### For Users

1. **Registration/Login**
   - Create a new account or log in with existing credentials
   - All passwords are securely hashed using bcrypt

2. **Upload Files**
   - Drag and drop files or click to select
   - Optionally set a password for file protection
   - Set expiration time (in hours) if needed
   - Click "Upload File" to complete

3. **Share Files**
   - After upload, copy the share URL
   - Share the URL with others
   - Recipients can download with or without password

4. **Manage Files**
   - View all uploaded files in your dashboard
   - Delete files you no longer need
   - Track download statistics

### For Recipients

1. **Access Shared File**
   - Click on the shared URL
   - View file information (size, upload date, etc.)

2. **Download File**
   - If password protected, enter the password
   - Click "Download File" to start download
   - File will download with original filename

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | JWT signing secret | Required |
| `ALLOWED_ORIGINS` | CORS allowed origins | http://localhost:3000 |
| `MAX_FILE_SIZE` | Maximum file size in bytes | 52428800 (50MB) |

### File Types Supported

- Images: JPEG, PNG, GIF
- Documents: PDF, TXT, DOC, DOCX
- Spreadsheets: XLS, XLSX
- And more configurable types

## 🏗️ Project Structure

```
secure-file-sharing/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── env.example           # Environment variables template
├── README.md             # This file
├── backup.js             # Data backup and restore utility
├── data/                 # JSON data storage
│   ├── users.json        # User accounts data
│   └── files.json        # File metadata storage
├── public/               # Frontend files
│   ├── index.html        # Main application page
│   ├── share.html        # File download page
│   ├── styles.css        # Application styles
│   ├── app.js           # Main application logic
│   └── share.js         # Share page logic
├── uploads/              # File storage directory (auto-created)
└── backups/              # Backup directory (auto-created)
```

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Token expiration (24 hours)
- Protected API endpoints

### File Security
- Secure file naming with UUIDs
- File type validation
- Size limits enforcement
- Optional password protection
- Automatic file expiration

### Server Security
- Helmet.js for HTTP headers
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Input validation and sanitization
- Error handling without information leakage

## 💾 Data Storage

### JSON File Storage
The application uses JSON files for persistent data storage:
- **Users**: `data/users.json` - User accounts and authentication data
- **Files**: `data/files.json` - File metadata and sharing information
- **Uploads**: `uploads/` - Actual file storage directory

### Data Backup & Restore
```bash
# Create a backup
npm run backup

# List available backups
npm run backup:list

# Restore from backup
npm run backup:restore <backup-path>
```

### Data Management
- **Automatic Loading**: Data is loaded from JSON files on server start
- **Persistent Storage**: All changes are saved immediately to JSON files
- **Backup System**: Automated backup of users, files, and uploads
- **Data Integrity**: Error handling for corrupted JSON files

## 🚀 Production Deployment

### Environment Setup
1. Set strong JWT secret
2. Configure proper CORS origins
3. Set up database (MongoDB/PostgreSQL recommended for production)
4. Configure file storage (AWS S3 recommended)
5. Set up SSL/TLS certificates
6. Configure regular backups

### Recommended Production Stack
- **Database**: MongoDB or PostgreSQL
- **File Storage**: AWS S3 or similar
- **Session Storage**: Redis
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2
- **SSL**: Let's Encrypt

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📝 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### File Management
- `POST /api/upload` - Upload file (authenticated)
- `GET /api/download/:fileId` - Download file
- `GET /api/file/:fileId` - Get file information
- `GET /api/files` - Get user's files (authenticated)
- `DELETE /api/file/:fileId` - Delete file (authenticated)

### Health Check
- `GET /api/health` - Server health status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the existing issues
2. Create a new issue with detailed information
3. Include your environment details and error messages

## 🔮 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Cloud storage integration (AWS S3, Google Cloud)
- [ ] Email notifications
- [ ] File preview functionality
- [ ] Bulk file operations
- [ ] Advanced analytics
- [ ] API rate limiting per user
- [ ] File encryption at rest
- [ ] Multi-language support
- [ ] Progressive Web App (PWA) features

## 🙏 Acknowledgments

- Express.js for the web framework
- Multer for file upload handling
- bcryptjs for password hashing
- Font Awesome for icons
- Modern CSS for beautiful styling 