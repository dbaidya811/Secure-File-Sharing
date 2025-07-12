const fs = require('fs-extra');
const path = require('path');

// Backup data from JSON files
async function backupData() {
    try {
        const backupDir = path.join(__dirname, 'backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}`);
        
        // Create backup directory
        await fs.ensureDir(backupPath);
        
        // Backup users
        const usersFile = path.join(__dirname, 'data', 'users.json');
        if (await fs.pathExists(usersFile)) {
            await fs.copy(usersFile, path.join(backupPath, 'users.json'));
            console.log('✅ Users backed up successfully');
        }
        
        // Backup files
        const filesFile = path.join(__dirname, 'data', 'files.json');
        if (await fs.pathExists(filesFile)) {
            await fs.copy(filesFile, path.join(backupPath, 'files.json'));
            console.log('✅ Files backed up successfully');
        }
        
        // Backup uploads directory
        const uploadsDir = path.join(__dirname, 'uploads');
        if (await fs.pathExists(uploadsDir)) {
            await fs.copy(uploadsDir, path.join(backupPath, 'uploads'));
            console.log('✅ Uploads directory backed up successfully');
        }
        
        console.log(`\n🎉 Backup completed successfully!`);
        console.log(`📁 Backup location: ${backupPath}`);
        
    } catch (error) {
        console.error('❌ Backup failed:', error);
    }
}

// Restore data from backup
async function restoreData(backupPath) {
    try {
        const dataDir = path.join(__dirname, 'data');
        const uploadsDir = path.join(__dirname, 'uploads');
        
        // Restore users
        const usersBackup = path.join(backupPath, 'users.json');
        if (await fs.pathExists(usersBackup)) {
            await fs.copy(usersBackup, path.join(dataDir, 'users.json'));
            console.log('✅ Users restored successfully');
        }
        
        // Restore files
        const filesBackup = path.join(backupPath, 'files.json');
        if (await fs.pathExists(filesBackup)) {
            await fs.copy(filesBackup, path.join(dataDir, 'files.json'));
            console.log('✅ Files restored successfully');
        }
        
        // Restore uploads directory
        const uploadsBackup = path.join(backupPath, 'uploads');
        if (await fs.pathExists(uploadsBackup)) {
            await fs.copy(uploadsBackup, uploadsDir);
            console.log('✅ Uploads directory restored successfully');
        }
        
        console.log('\n🎉 Restore completed successfully!');
        
    } catch (error) {
        console.error('❌ Restore failed:', error);
    }
}

// List available backups
async function listBackups() {
    try {
        const backupDir = path.join(__dirname, 'backups');
        if (await fs.pathExists(backupDir)) {
            const backups = await fs.readdir(backupDir);
            if (backups.length === 0) {
                console.log('No backups found.');
                return;
            }
            
            console.log('Available backups:');
            backups.forEach(backup => {
                console.log(`📁 ${backup}`);
            });
        } else {
            console.log('No backups directory found.');
        }
    } catch (error) {
        console.error('Error listing backups:', error);
    }
}

// Main function
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'backup':
            await backupData();
            break;
        case 'restore':
            const backupPath = process.argv[3];
            if (!backupPath) {
                console.log('Usage: node backup.js restore <backup-path>');
                return;
            }
            await restoreData(backupPath);
            break;
        case 'list':
            await listBackups();
            break;
        default:
            console.log('Secure File Sharing - Data Management');
            console.log('\nUsage:');
            console.log('  node backup.js backup     - Create a new backup');
            console.log('  node backup.js restore <path> - Restore from backup');
            console.log('  node backup.js list       - List available backups');
    }
}

main(); 