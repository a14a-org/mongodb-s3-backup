/**
 * Utility functions for MongoDB S3 backup
 */

const path = require('path');
const os = require('os');
const fs = require('fs');
const winston = require('winston');
const config = require('../config');

// Set up logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'mongodb-backup.log' })
  ]
});

/**
 * Gets a timestamp string in format YYYYMMDD_HHMMSS
 * 
 * @returns {string} - Formatted timestamp
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/[-:]/g, '')     // Remove dashes and colons
    .replace(/\.\d+Z$/, '')   // Remove milliseconds and Z
    .replace('T', '_');       // Replace T with underscore
}

/**
 * Gets the path to a backup directory for a given timestamp
 * 
 * @param {string} timestamp - Timestamp to use in directory name
 * @returns {string} - Path to backup directory
 */
function getBackupDirectory(timestamp) {
  const backupDir = process.env.BACKUP_DIR || path.join(os.tmpdir(), 'mongodb-backups');
  
  // Ensure backup base directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  return path.join(backupDir, `mongodb_backup_${timestamp}`);
}

/**
 * Gets the filename for a compressed backup
 * 
 * @param {string} dirName - Name of the backup directory
 * @returns {string} - Path to compressed backup file
 */
function getBackupFilename(dirName) {
  const backupDir = process.env.BACKUP_DIR || path.join(os.tmpdir(), 'mongodb-backups');
  return path.join(backupDir, `${dirName}.tar.gz`);
}

/**
 * Gets the S3 key (object name) for a backup file
 * 
 * @param {string} filename - Local filename
 * @returns {string} - S3 key
 */
function getS3Key(filename) {
  return path.basename(filename);
}

/**
 * Parses a timestamp from a backup filename
 * 
 * @param {string} filename - Backup filename
 * @returns {Date|null} - Date object from timestamp or null if not parseable
 */
function parseTimestampFromFilename(filename) {
  // Extract timestamp from format mongodb_backup_YYYYMMDD_HHMMSS.tar.gz
  const match = path.basename(filename).match(/mongodb_backup_(\d{8}_\d{6})/);
  
  if (!match) return null;
  
  const timestamp = match[1];
  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  const hour = timestamp.substring(9, 11);
  const minute = timestamp.substring(11, 13);
  const second = timestamp.substring(13, 15);
  
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}

module.exports = {
  logger,
  getTimestamp,
  getBackupDirectory,
  getBackupFilename,
  getS3Key,
  parseTimestampFromFilename
}; 