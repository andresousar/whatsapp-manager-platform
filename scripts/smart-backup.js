#!/usr/bin/env node

/**
 * WhatsApp Manager Platform - Smart Backup System
 * 
 * Sistema inteligente de backup que decide automaticamente
 * o que fazer baseado no tipo de mudança
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configuração
const config = {
  databaseUrl: process.env.DATABASE_URL,
  backupDir: path.join(__dirname, '../backups'),
  s3Bucket: process.env.BACKUP_S3_BUCKET,
  githubToken: process.env.GITHUB_TOKEN,
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
 * Determina o tipo de backup baseado nas mudanças
 */
function determineBackupType(trigger, changes) {
  console.log(`🔍 Analyzing changes for trigger: ${trigger}`);
  
  if (trigger === 'push') {
    // Verifica se houve mudanças no banco
    if (changes.includes('prisma') || changes.includes('database')) {
      return 'full';
    }
    // Verifica se houve mudanças críticas
    if (changes.includes('auth') || changes.includes('security')) {
      return 'full';
    }
    return 'incremental';
  }
  
  if (trigger === 'release') {
    return 'full';
  }
  
  if (trigger === 'schedule') {
    return 'database';
  }
  
  return 'full';
}

/**
 * Cria backup do banco de dados
 */
async function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `whatsapp_backup_${timestamp}.sql`;
  const backupPath = path.join(config.backupDir, 'database', backupFileName);

  try {
    console.log('🔄 Creating database backup...');
    
    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
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
 * Cria backup das configurações
 */
async function createConfigBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(config.backupDir, 'config');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log('🔄 Creating configuration backup...');
    
    const configFiles = [
      'apps/api/package.json',
      'apps/web/package.json',
      'apps/api/prisma/schema.prisma',
      '.github/workflows/ci.yml',
      '.github/workflows/backup.yml'
    ];

    const configBackup = {
      timestamp: new Date().toISOString(),
      files: {}
    };

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        configBackup.files[file] = fs.readFileSync(file, 'utf8');
      }
    }

    const backupPath = path.join(backupDir, `config_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(configBackup, null, 2));
    
    console.log(`✅ Configuration backup created: config_${timestamp}.json`);
    return backupPath;
  } catch (error) {
    console.error('❌ Error creating configuration backup:', error.message);
    throw error;
  }
}

/**
 * Cria backup do código (snapshot)
 */
async function createCodeBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(config.backupDir, 'code');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log('🔄 Creating code backup...');
    
    // Create a tarball of the current code
    const backupPath = path.join(backupDir, `code_${timestamp}.tar.gz`);
    execSync(`tar -czf "${backupPath}" --exclude=node_modules --exclude=.git --exclude=dist --exclude=build .`);
    
    console.log(`✅ Code backup created: code_${timestamp}.tar.gz`);
    return backupPath;
  } catch (error) {
    console.error('❌ Error creating code backup:', error.message);
    throw error;
  }
}

/**
 * Upload para S3
 */
async function uploadToS3(filePath, s3Key) {
  if (!config.s3Bucket) {
    console.log('⚠️  S3 bucket not configured, skipping upload');
    return;
  }

  try {
    console.log(`☁️  Uploading to S3: ${s3Key}...`);
    
    const fileContent = fs.readFileSync(filePath);
    
    const uploadParams = {
      Bucket: config.s3Bucket,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/gzip',
      Metadata: {
        'backup-date': new Date().toISOString(),
        'backup-type': path.basename(s3Key).split('_')[0],
        'project': 'whatsapp-manager-platform'
      }
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`✅ Uploaded to S3: ${s3Key}`);
  } catch (error) {
    console.error('❌ Error uploading to S3:', error.message);
    throw error;
  }
}

/**
 * Limpa backups antigos
 */
function cleanOldBackups() {
  try {
    console.log('🧹 Cleaning old backups...');
    
    const backupTypes = ['database', 'config', 'code'];
    
    for (const type of backupTypes) {
      const typeDir = path.join(config.backupDir, type);
      if (!fs.existsSync(typeDir)) continue;

      const files = fs.readdirSync(typeDir)
        .map(file => ({
          name: file,
          path: path.join(typeDir, file),
          stats: fs.statSync(path.join(typeDir, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      // Keep only the most recent backups
      const filesToDelete = files.slice(config.maxBackups);
      
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Deleted old backup: ${file.name}`);
      });
    }

    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error.message);
  }
}

/**
 * Cria relatório de backup
 */
function createBackupReport(backups, trigger, backupType) {
  const report = {
    timestamp: new Date().toISOString(),
    trigger: trigger,
    backupType: backupType,
    backups: backups.map(backup => ({
      type: path.basename(backup).split('_')[0],
      file: path.basename(backup),
      size: fs.statSync(backup).size
    })),
    status: 'success'
  };

  const reportPath = path.join(config.backupDir, 'backup_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📊 Backup report created');
  return report;
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const backupType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'full';
  const trigger = args.find(arg => arg.startsWith('--trigger='))?.split('=')[1] || 'manual';

  console.log('🚀 Starting Smart Backup System...');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔄 Trigger: ${trigger}`);
  console.log(`📦 Type: ${backupType}`);
  
  try {
    const backups = [];

    // Determina o que fazer baseado no tipo
    switch (backupType) {
      case 'full':
        console.log('🔄 Creating full backup...');
        backups.push(await createDatabaseBackup());
        backups.push(await createConfigBackup());
        backups.push(await createCodeBackup());
        break;
        
      case 'database':
        console.log('🔄 Creating database backup...');
        backups.push(await createDatabaseBackup());
        break;
        
      case 'config':
        console.log('🔄 Creating configuration backup...');
        backups.push(await createConfigBackup());
        break;
        
      case 'code':
        console.log('🔄 Creating code backup...');
        backups.push(await createCodeBackup());
        break;
        
      default:
        throw new Error(`Unknown backup type: ${backupType}`);
    }

    // Upload para S3
    for (const backup of backups) {
      const s3Key = `backups/${path.basename(backup)}`;
      await uploadToS3(backup, s3Key);
    }

    // Limpa backups antigos
    cleanOldBackups();
    
    // Cria relatório
    const report = createBackupReport(backups, trigger, backupType);
    
    console.log('🎉 Smart backup completed successfully!');
    console.log(`📁 Backups created: ${backups.length}`);
    console.log(`📏 Total size: ${(backups.reduce((sum, backup) => sum + fs.statSync(backup).size, 0) / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('💥 Smart backup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createDatabaseBackup,
  createConfigBackup,
  createCodeBackup,
  uploadToS3,
  cleanOldBackups
};
