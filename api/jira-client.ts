import { markdownToADF, plainTextToADF } from './markdown-converter';

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

