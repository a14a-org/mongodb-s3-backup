# MongoDB S3 Backup

Automated MongoDB backup to AWS S3 with retention management. This service performs daily backups of your MongoDB database, uploads them to an S3 bucket, and maintains a 7-day retention policy. Supports both AWS S3 and S3-compatible storage services like DigitalOcean Spaces.

## Features

- Automated MongoDB backups using `mongodump`
- Compression of backups to save storage space
- Secure upload to AWS S3 or S3-compatible storage
- Configurable retention policy (default: 7 days)
- Built for Coolify deployment

## Requirements

- Node.js 22.11.0+
- MongoDB Database Tools (`mongodump` and `mongorestore`)
- AWS S3 bucket or S3-compatible storage (DigitalOcean Spaces, Minio, etc.)
- AWS credentials with S3 access

## Installing MongoDB Database Tools

Before using this tool, you need to install MongoDB Database Tools:

### On Ubuntu/Debian
```bash
# Import the MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB Database Tools
sudo apt-get install -y mongodb-database-tools
```

### On CentOS/RHEL
```bash
# Create a repository file
cat <<EOF | sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

# Install MongoDB Database Tools
sudo yum install -y mongodb-database-tools
```

### On macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-database-tools
```

## Configuration

Configure the service using environment variables:

### Required Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `AWS_ACCESS_KEY_ID`: AWS access key or S3-compatible storage access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key or S3-compatible storage secret key
- `S3_BUCKET_NAME`: Name of the S3 bucket to store backups
- `AWS_REGION`: AWS region (e.g., `us-east-1`) - **Required only when using AWS S3**

### Optional Environment Variables

- `S3_ENDPOINT_URL`: Endpoint URL for S3-compatible storage (e.g., `https://ams3.digitaloceanspaces.com` for DigitalOcean Spaces)
- `BACKUP_RETENTION_DAYS`: Number of days to keep backups (default: 7)
- `BACKUP_DIR`: Local directory to store temporary backups
- `LOG_LEVEL`: Logging level (default: `info`)
- `LOG_FILE`: Path to log file (default: `mongodb-backup.log`)

## Using DigitalOcean Spaces or Other S3-compatible Storage

To use DigitalOcean Spaces or another S3-compatible storage provider instead of AWS S3:

1. Set the required environment variables:
   ```
   AWS_ACCESS_KEY_ID=your_spaces_key
   AWS_SECRET_ACCESS_KEY=your_spaces_secret
   S3_BUCKET_NAME=your-spaces-name
   ```

2. Set the S3 endpoint URL environment variable:
   ```
   S3_ENDPOINT_URL=https://ams3.digitaloceanspaces.com
   ```

3. The `AWS_REGION` variable is optional when using a custom endpoint. If not provided, a default region will be used.

The application automatically detects that you're using S3-compatible storage instead of AWS S3 and configures the connection appropriately.

## Running Locally

1. Clone this repository
2. Create a `.env` file based on `.env.example`
3. Install dependencies:

   ```bash
   npm install
   ```

4. Ensure MongoDB Database Tools are installed (see above)

5. Run the backup:

   ```bash
   npm start
   ```

## Docker Deployment

This service includes a Dockerfile for container deployment:

```bash
docker build -t mongodb-s3-backup .
docker run -d --env-file .env mongodb-s3-backup
```

The Dockerfile automatically installs the required MongoDB tools.

## Coolify Deployment

To deploy on Coolify:

1. Add this repository to Coolify
2. Configure the required environment variables
3. Deploy the service

The service will run as a background process with a daily scheduled backup at midnight.

## Manually Triggering Backups

When deployed in Docker or Coolify, you can manually trigger a backup by executing:

```bash
docker exec <container_id> /app/run-backup.sh
```

## Restoring Backups

To restore a backup:

1. Download the backup from S3
2. Extract the tar.gz file
3. Use `mongorestore` to restore the database:

   ```bash
   mongorestore --uri="mongodb://username:password@host:port" <path_to_extracted_backup>
   ```

## License

MIT 