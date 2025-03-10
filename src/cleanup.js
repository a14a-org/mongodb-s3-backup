/**
 * Cleanup utilities for managing MongoDB backup retention
 */

const { listS3Objects, deleteS3Object } = require('./s3-upload');
const { logger } = require('./utils');

/**
 * Cleans up old backups based on retention policy
 * 
 * @param {string} bucketName - Name of the S3 bucket
 * @param {number} retentionDays - Number of days to keep backups
 * @returns {Promise<Array>} - Array of deleted object keys
 */
async function cleanupOldBackups(bucketName, retentionDays = 7) {
  try {
    logger.info(`Starting cleanup of backups older than ${retentionDays} days in bucket ${bucketName}`);
    
    // Calculate cutoff date (retentionDays ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Get all objects in the bucket
    const objects = await listS3Objects(bucketName);
    
    // Filter objects older than the retention period
    const oldObjects = objects.filter(obj => {
      return new Date(obj.LastModified) < cutoffDate;
    });
    
    if (oldObjects.length === 0) {
      logger.info('No backups found that exceed the retention period');
      return [];
    }
    
    logger.info(`Found ${oldObjects.length} backups older than ${retentionDays} days to clean up`);
    
    // Delete each old object
    const deletedKeys = [];
    for (const obj of oldObjects) {
      await deleteS3Object(bucketName, obj.Key);
      deletedKeys.push(obj.Key);
    }
    
    logger.info(`Cleanup completed, deleted ${deletedKeys.length} old backups`);
    return deletedKeys;
  } catch (error) {
    logger.error('Error cleaning up old backups:', error);
    throw error;
  }
}

module.exports = {
  cleanupOldBackups
}; 