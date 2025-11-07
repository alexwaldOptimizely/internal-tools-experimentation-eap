# Product Requirements Document (PRD)
## Multi-Tenant JIRA Integration Tool for Opal

### Document Information
- **Repository**: https://github.com/alexwaldOptimizely/alex-wald-general-tools
- **Version**: 1.0.0
- **Date**: November 2025
- **Author**: Alex Wald
- **Status**: Draft

---

## 1. Executive Summary

### 1.1 Purpose
This document defines the requirements for a multi-tenant JIRA integration tool that enables multiple clients to create JIRA tickets through Optimizely Opal. The solution uses a single GitHub repository with multiple Vercel deployments, each configured with client-specific environment variables.

### 1.2 Objectives
- Enable multiple clients to use the same codebase with isolated deployments
- Provide a scalable solution for adding new clients without code changes
- Maintain a single source of truth for code updates
- Ensure complete isolation between client deployments
- Simplify maintenance and updates across all clients

### 1.3 Success Criteria
- Successfully deploy 10+ client-specific instances from one repository
- Each client can independently register and use the tool in their Opal instance
- Code updates deploy to all clients automatically
- Zero cross-client data leakage
- 99.9% uptime per deployment
- Support for adding new clients in < 1 hour

---

## 2. Architecture Overview

### 2.1 Deployment Model

**Single Repository, Multiple Deployments:**
```
GitHub Repository (alex-wald-general-tools)
    │
    ├─── Vercel Project: client1-jira-tools
    │    └─── Environment Variables (Client 1)
    │    └─── Deployment URL: client1-jira-tools.vercel.app
    │
    ├─── Vercel Project: client2-jira-tools
    │    └─── Environment Variables (Client 2)
    │    └─── Deployment URL: client2-jira-tools.vercel.app
    │
    └─── Vercel Project: clientN-jira-tools
         └─── Environment Variables (Client N)
         └─── Deployment URL: clientN-jira-tools.vercel.app
```

### 2.2 Key Principles

1. **Code Reusability**: Single codebase shared across all deployments
2. **Configuration Isolation**: Each deployment has unique environment variables
3. **Automatic Updates**: Code changes deploy to all clients simultaneously
4. **Client Independence**: Each client's Opal instance connects to their own deployment
5. **No Hardcoding**: All client-specific values come from environment variables

---

## 3. Technical Requirements

### 3.1 Repository Structure

```
alex-wald-general-tools/
├── api/
│   ├── index.ts              # Main Express app and Opal tool definition
│   ├── jira-client.ts        # JIRA Cloud API client
│   └── jira-tools.ts         # Business logic for ticket creation
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment configuration
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore patterns
├── README.md                 # Setup and usage documentation
├── DEPLOYMENT.md             # Deployment guide
└── PRD_MULTI_TENANT.md       # This document
```

### 3.2 Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Deployment**: Vercel Serverless Functions
- **API**: JIRA Cloud REST API v3
- **Integration**: Optimizely Opal Tools SDK

### 3.3 API Endpoints

All endpoints are consistent across all deployments:

1. **GET /discovery**
   - Purpose: Opal tool discovery endpoint
   - Authentication: None (public)
   - Returns: Tool manifest with functions array

2. **GET /health**
   - Purpose: Health check and JIRA connectivity test
   - Authentication: None (public)
   - Returns: Service health and JIRA connection status

3. **POST /tools/create_jira_ticket**
   - Purpose: Create JIRA ticket
   - Authentication: Bearer token (required)
   - Returns: Created ticket details

---

## 4. Environment Variables

### 4.1 Required Variables

Each Vercel deployment must have the following environment variables configured:

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `BEARER_TOKEN` | Authentication token for Opal tool endpoints | `MySecretToken123!` | Must be unique per client |
| `BASE_URL` | Full URL of this deployment | `https://client1-jira-tools.vercel.app` | Auto-set by Vercel, but verify |
| `JIRA_API_TOKEN` | JIRA Cloud API token | `ATATT3x...` | Client's JIRA API token |
| `JIRA_BASE_URL` | Base URL of JIRA instance | `https://client.atlassian.net` | Client's JIRA instance |
| `JIRA_USER_EMAIL` | Email for JIRA API auth | `user@client.com` | Must match API token owner |
| `JIRA_PROJECT_KEY` | Target JIRA project key | `PROJ` | Client's project key |

### 4.2 Optional Variables

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `JIRA_DEFAULT_ISSUE_TYPE` | Default issue type | `Story` | Can be overridden in request |
| `JIRA_DEFAULT_ASIGNEE_EMAIL` | Default assignee | `JIRA_USER_EMAIL` | Falls back to API user email |

### 4.3 Environment Variable Management

- **Storage**: All variables stored in Vercel dashboard (never in code)
- **Security**: All tokens are secrets, not exposed in logs
- **Validation**: Health endpoint validates required variables
- **Documentation**: `.env.example` file provides template

---

## 5. Deployment Process

### 5.1 Initial Repository Setup

1. **Create GitHub Repository**
   - Repository: `alex-wald-general-tools`
   - Visibility: Private (recommended) or Public
   - Default branch: `main`

2. **Push Code**
   - Copy codebase from working implementation
   - Remove any client-specific hardcoded values
   - Ensure all configurable values use environment variables
   - Push to `main` branch

3. **Configure Repository Settings**
   - Enable branch protection on `main`
   - Set up required status checks (if using CI/CD)
   - Configure webhook settings for Vercel

### 5.2 Client Deployment Setup

**For Each New Client:**

1. **Create Vercel Project**
   - Project name: `{client-name}-jira-tools` (e.g., `petsmart-jira-tools`)
   - Framework preset: "Other" (not Next.js)
   - Root directory: `/` (root of repo)
   - Build command: `npm run build` (optional, Vercel auto-detects)
   - Output directory: Leave empty (serverless functions)

2. **Connect to GitHub**
   - Connect Vercel project to `alex-wald-general-tools` repository
   - Select `main` branch
   - Enable automatic deployments

3. **Configure Environment Variables**
   - Navigate to Project Settings → Environment Variables
   - Add all required variables (see Section 4.1)
   - Set for all environments (Production, Preview, Development)
   - Verify `BASE_URL` matches deployment URL

4. **Deploy**
   - Vercel automatically deploys on connection
   - Wait for deployment to complete
   - Verify deployment URL is accessible

5. **Test Deployment**
   - Test `/health` endpoint: `https://{deployment-url}/health`
   - Test `/discovery` endpoint: `https://{deployment-url}/discovery`
   - Test tool execution with Bearer token
   - Verify JIRA connectivity

6. **Register in Opal**
   - Client logs into their Opal instance
   - Navigate to Tools → Add Tool Registry
   - Registry Name: `{client-name}_jira_integration`
   - Discovery URL: `https://{deployment-url}/discovery`
   - Bearer Token: (from Vercel `BEARER_TOKEN` env var)
   - Save and verify tool appears

### 5.3 Update Process

**For Code Updates:**

1. **Development**
   - Make changes in feature branch
   - Test locally with `vercel dev`
   - Test in staging deployment (if available)

2. **Merge to Main**
   - Create pull request
   - Review and approve
   - Merge to `main` branch

3. **Automatic Deployment**
   - GitHub webhook triggers Vercel
   - All connected Vercel projects deploy automatically
   - Each deployment uses its own environment variables
   - Monitor deployments in Vercel dashboard

4. **Verification**
   - Check deployment status for all projects
   - Test health endpoints
   - Monitor error logs
   - Notify clients if breaking changes

---

## 6. Security Requirements

### 6.1 Authentication

- **Discovery Endpoint**: Public (no authentication required)
- **Health Endpoint**: Public (no authentication required)
- **Tool Execution Endpoint**: Bearer token authentication required
- **JIRA API**: Basic authentication (email + API token)

### 6.2 Token Management

- **Bearer Tokens**: Unique per client, stored in Vercel
- **JIRA API Tokens**: Client-provided, stored in Vercel
- **Token Rotation**: Support manual rotation via Vercel env var updates
- **Token Exposure**: Never log tokens, never commit to code

### 6.3 Data Isolation

- **Complete Isolation**: Each deployment is completely isolated
- **No Shared State**: No shared databases, caches, or storage
- **Environment Variables**: Each deployment has separate env vars
- **No Cross-Client Access**: Impossible for one client to access another's data

### 6.4 Access Control

- **Vercel Project Access**: Limit access to authorized personnel only
- **GitHub Repository Access**: Limit to development team
- **Audit Logs**: Vercel provides deployment and access logs
- **2FA**: Enable 2FA on Vercel and GitHub accounts

---

## 7. Tool Functionality

### 7.1 Tool Definition

**Tool Name**: `create_jira_ticket` (configurable per deployment if needed)

**Tool Description**: "Create a new JIRA ticket in the configured JIRA project"

### 7.2 Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `Summary` | string | Yes | - | Brief summary of the ticket |
| `Description` | string | No | Empty | Detailed description of the ticket |
| `issueType` | string | No | `Story` | Type of issue (Story, Bug, Task, etc.) |
| `assigneeEmail` | string | No | `JIRA_USER_EMAIL` | Email of the assignee |

### 7.3 Parameter Handling

- **Case Insensitive**: Support both `Summary` and `summary` (Opal compatibility)
- **Nested Parameters**: Support both direct and nested parameter formats
- **Validation**: Validate required fields before JIRA API call
- **Defaults**: Apply defaults for optional fields

### 7.4 Response Format

```json
{
  "success": true,
  "ticket": {
    "key": "PROJ-123",
    "summary": "Ticket summary",
    "description": "Ticket description",
    "issueType": "Story",
    "assignee": "user@example.com",
    "url": "https://client.atlassian.net/browse/PROJ-123"
  },
  "message": "Successfully created JIRA ticket PROJ-123..."
}
```

---

## 8. Error Handling

### 8.1 Error Categories

1. **Authentication Errors (401)**
   - Missing Bearer token
   - Invalid Bearer token
   - JIRA API authentication failure

2. **Authorization Errors (403)**
   - Insufficient JIRA permissions
   - Cannot assign to user

3. **Validation Errors (400)**
   - Missing required fields
   - Invalid field values
   - Invalid project configuration

4. **Not Found Errors (404)**
   - Project not found
   - Issue type not found
   - User not found

5. **Rate Limiting (429)**
   - JIRA API rate limit exceeded
   - Too many requests

6. **Server Errors (500)**
   - JIRA API errors
   - Internal server errors
   - Configuration errors

### 8.2 Error Response Format

```json
{
  "error": "Error category",
  "message": "Human-readable error message",
  "details": "Additional troubleshooting information"
}
```

### 8.3 Logging

- **Request Logging**: Log all requests (without sensitive data)
- **Error Logging**: Log all errors with context
- **Client Identification**: Include deployment/client info in logs
- **Log Retention**: Vercel provides log retention per plan

---

## 9. Testing Strategy

### 9.1 Pre-Deployment Testing

1. **Local Testing**
   - Test with `vercel dev`
   - Test all endpoints
   - Test error scenarios

2. **Staging Deployment**
   - Maintain one staging deployment
   - Test all changes before production
   - Test with real JIRA instance

3. **Integration Testing**
   - Test Opal registration
   - Test tool execution from Opal
   - Test error handling

### 9.2 Post-Deployment Testing

1. **Health Check**
   - Verify `/health` endpoint works
   - Verify JIRA connectivity

2. **Discovery Check**
   - Verify `/discovery` endpoint returns correct format
   - Verify Opal can parse response

3. **Tool Execution**
   - Test ticket creation with Bearer token
   - Test error scenarios
   - Verify ticket appears in JIRA

### 9.3 Ongoing Testing

- **Automated Health Checks**: Monitor all deployments
- **Error Monitoring**: Track errors across deployments
- **Client Feedback**: Monitor client-reported issues
- **Regression Testing**: Test after each code update

---

## 10. Monitoring and Maintenance

### 10.1 Monitoring

**Per Deployment:**
- Health endpoint status
- Error rates
- Response times
- JIRA API connectivity

**Aggregate:**
- Total deployments
- Deployment success rates
- Common error patterns
- Client usage patterns

### 10.2 Maintenance Tasks

**Regular:**
- Review error logs weekly
- Check deployment health daily
- Update dependencies monthly
- Review security quarterly

**As Needed:**
- Add new client deployments
- Update environment variables
- Fix bugs and issues
- Add new features

### 10.3 Documentation

**For Developers:**
- Code documentation
- Deployment procedures
- Troubleshooting guides
- Environment variable reference

**For Clients:**
- Setup instructions
- Opal registration guide
- Troubleshooting common issues
- Support contact information

---

## 11. Scaling Considerations

### 11.1 Current Scale

- **Initial Target**: 10 client deployments
- **Expected Growth**: 5-10 new clients per quarter
- **Deployment Limit**: Vercel plan limits (check current plan)

### 11.2 Scaling Challenges

1. **Deployment Management**
   - Manual setup becomes time-consuming
   - Consider automation scripts
   - Consider Vercel API for automation

2. **Monitoring**
   - Need centralized monitoring
   - Consider external monitoring service
   - Dashboard for all deployments

3. **Cost Management**
   - Monitor Vercel costs
   - Optimize deployments
   - Consider Enterprise pricing

4. **Support**
   - Scale support processes
   - Create self-service documentation
   - Consider support ticketing system

### 11.3 Future Enhancements

- **Automated Client Onboarding**: Script to create new deployments
- **Centralized Dashboard**: View all deployments in one place
- **Client Portal**: Self-service environment variable management
- **Analytics**: Usage analytics per client
- **Multi-Region**: Deploy to different regions per client

---

## 12. Risk Mitigation

### 12.1 Identified Risks

See detailed risk analysis in separate document. Key risks include:
- Breaking changes affecting all clients
- Environment variable configuration errors
- Opal/JIRA API changes
- Security token management
- Deployment management at scale

### 12.2 Mitigation Strategies

1. **Staging Environment**: Always test in staging first
2. **Gradual Rollout**: Test with one client before all
3. **Monitoring**: Comprehensive monitoring and alerting
4. **Documentation**: Clear documentation for all processes
5. **Backup Plans**: Rollback procedures and backup strategies
6. **Communication**: Client communication plan for updates

---

## 13. Success Metrics

### 13.1 Technical Metrics

- **Uptime**: 99.9% per deployment
- **Response Time**: < 2 seconds for ticket creation
- **Error Rate**: < 1% of requests
- **Deployment Success Rate**: 100% successful deployments

### 13.2 Business Metrics

- **Client Onboarding Time**: < 1 hour per client
- **Time to Deploy Updates**: < 30 minutes for all clients
- **Client Satisfaction**: Positive feedback from clients
- **Support Tickets**: < 5 per month per client

### 13.3 Operational Metrics

- **Code Updates**: Weekly or as needed
- **New Client Deployments**: 5-10 per quarter
- **Maintenance Time**: < 2 hours per week
- **Documentation Updates**: Updated with each major change

---

## 14. Timeline and Milestones

### 14.1 Phase 1: Repository Setup (Week 1)
- [ ] Create GitHub repository
- [ ] Migrate codebase
- [ ] Remove hardcoded values
- [ ] Update documentation
- [ ] Create `.env.example`

### 14.2 Phase 2: First Client Deployment (Week 1-2)
- [ ] Create first Vercel project
- [ ] Configure environment variables
- [ ] Deploy and test
- [ ] Register in Opal
- [ ] End-to-end testing

### 14.3 Phase 3: Multi-Client Setup (Week 2-3)
- [ ] Deploy 3-5 additional clients
- [ ] Document deployment process
- [ ] Create deployment checklist
- [ ] Test update process

### 14.4 Phase 4: Scale and Optimize (Week 4+)
- [ ] Deploy remaining clients
- [ ] Set up monitoring
- [ ] Create automation scripts
- [ ] Optimize processes

---

## 15. Dependencies and Assumptions

### 15.1 Dependencies

- **Vercel Platform**: Reliable hosting and deployment
- **GitHub**: Code repository and version control
- **JIRA Cloud API**: Stable API for ticket creation
- **Opal SDK**: Stable tool registration format
- **Node.js/TypeScript**: Runtime and language support

### 15.2 Assumptions

- All clients use JIRA Cloud (not JIRA Server)
- All clients have Opal access
- All clients can create JIRA API tokens
- All clients have appropriate JIRA permissions
- Vercel plan supports required number of projects
- Clients can access Vercel deployment URLs

---

## 16. Open Questions and Decisions Needed

### 16.1 Technical Decisions

- [ ] Should tool name be configurable per client?
- [ ] Should we support custom issue types per client?
- [ ] Should we add rate limiting per deployment?
- [ ] Should we add request logging/analytics?

### 16.2 Operational Decisions

- [ ] Who manages client deployments?
- [ ] What is the support process?
- [ ] How do we handle client-specific customizations?
- [ ] What is the update communication process?

### 16.3 Business Decisions

- [ ] What is the pricing model (if any)?
- [ ] What are the SLA requirements?
- [ ] What is the support level per client?
- [ ] What are the onboarding requirements?

---

## 17. Appendices

### 17.1 Environment Variables Template

See `.env.example` file in repository.

### 17.2 Deployment Checklist

See `DEPLOYMENT.md` file in repository.

### 17.3 API Documentation

See `README.md` file in repository.

### 17.4 Troubleshooting Guide

See `TROUBLESHOOTING.md` file in repository (to be created).

---

## Document Approval

- **Product Owner**: [Name]
- **Technical Lead**: [Name]
- **Date Approved**: [Date]
- **Version**: 1.0.0

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-07 | Alex Wald | Initial PRD creation |

