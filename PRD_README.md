# Product Requirements Document (PRD)
## Generic JIRA Integration Tool for Opal

### Project Overview

**Objective**: Create a generic, multi-tenant JIRA integration tool that enables seamless ticket creation and management through Opal integration. The tool is designed to work with any JIRA instance and automatically adapts to different client configurations through environment variables.

### Background

This tool provides a generic solution for integrating JIRA Cloud API with Opal, enabling programmatic ticket creation and management. The implementation is completely generic with no hardcoded client-specific references. All client-specific configurations (field mappings, project settings, etc.) are handled through environment variables, making it suitable for deployment across multiple clients and use cases.

### Key Design Principles

1. **Generic Codebase**: No hardcoded client-specific fields or configurations in the GitHub repository
2. **Environment-Driven Configuration**: All client-specific settings configured via Vercel environment variables
3. **Dynamic Discovery**: Discovery endpoint automatically exposes fields based on configured environment variables
4. **Flexible Field Mapping**: Supports any JIRA custom fields through `JIRA_FIELD_*` environment variables
5. **Multi-Tenant Ready**: Same codebase can be deployed multiple times with different configurations

### Functional Requirements

#### 1. Repository Duplication
- **Source**: `https://github.com/alexwaldOptimizely/alex-wald-tools`
- **Target**: `https://github.com/alexwaldOptimizely/internal-tools-experimentation-eap`
- **Scope**: Complete codebase replication with Optimizely-specific adaptations

#### 2. Environment Configuration

**Required Environment Variables**

| Variable | Purpose | Example |
|----------|---------|---------|
| `JIRA_BASE_URL` | JIRA instance base URL | `https://optimizely-ext.atlassian.net` |
| `JIRA_USER_EMAIL` | Email for JIRA API authentication | `user@example.com` |
| `JIRA_API_TOKEN` | JIRA Cloud API token | `ATATT3x...` |
| `JIRA_PROJECT_KEY` | Default JIRA project key | `DEX` |
| `BEARER_TOKEN` | Authentication token for Opal tool endpoints | `MySecretToken123!` |
| `BASE_URL` | Base URL of deployed application | `https://your-app.vercel.app` |

**Optional Environment Variables**

| Variable | Purpose | Example |
|----------|---------|---------|
| `JIRA_DEFAULT_ISSUE_TYPE` | Default issue type | `Story` |
| `JIRA_DEFAULT_ASIGNEE_EMAIL` | Default assignee email | `user@example.com` |

**Custom Field Configuration (Dynamic)**

Custom JIRA fields are configured using `JIRA_FIELD_*` environment variables. The discovery endpoint automatically detects and exposes these fields to Opal.

**Format**: `JIRA_FIELD_<FIELD_NAME>=<JIRA_FIELD_ID>`

**Examples**:
- `JIRA_FIELD_PRIORITY_SCORE=customfield_10156`
- `JIRA_FIELD_HYPOTHESIS=customfield_10157`
- `JIRA_FIELD_EXPERIMENT_DETAILS=customfield_10158`
- `JIRA_FIELD_TARGET_AUDIENCE=customfield_10159`
- `JIRA_FIELD_METRICS=customfield_10151`
- `JIRA_FIELD_TRAFFIC_DISTRIBUTION=customfield_10336`
- `JIRA_FIELD_SQUAD_ALIGNMENT=customfield_10239`
- `JIRA_FIELD_DEVICE_TYPE=customfield_10248`

**Field Name Conversion**:
- Environment variable: `JIRA_FIELD_PRIORITY_SCORE`
- Opal parameter name: `priorityScore` (automatically converted to camelCase)
- Supported variations: `priorityScore`, `priority_score`, `priority-score`, `priority score`, `priorityscore`

**Type Inference**:
- Fields containing "score", "points", "value", or "count" are automatically typed as `number`
- All other fields default to `string`

#### 3. Core Features

**JIRA Ticket Creation Tool**
- Create tickets in any configured JIRA project
- Support for all standard JIRA fields (summary, description, assignee, issue type, priority, labels, components, etc.)
- **Dynamic custom field support**: Automatically supports any custom fields configured via `JIRA_FIELD_*` environment variables
- Flexible field mapping: Handles field name variations (camelCase, snake_case, kebab-case, spaces)
- Markdown support in descriptions (automatically converted to JIRA ADF format)
- Return ticket key and URL for tracking

**Dynamic Discovery Endpoint**
- **Automatically builds parameter list** from environment variables at runtime
- No hardcoded field definitions in code
- Exposes all configured `JIRA_FIELD_*` variables as Opal parameters
- Automatically infers field types (string vs number)
- Provides field descriptions showing JIRA field ID mappings
- Each deployment shows only the fields configured in its environment

**Opal Integration**
- Discovery endpoint for tool registration in Opal
- Bearer token authentication for tool execution endpoints
- Health check endpoint for monitoring JIRA connectivity
- Comprehensive error handling with troubleshooting guidance

**Field Mapping System**
- Intelligent field name normalization (handles spaces, underscores, hyphens, case variations)
- Automatic mapping of friendly names to JIRA field IDs
- Support for standard JIRA fields and unlimited custom fields
- Field value formatting based on field type (assignee, priority, labels, etc.)

**API Endpoints**
- `GET /discovery` - Dynamic tool manifest for Opal (automatically includes all configured fields)
- `GET /health` - Service health and JIRA connectivity check
- `POST /tools/create_jira_ticket_with_fields` - Create new JIRA tickets with all fields
- `POST /tools/update_jira_ticket_with_fields` - Update existing JIRA tickets

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
│   ├── index.ts           # Main Express app, dynamic discovery endpoint, tool execution
│   ├── jira-client.ts     # JIRA Cloud API client with authentication
│   ├── jira-tools.ts      # Business logic for ticket creation/updates
│   ├── field-mapper.ts    # Dynamic field mapping system
│   └── markdown-converter.ts # Markdown to JIRA ADF conversion
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vercel.json            # Vercel deployment configuration
├── env.example            # Environment variables template
├── .gitignore             # Git ignore patterns
└── README.md              # Documentation
```

**Key Components**

1. **Dynamic Discovery Endpoint** (`api/index.ts`)
   - Scans `process.env` for `JIRA_FIELD_*` variables at runtime
   - Builds Opal parameter list dynamically
   - No code changes needed to add new fields

2. **Field Mapper** (`api/field-mapper.ts`)
   - Maps friendly field names to JIRA field IDs
   - Loads mappings from environment variables
   - Handles field name variations and normalization
   - Formats field values based on JIRA field types

3. **JIRA Client** (`api/jira-client.ts`)
   - Handles JIRA API authentication
   - Creates and updates JIRA issues
   - Converts markdown descriptions to JIRA ADF format

4. **JIRA Tools** (`api/jira-tools.ts`)
   - Business logic for ticket operations
   - Validates required fields
   - Error handling and user-friendly error messages

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

#### Phase 2: Code Adaptation ✅ COMPLETE
1. ✅ Removed all client-specific references (Petsmart, etc.)
2. ✅ Implemented dynamic discovery endpoint that reads from environment variables
3. ✅ Built flexible field mapping system supporting unlimited custom fields
4. ✅ Made tool completely generic - no hardcoded client configurations
5. ✅ Implemented automatic field type inference
6. ✅ Added support for field name variations (camelCase, snake_case, etc.)

#### Phase 3: Testing & Validation ✅ COMPLETE
1. ✅ Local development testing
2. ✅ Environment variable validation
3. ✅ JIRA connectivity testing
4. ✅ Opal integration testing
5. ✅ Multi-tenant deployment validation (Petsmart and Optimizely instances)

#### Phase 4: Deployment ✅ COMPLETE
1. ✅ Deployed to Vercel with multiple configurations
2. ✅ Verified dynamic discovery endpoint works correctly
3. ✅ Confirmed each deployment shows only its configured fields
4. ✅ Validated field mapping system handles custom fields correctly

### Success Criteria

- [x] Complete repository duplication with generic adaptations
- [x] All client-specific references removed from codebase
- [x] Dynamic discovery endpoint implemented and working
- [x] Field mapping system supports unlimited custom fields
- [x] JIRA ticket creation working with any configured project
- [x] Tool completely generic - works for any JIRA instance
- [x] Opal tool registration successful (multiple deployments validated)
- [x] Health check endpoint reporting healthy status
- [x] Error handling providing clear troubleshooting guidance
- [x] Multi-tenant deployment successful (Petsmart: 18 custom fields, Optimizely: 2 custom fields)
- [x] Dynamic field discovery working correctly (each deployment shows only its configured fields)

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

- Access to target JIRA instance (any JIRA Cloud instance)
- Valid JIRA API token with appropriate permissions
- Vercel deployment platform access
- Opal tool registration access
- Knowledge of JIRA custom field IDs for the target instance

### Multi-Tenant Deployment

The tool is designed for multi-tenant deployment. The same codebase can be deployed multiple times with different configurations:

**Example Deployments**:

1. **Petsmart Deployment** (`petsmart-jira-fields.vercel.app`)
   - JIRA Instance: `https://petsmart.atlassian.net`
   - Project: `DTO`
   - Custom Fields: 18 fields (priorityScore, hypothesis, experimentDetails, etc.)

2. **Optimizely Deployment** (`internal-tools-experimentation-eap.vercel.app`)
   - JIRA Instance: `https://optimizely-ext.atlassian.net`
   - Project: `DEX`
   - Custom Fields: 2 fields (epicLink, team)

**Deployment Process**:
1. Deploy same codebase to Vercel
2. Configure environment variables for target JIRA instance
3. Set `JIRA_FIELD_*` variables for custom fields
4. Discovery endpoint automatically exposes configured fields
5. No code changes required

### Implementation Status

**✅ COMPLETE** - All phases completed successfully

**Key Achievements**:
- ✅ Generic codebase with zero hardcoded client references
- ✅ Dynamic discovery endpoint working correctly
- ✅ Field mapping system supports unlimited custom fields
- ✅ Multi-tenant deployments validated
- ✅ Automatic field type inference
- ✅ Flexible field name handling (supports all naming conventions)

### Example Usage

**Discovery Endpoint Response** (automatically generated):
```json
{
  "functions": [{
    "name": "create_jira_ticket_with_fields",
    "description": "Create a new JIRA ticket with custom fields. Supports all standard fields... Additionally supports 18 custom field(s) configured via JIRA_FIELD_* environment variables.",
    "parameters": [
      {"name": "Summary", "type": "string", "required": true},
      {"name": "Description", "type": "string", "required": false},
      {"name": "priorityScore", "type": "number", "description": "Priority Score (maps to customfield_10156)", "required": false},
      {"name": "hypothesis", "type": "string", "description": "Hypothesis (maps to customfield_10157)", "required": false},
      // ... automatically includes all JIRA_FIELD_* configured fields
    ]
  }]
}
```

**Field Mapping Examples**:
- `priorityScore` → `customfield_10156` (via `JIRA_FIELD_PRIORITY_SCORE`)
- `hypothesis` → `customfield_10157` (via `JIRA_FIELD_HYPOTHESIS`)
- `experimentDetails` → `customfield_10158` (via `JIRA_FIELD_EXPERIMENT_DETAILS`)

**Supported Field Name Variations**:
- `priorityScore`, `priority_score`, `priority-score`, `priority score`, `priorityscore` → All map to same field

---

*This PRD documents a fully generic JIRA integration tool that works with any JIRA instance. All client-specific configurations are handled through environment variables, making it suitable for multi-tenant deployment. The tool automatically adapts to different JIRA instances and field configurations without requiring code changes.*
