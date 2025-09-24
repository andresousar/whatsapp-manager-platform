#!/bin/bash

# WhatsApp Manager Platform - Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up WhatsApp Manager Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Check if Git is installed
check_git() {
    print_status "Checking Git installation..."
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "Git is installed: $GIT_VERSION"
    else
        print_error "Git is not installed. Please install Git from https://git-scm.com/"
        exit 1
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend (NestJS)..."
    
    cd apps/api
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Copy environment file
    if [ ! -f .env ]; then
        print_status "Creating .env file for backend..."
        cp .env.example .env 2>/dev/null || echo "DATABASE_URL=postgresql://solisipbx:Solis@@#2025@147.93.70.232:5432/whatsapp_business_platform" > .env
        print_warning "Please update the .env file with your actual configuration"
    fi
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    # Run database migrations
    print_status "Running database migrations..."
    npx prisma db push
    
    print_success "Backend setup completed!"
    cd ../..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend (React)..."
    
    cd apps/web
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Copy environment file
    if [ ! -f .env ]; then
        print_status "Creating .env file for frontend..."
        cp .env.example .env 2>/dev/null || echo "VITE_API_URL=http://localhost:3001/api" > .env
        print_warning "Please update the .env file with your actual configuration"
    fi
    
    print_success "Frontend setup completed!"
    cd ../..
}

# Setup shared packages
setup_packages() {
    print_status "Setting up shared packages..."
    
    cd packages/shared-types
    npm install
    cd ../eslint-config
    npm install
    cd ../..
    
    print_success "Shared packages setup completed!"
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    # Install husky
    npm install --save-dev husky
    
    # Setup pre-commit hook
    npx husky install
    npx husky add .husky/pre-commit "npm run lint-staged"
    
    print_success "Git hooks setup completed!"
}

# Create initial commit
create_initial_commit() {
    print_status "Creating initial commit..."
    
    # Add all files
    git add .
    
    # Create initial commit
    git commit -m "feat: initial project setup

- Add project structure
- Configure backend (NestJS + Prisma)
- Configure frontend (React + Vite)
- Add CI/CD pipeline
- Add backup system
- Add documentation"

    print_success "Initial commit created!"
}

# Main setup function
main() {
    echo "=========================================="
    echo "  WhatsApp Manager Platform Setup"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_node
    check_npm
    check_git
    
    echo ""
    print_status "All prerequisites are met. Starting setup..."
    echo ""
    
    # Setup components
    setup_backend
    echo ""
    setup_frontend
    echo ""
    setup_packages
    echo ""
    setup_git_hooks
    echo ""
    
    # Create initial commit
    create_initial_commit
    echo ""
    
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update environment files with your configuration"
    echo "2. Start the development servers:"
    echo "   - Backend: cd apps/api && npm run start:dev"
    echo "   - Frontend: cd apps/web && npm run dev"
    echo "3. Access the application at http://localhost:3000"
    echo ""
    echo "For more information, check the documentation in the docs/ folder."
}

# Run main function
main "$@"
