#!/bin/bash
# Test GraphQL API connectivity and authentication

echo "Testing AWS Amplify GraphQL API..."
echo "=================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    echo "Install: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✓ AWS CLI ins    talled"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

echo "✓ AWS credentials configured"

# List GraphQL APIs
echo ""
echo "GraphQL APIs in us-east-1:"
echo "-------------------------"
aws appsync list-graphql-apis --region us-east-1 --query 'graphqlApis[*].[name,apiId,authenticationType]' --output table

# Check Cognito Identity Pool
echo ""
echo "Cognito Identity Pools:"
echo "----------------------"
aws cognito-identity list-identity-pools --max-results 10 --region us-east-1 --query 'IdentityPools[*].[IdentityPoolName,IdentityPoolId]' --output table

echo ""
echo "✓ API connectivity test complete"
echo ""
echo "Next steps:"
echo "1. Verify the GraphQL endpoint in amplify_outputs.json matches the API above"
echo "2. Verify unauthenticated_identities_enabled is true in amplify_outputs.json"
echo "3. Test the app with: ionic serve"
