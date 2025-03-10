FROM node:22.11.0-alpine

# Install MongoDB tools and dependencies
RUN apk add --no-cache mongodb-tools

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create directory for backups
RUN mkdir -p /app/backups
ENV BACKUP_DIR=/app/backups

# Set up cron job
RUN echo "0 0 * * * cd /app && node src/backup.js >> /app/mongodb-backup.log 2>&1" > /etc/crontabs/root
RUN chmod 644 /etc/crontabs/root

# For testing the backup manually
RUN echo '#!/bin/sh' > /app/run-backup.sh
RUN echo 'node /app/src/backup.js' >> /app/run-backup.sh
RUN chmod +x /app/run-backup.sh

# Display logs
CMD ["sh", "-c", "crond -f & tail -f /app/mongodb-backup.log"] 