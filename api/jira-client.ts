import { markdownToADF, plainTextToADF } from './markdown-converter';
import { mapFieldNameToId, formatFieldValue, requiresSpecialFormatting } from './field-mapper';

class JiraClient {
  private config: {
    baseUrl: string;
    email: string;
    apiToken: string;
  };

  constructor() {
    this.config = {
      baseUrl: process.env.JIRA_BASE_URL || 'https://optimizely-ext.atlassian.net',
      email: process.env.JIRA_USER_EMAIL || 'alex.wald@optimizely.com',
      apiToken: process.env.JIRA_API_TOKEN || ''
    };

    if (!this.config.apiToken) {
      throw new Error('JIRA_API_TOKEN environment variable is required');
    }
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.config.email}:${this.config.apiToken}`).toString('base64');
    return `Basic ${credentials}`;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}/rest/api/3${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JIRA API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{
    status: string;
    project?: string;
    error?: string;
  }> {
    try {
      // Test basic connectivity by getting current user
      await this.makeRequest('/myself');
      
      // Test project access
      const project = await this.makeRequest(`/project/${process.env.JIRA_PROJECT_KEY || 'DHK'}`);
      
      return {
        status: 'connected',
        project: project.name
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createIssue(issueData: {
    summary: string;
    description: string;
    issueType: string;
    assigneeEmail: string;
  }): Promise<{
    key: string;
    summary: string;
    description: string;
    issueType: string;
    assignee: string;
    url: string;
  }> {
    const projectKey = process.env.JIRA_PROJECT_KEY || 'DHK';
    
    // Convert description to ADF format (supports markdown)
    let descriptionADF;
    try {
      const descriptionText = issueData.description || 'Created via Optimizely Internal Tools';
      descriptionADF = markdownToADF(descriptionText);
    } catch (error) {
      // Fallback to plain text if markdown conversion fails
      console.warn('Markdown conversion failed, using plain text:', error);
      descriptionADF = plainTextToADF(issueData.description || 'Created via Optimizely Internal Tools');
    }
    
    // Create the issue
    const issuePayload = {
      fields: {
        project: {
          key: projectKey
        },
        summary: issueData.summary,
        description: descriptionADF,
        issuetype: {
          name: issueData.issueType
        },
        assignee: {
          emailAddress: issueData.assigneeEmail
        }
      }
    };

    const createdIssue = await this.makeRequest('/issue', {
      method: 'POST',
      body: JSON.stringify(issuePayload)
    });

    return {
      key: createdIssue.key,
      summary: issueData.summary,
      description: issueData.description,
      issueType: issueData.issueType,
      assignee: issueData.assigneeEmail,
      url: `${this.config.baseUrl}/browse/${createdIssue.key}`
    };
  }

  /**
   * Get issue details by key
   */
  async getIssue(issueKey: string): Promise<any> {
    return this.makeRequest(`/issue/${issueKey}`);
  }

  /**
   * Update an existing JIRA issue
   * @param issueKey - JIRA issue key (e.g., "DHK-123")
   * @param fields - Object with field names/IDs and values to update
   */
  async updateIssue(issueKey: string, fields: Record<string, any>): Promise<{
    key: string;
    url: string;
    updatedFields: string[];
  }> {
    // First verify the issue exists
    try {
      await this.getIssue(issueKey);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error(`Ticket ${issueKey} not found or you don't have access to it`);
      }
      throw error;
    }

    // Build the update payload
    const updateFields: Record<string, any> = {};
    const updatedFieldNames: string[] = [];

    for (const [fieldName, value] of Object.entries(fields)) {
      // Skip null/undefined values
      if (value === null || value === undefined) {
        continue;
      }

      // Map field name to JIRA field ID
      const fieldId = mapFieldNameToId(fieldName);
      updatedFieldNames.push(fieldName);

      // Handle description specially (convert markdown to ADF)
      if (requiresSpecialFormatting(fieldId) && typeof value === 'string') {
        try {
          updateFields[fieldId] = markdownToADF(value);
        } catch (error) {
          console.warn('Markdown conversion failed for description, using plain text:', error);
          updateFields[fieldId] = plainTextToADF(value);
        }
      } else {
        // Format the field value appropriately
        updateFields[fieldId] = formatFieldValue(fieldId, value);
      }
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Update the issue
    const updatePayload = {
      fields: updateFields
    };

    await this.makeRequest(`/issue/${issueKey}`, {
      method: 'PUT',
      body: JSON.stringify(updatePayload)
    });

    return {
      key: issueKey,
      url: `${this.config.baseUrl}/browse/${issueKey}`,
      updatedFields: updatedFieldNames
    };
  }
}

// Lazy initialization to avoid crashing if env vars are missing
let _jiraClient: JiraClient | null = null;

export const jiraClient = {
  get instance(): JiraClient {
    if (!_jiraClient) {
      _jiraClient = new JiraClient();
    }
    return _jiraClient;
  }
};

// For backward compatibility, export a getter function
export function getJiraClient(): JiraClient {
  return jiraClient.instance;
}

