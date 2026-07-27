#!/bin/bash

# AWS Amplify Gen 2 Backend Deployment Script
# This script deploys the GraphQL API and DynamoDB backend

echo "🚀 Starting AWS Amplify Gen 2 Backend Deployment..."

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not installed. Please install Node.js first."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd amplify
npm install
cd ..

# Deploy the backend using Amplify Gen 2
echo "🏗️ Deploying Amplify Gen 2 backend..."
echo "Choose deployment option:"
echo "1. Sandbox (for development/testing)"
echo "2. Pipeline Deploy (for production)"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo "🔧 Starting sandbox environment..."
    npx ampx sandbox
elif [ "$choice" = "2" ]; then
    read -p "Enter branch name (e.g., main): " branch
    echo "🚀 Deploying to production pipeline..."
    npx ampx pipeline-deploy --branch "$branch"
else
    echo "❌ Invalid choice. Exiting."
    exit 1
fi

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Backend deployment successful!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Check amplify_outputs.json for updated API endpoints"
    echo "2. Commit and push changes to trigger frontend deployment"
    echo "3. Test GraphQL API endpoints"
    echo ""
    echo "📚 Documentation:"
    echo "- GraphQL Fix: GRAPHQL_404_FIX.md"
    echo "- Backend: BACKEND_DEPLOYMENT.md"
    echo ""
    echo "🔗 GraphQL API:"
    echo "- Endpoint: Check amplify_outputs.json -> data.url"
    echo "- Auth Mode: IAM (for unauthenticated access)"
    echo "- Models: Art, Studio, Organization, Person, Event, Favorite"
else
    echo "❌ Backend deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi