#!/bin/bash
# MongoDB Database Tools Installation Script
# This script installs MongoDB Database Tools (mongodump, mongorestore, etc.)
# on various operating systems.

# Detect the operating system
echo "Detecting operating system..."
OS=""
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
elif [ -f /etc/lsb-release ]; then
    . /etc/lsb-release
    OS=$DISTRIB_ID
elif [ -f /etc/debian_version ]; then
    OS="debian"
elif [ -f /etc/redhat-release ]; then
    OS="rhel"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    echo "Operating system not detected. Please install MongoDB Database Tools manually."
    exit 1
fi

echo "Detected OS: $OS"

# Install MongoDB Database Tools based on the OS
case "$OS" in
    "ubuntu"|"debian")
        echo "Installing for Ubuntu/Debian..."
        
        # Check if we have sudo
        if ! command -v sudo &> /dev/null; then
            APT_CMD="apt-get"
        else
            APT_CMD="sudo apt-get"
        fi
        
        # Import the MongoDB public GPG key
        echo "Importing MongoDB public GPG key..."
        wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
        
        # Add MongoDB repository
        echo "Adding MongoDB repository..."
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
        
        # Update package database
        echo "Updating package database..."
        $APT_CMD update
        
        # Install MongoDB Database Tools
        echo "Installing MongoDB Database Tools..."
        $APT_CMD install -y mongodb-database-tools
        ;;
        
    "fedora"|"centos"|"rhel")
        echo "Installing for CentOS/RHEL/Fedora..."
        
        # Create a repository file
        echo "Creating MongoDB repository file..."
        cat <<EOF | sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
        
        # Install MongoDB Database Tools
        echo "Installing MongoDB Database Tools..."
        sudo yum install -y mongodb-database-tools
        ;;
        
    "alpine")
        echo "Installing for Alpine Linux..."
        apk add --no-cache mongodb-tools
        ;;
        
    "macos")
        echo "Installing for macOS..."
        
        # Check if Homebrew is installed
        if ! command -v brew &> /dev/null; then
            echo "Homebrew not found. Please install Homebrew first."
            echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
        
        # Install MongoDB Database Tools
        echo "Installing MongoDB Database Tools..."
        brew tap mongodb/brew
        brew install mongodb-database-tools
        ;;
        
    *)
        echo "Unsupported operating system: $OS"
        echo "Please install MongoDB Database Tools manually."
        exit 1
        ;;
esac

# Verify installation
echo "Verifying installation..."
if command -v mongodump &> /dev/null && command -v mongorestore &> /dev/null; then
    echo "MongoDB Database Tools installed successfully."
    echo "mongodump version: $(mongodump --version | head -n 1)"
    echo "mongorestore version: $(mongorestore --version | head -n 1)"
else
    echo "Installation verification failed. Please install MongoDB Database Tools manually."
    exit 1
fi

exit 0 