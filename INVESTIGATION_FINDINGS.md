# Investigation Findings: Internal Tools Repository Issues

## Executive Summary

This document outlines the findings from investigating why the `internal-tools-experimentation-eap` repository is not working compared to the working `alex-wald-tools` repository.

## Critical Issues Found

### 1. **Missing Source Files** ⚠️ CRITICAL
**Issue**: The `api/` directory was missing two critical source files:
- `api/jira-client.ts` - JIRA API client implementation
- `api/jira-tools.ts` - Business logic for ticket creation

**Impact**: The application cannot compile or run because `api/index.ts` imports these files, but they don't exist.

**Status**: ✅ **FIXED** - Both files have been recreated from compiled versions in `dist/`

---

### 2. **Missing Bearer Token Authentication** ⚠️ CRITICAL
**Issue**: The `/tools/create_jira_ticket` endpoint was not protected with Bearer token authentication.

**Impact**: 
- Security vulnerability - anyone can call the endpoint without authentication
- Opal integration requires Bearer token authentication for tool endpoints
- The working repo has this protection, but the internal repo was missing it

**Status**: ✅ **FIXED** - Bearer token authentication middleware has been added

**Implementation**:
- Added `authenticateBearerToken` middleware function
- Applied middleware to `/tools/create_jira_ticket` endpoint
- Validates `Authorization: Bearer <token>` header against `BEARER_TOKEN` environment variable

---

### 3. **Incorrect JIRA API Usage** ⚠️ MODERATE
**Issue**: The `createIssue` method was attempting to fetch issue types from `/project/${projectKey}/statuses`, which returns statuses, not issue types.

**Impact**: 
- Unnecessary API call that could fail
- The fetched data wasn't being used anyway
- Could cause confusion or errors if the endpoint structure changes

**Status**: ✅ **FIXED** - Removed unnecessary issue type fetching code

---

## Environment & Permissions Configuration

### Environment Variables Required

The following environment variables must be configured in Vercel (and locally in `.env`):

| Variable | Purpose | Example |
|----------|---------|---------|
| `BEARER_TOKEN` | Authentication token for Opal tool endpoints | `MySecretToken123!` |
| `BASE_URL` | Full URL of deployed application | `https://your-app.vercel.app` |
| `JIRA_API_TOKEN` | JIRA Cloud API token | `ATATT3x...` |
| `JIRA_BASE_URL` | JIRA instance URL | `https://optimizely-ext.atlassian.net` |
| `JIRA_USER_EMAIL` | Email for JIRA API authentication | `alex.wald@optimizely.com` |
| `JIRA_PROJECT_KEY` | Target JIRA project key | `DEX` |
| `JIRA_DEFAULT_ISSUE_TYPE` | Default issue type | `Story` |
| `JIRA_DEFAULT_ASIGNEE_EMAIL` | Default assignee email | `alex.wald@optimizely.com` |

### Permissions Required

1. **JIRA API Token Permissions**:
   - Must have permission to create issues in the DEX project
   - Must have permission to assign issues to users
   - Must have permission to read project details

2. **Vercel Deployment**:
   - All environment variables must be set in Vercel dashboard
   - Repository must be connected to Vercel
   - Deployment must be configured for the `api/` directory

3. **Opal Integration**:
   - Bearer token must match between:
     - `BEARER_TOKEN` environment variable in Vercel
     - Bearer token configured in Opal tool registry

---

## Comparison: Working vs Non-Working Repo

### Working Repo (`alex-wald-tools`)
- ✅ Has `api/jira-client.ts`
- ✅ Has `api/jira-tools.ts`
- ✅ Has Bearer token authentication middleware
- ✅ Properly configured environment variables
- ✅ Working JIRA integration

### Non-Working Repo (`internal-tools-experimentation-eap`) - BEFORE FIXES
- ❌ Missing `api/jira-client.ts`
- ❌ Missing `api/jira-tools.ts`
- ❌ Missing Bearer token authentication
- ❌ Incorrect JIRA API usage
- ⚠️ Environment variables may not be configured in Vercel

### Non-Working Repo - AFTER FIXES
- ✅ Has `api/jira-client.ts` (recreated)
- ✅ Has `api/jira-tools.ts` (recreated)
- ✅ Has Bearer token authentication (added)
- ✅ Fixed JIRA API usage (cleaned up)
- ⚠️ **Still need to verify**: Environment variables in Vercel

---

## Next Steps

### Immediate Actions Required

1. **Verify Environment Variables in Vercel**:
   - Log into Vercel dashboard
   - Navigate to project settings
   - Verify all environment variables are set correctly
   - Ensure `BEARER_TOKEN` matches what's configured in Opal

2. **Test Deployment**:
   - Push changes to GitHub
   - Verify Vercel deployment succeeds
   - Test `/health` endpoint
   - Test `/discovery` endpoint
   - Test `/tools/create_jira_ticket` with Bearer token

3. **Verify Opal Integration**:
   - Check Opal tool registry configuration
   - Ensure discovery URL points to correct Vercel deployment
   - Ensure Bearer token matches `BEARER_TOKEN` in Vercel

4. **Test JIRA Permissions**:
   - Verify JIRA API token has correct permissions
   - Test creating a ticket manually via API
   - Verify project key `DEX` exists and is accessible

---

## Code Changes Made

### Files Created
1. `api/jira-client.ts` - JIRA API client with authentication and issue creation
2. `api/jira-tools.ts` - Business logic wrapper for ticket creation

### Files Modified
1. `api/index.ts` - Added Bearer token authentication middleware

### Files Cleaned Up
1. `api/jira-client.ts` - Removed incorrect issue type fetching code

---

## Testing Checklist

- [ ] Local build succeeds (`npm run build`)
- [ ] Local server starts (`npm run dev`)
- [ ] `/health` endpoint returns healthy status
- [ ] `/discovery` endpoint returns tool manifest
- [ ] `/tools/create_jira_ticket` rejects requests without Bearer token
- [ ] `/tools/create_jira_ticket` accepts requests with valid Bearer token
- [ ] JIRA ticket creation succeeds
- [ ] Vercel deployment succeeds
- [ ] Opal can discover and use the tool

---

## Root Cause Analysis

The primary root cause was **missing source files**. The repository had:
- Compiled JavaScript files in `dist/`
- TypeScript source files were missing
- This suggests the source files were either:
  - Never committed to the repository
  - Accidentally deleted
  - Not copied from the working repo

The secondary issue was **missing security middleware** - Bearer token authentication was not implemented, which is required for Opal integration.

---

## Recommendations

1. **Add Source Files to Git**: Ensure all TypeScript source files are committed to the repository
2. **Add CI/CD Checks**: Add a build step that verifies all source files exist before deployment
3. **Documentation**: Update README with troubleshooting steps for common issues
4. **Environment Variable Validation**: Add startup checks that validate all required environment variables are present
5. **Health Check Enhancement**: Enhance `/health` endpoint to check environment variable configuration

---

## Conclusion

The main issues preventing the internal tools repository from working were:
1. Missing source files (`jira-client.ts`, `jira-tools.ts`)
2. Missing Bearer token authentication
3. Potentially missing or incorrect environment variables in Vercel

All code issues have been fixed. The remaining work is to verify and configure environment variables in Vercel and test the deployment.

