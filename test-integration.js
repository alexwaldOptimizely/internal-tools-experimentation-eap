#!/usr/bin/env node

import { jiraClient } from './api/jira-client';
import { createJiraTicket } from './api/jira-tools';

async function testJiraIntegration() {
  console.log('🧪 Testing Optimizely Internal Tools - JIRA Integration\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing JIRA connectivity...');
    const health = await jiraClient.healthCheck();
    console.log('✅ Health Check Result:', health);
    console.log('');

    // Test 2: Create a test ticket
    console.log('2️⃣ Testing ticket creation...');
    const testTicket = await createJiraTicket({
      summary: 'Test ticket from Optimizely Internal Tools',
      description: 'This is a test ticket created via the Optimizely Opal integration. Please delete this ticket.',
      issueType: 'Story',
      assigneeEmail: 'alex.wald@optimizely.com'
    });
    
    console.log('✅ Ticket Created Successfully!');
    console.log('   Key:', testTicket.key);
    console.log('   Summary:', testTicket.summary);
    console.log('   Assignee:', testTicket.assignee);
    console.log('   URL:', testTicket.url);
    console.log('');

    console.log('🎉 All tests passed! The JIRA integration is working correctly.');
    console.log('📝 Note: Please delete the test ticket manually from JIRA.');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    console.error('');
    console.error('🔧 Troubleshooting steps:');
    console.error('   1. Check your environment variables are set correctly');
    console.error('   2. Verify your JIRA API token has proper permissions');
    console.error('   3. Ensure you have access to the DEX project');
    console.error('   4. Check your network connectivity to JIRA');
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testJiraIntegration();
}

