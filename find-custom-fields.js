/**
 * Script to fetch a JIRA ticket and identify custom field IDs
 * Usage: node find-custom-fields.js DHK-4235
 * 
 * Set environment variables:
 * - JIRA_BASE_URL (default: https://optimizely-ext.atlassian.net)
 * - JIRA_USER_EMAIL (default: alex.wald@optimizely.com)
 * - JIRA_API_TOKEN (required)
 */

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://optimizely-ext.atlassian.net';
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL || 'alex.wald@optimizely.com';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || '';

if (!JIRA_API_TOKEN) {
  console.error('Error: JIRA_API_TOKEN environment variable is required');
  process.exit(1);
}

const ticketKey = process.argv[2] || 'DHK-4235';

async function fetchTicket() {
  try {
    const credentials = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const url = `${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}`;
    
    console.log(`Fetching ticket ${ticketKey}...`);
    console.log(`URL: ${url}\n`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JIRA API Error (${response.status}): ${errorText}`);
    }

    const issue = await response.json();
    
    console.log('=== TICKET FIELDS ===\n');
    console.log(`Key: ${issue.key}`);
    console.log(`Summary: ${issue.fields.summary}`);
    console.log(`Issue Type: ${issue.fields.issuetype?.name}`);
    console.log(`Priority: ${issue.fields.priority?.name}`);
    console.log(`Labels: ${issue.fields.labels?.join(', ') || 'None'}`);
    console.log(`\n=== CUSTOM FIELDS ===\n`);
    
    // Find all custom fields (fields starting with customfield_)
    const customFields = [];
    const allFields = [];
    
    for (const [fieldId, value] of Object.entries(issue.fields)) {
      allFields.push({ fieldId, value });
      
      if (fieldId.startsWith('customfield_')) {
        customFields.push({ fieldId, value });
      }
    }
    
    // Sort custom fields by field ID
    customFields.sort((a, b) => a.fieldId.localeCompare(b.fieldId));
    
    if (customFields.length === 0) {
      console.log('No custom fields found in this ticket.\n');
    } else {
      console.log(`Found ${customFields.length} custom field(s):\n`);
      customFields.forEach(({ fieldId, value }) => {
        // Try to identify what the field is based on value type and content
        let fieldType = 'Unknown';
        let displayValue = value;
        
        if (typeof value === 'number') {
          fieldType = 'Number';
          displayValue = value;
          // Story Points is typically a number
          if (value > 0 && value <= 100) {
            console.log(`  ${fieldId}: ${value} (${fieldType}) ⭐ LIKELY STORY POINTS`);
          } else {
            console.log(`  ${fieldId}: ${value} (${fieldType})`);
          }
        } else if (typeof value === 'string') {
          fieldType = 'String';
          console.log(`  ${fieldId}: "${value}" (${fieldType})`);
        } else if (Array.isArray(value)) {
          fieldType = 'Array';
          console.log(`  ${fieldId}: [${value.length} items] (${fieldType})`);
        } else if (value && typeof value === 'object') {
          fieldType = 'Object';
          if (value.name) {
            displayValue = value.name;
            console.log(`  ${fieldId}: ${value.name} (${fieldType})`);
          } else if (value.value) {
            displayValue = value.value;
            console.log(`  ${fieldId}: ${value.value} (${fieldType})`);
          } else {
            console.log(`  ${fieldId}: ${JSON.stringify(value).substring(0, 50)}... (${fieldType})`);
          }
        } else if (value === null) {
          console.log(`  ${fieldId}: null (Empty)`);
        } else {
          console.log(`  ${fieldId}: ${value} (${fieldType})`);
        }
      });
    }
    
    // Also show standard fields that might be useful
    console.log(`\n=== STANDARD FIELDS ===\n`);
    const standardFields = [
      { id: 'summary', name: 'Summary' },
      { id: 'description', name: 'Description' },
      { id: 'priority', name: 'Priority' },
      { id: 'labels', name: 'Labels' },
      { id: 'components', name: 'Components' },
      { id: 'fixVersions', name: 'Fix Versions' },
      { id: 'duedate', name: 'Due Date' }
    ];
    
    standardFields.forEach(({ id, name }) => {
      const value = issue.fields[id];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          console.log(`  ${id}: [${value.length} items]`);
        } else if (typeof value === 'object' && value.name) {
          console.log(`  ${id}: ${value.name}`);
        } else {
          console.log(`  ${id}: ${value}`);
        }
      }
    });
    
    // Try to get field metadata to see field names
    console.log(`\n=== FETCHING FIELD METADATA ===\n`);
    try {
      const fieldsUrl = `${JIRA_BASE_URL}/rest/api/3/field`;
      const fieldsResponse = await fetch(fieldsUrl, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (fieldsResponse.ok) {
        const fields = await fieldsResponse.json();
        const fieldMap = {};
        fields.forEach(field => {
          fieldMap[field.id] = field;
        });
        
        console.log('Custom field names:\n');
        customFields.forEach(({ fieldId }) => {
          const fieldInfo = fieldMap[fieldId];
          if (fieldInfo) {
            console.log(`  ${fieldId}: "${fieldInfo.name}" (${fieldInfo.type})`);
            if (fieldInfo.name.toLowerCase().includes('story') || 
                fieldInfo.name.toLowerCase().includes('point')) {
              console.log(`    ⭐ THIS IS LIKELY STORY POINTS!`);
            }
          }
        });
      }
    } catch (error) {
      console.log(`Could not fetch field metadata: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error fetching ticket:', error.message);
    process.exit(1);
  }
}

fetchTicket();

