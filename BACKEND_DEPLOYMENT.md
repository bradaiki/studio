# AWS Amplify Gen 2 Backend Deployment Guide

This guide explains how to deploy the AWS Amplify Gen 2 REST API backend for the martial arts and wellness platform.

## Prerequisites

1. **AWS CLI** installed and configured
2. **Node.js** (version 18 or higher)
3. **Amplify CLI** installed globally: `npm install -g @aws-amplify/cli`
4. **AWS Account** with appropriate permissions

## Backend Architecture

The backend includes:

### 📊 **Data Layer (GraphQL + DynamoDB)**
- **Arts**: Martial arts, wellness practices, and crafts
- **Studios**: Training facilities and workshops
- **Organizations**: Martial arts organizations and associations
- **People**: Practitioners, instructors, and community members
- **Events**: Seminars, competitions, workshops, and social events
- **UserPreferences**: User-specific settings and relationships

### 🔌 **API Layer (REST APIs)**
- **Arts API**: CRUD operations for arts and practices
- **Studios API**: Studio management and search
- **Organizations API**: Organization data and relationships
- **People API**: User profiles and social features
- **Events API**: Event management and discovery

### 🔐 **Authentication**
- **Amazon Cognito**: User authentication and authorization
- **IAM Roles**: Service-to-service authentication
- **API Gateway**: Request authorization and CORS

## Deployment Steps

### 1. Install Dependencies

```bash
# Install backend dependencies
cd amplify
npm install

# Install frontend dependencies (if not already done)
cd ..
npm install
```

### 2. Configure Amplify

```bash
# Initialize Amplify (if not already done)
amplify configure

# Deploy the backend
amplify push
```

### 3. Deploy Individual Components

```bash
# Deploy data layer (GraphQL API + DynamoDB)
amplify push --category api

# Deploy authentication
amplify push --category auth

# Deploy functions (REST APIs)
amplify push --category function
```

### 4. Update Frontend Configuration

After deployment, update the `amplify_outputs.json` file with the new API endpoints:

```json
{
  "auth": {
    // ... existing auth config
  },
  "api": {
    "arts": {
      "endpoint": "https://your-api-id.execute-api.region.amazonaws.com/prod/arts",
      "region": "us-east-1"
    },
    "studios": {
      "endpoint": "https://your-api-id.execute-api.region.amazonaws.com/prod/studios",
      "region": "us-east-1"
    },
    "organizations": {
      "endpoint": "https://your-api-id.execute-api.region.amazonaws.com/prod/organizations",
      "region": "us-east-1"
    },
    "people": {
      "endpoint": "https://your-api-id.execute-api.region.amazonaws.com/prod/people",
      "region": "us-east-1"
    },
    "events": {
      "endpoint": "https://your-api-id.execute-api.region.amazonaws.com/prod/events",
      "region": "us-east-1"
    }
  }
}
```

## API Endpoints

### Arts API
- `GET /arts` - List all arts (with filtering)
- `GET /arts/{id}` - Get specific art
- `POST /arts` - Create new art
- `PUT /arts/{id}` - Update art
- `DELETE /arts/{id}` - Delete art

### Studios API
- `GET /studios` - List all studios
- `GET /studios/{id}` - Get specific studio
- `POST /studios` - Create new studio
- `PUT /studios/{id}` - Update studio
- `DELETE /studios/{id}` - Delete studio

### Organizations API
- `GET /organizations` - List all organizations
- `GET /organizations/{id}` - Get specific organization
- `POST /organizations` - Create new organization
- `PUT /organizations/{id}` - Update organization
- `DELETE /organizations/{id}` - Delete organization

### People API
- `GET /people` - List all people
- `GET /people/{id}` - Get specific person
- `POST /people` - Create new person
- `PUT /people/{id}` - Update person
- `DELETE /people/{id}` - Delete person

### Events API
- `GET /events` - List all events
- `GET /events/{id}` - Get specific event
- `POST /events` - Create new event
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event

## Query Parameters

### Arts API
- `category`: Filter by category (martial-arts, wellness, crafts, my-arts)
- `search`: Search in name, description
- `userId`: Current user ID for personalization

### Studios API
- `search`: Search in name, description, location
- `location`: Filter by location
- `userStudios`: Show only user's studios (true/false)

### Organizations API
- `search`: Search in name, description, headquarters

### People API
- `search`: Search in name, username, bio, location
- `following`: Show only followed people (true/false)

### Events API
- `search`: Search in title, description, location, organizer
- `category`: Filter by category (seminar, competition, workshop, social, training)
- `upcoming`: Show only upcoming events (true/false)

## Authentication

All APIs support:
- **Authenticated requests**: Include `Authorization: Bearer {token}` header
- **Guest access**: Limited read-only access for public content
- **Owner permissions**: Full CRUD access for owned resources

## Error Handling

APIs return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "statusCode": 400
}
```

## CORS Configuration

All APIs are configured with CORS to allow:
- All origins (`*`)
- All methods (GET, POST, PUT, DELETE, OPTIONS)
- All headers
- Credentials support

## Monitoring and Logging

- **CloudWatch Logs**: Function execution logs
- **API Gateway Logs**: Request/response logging
- **DynamoDB Metrics**: Database performance metrics
- **Cognito Analytics**: Authentication metrics

## Cost Optimization

- **DynamoDB On-Demand**: Pay per request
- **Lambda**: Pay per execution
- **API Gateway**: Pay per request
- **Cognito**: Free tier for up to 50,000 MAUs

## Security Best Practices

1. **Authentication**: All write operations require authentication
2. **Authorization**: Resource-level permissions
3. **Input Validation**: Server-side validation for all inputs
4. **Rate Limiting**: API Gateway throttling
5. **Encryption**: Data encrypted at rest and in transit

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check API Gateway CORS configuration
2. **Authentication Errors**: Verify Cognito configuration
3. **Permission Errors**: Check IAM roles and policies
4. **Function Timeouts**: Increase Lambda timeout settings

### Debugging

```bash
# View function logs
amplify console api

# Check deployment status
amplify status

# View detailed logs
amplify logs function arts-api
```

## Next Steps

1. **Data Migration**: Import existing data using the APIs
2. **Frontend Integration**: Update services to use new APIs
3. **Testing**: Comprehensive API testing
4. **Performance Optimization**: Monitor and optimize based on usage
5. **Scaling**: Configure auto-scaling based on demand

## Support

For issues or questions:
1. Check CloudWatch logs for detailed error information
2. Review API Gateway execution logs
3. Verify authentication and authorization settings
4. Test with Postman or similar API testing tools