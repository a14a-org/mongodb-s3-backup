#!/usr/bin/env node

/**
 * MongoDB S3 Backup
 * 
 * This script performs a backup of a MongoDB database and uploads it to S3.
 * It's designed to be run as a scheduled task (e.g., daily via cron/Coolify).
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execAsync = promisify(exec);
const mkdirAsync = promisify(fs.mkdir);
const config = require('../config');
const { compressBackup } = require('./compress');
const { uploadToS3 } = require('./s3-upload');
const { cleanupOldBackups } = require('./cleanup');
const { getTimestamp, getBackupDirectory, getBackupFilename, logger } = require('./utils');

// Ensure required environment variables are set
function validateEnvironment() {
  const requiredVars = [
    'MONGODB_URI',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'S3_BUCKET_NAME'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Create a MongoDB backup using mongodump
async function createMongoBackup(backupDir) {
  logger.info(`Creating MongoDB backup in ${backupDir}`);
  
  try {
    // Ensure backup directory exists
    await mkdirAsync(backupDir, { recursive: true });
    
    // Run mongodump command
    const command = `mongodump --uri="${process.env.MONGODB_URI}" --out="${backupDir}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('done dumping')) {
      throw new Error(`mongodump error: ${stderr}`);
    }
    
    logger.info('MongoDB backup completed successfully');
    return backupDir;
  } catch (error) {
    logger.error('Error creating MongoDB backup:', error);
    throw error;
  }
}

// Main backup process
async function runBackup() {
  try {
    // Load environment variables if not already loaded
    if (!process.env.MONGODB_URI) {
      require('dotenv').config();
    }
    
    validateEnvironment();
    
    const timestamp = getTimestamp();
    const backupDir = getBackupDirectory(timestamp);
    
    // Create MongoDB backup
    await createMongoBackup(backupDir);
    
    // Compress the backup
    const compressedBackupFile = await compressBackup(backupDir);
    
    // Upload to S3
    const s3Key = path.basename(compressedBackupFile);
    await uploadToS3(compressedBackupFile, process.env.S3_BUCKET_NAME, s3Key);
    
    // Clean up local files
    fs.rmSync(backupDir, { recursive: true, force: true });
    fs.unlinkSync(compressedBackupFile);
    
    // Clean up old backups from S3 based on retention policy
    await cleanupOldBackups(
      process.env.S3_BUCKET_NAME, 
      process.env.BACKUP_RETENTION_DAYS || config.backupRetentionDays
    );
    
    logger.info('Backup process completed successfully');
    return true;
  } catch (error) {
    logger.error('Backup process failed:', error);
    process.exit(1);
  }
}

// Run backup if this script is executed directly
if (require.main === module) {
  runBackup();
}

module.exports = { runBackup, createMongoBackup }; 