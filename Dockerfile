FROM node:22.11.0-alpine

# Install MongoDB tools with explicit version and verify installation
RUN apk add --no-cache mongodb-tools && \
    mongodump --version && \
    mongorestore --version

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
# Use regular npm install if package-lock.json doesn't exist
RUN if [ -f package-lock.json ]; then \
        npm ci --omit=dev; \
    else \
        npm install --omit=dev; \
    fi

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