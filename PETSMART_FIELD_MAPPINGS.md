# Petsmart JIRA Field Mappings

## Base Configuration

```
JIRA_BASE_URL=https://petsmart.atlassian.net
JIRA_USER_EMAIL=oruhland@petsmart.com
JIRA_API_TOKEN=YOUR_API_TOKEN_HERE
JIRA_PROJECT_KEY=DTO
JIRA_DEFAULT_ISSUE_TYPE=Story
JIRA_DEFAULT_ASIGNEE_EMAIL=oruhland@petsmart.com
```

## Standard Field Mappings

These are standard JIRA fields that should work as-is:

```
JIRA_FIELD_SUMMARY=summary
JIRA_FIELD_DESCRIPTION=description
JIRA_FIELD_PRIORITY=priority
JIRA_FIELD_LABELS=labels
```

## Story Points Field

Petsmart has multiple Story Points fields. The most common ones are:

- `customfield_10016` - **Story point estimate** (recommended - this is the standard JIRA Story Points field)
- `customfield_10034` - Story Points
- `customfield_10323` - Burned Story points
- `customfield_10325` - Aggregate Story points
- `customfield_10329` - Total Story Points
- `customfield_10332` - Total User Story Points

**Recommended:**
```
JIRA_FIELD_STORY_POINTS=customfield_10016
```

## Other Useful Custom Fields Found

Based on ticket DTO-667, here are some other custom fields that might be useful:

- `customfield_10151` - Metrics
- `customfield_10156` - Priority Score
- `customfield_10157` - Hypothesis
- `customfield_10158` - Experiment Details
- `customfield_10159` - Target Audience
- `customfield_10205` - Digital Description
- `customfield_10231` - Report Link
- `customfield_10236` - Experience URL
- `customfield_10239` - Squad Alignment
- `customfield_10248` - Device Type
- `customfield_10250` - Market
- `customfield_10255` - Description (DCDD)
- `customfield_10292` - Incremental Value
- `customfield_10336` - Traffic Distribution
- `customfield_10337` - Test Outcome

## Complete Vercel Environment Variables

Copy these into Vercel:

```
JIRA_BASE_URL=https://petsmart.atlassian.net
JIRA_USER_EMAIL=oruhland@petsmart.com
JIRA_API_TOKEN=YOUR_API_TOKEN_HERE
JIRA_PROJECT_KEY=DTO
JIRA_DEFAULT_ISSUE_TYPE=Story
JIRA_DEFAULT_ASIGNEE_EMAIL=oruhland@petsmart.com
JIRA_FIELD_SUMMARY=summary
JIRA_FIELD_DESCRIPTION=description
JIRA_FIELD_PRIORITY=priority
JIRA_FIELD_LABELS=labels
JIRA_FIELD_STORY_POINTS=customfield_10016
```

## Notes

- Total custom fields found: 456
- The ticket DTO-667 is an Epic, which is why Story Points wasn't set on it
- For Story/Task tickets, use `customfield_10016` for Story Points
- All field IDs were discovered via JIRA API v3

