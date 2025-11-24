# Finding JIRA Field IDs for Petsmart

## Current Status

The API token provided doesn't have permission to:
- View ticket DTO-667
- Access custom field metadata via API

## Alternative Methods to Find Field IDs

### Method 1: Via JIRA UI (Easiest)

1. **Open any ticket in the DTO project** in JIRA
2. **Right-click on a field** (e.g., Story Points, Priority) and select "Inspect" or "Inspect Element"
3. **Look for the field ID** in the HTML - it will be something like `customfield_10016`
4. **Or go to JIRA Settings**:
   - Go to JIRA Settings → Issues → Custom Fields
   - Click on the custom field you need (e.g., "Story Points")
   - The field ID is in the URL: `...customfield_10016...`

### Method 2: Use Browser Developer Tools

1. Open a ticket in JIRA (e.g., DTO-667)
2. Open browser Developer Tools (F12)
3. Go to Network tab
4. Refresh the page
5. Look for API calls to `/rest/api/3/issue/DTO-667` or similar
6. Check the response - it will show all fields with their IDs

### Method 3: Use a Ticket You Can Access

If you have access to a different ticket, run:

```bash
JIRA_BASE_URL=https://petsmart.atlassian.net \
JIRA_USER_EMAIL=your-email@optimizely.com \
JIRA_API_TOKEN=your_token \
node fetch-ticket-fields.js TICKET-KEY
```

### Method 4: Check JIRA Project Settings

1. Go to the DTO project in JIRA
2. Click Project Settings → Fields
3. This will show all fields used in the project
4. Custom fields will show their IDs

## Standard Fields (Usually These Work)

For most JIRA instances, these standard field IDs should work:

- `summary` - Summary/Title
- `description` - Description  
- `priority` - Priority
- `labels` - Labels

These don't need to be configured - they're standard JIRA fields.

## What You Need to Find

For the first client setup, you need to find:

1. **Story Points field ID** - Usually `customfield_10016` or similar
   - Look for fields named "Story Points", "Story point estimate", "Points", etc.

2. **Any other custom fields** you want to support

## Once You Have the Field IDs

Set these environment variables in Vercel:

```
JIRA_BASE_URL=https://petsmart.atlassian.net
JIRA_USER_EMAIL=your-email@optimizely.com
JIRA_API_TOKEN=your_token
JIRA_PROJECT_KEY=DTO
JIRA_FIELD_SUMMARY=summary
JIRA_FIELD_DESCRIPTION=description
JIRA_FIELD_PRIORITY=priority
JIRA_FIELD_STORY_POINTS=customfield_XXXXX  # Replace with actual ID
JIRA_FIELD_LABELS=labels
```

## Quick Test

Once you have a field ID, you can test it by creating a ticket with that field and seeing if it works.

