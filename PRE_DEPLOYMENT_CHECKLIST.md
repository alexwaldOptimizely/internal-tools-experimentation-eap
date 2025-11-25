# Pre-Deployment Checklist

## ✅ Environment Variables in Vercel

Verify these are set in Vercel (Settings → Environment Variables):

- [x] `JIRA_FIELD_SUMMARY=summary`
- [x] `JIRA_FIELD_DESCRIPTION=description`
- [x] `JIRA_FIELD_PRIORITY=priority`
- [x] `JIRA_FIELD_STORY_POINTS=customfield_10016`
- [x] `JIRA_FIELD_LABELS=labels`

**Note**: Make sure `JIRA_FIELD_STORY_POINTS` is set to `customfield_10016` (not the default `customfield_10016` placeholder)

## ✅ Code Status

- [x] Code builds successfully (`npm run build`)
- [x] No linting errors
- [x] All changes committed and pushed to GitHub

## ✅ Functionality

The following features should work after deployment:

1. **Ticket Creation** - Can create tickets with:
   - Summary ✅
   - Description (with markdown support) ✅
   - Priority ✅
   - Story Points ✅
   - Labels ✅

2. **Ticket Updates** - Can update any field on existing tickets ✅

3. **Field Mapping** - Field names are automatically mapped via environment variables ✅

## 🚀 Deployment

Deployment happens automatically via GitHub Actions when you push to `main` branch.

After deployment:

1. **Test Health Endpoint**:
   ```bash
   curl https://your-app.vercel.app/health
   ```

2. **Test Discovery Endpoint**:
   ```bash
   curl https://your-app.vercel.app/discovery
   ```

3. **Test Ticket Creation** (with Bearer token):
   ```bash
   curl -X POST https://your-app.vercel.app/tools/create_jira_ticket \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer MySecretToken123!" \
     -d '{
       "summary": "Test ticket",
       "description": "## Test\n\nThis is a **test**",
       "priority": "High",
       "storyPoints": 3,
       "labels": ["test"]
     }'
   ```

4. **Verify in JIRA**:
   - Check that the ticket was created
   - Verify markdown renders correctly in description
   - Verify priority, story points, and labels are set correctly

## 📝 Notes

- Environment variables are loaded at application startup
- Changes to environment variables require a redeploy
- Field names are case-insensitive and handle spaces/underscores/hyphens automatically
- Story Points field ID: `customfield_10016` (confirmed from ticket DHK-4235)

