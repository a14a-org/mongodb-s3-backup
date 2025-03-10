/**
 * S3 upload utilities for MongoDB backups
 */

const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const { logger } = require('./utils');

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Uploads a file to an S3 bucket
 * 
 * @param {string} filePath - Path to the file to upload
 * @param {string} bucketName - Name of the S3 bucket
 * @param {string} s3Key - Object key in S3 (typically the filename)
 * @returns {Promise<object>} - S3 upload result
 */
async function uploadToS3(filePath, bucketName, s3Key) {
  try {
    logger.info(`Uploading ${filePath} to S3 bucket ${bucketName} with key ${s3Key}`);
    
    // Create readable stream from the file
    const fileStream = fs.createReadStream(filePath);
    
    // Set up the upload parameters
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileStream
    };
    
    // Upload to S3
    const command = new PutObjectCommand(uploadParams);
    const response = await s3Client.send(command);
    
    logger.info(`Upload completed successfully to s3://${bucketName}/${s3Key}`);
    return response;
  } catch (error) {
    logger.error('Error uploading to S3:', error);
    throw error;
  }
}

/**
 * Downloads a file from an S3 bucket
 * 
 * @param {string} bucketName - Name of the S3 bucket
 * @param {string} s3Key - Object key in S3
 * @param {string} destinationPath - Local path to save the file
 * @returns {Promise<string>} - Path to the downloaded file
 */
async function downloadFromS3(bucketName, s3Key, destinationPath) {
  try {
    logger.info(`Downloading s3://${bucketName}/${s3Key} to ${destinationPath}`);
    
    // Create write stream for the destination file
    const fileStream = fs.createWriteStream(destinationPath);
    
    // Set up the download parameters
    const downloadParams = {
      Bucket: bucketName,
      Key: s3Key
    };
    
    // Download from S3
    const { Body } = await s3Client.getObject(downloadParams);
    
    // Return a promise that resolves when the file is fully written
    return new Promise((resolve, reject) => {
      Body.pipe(fileStream)
        .on('error', err => {
          reject(err);
        })
        .on('close', () => {
          logger.info(`Download completed successfully to ${destinationPath}`);
          resolve(destinationPath);
        });
    });
  } catch (error) {
    logger.error('Error downloading from S3:', error);
    throw error;
  }
}

/**
 * Lists objects in an S3 bucket
 * 
 * @param {string} bucketName - Name of the S3 bucket
 * @param {string} [prefix=''] - Optional prefix to filter objects by
 * @returns {Promise<Array>} - Array of objects in the bucket
 */
async function listS3Objects(bucketName, prefix = '') {
  try {
    logger.info(`Listing objects in S3 bucket ${bucketName}${prefix ? ` with prefix ${prefix}` : ''}`);
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix
    });
    
    const { Contents = [] } = await s3Client.send(command);
    
    logger.info(`Found ${Contents.length} objects in bucket ${bucketName}`);
    return Contents;
  } catch (error) {
    logger.error('Error listing S3 objects:', error);
    throw error;
  }
}

/**
 * Deletes an object from an S3 bucket
 * 
 * @param {string} bucketName - Name of the S3 bucket
 * @param {string} s3Key - Object key in S3
 * @returns {Promise<object>} - S3 delete result
 */
async function deleteS3Object(bucketName, s3Key) {
  try {
    logger.info(`Deleting object s3://${bucketName}/${s3Key}`);
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });
    
    const response = await s3Client.send(command);
    
    logger.info(`Deleted object s3://${bucketName}/${s3Key} successfully`);
    return response;
  } catch (error) {
    logger.error('Error deleting S3 object:', error);
    throw error;
  }
}

module.exports = {
  uploadToS3,
  downloadFromS3,
  listS3Objects,
  deleteS3Object
}; 