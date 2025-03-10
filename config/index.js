/**
 * Default configuration for MongoDB S3 Backup
 * 
 * These defaults can be overridden by environment variables.
 */

module.exports = {
  // Backup settings
  backupRetentionDays: 7,          // Number of days to keep backups (can be overridden with BACKUP_RETENTION_DAYS)
  backupPrefix: 'mongodb_backup_', // Prefix for backup files
  
  // Temporary directory settings
  tempDir: process.env.TEMP_DIR || null, // Use system temp dir by default
  
  // MongoDB settings (these should be set via environment variables)
  mongodbUri: process.env.MONGODB_URI,
  
  // AWS S3 settings (these should be set via environment variables)
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  s3BucketName: process.env.S3_BUCKET_NAME,
  
  // Logging settings
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'mongodb-backup.log'
}; 