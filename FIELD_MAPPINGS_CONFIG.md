# Field Mappings Configuration Guide

## Overview

The JIRA integration tool uses individual environment variables for each field. This allows you to configure the JIRA field ID for each field that Opal will send.

## Configuration

### Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `JIRA_FIELD_SUMMARY` | `summary` | JIRA field ID for summary |
| `JIRA_FIELD_DESCRIPTION` | `description` | JIRA field ID for description |
| `JIRA_FIELD_PRIORITY` | `priority` | JIRA field ID for priority |
| `JIRA_FIELD_STORY_POINTS` | `customfield_10016` | JIRA field ID for story points (replace with your field ID) |
| `JIRA_FIELD_LABELS` | `labels` | JIRA field ID for labels |

### Example Configuration

For the first client with standard fields:

```
JIRA_FIELD_SUMMARY=summary
JIRA_FIELD_DESCRIPTION=description
JIRA_FIELD_PRIORITY=priority
JIRA_FIELD_STORY_POINTS=customfield_10016
JIRA_FIELD_LABELS=labels
```

**Note**: Replace `customfield_10016` with your actual Story Points custom field ID.

## How It Works

1. **Field Name Mapping**: The system maps friendly field names to JIRA field IDs:
   - `summary` → Uses `JIRA_FIELD_SUMMARY` (defaults to `summary` if not set)
   - `description` → Uses `JIRA_FIELD_DESCRIPTION` (defaults to `description` if not set)
   - `priority` → Uses `JIRA_FIELD_PRIORITY` (defaults to `priority` if not set)
   - `storyPoints`, `storypoints`, `story points`, `points`, `pts` → Uses `JIRA_FIELD_STORY_POINTS`
   - `labels`, `label` → Uses `JIRA_FIELD_LABELS` (defaults to `labels` if not set)

2. **Case Insensitive**: Field names are automatically handled case-insensitively
   - `Priority`, `priority`, `PRIORITY` all work the same
   - `storyPoints`, `Story Points`, `STORY_POINTS` all work the same

3. **Normalization**: Spaces, underscores, and hyphens are automatically normalized
   - `story points` = `storypoints` = `story_points` = `story-points`

4. **Defaults**: If an environment variable is not set, the system uses standard JIRA field IDs

## Finding Custom Field IDs

To find custom field IDs in JIRA (like Story Points):

1. **Via JIRA UI**:
   - Go to JIRA Settings → Issues → Custom Fields
   - Click on the Story Points field
   - The field ID is in the URL: `...customfield_10016...`

2. **Via JIRA API**:
   ```bash
   curl -u email:token \
     https://your-instance.atlassian.net/rest/api/3/field
   ```
   Look for the `id` field in the response.

## Standard Field IDs

These are the default values if environment variables are not set:

- `JIRA_FIELD_SUMMARY` → `summary`
- `JIRA_FIELD_DESCRIPTION` → `description`
- `JIRA_FIELD_PRIORITY` → `priority`
- `JIRA_FIELD_LABELS` → `labels`

## Custom Fields

For custom fields like Story Points, you must set the environment variable:

- `JIRA_FIELD_STORY_POINTS` → `customfield_10016` (replace with your field ID)

The system will automatically map these field name variations to your custom field ID:
- `storyPoints`
- `storypoints`
- `story points`
- `story_points`
- `story-points`
- `points`
- `pts`

## Adding More Fields

To add more fields in the future, you would need to:
1. Add the environment variable mapping in `api/field-mapper.ts`
2. Add the environment variable to Vercel
3. Update this documentation

## Troubleshooting

### Field Not Working

1. Verify the environment variable is set in Vercel
2. Check that the field ID is correct
3. Ensure the field exists in your JIRA project
4. Redeploy after updating environment variables

### Custom Field Not Found

1. Verify the custom field ID is correct (starts with `customfield_`)
2. Check that the field exists in your JIRA project
3. Verify you have permission to set the field

### Environment Variable Not Loading

1. Ensure the variable is set for the correct environment (Production/Preview/Development)
2. Redeploy after adding/updating the variable
3. Check Vercel logs for any errors

## Notes

- Environment variables are loaded once at application startup
- Changes require a redeploy to take effect
- Field names are case-insensitive and handle spaces/underscores/hyphens automatically
- The system is backward compatible - works with defaults if variables are not set
