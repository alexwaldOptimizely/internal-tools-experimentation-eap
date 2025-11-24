/**
 * Script to fetch a specific JIRA ticket and show all fields
 * Usage: node fetch-ticket-fields.js TICKET-KEY
 */

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://optimizely-ext.atlassian.net';
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL || 'alex.wald@optimizely.com';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || '';

const ticketKey = process.argv[2] || 'DTO-667';

if (!JIRA_API_TOKEN) {
  console.error('Error: JIRA_API_TOKEN environment variable is required');
  console.error('Usage: JIRA_BASE_URL=... JIRA_USER_EMAIL=... JIRA_API_TOKEN=... node fetch-ticket-fields.js TICKET-KEY');
  process.exit(1);
}

async function fetchTicketFields() {
  try {
    const credentials = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    
    console.log(`Fetching ticket ${ticketKey}...`);
    console.log(`Base URL: ${JIRA_BASE_URL}\n`);
    
    // Try API v3 first, fall back to v2
    let apiVersion = '3';
    let fieldsUrl = `${JIRA_BASE_URL}/rest/api/3/field`;
    let fieldsResponse = await fetch(fieldsUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // If v3 fails, try v2
    if (!fieldsResponse.ok && fieldsResponse.status === 404) {
      console.log('API v3 not available, trying v2...');
      apiVersion = '2';
      fieldsUrl = `${JIRA_BASE_URL}/rest/api/2/field`;
      fieldsResponse = await fetch(fieldsUrl, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    if (!fieldsResponse.ok) {
      throw new Error(`Failed to fetch fields: ${fieldsResponse.status}`);
    }

    const allFields = await fieldsResponse.json();
    const fieldMap = {};
    allFields.forEach(field => {
      fieldMap[field.id] = field;
    });
    
    // Now fetch the ticket
    const issueUrl = `${JIRA_BASE_URL}/rest/api/${apiVersion}/issue/${ticketKey}`;
    const issueResponse = await fetch(issueUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!issueResponse.ok) {
      const errorText = await issueResponse.text();
      throw new Error(`Failed to fetch ticket: ${issueResponse.status} - ${errorText}`);
    }

    const issue = await issueResponse.json();
    const issueFields = issue.fields;
    
    console.log('=== TICKET INFORMATION ===\n');
    console.log(`Key: ${issue.key}`);
    console.log(`Summary: ${issueFields.summary || 'N/A'}`);
    console.log(`Issue Type: ${issueFields.issuetype?.name || 'N/A'}`);
    console.log(`Status: ${issueFields.status?.name || 'N/A'}`);
    console.log(`Priority: ${issueFields.priority?.name || 'N/A'}`);
    console.log(`Assignee: ${issueFields.assignee?.displayName || 'Unassigned'}`);
    console.log(`Reporter: ${issueFields.reporter?.displayName || 'N/A'}`);
    console.log(`Labels: ${issueFields.labels?.join(', ') || 'None'}`);
    
    // Show description if it exists
    if (issueFields.description) {
      console.log(`\nDescription:`);
      if (typeof issueFields.description === 'string') {
        console.log(issueFields.description);
      } else if (issueFields.description.content) {
        // ADF format - extract text
        const extractText = (node) => {
          if (node.text) return node.text;
          if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractText).join('');
          }
          return '';
        };
        const descText = extractText(issueFields.description);
        console.log(descText || '[Rich text description]');
      }
    }
    
    console.log(`\n=== STANDARD FIELDS ===\n`);
    const standardFields = [
      { id: 'summary', name: 'Summary' },
      { id: 'description', name: 'Description' },
      { id: 'priority', name: 'Priority' },
      { id: 'labels', name: 'Labels' },
      { id: 'components', name: 'Components' },
      { id: 'fixVersions', name: 'Fix Versions' },
      { id: 'duedate', name: 'Due Date' },
      { id: 'reporter', name: 'Reporter' },
      { id: 'assignee', name: 'Assignee' },
      { id: 'issuetype', name: 'Issue Type' },
      { id: 'status', name: 'Status' }
    ];
    
    standardFields.forEach(({ id, name }) => {
      const value = issueFields[id];
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && value.name) {
          console.log(`  ${id.padEnd(20)} : ${name.padEnd(20)} = ${value.name}`);
        } else if (typeof value === 'object' && value.displayName) {
          console.log(`  ${id.padEnd(20)} : ${name.padEnd(20)} = ${value.displayName}`);
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            const items = value.map(v => v.name || v.displayName || v).join(', ');
            console.log(`  ${id.padEnd(20)} : ${name.padEnd(20)} = [${items}]`);
          } else {
            console.log(`  ${id.padEnd(20)} : ${name.padEnd(20)} = []`);
          }
        } else if (typeof value === 'string') {
          console.log(`  ${id.padEnd(20)} : ${name.padEnd(20)} = "${value}"`);
        } else {
          console.log(`  ${id.padEnd(20)} : ${name.padEnd(20)} = ${value}`);
        }
      }
    });
    
    console.log(`\n=== CUSTOM FIELDS WITH VALUES ===\n`);
    const customFieldsWithValues = [];
    
    for (const [fieldId, value] of Object.entries(issueFields)) {
      if (fieldId.startsWith('customfield_') && value !== null && value !== undefined) {
        const fieldInfo = fieldMap[fieldId];
        const fieldName = fieldInfo ? fieldInfo.name : 'Unknown Field';
        const fieldType = fieldInfo ? fieldInfo.type : 'unknown';
        
        let displayValue = value;
        if (typeof value === 'object' && value.name) {
          displayValue = value.name;
        } else if (typeof value === 'object' && value.value) {
          displayValue = value.value;
        } else if (typeof value === 'object' && value.displayName) {
          displayValue = value.displayName;
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            displayValue = value.map(v => v.name || v.displayName || v).join(', ');
          } else {
            displayValue = '[empty]';
          }
        } else if (typeof value === 'object' && value.content) {
          // ADF format
          const extractText = (node) => {
            if (node.text) return node.text;
            if (node.content && Array.isArray(node.content)) {
              return node.content.map(extractText).join('');
            }
            return '';
          };
          displayValue = extractText(value) || '[Rich text]';
        }
        
        customFieldsWithValues.push({
          id: fieldId,
          name: fieldName,
          value: displayValue,
          type: fieldType,
          rawValue: value
        });
      }
    }
    
    // Sort by field ID
    customFieldsWithValues.sort((a, b) => {
      const aNum = parseInt(a.id.replace('customfield_', ''));
      const bNum = parseInt(b.id.replace('customfield_', ''));
      return aNum - bNum;
    });
    
    if (customFieldsWithValues.length === 0) {
      console.log('  No custom fields with values found.\n');
    } else {
      customFieldsWithValues.forEach(({ id, name, value, type }) => {
        const valueStr = typeof value === 'string' && value.length > 80 
          ? value.substring(0, 80) + '...' 
          : String(value);
        console.log(`  ${id.padEnd(20)} : ${name.padEnd(40)} = ${valueStr} (${type})`);
      });
    }
    
    // Identify likely fields for our mapping
    console.log(`\n=== FIELD IDENTIFICATION FOR MAPPING ===\n`);
    
    // Find Story Points
    const storyPointsFields = customFieldsWithValues.filter(f => {
      const nameLower = f.name.toLowerCase();
      return (nameLower.includes('story') && (nameLower.includes('point') || nameLower.includes('estimate'))) ||
             (nameLower.includes('point') && !nameLower.includes('priority'));
    });
    
    if (storyPointsFields.length > 0) {
      console.log('⭐ Story Points Field:');
      storyPointsFields.forEach(f => {
        console.log(`   ${f.id} = "${f.name}" (value: ${f.value})`);
      });
    } else {
      console.log('⚠️  Story Points field not found in this ticket');
    }
    
    // Show all custom field IDs for easy copying
    console.log(`\n=== ALL CUSTOM FIELD IDs (for environment variables) ===\n`);
    if (customFieldsWithValues.length > 0) {
      customFieldsWithValues.forEach(({ id, name }) => {
        console.log(`# ${name}`);
        console.log(`# ${id}`);
      });
    }
    
    // Generate recommended environment variables
    console.log(`\n=== RECOMMENDED ENVIRONMENT VARIABLES ===\n`);
    console.log('JIRA_FIELD_SUMMARY=summary');
    console.log('JIRA_FIELD_DESCRIPTION=description');
    console.log('JIRA_FIELD_PRIORITY=priority');
    console.log('JIRA_FIELD_LABELS=labels');
    
    if (storyPointsFields.length > 0) {
      console.log(`JIRA_FIELD_STORY_POINTS=${storyPointsFields[0].id}  # ${storyPointsFields[0].name}`);
    } else {
      console.log('# JIRA_FIELD_STORY_POINTS=customfield_XXXXX  # Find Story Points field ID from field list above');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

fetchTicketFields();

