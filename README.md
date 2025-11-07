# Optimizely Internal Tools - JIRA Integration

A TypeScript-based tool for creating JIRA tickets in Optimizely's internal DEX project through Opal integration.

## Overview

This tool provides a seamless way for Optimizely teams to create JIRA tickets directly through Opal, eliminating the need to manually navigate to JIRA for ticket creation.

## Features

- **JIRA Ticket Creation**: Create tickets in Optimizely's DEX project
- **Opal Integration**: Seamless integration with Optimizely's Opal instance
- **Flexible Assignment**: Assign tickets to any Optimizely team member
- **Health Monitoring**: Built-in health check for JIRA connectivity
- **Error Handling**: Comprehensive error handling with troubleshooting guidance

## Environment Variables

Copy `env.example` to `.env` and configure the following variables:

```bash
# Authentication
BEARER_TOKEN=MySecretToken123!

# Application
BASE_URL=https://alex-wald-tools.vercel.app

# JIRA Configuration
JIRA_API_TOKEN=your_jira_api_token
JIRA_BASE_URL=https://optimizely-ext.atlassian.net
JIRA_USER_EMAIL=alex.wald@optimizely.com

# JIRA Project Settings
JIRA_PROJECT_KEY=DEX
JIRA_DEFAULT_ISSUE_TYPE=Story
JIRA_DEFAULT_ASIGNEE_EMAIL=alex.wald@optimizely.com
```

## API Endpoints

### Health Check
```bash
GET /health
```
Returns the health status of the service and JIRA connectivity.

### Discovery
```bash
GET /discovery
```
Returns the tool manifest for Opal registration.

### Create JIRA Ticket
```bash
POST /tools/create_jira_ticket
Content-Type: application/json

{
  "summary": "Test ticket from Optimizely Internal Tools",
  "description": "This is a test ticket created via the Optimizely Opal integration",
  "issueType": "Story",
  "assigneeEmail": "alex.wald@optimizely.com"
}
```

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   cp env.example .env
   # Edit .env with your values
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Testing

### Test Discovery Endpoint
```bash
curl http://localhost:3000/discovery
```

### Test Health Check
```bash
curl http://localhost:3000/health
```

### Test Ticket Creation
```bash
curl -X POST http://localhost:3000/tools/create_jira_ticket \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Test ticket from Optimizely Internal Tools",
    "description": "This is a test ticket created via the Optimizely Opal integration"
  }'
```

## Deployment to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/alexwaldOptimizely/internal-tools-experimentation-eap.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### 3. Register in Optimizely Opal
1. Go to Opal Tools
2. Click "Add tool registry"
3. Fill in:
   - **Registry Name**: `optimizely_jira_integration`
   - **Discovery URL**: `https://your-project.vercel.app/discovery`
   - **Bearer Token**: `MySecretToken123!`

## Configuration

### Hardcoded Values
The following values are configured for Optimizely's internal use:

- **Project Key**: `DEX`
- **Default Issue Type**: `Story`
- **Default Assignee**: `alex.wald@optimizely.com`

### Environment Variables
- `BEARER_TOKEN`: Secret token for protecting tool execution endpoints
- `BASE_URL`: Full URL of your deployed application
- `JIRA_API_TOKEN`: JIRA Cloud API token for authentication
- `JIRA_BASE_URL`: Base URL of Optimizely's JIRA instance
- `JIRA_USER_EMAIL`: Email address for JIRA API authentication

## Error Handling

The tool provides comprehensive error handling with specific guidance:

- **400 Bad Request**: Invalid field data or project configuration issues
- **401 Unauthorized**: API token authentication failures
- **403 Forbidden**: Insufficient permissions for project or user assignment
- **404 Not Found**: Project or issue type not found
- **429 Rate Limited**: Too many API requests

Each error includes:
- Clear description of the problem
- Possible causes
- Troubleshooting steps
- Technical details for debugging

## Security

- API tokens stored as environment variables
- Bearer token authentication for tool endpoints
- Input validation and sanitization
- No sensitive data in logs or error messages
- Secure HTTPS communication with JIRA Cloud

## Support

For issues or questions:

1. Check the health endpoint for JIRA connectivity
2. Verify environment variables are correctly set
3. Ensure JIRA permissions are properly configured
4. Contact Alex Wald for DEX project access issues

## License

MIT License - See LICENSE file for details.

