# Product Requirements Document (PRD)
## Optimizely Internal Tools Experimentation - JIRA Integration

### Project Overview

**Objective**: Create an exact copy of the `alex-wald-tools` repository and adapt it for Optimizely's internal instance, enabling seamless JIRA ticket creation and management through Opal integration.

### Background

The original `alex-wald-tools` repository provides a prototype tool for Opal that integrates with JIRA Cloud API to create tickets programmatically. This project aims to replicate this functionality specifically for Optimizely's internal infrastructure, removing any client-specific references and making it a generic internal tool for Optimizely teams.

### Functional Requirements

#### 1. Repository Duplication
- **Source**: `https://github.com/alexwaldOptimizely/alex-wald-tools`
- **Target**: `https://github.com/alexwaldOptimizely/internal-tools-experimentation-eap`
- **Scope**: Complete codebase replication with Optimizely-specific adaptations

#### 2. Environment Configuration
Based on the provided screenshot, configure the following environment variables for Optimizely's internal JIRA instance:

| Variable | Value | Purpose |
|----------|-------|---------|
| `JIRA_PROJECT_KEY` | `DEX` | Target JIRA project for ticket creation |
| `JIRA_DEFAULT_ISSUE_TYPE` | `Story` | Default issue type for new tickets |
| `JIRA_DEFAULT_ASIGNEE_EMAIL` | `alex.wald@optimizely.com` | Default assignee for tickets |
| `BEARER_TOKEN` | `MySecretToken123!` | Authentication token for tool endpoints |
| `BASE_URL` | `https://alex-wald-tools.vercel.app` | Base URL for deployed application |
| `JIRA_API_TOKEN` | `your_jira_api_token_here` | Optimizely JIRA Cloud API authentication |
| `JIRA_BASE_URL` | `https://optimizely-ext.atlassian.net` | Optimizely internal JIRA instance URL |
| `JIRA_USER_EMAIL` | `alex.wald@optimizely.com` | Optimizely JIRA API user email |

#### 3. Core Features

**JIRA Ticket Creation Tool**
- Create tickets in Optimizely's internal DEX project
- Assign tickets to specified Optimizely team members by default
- Support custom summary and description
- Return ticket key and URL for tracking
- Generic tool suitable for any Optimizely team's workflow

**Opal Integration**
- Discovery endpoint for tool registration in Optimizely's Opal instance
- Bearer token authentication for internal security
- Health check endpoint for monitoring Optimizely's JIRA connectivity
- Error handling with troubleshooting guidance specific to Optimizely's infrastructure

**API Endpoints**
- `GET /discovery` - Tool manifest for Opal
- `GET /health` - Service health and JIRA connectivity
- `POST /tools/create_jira_ticket` - Create new JIRA tickets

#### 4. Technical Architecture

**Technology Stack**
- TypeScript/Node.js
- Express.js for API endpoints
- JIRA Cloud REST API integration
- Vercel deployment platform

**Project Structure**
```
/
├── api/
│   ├── index.ts           # Main Express app and Opal tool definition
│   ├── jira-client.ts     # JIRA Cloud API client with authentication
│   └── jira-tools.ts      # Business logic for ticket creation
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vercel.json            # Vercel deployment configuration
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore patterns
└── README.md              # Documentation
```

### Non-Functional Requirements

#### Security
- API tokens stored as environment variables only
- Bearer token authentication for all tool endpoints
- Input validation and sanitization
- No sensitive data in logs or error messages
- HTTPS communication with JIRA Cloud

#### Performance
- Sub-second response times for ticket creation
- Efficient API rate limiting handling
- Proper error handling and retry logic

#### Reliability
- Comprehensive error handling with specific guidance
- Health check endpoint for monitoring
- Graceful degradation on API failures

### Implementation Plan

#### Phase 1: Repository Setup
1. Clone source repository structure
2. Initialize target repository
3. Set up basic project configuration

#### Phase 2: Code Adaptation
1. Remove any client-specific references (Petsmart, etc.)
2. Update hardcoded values for Optimizely's internal instance
3. Configure environment variables for Optimizely's JIRA
4. Adapt JIRA project settings (DEX project)
5. Update default assignee and issue types for Optimizely teams
6. Make tool generic for any Optimizely team's use case

#### Phase 3: Testing & Validation
1. Local development testing
2. Environment variable validation
3. JIRA connectivity testing
4. Opal integration testing

#### Phase 4: Deployment
1. Deploy to Vercel with Optimizely-specific configuration
2. Configure production environment variables for Optimizely's infrastructure
3. Register tool in Optimizely's internal Opal instance
4. End-to-end testing with Optimizely teams

### Success Criteria

- [ ] Complete repository duplication with Optimizely-specific adaptations
- [ ] All client-specific references removed (Petsmart, etc.)
- [ ] All environment variables properly configured for Optimizely's infrastructure
- [ ] JIRA ticket creation working with Optimizely's DEX project
- [ ] Tool generic enough for any Optimizely team to use
- [ ] Opal tool registration successful in Optimizely's internal instance
- [ ] Health check endpoint reporting healthy status for Optimizely's JIRA
- [ ] Error handling providing clear troubleshooting guidance for Optimizely teams
- [ ] Deployment successful on Vercel with Optimizely-specific configuration

### Risk Mitigation

**API Rate Limiting**
- Implement proper retry logic with exponential backoff
- Monitor API usage and implement caching where appropriate

**Authentication Issues**
- Validate all API tokens during startup
- Provide clear error messages for authentication failures
- Implement token refresh mechanisms if needed

**JIRA Project Access**
- Verify Optimizely's DEX project permissions
- Test ticket creation with different Optimizely user roles
- Implement fallback assignment strategies for Optimizely teams
- Ensure tool works across different Optimizely departments

### Dependencies

- Access to Optimizely's internal JIRA instance (`https://optimizely-ext.atlassian.net`)
- Valid JIRA API token with appropriate permissions for Optimizely's infrastructure
- Vercel deployment platform access
- Optimizely's internal Opal tool registration access
- Permission to remove client-specific references and make tool generic

### Timeline

- **Week 1**: Repository setup and code adaptation
- **Week 2**: Testing and validation
- **Week 3**: Deployment and Opal integration
- **Week 4**: Documentation and final validation

---

*This PRD serves as the foundation for creating an Optimizely-specific version of the JIRA integration tool, ensuring seamless ticket management through Opal integration. The tool will be generic and suitable for any Optimizely team, with all client-specific references removed.*
