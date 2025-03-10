# Setting Up Your MongoDB S3 Backup Repository

This guide will help you turn the `mongodb-s3-backup` directory into a standalone repository that you can deploy on Coolify.

## Step 1: Create a New Repository

1. Go to your Git hosting provider (GitHub, GitLab, etc.) and create a new repository
   - The repository should be created at: https://github.com/a14a-org/mongodb-s3-backup
2. Do not initialize it with any files

## Step 2: Prepare Your Local Directory

1. Rename the template files to their proper names:
   ```bash
   mv env.template .env.example
   mv git-ignore .gitignore
   ```

2. Make the backup script executable:
   ```bash
   chmod +x src/backup.js
   ```

## Step 3: Initialize Git Repository

1. Navigate to the `mongodb-s3-backup` directory:
   ```bash
   cd mongodb-s3-backup
   ```

2. Initialize a new Git repository:
   ```bash
   git init
   ```

3. Add all files to the repository:
   ```bash
   git add .
   ```

4. Commit the files:
   ```bash
   git commit -m "Initial commit"
   ```

5. Link to your remote repository:
   ```bash
   git remote add origin https://github.com/a14a-org/mongodb-s3-backup.git
   ```

6. Push to the remote repository:
   ```bash
   git branch -m master main  # Rename the default branch to main
   git push -u origin main
   ```

## Step 4: Deploy on Coolify

1. In Coolify, add the repository: `https://github.com/a14a-org/mongodb-s3-backup`
2. Configure the required environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `AWS_ACCESS_KEY_ID` - Your AWS access key or S3-compatible storage access key
   - `AWS_SECRET_ACCESS_KEY` - Your AWS secret key or S3-compatible storage secret key
   - `AWS_REGION` - AWS region (e.g., us-east-1) or region for your S3-compatible storage
   - `S3_BUCKET_NAME` - Name of your S3 bucket

3. For DigitalOcean Spaces or other S3-compatible storage, also set:
   - `S3_ENDPOINT_URL` - Endpoint URL for S3-compatible storage (e.g., `https://nyc3.digitaloceanspaces.com`)

4. Deploy the service

## Step 5: Verify Deployment

1. Check the logs to make sure the container starts correctly
2. Trigger a manual backup to test:
   ```bash
   docker exec <container_id> /app/run-backup.sh
   ```

3. Verify that the backup appears in your S3 bucket or S3-compatible storage

The service is now set up to perform daily backups at midnight and maintain a 7-day retention policy. 