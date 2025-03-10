/**
 * Compression utilities for MongoDB backups
 */

const tar = require('tar');
const fs = require('fs');
const path = require('path');
const { getBackupFilename, logger } = require('./utils');

/**
 * Compresses a directory containing MongoDB backup files into a tar.gz file
 * 
 * @param {string} backupDir - Path to the directory containing MongoDB backup files
 * @returns {Promise<string>} - Path to the compressed file
 */
async function compressBackup(backupDir) {
  try {
    // Get destination filename based on the backup directory name
    const dirName = path.basename(backupDir);
    const compressedFilePath = getBackupFilename(dirName);
    
    logger.info(`Compressing backup from ${backupDir} to ${compressedFilePath}`);
    
    // Create a tar.gz archive from the backup directory
    await tar.create(
      {
        gzip: true,
        file: compressedFilePath,
        cwd: path.dirname(backupDir)
      },
      [path.basename(backupDir)]
    );
    
    logger.info(`Compression completed: ${compressedFilePath}`);
    return compressedFilePath;
  } catch (error) {
    logger.error('Error compressing backup:', error);
    throw error;
  }
}

/**
 * Decompresses a tar.gz file to the specified directory
 * 
 * @param {string} compressedFilePath - Path to the compressed tar.gz file
 * @param {string} extractDir - Directory to extract files to
 * @returns {Promise<string>} - Path to the extracted directory
 */
async function decompressBackup(compressedFilePath, extractDir) {
  try {
    logger.info(`Decompressing ${compressedFilePath} to ${extractDir}`);
    
    // Ensure extract directory exists
    fs.mkdirSync(extractDir, { recursive: true });
    
    // Extract the archive
    await tar.extract({
      file: compressedFilePath,
      cwd: extractDir
    });
    
    logger.info(`Decompression completed to ${extractDir}`);
    return extractDir;
  } catch (error) {
    logger.error('Error decompressing backup:', error);
    throw error;
  }
}

module.exports = {
  compressBackup,
  decompressBackup
}; 