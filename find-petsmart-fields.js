/**
 * Script to find JIRA field IDs for Petsmart
 * Run with: node find-petsmart-fields.js
 */

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://petsmart.atlassian.net';
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL || 'alex.wald@optimizely.com';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || '';

if (!JIRA_API_TOKEN) {
  console.error('Error: JIRA_API_TOKEN environment variable is required');
  console.error('Usage: JIRA_BASE_URL=... JIRA_USER_EMAIL=... JIRA_API_TOKEN=... node find-petsmart-fields.js [ticketKey]');
  process.exit(1);
}

async function findFields() {
  const credentials = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  
  console.log('Fetching fields from Petsmart JIRA...\n');
  
  // Try to get fields via API v3
  try {
    const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/field`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const fields = await response.json();
      const customFields = fields.filter(f => f.id.startsWith('customfield_'));
      
      console.log(`Found ${fields.length} total fields, ${customFields.length} custom fields\n`);
      
      if (customFields.length > 0) {
        console.log('=== CUSTOM FIELDS ===\n');
        customFields.forEach(f => {
          const nameLower = f.name.toLowerCase();
          let marker = '';
          if (nameLower.includes('story') && (nameLower.includes('point') || nameLower.includes('estimate'))) {
            marker = ' ⭐ LIKELY STORY POINTS';
          } else if (nameLower.includes('priority')) {
            marker = ' 🔴 PRIORITY';
          } else if (nameLower.includes('epic')) {
            marker = ' 📋 EPIC';
          }
          console.log(`  ${f.id.padEnd(25)} : ${f.name}${marker}`);
        });
      } else {
        console.log('⚠️  No custom fields found via API. This might be a permissions issue.');
        console.log('   Try accessing a ticket directly in JIRA UI to find field IDs.\n');
      }
    }
  } catch (error) {
    console.log('Error fetching fields:', error.message);
  }
  
  // Try to get a ticket to see what fields it has
  const ticketKey = process.argv[2] || 'DTO-667';
  console.log(`\n=== TRYING TO FETCH TICKET ${ticketKey} ===\n`);
  
  try {
    const issueResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });
    
    if (issueResponse.ok) {
      const issue = await issueResponse.json();
      const fields = issue.fields;
      
      console.log(`✅ Successfully fetched ticket ${issue.key}`);
      console.log(`Summary: ${fields.summary || 'N/A'}\n`);
      
      // Find custom fields
      const customFields = [];
      for (const [fieldId, value] of Object.entries(fields)) {
        if (fieldId.startsWith('customfield_') && value !== null && value !== undefined) {
          customFields.push({ id: fieldId, value });
        }
      }
      
      if (customFields.length > 0) {
        console.log('=== CUSTOM FIELDS IN THIS TICKET ===\n');
        customFields.sort((a, b) => a.id.localeCompare(b.id));
        customFields.forEach(({ id, value }) => {
          let displayValue = value;
          if (typeof value === 'object' && value.name) displayValue = value.name;
          else if (typeof value === 'object' && value.value) displayValue = value.value;
          else if (Array.isArray(value)) displayValue = `[${value.length} items]`;
          console.log(`  ${id.padEnd(25)} : ${displayValue}`);
        });
      }
      
      // Show standard fields
      console.log('\n=== STANDARD FIELDS ===\n');
      console.log(`  summary    : ${fields.summary || 'N/A'}`);
      console.log(`  description: ${fields.description ? '[Has description]' : 'N/A'}`);
      console.log(`  priority   : ${fields.priority?.name || 'N/A'}`);
      console.log(`  labels     : ${fields.labels?.join(', ') || 'None'}`);
      
    } else {
      const errorText = await issueResponse.text();
      console.log(`❌ Cannot access ticket ${ticketKey}`);
      console.log(`   Error: ${errorText}\n`);
      console.log('This might be due to:');
      console.log('  - Ticket doesn\'t exist');
      console.log('  - API token doesn\'t have permission to view this ticket');
      console.log('  - Ticket is in a restricted project\n');
      console.log('💡 ALTERNATIVE: Find field IDs manually in JIRA:');
      console.log('   1. Open any ticket in the DTO project');
      console.log('   2. Go to JIRA Settings → Issues → Custom Fields');
      console.log('   3. Click on a custom field (e.g., Story Points)');
      console.log('   4. The field ID is in the URL: ...customfield_10016...');
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  console.log('\n=== RECOMMENDED ENVIRONMENT VARIABLES ===\n');
  console.log('For Petsmart JIRA, set these in Vercel:');
  console.log('JIRA_FIELD_SUMMARY=summary');
  console.log('JIRA_FIELD_DESCRIPTION=description');
  console.log('JIRA_FIELD_PRIORITY=priority');
  console.log('JIRA_FIELD_LABELS=labels');
  console.log('# JIRA_FIELD_STORY_POINTS=customfield_XXXXX  # Find from custom fields above or JIRA UI');
}

findFields().catch(console.error);

