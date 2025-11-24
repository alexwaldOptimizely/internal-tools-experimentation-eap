# Deployment Guide - Optimizely Internal Tools

## Quick Start Deployment

### 1. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your values (already configured for Optimizely)
# All values are pre-configured based on your screenshot
```

### 2. Local Testing
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Test the integration (requires valid JIRA credentials)
npm test
```

### 3. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub repository
2. Connect repository to Vercel dashboard
3. Configure environment variables in Vercel
4. Deploy automatically

### 4. Configure Environment Variables in Vercel

Add these environment variables in your Vercel dashboard:

```
BEARER_TOKEN=MySecretToken123!
BASE_URL=https://your-project-name.vercel.app
JIRA_API_TOKEN=ATATT3xFfGF0tHuZnT3kp0ei3dI4jr9mIw1A8oC8u0SRThkTJkZH8g_s5hR96So9g8bw8X1r4yt1-SUViYWApNKyreAnfu5lLFSUJsBKP63nNaWorM7IqvcfwTMlrFtu_Fd4BH5ONeMS7CfTwSHuzuC0SIewCD98WgsxQ6-xFXxckjmTygJmbgw=D9B09ECE
JIRA_BASE_URL=https://optimizely-ext.atlassian.net
JIRA_USER_EMAIL=alex.wald@optimizely.com
JIRA_PROJECT_KEY=DEX
JIRA_DEFAULT_ISSUE_TYPE=Story
JIRA_DEFAULT_ASIGNEE_EMAIL=alex.wald@optimizely.com
```

### 5. Register in Optimizely Opal

1. Go to your Optimizely Opal instance
2. Navigate to Tools section
3. Click "Add tool registry"
4. Fill in the details:
   - **Registry Name**: `optimizely_jira_integration`
   - **Discovery URL**: `https://your-project-name.vercel.app/discovery`
   - **Bearer Token**: `MySecretToken123!`

### 6. Test the Integration

#### Test Discovery Endpoint
```bash
curl https://your-project-name.vercel.app/discovery
```

#### Test Health Check
```bash
curl https://your-project-name.vercel.app/health
```

#### Test Ticket Creation
```bash
curl -X POST https://your-project-name.vercel.app/tools/create_jira_ticket \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Test ticket from Optimizely Internal Tools",
    "description": "This is a test ticket created via the Optimizely Opal integration"
  }'
```

## Project Structure

```
/
├── api/
│   ├── index.ts           # Main Express app and Opal tool definition
│   ├── jira-client.ts     # JIRA Cloud API client with authentication
│   └── jira-tools.ts      # Business logic for ticket creation
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vercel.json            # Vercel deployment configuration
├── env.example            # Environment variables template
├── .gitignore             # Git ignore patterns
├── README.md              # Documentation
├── PRD_README.md          # Product Requirements Document
└── test-integration.js    # Integration test script
```

## Key Features Implemented

✅ **Complete JIRA Integration**
- Create tickets in Optimizely's DEX project
- Assign to any Optimizely team member
- Support for different issue types
- Comprehensive error handling

✅ **Opal Tool Registration**
- Discovery endpoint for tool manifest
- Bearer token authentication
- Health check endpoint
- Tool execution endpoint

✅ **Optimizely-Specific Configuration**
- Pre-configured for Optimizely's JIRA instance
- Default assignee set to Alex Wald
- DEX project as default target
- All client-specific references removed

✅ **Production Ready**
- TypeScript for type safety
- Comprehensive error handling
- Environment variable configuration
- Vercel deployment ready
- Health monitoring

## Troubleshooting

### Common Issues

1. **JIRA Authentication Failed**
   - Verify `JIRA_API_TOKEN` is correct
   - Check `JIRA_USER_EMAIL` matches your JIRA account
   - Ensure token has proper permissions

2. **Project Access Denied**
   - Verify you have access to DEX project
   - Check project key is correct
   - Ensure you can create tickets in the project

3. **Opal Registration Failed**
   - Verify discovery URL is accessible
   - Check bearer token matches
   - Ensure Opal has network access to your Vercel app

### Support

For issues or questions:
1. Check the health endpoint: `https://your-app.vercel.app/health`
2. Verify environment variables are correctly set
3. Test locally with `npm test`
4. Contact Alex Wald for DEX project access issues

## Next Steps

1. **Deploy to Vercel** using the steps above
2. **Register in Opal** with the discovery URL
3. **Test ticket creation** through Opal
4. **Share with Optimizely teams** for broader adoption
5. **Monitor usage** through Vercel analytics and JIRA reports





