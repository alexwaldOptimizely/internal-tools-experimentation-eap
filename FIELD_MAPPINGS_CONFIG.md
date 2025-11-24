# Field Mappings Configuration Guide

## Overview

The JIRA integration tool supports custom field name mappings via the `JIRA_FIELD_MAPPINGS` environment variable. This allows you to:
- Handle typos and misspellings
- Support multiple field name variations
- Map custom field names to JIRA field IDs
- Provide case-insensitive field matching

## Configuration

### Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `JIRA_FIELD_MAPPINGS`
   - **Value**: JSON object (see format below)
   - **Environment**: Production, Preview, Development (as needed)

### Format

The `JIRA_FIELD_MAPPINGS` variable should be a JSON object where:
- **Key**: Field name variation (what users might type)
- **Value**: JIRA field ID (what JIRA expects)

```json
{
  "priority": "priority",
  "prio": "priority",
  "Priority": "priority",
  "PRIORITY": "priority",
  "storyPoints": "customfield_10016",
  "story points": "customfield_10016",
  "storypoints": "customfield_10016",
  "points": "customfield_10016",
  "Story Points": "customfield_10016",
  "labels": "labels",
  "label": "labels",
  "Labels": "labels"
}
```

### Example Configuration

For a client with custom fields for story points and epic:

```json
{
  "priority": "priority",
  "prio": "priority",
  "storyPoints": "customfield_10016",
  "story points": "customfield_10016",
  "points": "customfield_10016",
  "epic": "customfield_10017",
  "Epic Link": "customfield_10017",
  "epicLink": "customfield_10017"
}
```

## How It Works

1. **Field Name Normalization**: The system automatically normalizes field names by:
   - Converting to lowercase
   - Removing spaces, underscores, and hyphens
   - Trimming whitespace

2. **Lookup Process**:
   - First checks exact match (case-insensitive)
   - Then checks normalized match
   - Falls back to original field name
   - If still not found, returns the original (may be a valid custom field ID)

3. **Error Handling**:
   - Invalid field names trigger suggestions
   - Error messages show: `"prio" (did you mean: priority?)`
   - Custom fields (starting with `customfield_`) bypass validation

## Standard Fields (Pre-mapped)

These fields are already mapped and don't need to be in `JIRA_FIELD_MAPPINGS`:

- `summary`, `description`
- `assignee`, `assigneeEmail`
- `issueType`, `issuetype`
- `priority`
- `labels`
- `components`
- `fixVersions`, `affectsVersions`
- `dueDate`, `duedate`
- `reporter`, `reporterEmail`
- `environment`, `parent`

You can still add variations/aliases for these in `JIRA_FIELD_MAPPINGS` to override or extend.

## Finding Custom Field IDs

To find custom field IDs in JIRA:

1. **Via JIRA UI**:
   - Go to JIRA Settings → Issues → Custom Fields
   - Click on a custom field
   - The field ID is in the URL: `...customfield_10016...`

2. **Via JIRA API**:
   ```bash
   curl -u email:token \
     https://your-instance.atlassian.net/rest/api/3/field
   ```
   Look for the `id` field in the response.

## Best Practices

1. **Include Common Variations**:
   - Case variations: `"Priority"`, `"PRIORITY"`, `"priority"`
   - Spacing: `"story points"`, `"storypoints"`, `"story_points"`
   - Abbreviations: `"prio"` → `"priority"`, `"pts"` → `"storyPoints"`

2. **Handle Typos**:
   - Common misspellings: `"priorty"` → `"priority"`
   - Common typos for your team

3. **Document Custom Fields**:
   - Map friendly names to custom field IDs
   - Include multiple variations

4. **Test Your Mappings**:
   - Test with various case combinations
   - Test with spaces/underscores/hyphens
   - Verify custom field IDs are correct

## Example: Complete Configuration

```json
{
  "priority": "priority",
  "Priority": "priority",
  "PRIORITY": "priority",
  "prio": "priority",
  "pri": "priority",
  "labels": "labels",
  "label": "labels",
  "Labels": "labels",
  "storyPoints": "customfield_10016",
  "story points": "customfield_10016",
  "storypoints": "customfield_10016",
  "Story Points": "customfield_10016",
  "points": "customfield_10016",
  "pts": "customfield_10016",
  "epic": "customfield_10017",
  "epicLink": "customfield_10017",
  "Epic Link": "customfield_10017",
  "components": "components",
  "component": "components",
  "Components": "components"
}
```

## Troubleshooting

### Field Not Found Errors

If you see errors like:
```
Invalid field names: prio (did you mean: priority?)
```

1. Add the mapping to `JIRA_FIELD_MAPPINGS`:
   ```json
   {"prio": "priority"}
   ```

2. Redeploy or wait for environment variable to update

### Custom Fields Not Working

1. Verify the custom field ID is correct
2. Ensure the field ID starts with `customfield_`
3. Check that the field exists in your JIRA project
4. Verify you have permission to set the field

### Environment Variable Not Loading

1. Check that the JSON is valid (use a JSON validator)
2. Ensure the variable is set for the correct environment (Production/Preview/Development)
3. Redeploy after adding/updating the variable
4. Check Vercel logs for parsing errors

## Notes

- Field mappings are loaded once at application startup
- Changes to `JIRA_FIELD_MAPPINGS` require a redeploy to take effect
- Custom field IDs (starting with `customfield_`) bypass validation
- The system is backward compatible - works without `JIRA_FIELD_MAPPINGS` set

