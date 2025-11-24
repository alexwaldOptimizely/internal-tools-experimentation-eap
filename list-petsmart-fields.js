/**
 * Simple script to list all JIRA fields for Petsmart
 */

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://petsmart.atlassian.net';
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL || 'alex.wald@optimizely.com';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || '';

if (!JIRA_API_TOKEN) {
  console.error('Error: JIRA_API_TOKEN environment variable is required');
  console.error('Usage: JIRA_BASE_URL=... JIRA_USER_EMAIL=... JIRA_API_TOKEN=... node list-petsmart-fields.js');
  process.exit(1);
}

async function listFields() {
  const credentials = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  
  const response = await fetch(`${JIRA_BASE_URL}/rest/api/2/field`, {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json'
    }
  });
  
  const fields = await response.json();
  
  console.log('=== ALL FIELDS ===\n');
  console.log(`Total fields: ${fields.length}\n`);
  
  // Find standard fields we care about
  const standardFields = ['summary', 'description', 'priority', 'labels'];
  console.log('=== STANDARD FIELDS WE NEED ===\n');
  standardFields.forEach(fieldId => {
    const field = fields.find(f => f.id === fieldId || f.key === fieldId);
    if (field) {
      console.log(`  ${field.id.padEnd(25)} : ${field.name}`);
    } else {
      console.log(`  ${fieldId.padEnd(25)} : NOT FOUND`);
    }
  });
  
  // Show all custom fields
  const customFields = fields.filter(f => f.custom === true);
  console.log(`\n=== CUSTOM FIELDS (${customFields.length} total) ===\n`);
  
  // Group by likely purpose
  const storyPointsFields = [];
  const otherCustomFields = [];
  
  customFields.forEach(field => {
    const nameLower = field.name.toLowerCase();
    if (nameLower.includes('story') && (nameLower.includes('point') || nameLower.includes('estimate'))) {
      storyPointsFields.push(field);
    } else if (nameLower.includes('point') && !nameLower.includes('priority')) {
      storyPointsFields.push(field);
    } else {
      otherCustomFields.push(field);
    }
  });
  
  if (storyPointsFields.length > 0) {
    console.log('⭐ LIKELY STORY POINTS FIELDS:');
    storyPointsFields.forEach(field => {
      console.log(`  ${field.id.padEnd(25)} : ${field.name} (${field.type || 'N/A'})`);
    });
    console.log('');
  }
  
  // Show first 50 other custom fields
  console.log('📝 OTHER CUSTOM FIELDS:');
  otherCustomFields.slice(0, 50).forEach(field => {
    console.log(`  ${field.id.padEnd(25)} : ${field.name} (${field.type || 'N/A'})`);
  });
  
  if (otherCustomFields.length > 50) {
    console.log(`  ... and ${otherCustomFields.length - 50} more`);
  }
  
  // Generate environment variables
  console.log(`\n=== RECOMMENDED ENVIRONMENT VARIABLES ===\n`);
  console.log('JIRA_FIELD_SUMMARY=summary');
  console.log('JIRA_FIELD_DESCRIPTION=description');
  console.log('JIRA_FIELD_PRIORITY=priority');
  console.log('JIRA_FIELD_LABELS=labels');
  
  if (storyPointsFields.length > 0) {
    console.log(`JIRA_FIELD_STORY_POINTS=${storyPointsFields[0].id}  # ${storyPointsFields[0].name}`);
  } else {
    console.log('# JIRA_FIELD_STORY_POINTS=customfield_XXXXX  # Find from custom fields above');
  }
}

listFields().catch(console.error);

