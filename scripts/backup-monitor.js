#!/usr/bin/env node

/**
 * WhatsApp Manager Platform - Backup Monitor
 * 
 * Monitora o status dos backups e envia alertas
 */

const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Configuração
const config = {
  s3Bucket: process.env.BACKUP_S3_BUCKET,
  backupDir: path.join(__dirname, '../backups'),
  alertThreshold: 24 * 60 * 60 * 1000, // 24 horas em ms
  maxBackupAge: 7 * 24 * 60 * 60 * 1000 // 7 dias em ms
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
 * Verifica status dos backups locais
 */
function checkLocalBackups() {
  console.log('🔍 Checking local backups...');
  
  const backupTypes = ['database', 'config', 'code'];
  const status = {
    local: {},
    total: 0,
    oldest: null,
    newest: null
  };

  for (const type of backupTypes) {
    const typeDir = path.join(config.backupDir, type);
    if (!fs.existsSync(typeDir)) {
      status.local[type] = { count: 0, files: [] };
      continue;
    }

    const files = fs.readdirSync(typeDir)
      .map(file => {
        const filePath = path.join(typeDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          mtime: stats.mtime,
          age: Date.now() - stats.mtime.getTime()
        };
      })
      .sort((a, b) => b.mtime - a.mtime);

    status.local[type] = {
      count: files.length,
      files: files,
      newest: files[0]?.mtime || null,
      oldest: files[files.length - 1]?.mtime || null
    };

    status.total += files.length;

    // Atualiza oldest e newest globais
    if (files.length > 0) {
      if (!status.oldest || files[files.length - 1].mtime < status.oldest) {
        status.oldest = files[files.length - 1].mtime;
      }
      if (!status.newest || files[0].mtime > status.newest) {
        status.newest = files[0].mtime;
      }
    }
  }

  return status;
}

/**
 * Verifica status dos backups no S3
 */
async function checkS3Backups() {
  console.log('🔍 Checking S3 backups...');
  
  if (!config.s3Bucket) {
    console.log('⚠️  S3 bucket not configured');
    return { count: 0, files: [] };
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: config.s3Bucket,
      Prefix: 'backups/'
    });

    const response = await s3Client.send(command);
    const files = response.Contents || [];

    const backupFiles = files
      .map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        age: Date.now() - file.LastModified.getTime()
      }))
      .sort((a, b) => b.lastModified - a.lastModified);

    return {
      count: backupFiles.length,
      files: backupFiles,
      newest: backupFiles[0]?.lastModified || null,
      oldest: backupFiles[backupFiles.length - 1]?.lastModified || null
    };
  } catch (error) {
    console.error('❌ Error checking S3 backups:', error.message);
    return { count: 0, files: [], error: error.message };
  }
}

/**
 * Verifica se há alertas necessários
 */
function checkAlerts(localStatus, s3Status) {
  const alerts = [];

  // Verifica se o backup mais recente é muito antigo
  const newestBackup = localStatus.newest || s3Status.newest;
  if (newestBackup) {
    const age = Date.now() - newestBackup.getTime();
    if (age > config.alertThreshold) {
      alerts.push({
        type: 'warning',
        message: `Backup mais recente é de ${Math.round(age / (60 * 60 * 1000))} horas atrás`,
        severity: 'high'
      });
    }
  } else {
    alerts.push({
      type: 'error',
      message: 'Nenhum backup encontrado',
      severity: 'critical'
    });
  }

  // Verifica se há backups muito antigos
  const oldestBackup = localStatus.oldest || s3Status.oldest;
  if (oldestBackup) {
    const age = Date.now() - oldestBackup.getTime();
    if (age > config.maxBackupAge) {
      alerts.push({
        type: 'info',
        message: `Backup mais antigo é de ${Math.round(age / (24 * 60 * 60 * 1000))} dias atrás`,
        severity: 'low'
      });
    }
  }

  // Verifica se há poucos backups
  const totalBackups = localStatus.total + s3Status.count;
  if (totalBackups < 3) {
    alerts.push({
      type: 'warning',
      message: `Apenas ${totalBackups} backups encontrados`,
      severity: 'medium'
    });
  }

  return alerts;
}

/**
 * Gera relatório de status
 */
function generateStatusReport(localStatus, s3Status, alerts) {
  const report = {
    timestamp: new Date().toISOString(),
    status: alerts.length === 0 ? 'healthy' : 'warning',
    local: {
      total: localStatus.total,
      types: Object.keys(localStatus.local).reduce((acc, type) => {
        acc[type] = localStatus.local[type].count;
        return acc;
      }, {})
    },
    s3: {
      total: s3Status.count,
      error: s3Status.error || null
    },
    alerts: alerts,
    summary: {
      newestBackup: localStatus.newest || s3Status.newest,
      oldestBackup: localStatus.oldest || s3Status.oldest,
      totalBackups: localStatus.total + s3Status.count
    }
  };

  return report;
}

/**
 * Salva relatório de status
 */
function saveStatusReport(report) {
  const reportPath = path.join(config.backupDir, 'status_report.json');
  
  // Ensure backup directory exists
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Status report saved: ${reportPath}`);
}

/**
 * Função principal
 */
async function main() {
  console.log('🔍 Starting backup monitoring...');
  
  try {
    // Verifica backups locais
    const localStatus = checkLocalBackups();
    
    // Verifica backups no S3
    const s3Status = await checkS3Backups();
    
    // Verifica alertas
    const alerts = checkAlerts(localStatus, s3Status);
    
    // Gera relatório
    const report = generateStatusReport(localStatus, s3Status, alerts);
    
    // Salva relatório
    saveStatusReport(report);
    
    // Exibe resumo
    console.log('\n📊 Backup Status Summary:');
    console.log(`   Local backups: ${localStatus.total}`);
    console.log(`   S3 backups: ${s3Status.count}`);
    console.log(`   Total: ${report.summary.totalBackups}`);
    console.log(`   Status: ${report.status.toUpperCase()}`);
    
    if (alerts.length > 0) {
      console.log('\n🚨 Alerts:');
      alerts.forEach(alert => {
        const icon = alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} ${alert.message}`);
      });
    } else {
      console.log('\n✅ All systems healthy!');
    }
    
    // Exit com código de erro se houver alertas críticos
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    if (criticalAlerts.length > 0) {
      console.log('\n💥 Critical alerts found!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Backup monitoring failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkLocalBackups,
  checkS3Backups,
  checkAlerts,
  generateStatusReport
};
