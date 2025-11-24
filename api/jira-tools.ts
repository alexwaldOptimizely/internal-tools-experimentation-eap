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

interface UpdateTicketParams {
  ticketKey: string;
  fields: Record<string, any>;
}

interface UpdatedJiraIssue {
  key: string;
  url: string;
  updatedFields: string[];
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
        throw new Error('Access denied. Please ensure you have permission to create tickets in the DHK project.');
      } else if (error.message.includes('404')) {
        throw new Error('Project or issue type not found. Please verify the DHK project exists and the issue type is valid.');
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

export async function updateJiraTicket(params: UpdateTicketParams): Promise<UpdatedJiraIssue> {
  try {
    // Validate required fields
    if (!params.ticketKey || params.ticketKey.trim().length === 0) {
      throw new Error('Ticket key is required and cannot be empty');
    }

    if (!params.fields || Object.keys(params.fields).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    // Validate ticket key format (e.g., "DHK-123")
    const ticketKeyPattern = /^[A-Z]+-\d+$/;
    if (!ticketKeyPattern.test(params.ticketKey.trim())) {
      throw new Error(`Invalid ticket key format: ${params.ticketKey}. Expected format: PROJECT-123`);
    }

    // Update the ticket
    const result = await jiraClient.instance.updateIssue(params.ticketKey.trim(), params.fields);
    return result;
  } catch (error) {
    // Enhanced error handling with specific guidance
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new Error(`Ticket ${params.ticketKey} not found or you don't have access to it. Please verify the ticket key is correct.`);
      } else if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please check your JIRA API token and email address.');
      } else if (error.message.includes('403')) {
        throw new Error(`Access denied. You don't have permission to update ticket ${params.ticketKey}. Please contact the project administrator.`);
      } else if (error.message.includes('400')) {
        const jiraError = error.message.includes('JIRA API Error') ? error.message : 'Invalid field data';
        throw new Error(`${jiraError}. Please check the field names and values you're trying to update.`);
      } else if (error.message.includes('404')) {
        throw new Error(`Ticket ${params.ticketKey} not found. Please verify the ticket key is correct.`);
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait a moment before updating another ticket.');
      } else {
        throw new Error(`Failed to update JIRA ticket: ${error.message}`);
      }
    }
    throw new Error('An unexpected error occurred while updating the JIRA ticket');
  }
}

