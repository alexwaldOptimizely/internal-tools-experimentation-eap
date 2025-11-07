import { jiraClient } from './jira-client';

interface CreateTicketParams {
  summary: string;
  description: string;
  issueType: string;
  assigneeEmail: string;
}

interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  issueType: string;
  assignee: string;
  url: string;
}

export async function createJiraTicket(params: CreateTicketParams): Promise<JiraIssue> {
  try {
    // Validate required fields
    if (!params.summary || params.summary.trim().length === 0) {
      throw new Error('Summary is required and cannot be empty');
    }

    // Set defaults
    const ticketData = {
      summary: params.summary.trim(),
      description: params.description || 'Created via Optimizely Internal Tools',
      issueType: params.issueType || 'Story',
      assigneeEmail: params.assigneeEmail || 'alex.wald@optimizely.com'
    };

    // Create the ticket
    const result = await jiraClient.instance.createIssue(ticketData);
    return result;
  } catch (error) {
    // Enhanced error handling with specific guidance
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please check your JIRA API token and email address.');
      } else if (error.message.includes('403')) {
        throw new Error('Access denied. Please ensure you have permission to create tickets in the DEX project.');
      } else if (error.message.includes('404')) {
        throw new Error('Project or issue type not found. Please verify the DEX project exists and the issue type is valid.');
      } else if (error.message.includes('400')) {
        // Include the actual JIRA error message for debugging
        const jiraError = error.message.includes('JIRA API Error') ? error.message : 'Invalid request data';
        throw new Error(`${jiraError}. Please check your ticket summary, description, project key, and issue type.`);
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait a moment before creating another ticket.');
      } else {
        throw new Error(`Failed to create JIRA ticket: ${error.message}`);
      }
    }
    throw new Error('An unexpected error occurred while creating the JIRA ticket');
  }
}

