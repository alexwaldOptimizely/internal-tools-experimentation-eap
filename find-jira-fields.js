/**
 * Script to fetch all JIRA fields and their IDs from the REST API
 * Usage: node find-jira-fields.js [ticketKey]
 * 
 * Set environment variables:
 * - JIRA_BASE_URL (default: https://optimizely-ext.atlassian.net)
 * - JIRA_USER_EMAIL (default: alex.wald@optimizely.com)
 * - JIRA_API_TOKEN (required)
 * 
 * If ticketKey is provided, also shows fields from that ticket
 */

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://optimizely-ext.atlassian.net';
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL || 'alex.wald@optimizely.com';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || '';
const ticketKey = process.argv[2];

if (!JIRA_API_TOKEN) {
  console.error('Error: JIRA_API_TOKEN environment variable is required');
  console.error('Usage: JIRA_BASE_URL=... JIRA_USER_EMAIL=... JIRA_API_TOKEN=... node find-jira-fields.js [ticketKey]');
  process.exit(1);
}

async function fetchFields() {
  try {
    const credentials = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    
    console.log('Fetching all fields from JIRA...');
    console.log(`Base URL: ${JIRA_BASE_URL}\n`);
    
    // Fetch all fields
    const fieldsUrl = `${JIRA_BASE_URL}/rest/api/3/field`;
    const fieldsResponse = await fetch(fieldsUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!fieldsResponse.ok) {
      const errorText = await fieldsResponse.text();
      throw new Error(`JIRA API Error (${fieldsResponse.status}): ${errorText}`);
    }

    const fields = await fieldsResponse.json();
    
    // Separate standard and custom fields
    const standardFields = [];
    const customFields = [];
    
    fields.forEach(field => {
      if (field.id.startsWith('customfield_')) {
        customFields.push(field);
      } else {
        standardFields.push(field);
      }
    });
    
    // Sort custom fields by ID
    customFields.sort((a, b) => {
      const aNum = parseInt(a.id.replace('customfield_', ''));
      const bNum = parseInt(b.id.replace('customfield_', ''));
      return aNum - bNum;
    });
    
    console.log('=== STANDARD FIELDS ===\n');
    standardFields.forEach(field => {
      console.log(`  ${field.id.padEnd(20)} : ${field.name} (${field.type})`);
    });
    
    console.log(`\n=== CUSTOM FIELDS (${customFields.length} total) ===\n`);
    
    // Group by common field types/names
    const storyPointsFields = [];
    const priorityFields = [];
    const epicFields = [];
    const otherFields = [];
    
    customFields.forEach(field => {
      const nameLower = field.name.toLowerCase();
      if (nameLower.includes('story') && (nameLower.includes('point') || nameLower.includes('estimate'))) {
        storyPointsFields.push(field);
      } else if (nameLower.includes('epic')) {
        epicFields.push(field);
      } else if (nameLower.includes('priority')) {
        priorityFields.push(field);
      } else {
        otherFields.push(field);
      }
    });
    
    // Show likely Story Points fields first
    if (storyPointsFields.length > 0) {
      console.log('⭐ LIKELY STORY POINTS FIELDS:');
      storyPointsFields.forEach(field => {
        console.log(`  ${field.id.padEnd(20)} : ${field.name} (${field.type})`);
      });
      console.log('');
    }
    
    // Show Epic fields
    if (epicFields.length > 0) {
      console.log('📋 EPIC FIELDS:');
      epicFields.forEach(field => {
        console.log(`  ${field.id.padEnd(20)} : ${field.name} (${field.type})`);
      });
      console.log('');
    }
    
    // Show Priority fields
    if (priorityFields.length > 0) {
      console.log('🔴 PRIORITY FIELDS:');
      priorityFields.forEach(field => {
        console.log(`  ${field.id.padEnd(20)} : ${field.name} (${field.type})`);
      });
      console.log('');
    }
    
    // Show other custom fields (limit to first 50 for readability)
    console.log('📝 OTHER CUSTOM FIELDS:');
    const fieldsToShow = otherFields.slice(0, 50);
    fieldsToShow.forEach(field => {
      console.log(`  ${field.id.padEnd(20)} : ${field.name} (${field.type})`);
    });
    
    if (otherFields.length > 50) {
      console.log(`  ... and ${otherFields.length - 50} more custom fields`);
    }
    
    // If ticket key provided, show fields from that ticket
    if (ticketKey) {
      console.log(`\n=== FIELDS FROM TICKET ${ticketKey} ===\n`);
      try {
        const issueUrl = `${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}`;
        const issueResponse = await fetch(issueUrl, {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (issueResponse.ok) {
          const issue = await issueResponse.json();
          const issueFields = issue.fields;
          
          // Show standard fields with values
          console.log('Standard Fields:');
          const standardFieldIds = ['summary', 'description', 'priority', 'labels', 'components', 'fixVersions', 'duedate', 'reporter'];
          standardFieldIds.forEach(fieldId => {
            const value = issueFields[fieldId];
            if (value !== undefined && value !== null) {
              if (typeof value === 'object' && value.name) {
                console.log(`  ${fieldId.padEnd(20)} : ${value.name}`);
              } else if (Array.isArray(value)) {
                console.log(`  ${fieldId.padEnd(20)} : [${value.length} items]`);
              } else {
                console.log(`  ${fieldId.padEnd(20)} : ${value}`);
              }
            }
          });
          
          // Show custom fields with values
          console.log('\nCustom Fields with Values:');
          const customFieldsWithValues = [];
          for (const [fieldId, value] of Object.entries(issueFields)) {
            if (fieldId.startsWith('customfield_') && value !== null && value !== undefined) {
              const fieldInfo = fields.find(f => f.id === fieldId);
              const fieldName = fieldInfo ? fieldInfo.name : 'Unknown';
              
              let displayValue = value;
              if (typeof value === 'object' && value.name) {
                displayValue = value.name;
              } else if (typeof value === 'object' && value.value) {
                displayValue = value.value;
              } else if (Array.isArray(value)) {
                displayValue = `[${value.length} items]`;
              }
              
              customFieldsWithValues.push({
                id: fieldId,
                name: fieldName,
                value: displayValue,
                type: typeof value
              });
            }
          }
          
          customFieldsWithValues.sort((a, b) => a.id.localeCompare(b.id));
          customFieldsWithValues.forEach(({ id, name, value, type }) => {
            console.log(`  ${id.padEnd(20)} : ${name.padEnd(40)} = ${value} (${type})`);
          });
        } else {
          console.log(`Could not fetch ticket ${ticketKey}: ${issueResponse.status}`);
        }
      } catch (error) {
        console.log(`Error fetching ticket: ${error.message}`);
      }
    }
    
    // Summary for environment variables
    console.log(`\n=== RECOMMENDED ENVIRONMENT VARIABLES ===\n`);
    console.log('# Based on field analysis, set these in Vercel:');
    console.log('JIRA_FIELD_SUMMARY=summary');
    console.log('JIRA_FIELD_DESCRIPTION=description');
    console.log('JIRA_FIELD_PRIORITY=priority');
    console.log('JIRA_FIELD_LABELS=labels');
    
    if (storyPointsFields.length > 0) {
      console.log(`# Story Points field (choose one):`);
      storyPointsFields.forEach(field => {
        console.log(`# JIRA_FIELD_STORY_POINTS=${field.id}  # ${field.name}`);
      });
      // Use the first one as default
      console.log(`JIRA_FIELD_STORY_POINTS=${storyPointsFields[0].id}`);
    } else {
      console.log('# JIRA_FIELD_STORY_POINTS=customfield_XXXXX  # Find the Story Points field ID above');
    }
    
  } catch (error) {
    console.error('Error fetching fields:', error.message);
    process.exit(1);
  }
}

fetchFields();

