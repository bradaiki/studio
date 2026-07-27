# Arts REST API Documentation

This document describes the REST API endpoints for the Arts service in the martial arts and wellness platform.

## Base URL
```
https://your-api-gateway-url.execute-api.region.amazonaws.com/prod
```

## Authentication
All endpoints support:
- **Bearer Token**: Include `Authorization: Bearer {token}` header for authenticated requests
- **Guest Access**: Limited read-only access for public content
- **Owner Permissions**: Full CRUD access for owned resources

## Endpoints

### 1. Get All Arts
**GET** `/arts`

Retrieve a list of all arts with optional filtering.

#### Query Parameters
- `category` (optional): Filter by category (`martial-arts`, `wellness`, `crafts`, `my-arts`, `all`)
- `search` (optional): Search in name, description, and short description
- `userId` (optional): Current user ID for personalization
- `limit` (optional): Maximum number of results (default: 100)

#### Example Request
```bash
GET /arts?category=martial-arts&limit=20
```

#### Example Response
```json
[
  {
    "id": "art_123",
    "name": "Aikido",
    "type": "aikido",
    "category": "martial-arts",
    "description": "The way of harmonious spirit...",
    "shortDescription": "Martial art focused on blending energy",
    "image": "https://example.com/aikido.jpg",
    "difficulty": "all-levels",
    "physicalDemands": "moderate",
    "benefits": ["Improved balance", "Stress reduction"],
    "isUserPracticing": true,
    "isUserCreated": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### 2. Get Single Art
**GET** `/arts/{id}`

Retrieve details for a specific art.

#### Path Parameters
- `id` (required): Art ID

#### Example Request
```bash
GET /arts/art_123
```

#### Example Response
```json
{
  "id": "art_123",
  "name": "Aikido",
  "type": "aikido",
  "category": "martial-arts",
  "description": "Detailed description...",
  "origin": "Japan (1920s)",
  "philosophy": "Harmony and peace...",
  "benefits": ["Improved balance", "Stress reduction"],
  "techniques": ["Irimi", "Tenkan", "Throws"],
  "equipment": ["Gi", "Hakama", "Bokken"],
  "mentalAspects": ["Mindfulness", "Emotional regulation"],
  "relatedArts": ["judo", "karate"],
  "organizations": ["org_1", "org_2"],
  "studios": ["studio_1", "studio_2"],
  "difficulty": "all-levels",
  "physicalDemands": "moderate",
  "isUserPracticing": true,
  "isUserCreated": false,
  "ownerId": "user_123",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 3. Create New Art
**POST** `/arts`

Create a new art (requires authentication).

#### Request Body
```json
{
  "name": "New Art",
  "type": "crafts",
  "category": "crafts",
  "description": "Detailed description of the art...",
  "shortDescription": "Brief description",
  "image": "https://example.com/image.jpg",
  "origin": "Ancient civilizations",
  "philosophy": "Core principles...",
  "benefits": ["Creativity", "Relaxation"],
  "techniques": ["Basic technique", "Advanced technique"],
  "equipment": ["Tool 1", "Tool 2"],
  "difficulty": "beginner",
  "physicalDemands": "low",
  "mentalAspects": ["Focus", "Patience"],
  "isPublic": true
}
```

#### Example Response
```json
{
  "id": "art_456",
  "name": "New Art",
  "ownerId": "current_user",
  "isUserCreated": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  ...
}
```

### 4. Update Art
**PUT** `/arts/{id}`

Update an existing art (requires ownership).

#### Path Parameters
- `id` (required): Art ID

#### Request Body
Same as create, but all fields are optional.

#### Example Response
```json
{
  "id": "art_456",
  "name": "Updated Art Name",
  "updatedAt": "2024-01-15T11:00:00Z",
  ...
}
```

### 5. Delete Art
**DELETE** `/arts/{id}`

Delete an art (requires ownership).

#### Path Parameters
- `id` (required): Art ID

#### Example Response
```json
{
  "message": "Art deleted successfully",
  "art": {
    "id": "art_456",
    "name": "Deleted Art"
  }
}
```

### 6. Search Arts
**GET** `/arts/search`

Search for arts by name, description, or short description.

#### Query Parameters
- `q` or `search` (required): Search query
- `limit` (optional): Maximum number of results (default: 50)

#### Example Request
```bash
GET /arts/search?q=martial&limit=10
```

#### Example Response
```json
{
  "arts": [
    {
      "id": "art_123",
      "name": "Aikido",
      "category": "martial-arts",
      ...
    }
  ],
  "query": "martial",
  "count": 1
}
```

### 7. Get Arts by Category
**GET** `/arts/categories/{category}`

Get arts filtered by a specific category.

#### Path Parameters
- `category` (required): Category name (`martial-arts`, `wellness`, `crafts`, `my-arts`, `all`)

#### Query Parameters
- `userId` (optional): User ID for `my-arts` category
- `limit` (optional): Maximum number of results (default: 50)

#### Example Request
```bash
GET /arts/categories/martial-arts?limit=20
```

#### Example Response
```json
{
  "arts": [
    {
      "id": "art_123",
      "name": "Aikido",
      "category": "martial-arts",
      ...
    }
  ],
  "category": "martial-arts",
  "count": 1
}
```

### 8. Toggle Practicing Status
**POST** `/arts/{id}/practicing` - Add to practicing arts
**DELETE** `/arts/{id}/practicing` - Remove from practicing arts

Toggle whether the current user is practicing this art.

#### Path Parameters
- `id` (required): Art ID

#### Example Request
```bash
POST /arts/art_123/practicing
```

#### Example Response
```json
{
  "art": {
    "id": "art_123",
    "name": "Aikido",
    "isUserPracticing": true,
    ...
  },
  "isUserPracticing": true,
  "message": "Added to practicing arts"
}
```

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": ["Name is required", "Category must be valid"]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Please provide a valid authorization token"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied",
  "message": "You do not have permission to edit this art"
}
```

### 404 Not Found
```json
{
  "error": "Art not found",
  "message": "The requested art does not exist"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

- **Rate Limit**: 1000 requests per minute
- **Burst Limit**: 2000 requests
- **Headers**: Rate limit information is included in response headers

## CORS Configuration

The API supports cross-origin requests with:
- **Allowed Origins**: `*` (all origins)
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `*` (all headers)
- **Credentials**: Supported

## Data Models

### Art Object
```typescript
interface Art {
  id: string;
  name: string;
  type: 'aikido' | 'karate' | 'taekwondo' | 'jujitsu' | 'yoga' | 'pilates' | 
        'kickboxing' | 'judo' | 'pottery' | 'woodworking' | 'jewelry' | 
        'painting' | 'sculpture' | 'crafts';
  description: string;
  shortDescription: string;
  image: string;
  category: 'martial-arts' | 'wellness' | 'crafts';
  origin?: string;
  philosophy?: string;
  benefits: string[];
  techniques?: string[];
  equipment?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  physicalDemands: 'low' | 'moderate' | 'high';
  mentalAspects: string[];
  relatedArts: string[];
  organizations: string[];
  studios: string[];
  ownerId?: string;
  isUserCreated?: boolean;
  isPublic?: boolean;
  isUserPracticing?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

## Usage Examples

### Frontend Integration (TypeScript)
```typescript
// Get all martial arts
const martialArts = await fetch('/arts?category=martial-arts');

// Search for yoga practices
const yogaResults = await fetch('/arts/search?q=yoga');

// Create a new art
const newArt = await fetch('/arts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Pottery',
    category: 'crafts',
    description: 'Clay working art...'
  })
});

// Toggle practicing status
await fetch(`/arts/${artId}/practicing`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### cURL Examples
```bash
# Get all arts
curl -X GET "https://api.example.com/arts"

# Create new art
curl -X POST "https://api.example.com/arts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"name":"New Art","category":"crafts"}'

# Search arts
curl -X GET "https://api.example.com/arts/search?q=martial"

# Toggle practicing
curl -X POST "https://api.example.com/arts/art_123/practicing" \
  -H "Authorization: Bearer your-token"
```

## Testing

Use tools like Postman, Insomnia, or cURL to test the API endpoints. Make sure to:

1. Test all HTTP methods (GET, POST, PUT, DELETE)
2. Verify authentication and authorization
3. Test error scenarios (invalid data, missing permissions)
4. Check CORS functionality for web applications
5. Validate response formats and status codes

## Deployment

The Arts API is deployed as part of the Amplify Gen 2 backend. To deploy:

```bash
cd amplify
npm install
amplify push
```

The API URL will be available in the Amplify console after deployment.