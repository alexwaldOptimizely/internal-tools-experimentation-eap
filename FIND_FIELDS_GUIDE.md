# Finding JIRA Field IDs for New Clients

## Quick Start

Use the `find-jira-fields.js` script to discover all field IDs for a new JIRA instance.

### Basic Usage

```bash
JIRA_BASE_URL=https://client.atlassian.net \
JIRA_USER_EMAIL=your-email@client.com \
JIRA_API_TOKEN=your_api_token \
node find-jira-fields.js
```

### With Ticket Analysis

To also see which fields are used in a specific ticket:

```bash
JIRA_BASE_URL=https://client.atlassian.net \
JIRA_USER_EMAIL=your-email@client.com \
JIRA_API_TOKEN=your_api_token \
node find-jira-fields.js CLIENT-123
```

## What the Script Does

1. **Fetches All Fields** - Gets all fields from the JIRA instance via REST API
2. **Categorizes Fields** - Separates standard fields from custom fields
3. **Identifies Common Fields** - Highlights likely Story Points, Epic, and Priority fields
4. **Shows Field IDs** - Displays field ID and name for easy reference
5. **Ticket Analysis** - If ticket key provided, shows which fields have values

## Output Format

The script will show:

### Standard Fields
```
summary              : Summary (string)
description          : Description (text)
priority             : Priority (priority)
labels               : Labels (array)
```

### Custom Fields (Highlighted)
```
⭐ LIKELY STORY POINTS FIELDS:
  customfield_10016   : Story point estimate (number)
  customfield_10127   : Story Points (number)

📋 EPIC FIELDS:
  customfield_10014   : Epic Link (epic)
```

### Recommended Environment Variables
At the end, it will suggest the environment variables to set in Vercel.

## Getting JIRA API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a label (e.g., "JIRA Field Discovery")
4. Copy the token
5. Use it as `JIRA_API_TOKEN`

## Setting Up for New Client

1. **Run the script** to discover fields:
   ```bash
   JIRA_BASE_URL=https://newclient.atlassian.net \
   JIRA_USER_EMAIL=your-email@newclient.com \
   JIRA_API_TOKEN=token_here \
   node find-jira-fields.js
   ```

2. **Identify key fields**:
   - Story Points (look for fields with "story" and "point" in name)
   - Priority (usually standard, but check if custom)
   - Labels (usually standard)
   - Any other custom fields needed

3. **Set environment variables in Vercel**:
   - `JIRA_FIELD_SUMMARY=summary`
   - `JIRA_FIELD_DESCRIPTION=description`
   - `JIRA_FIELD_PRIORITY=priority`
   - `JIRA_FIELD_STORY_POINTS=customfield_XXXXX` (from script output)
   - `JIRA_FIELD_LABELS=labels`

4. **Test with a ticket** (optional):
   ```bash
   node find-jira-fields.js CLIENT-123
   ```
   This shows which fields are actually used in that ticket.

## Troubleshooting

### Authentication Error
- Verify `JIRA_API_TOKEN` is correct
- Check `JIRA_USER_EMAIL` matches the account that created the token
- Ensure token hasn't expired

### No Fields Returned
- Check `JIRA_BASE_URL` is correct
- Verify you have permission to view fields
- Check network connectivity

### Can't Find Story Points Field
- Look for fields with "point", "estimate", "size", or "effort" in the name
- Check the "OTHER CUSTOM FIELDS" section
- The field might be named differently (e.g., "Story Points", "Points", "SP")

## Example Output

```
=== STANDARD FIELDS ===

  summary             : Summary (string)
  description         : Description (text)
  priority            : Priority (priority)
  labels              : Labels (array)

=== CUSTOM FIELDS (250 total) ===

⭐ LIKELY STORY POINTS FIELDS:
  customfield_10016   : Story point estimate (number)

📋 EPIC FIELDS:
  customfield_10014   : Epic Link (epic)

=== RECOMMENDED ENVIRONMENT VARIABLES ===

JIRA_FIELD_SUMMARY=summary
JIRA_FIELD_DESCRIPTION=description
JIRA_FIELD_PRIORITY=priority
JIRA_FIELD_LABELS=labels
JIRA_FIELD_STORY_POINTS=customfield_10016
```

