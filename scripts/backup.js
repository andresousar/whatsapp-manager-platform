#!/usr/bin/env node

/**
 * WhatsApp Manager Platform - Database Backup Script
 * 
 * This script creates automated backups of the database
 * and uploads them to cloud storage (S3, etc.)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configuration
const config = {
  databaseUrl: process.env.DATABASE_URL,
  backupDir: path.join(__dirname, '../backups/database'),
  s3Bucket: process.env.BACKUP_S3_BUCKET,
  retentionDays: 30,
  maxBackups: 10
};

// AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Create database backup
 */
async function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `whatsapp_backup_${timestamp}.sql`;
  const backupPath = path.join(config.backupDir, backupFileName);

  try {
    console.log('🔄 Creating database backup...');
    
    // Ensure backup directory exists
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true });
    }

    // Create backup using pg_dump
    const pgDumpCommand = `pg_dump "${config.databaseUrl}" > "${backupPath}"`;
    execSync(pgDumpCommand, { stdio: 'inherit' });

    console.log(`✅ Database backup created: ${backupFileName}`);
    
    // Compress backup
    const compressedPath = `${backupPath}.gz`;
    execSync(`gzip "${backupPath}"`);
    
    console.log(`📦 Backup compressed: ${backupFileName}.gz`);
    
    return compressedPath;
  } catch (error) {
    console.error('❌ Error creating database backup:', error.message);
    throw error;
  }
}

/**
 * Upload backup to S3
 */
async function uploadToS3(backupPath) {
  if (!config.s3Bucket) {
    console.log('⚠️  S3 bucket not configured, skipping upload');
    return;
  }

  try {
    console.log('☁️  Uploading backup to S3...');
    
    const fileName = path.basename(backupPath);
    const fileContent = fs.readFileSync(backupPath);
    
    const uploadParams = {
      Bucket: config.s3Bucket,
      Key: `database-backups/${fileName}`,
      Body: fileContent,
      ContentType: 'application/gzip',
      Metadata: {
        'backup-date': new Date().toISOString(),
        'backup-type': 'database',
        'project': 'whatsapp-manager-platform'
      }
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`✅ Backup uploaded to S3: ${fileName}`);
  } catch (error) {
    console.error('❌ Error uploading to S3:', error.message);
    throw error;
  }
}

/**
 * Clean old backups
 */
function cleanOldBackups() {
  try {
    console.log('🧹 Cleaning old backups...');
    
    if (!fs.existsSync(config.backupDir)) {
      return;
    }

    const files = fs.readdirSync(config.backupDir)
      .map(file => ({
        name: file,
        path: path.join(config.backupDir, file),
        stats: fs.statSync(path.join(config.backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);

    // Keep only the most recent backups
    const filesToDelete = files.slice(config.maxBackups);
    
    filesToDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Deleted old backup: ${file.name}`);
    });

    console.log(`✅ Cleanup completed. Kept ${Math.min(files.length, config.maxBackups)} backups`);
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error.message);
  }
}

/**
 * Create backup report
 */
function createBackupReport(backupPath) {
  const report = {
    timestamp: new Date().toISOString(),
    backupFile: path.basename(backupPath),
    backupSize: fs.statSync(backupPath).size,
    databaseUrl: config.databaseUrl ? 'configured' : 'not configured',
    s3Bucket: config.s3Bucket || 'not configured',
    status: 'success'
  };

  const reportPath = path.join(config.backupDir, 'backup_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📊 Backup report created');
  return report;
}

/**
 * Main backup function
 */
async function main() {
  console.log('🚀 Starting WhatsApp Manager Platform Backup...');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Validate configuration
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create backup
    const backupPath = await createDatabaseBackup();
    
    // Upload to S3
    await uploadToS3(backupPath);
    
    // Clean old backups
    cleanOldBackups();
    
    // Create report
    const report = createBackupReport(backupPath);
    
    console.log('🎉 Backup completed successfully!');
    console.log(`📁 Backup file: ${report.backupFile}`);
    console.log(`📏 Backup size: ${(report.backupSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('💥 Backup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createDatabaseBackup,
  uploadToS3,
  cleanOldBackups,
  createBackupReport
};
