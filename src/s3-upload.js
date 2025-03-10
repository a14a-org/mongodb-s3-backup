/**
 * S3 upload utilities for MongoDB backups
 */

const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const { logger } = require('./utils');

// Create S3 client
const createS3Client = () => {
  const config = {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  };

  // If S3_ENDPOINT_URL is provided, use it (for DigitalOcean Spaces, Minio, etc.)
  if (process.env.S3_ENDPOINT_URL) {
    logger.info(`Using custom S3 endpoint: ${process.env.S3_ENDPOINT_URL}`);
    config.endpoint = process.env.S3_ENDPOINT_URL;
    
    // For S3-compatible services like DigitalOcean Spaces, we need to force path-style access
    config.forcePathStyle = true;
    
    // For S3-compatible services, set a default region if AWS_REGION is not provided
    // This is just a placeholder as the actual region is determined by the endpoint
    if (!process.env.AWS_REGION) {
      config.region = 'us-east-1'; // Default region, not used with custom endpoint
      logger.info('Using default region with custom S3 endpoint');
    } else {
      config.region = process.env.AWS_REGION;
    }
  } else {
    // AWS S3 requires a region
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION is required when using AWS S3');
    }
    config.region = process.env.AWS_REGION;
  }

  return new S3Client(config);
};

const s3Client = createS3Client();

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