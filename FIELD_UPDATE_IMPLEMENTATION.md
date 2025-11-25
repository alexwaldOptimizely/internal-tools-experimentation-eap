# Field Update Implementation

## Overview

Implemented the ability to update any field on JIRA tickets created by this tool. The implementation supports both standard JIRA fields and custom fields, with automatic field name mapping and value formatting.

## What Was Implemented

### 1. Field Mapper (`api/field-mapper.ts`)
- Maps friendly field names to JIRA field IDs
- Formats field values appropriately for JIRA API
- Supports standard fields (summary, description, assignee, etc.)
- Supports custom fields by ID (e.g., `customfield_10001`)

### 2. JIRA Client Updates (`api/jira-client.ts`)
- Added `getIssue()` method to fetch ticket details
- Added `updateIssue()` method to update tickets with any fields
- Automatically converts description markdown to ADF format
- Handles field value formatting (emails, arrays, objects, etc.)

### 3. Update Tool Function (`api/jira-tools.ts`)
- Added `updateJiraTicket()` function with validation
- Validates ticket key format
- Provides detailed error messages

### 4. API Endpoint (`api/index.ts`)
- Added `POST /tools/update_jira_ticket_DHK` endpoint
- Protected with Bearer token authentication
- Updated discovery endpoint to include new tool

## Supported Fields

### Standard Fields (by friendly name)
- `summary` - Ticket summary/title
- `description` - Ticket description (supports markdown, auto-converted to ADF)
- `assigneeEmail` - Assignee email address
- `issueType` - Issue type name (e.g., "Story", "Bug", "Task")
- `priority` - Priority name (e.g., "High", "Medium", "Low")
- `labels` - Array of label strings
- `components` - Array of component names
- `fixVersions` - Array of version names
- `affectsVersions` - Array of version names
- `dueDate` - ISO date string (e.g., "2025-01-15")
- `reporterEmail` - Reporter email address

### Custom Fields
- Use JIRA field ID format: `customfield_10001`, `customfield_10002`, etc.
- Field IDs can be found in JIRA by viewing field configuration or using the JIRA API

## Usage Examples

### Update Single Field
```json
{
  "ticketKey": "DHK-123",
  "fields": {
    "summary": "Updated summary text"
  }
}
```

### Update Multiple Fields
```json
{
  "ticketKey": "DHK-123",
  "fields": {
    "summary": "New summary",
    "description": "## Updated Description\n\nThis is **bold** text.",
    "assigneeEmail": "new.assignee@optimizely.com",
    "priority": "High",
    "labels": ["urgent", "customer-request"]
  }
}
```

### Update Custom Field
```json
{
  "ticketKey": "DHK-123",
  "fields": {
    "customfield_10001": "Custom field value",
    "customfield_10002": 12345
  }
}
```

### Update with Markdown Description
```json
{
  "ticketKey": "DHK-123",
  "fields": {
    "description": "## Section Header\n\n- List item 1\n- List item 2\n\nThis is **bold** and this is *italic*."
  }
}
```

## Field Name Mapping

The system automatically maps friendly field names to JIRA field IDs:

| Friendly Name | JIRA Field ID | Notes |
|--------------|---------------|-------|
| `summary` | `summary` | Direct mapping |
| `description` | `description` | Auto-converts markdown to ADF |
| `assigneeEmail` | `assignee` | Converts email to JIRA user object |
| `issueType` | `issuetype` | Converts name to issue type object |
| `priority` | `priority` | Converts name to priority object |
| `labels` | `labels` | Array of strings |
| `components` | `components` | Array of component names/objects |
| `fixVersions` | `fixVersions` | Array of version names/objects |
| `affectsVersions` | `versions` | Array of version names/objects |
| `dueDate` | `duedate` | ISO date string |
| `reporterEmail` | `reporter` | Converts email to JIRA user object |

## Field Value Formatting

The system automatically formats field values based on field type:

- **Email addresses** (assignee, reporter): Converted to `{emailAddress: "user@example.com"}`
- **Issue types**: Converted to `{name: "Story"}`
- **Priorities**: Converted to `{name: "High"}`
- **Arrays** (labels, components, versions): Handled as arrays
- **Description**: Markdown converted to ADF format
- **Custom fields**: Passed through as-is (JIRA will validate)

## Error Handling

The update function provides specific error messages for:

- **Ticket not found (404)**: "Ticket DHK-123 not found or you don't have access to it"
- **Permission denied (403)**: "You don't have permission to update ticket DHK-123"
- **Invalid field (400)**: "Invalid field data. Please check the field names and values"
- **Invalid ticket key format**: "Invalid ticket key format: ABC. Expected format: PROJECT-123"
- **No fields provided**: "At least one field must be provided for update"

## Configuration

No additional environment variables are required. The field mapper supports standard fields out of the box, and custom fields can be referenced directly by their field ID.

### Finding Custom Field IDs

To find custom field IDs in JIRA:
1. Go to JIRA Settings → Issues → Custom Fields
2. Click on a custom field
3. The field ID is in the URL or can be found via JIRA API: `/rest/api/3/field`

## Testing

### Test Update Endpoint
```bash
curl -X POST https://your-app.vercel.app/tools/update_jira_ticket_DHK \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MySecretToken123!" \
  -d '{
    "ticketKey": "DHK-123",
    "fields": {
      "summary": "Updated summary",
      "priority": "High"
    }
  }'
```

### Test Discovery Endpoint
```bash
curl https://your-app.vercel.app/discovery
```

The discovery endpoint will now show both `create_jira_ticket_with_fields` and `update_jira_ticket_DHK` tools.

## Next Steps

1. **Deploy to Vercel** - Changes will auto-deploy via GitHub Actions
2. **Test with Opal** - The new tool should appear in Opal's discovery
3. **Configure Custom Fields** - If needed, document custom field IDs for users
4. **Monitor Usage** - Track which fields are being updated most frequently

## Notes

- Field names are case-insensitive
- Description field automatically converts markdown to JIRA ADF format
- The system validates ticket key format before attempting update
- All updates are atomic (all fields updated in a single API call)
- If a field update fails, the entire operation fails (no partial updates)

