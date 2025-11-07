import express from 'express';
import { createJiraTicket } from './jira-tools';
import { jiraClient } from './jira-client';

const app = express();
const PORT = process.env.PORT || 3000;

// Trigger redeploy - environment variables updated

// Middleware
app.use(express.json());

// Bearer token authentication middleware for tool endpoints
const authenticateBearerToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.BEARER_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'BEARER_TOKEN environment variable is not configured'
    });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (token !== expectedToken) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid bearer token'
    });
  }

  next();
};

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test JIRA connectivity
    const healthCheck = await jiraClient.instance.healthCheck();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      jira: healthCheck
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Discovery endpoint for Opal
app.get('/discovery', (req, res) => {
  res.json({
    name: 'optimizely-jira-integration',
    version: '1.0.0',
    functions: [
      {
        name: 'create_jira_ticket_DHK',
        description: 'Create a new JIRA ticket in Optimizely\'s internal DHK project',
        parameters: [
          {
            name: 'summary',
            type: 'string',
            description: 'Brief summary of the ticket',
            required: true
          },
          {
            name: 'description',
            type: 'string',
            description: 'Detailed description of the ticket',
            required: false
          },
          {
            name: 'issueType',
            type: 'string',
            description: 'Type of issue (defaults to Story)',
            required: false
          },
          {
            name: 'assigneeEmail',
            type: 'string',
            description: 'Email of the assignee (defaults to alex.wald@optimizely.com)',
            required: false
          }
        ],
        endpoint: '/tools/create_jira_ticket_DHK',
        http_method: 'POST',
        auth_requirements: [
          {
            type: 'bearer_token'
          }
        ]
      }
    ]
  });
});

// Tool execution endpoint (protected with Bearer token)
app.post('/tools/create_jira_ticket_DHK', authenticateBearerToken, async (req, res) => {
  try {
    const { summary, description, issueType, assigneeEmail } = req.body;

    if (!summary) {
      return res.status(400).json({
        error: 'Missing required field: summary',
        message: 'Please provide a summary for the JIRA ticket'
      });
    }

    const result = await createJiraTicket({
      summary,
      description: description || '',
      issueType: issueType || 'Story',
      assigneeEmail: assigneeEmail || 'alex.wald@optimizely.com'
    });

    res.json({
      success: true,
      ticket: result,
      message: `Successfully created JIRA ticket ${result.key} in DHK project. The ticket has been assigned to ${result.assignee} and can be viewed at ${result.url}`
    });

  } catch (error) {
    console.error('Error creating JIRA ticket:', error);
    
    if (error instanceof Error) {
      res.status(500).json({
        error: 'Failed to create JIRA ticket',
        message: error.message,
        details: 'Please check your JIRA permissions and project configuration'
      });
    } else {
      res.status(500).json({
        error: 'Unknown error occurred',
        message: 'An unexpected error occurred while creating the JIRA ticket'
      });
    }
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Optimizely Internal Tools',
    description: 'JIRA integration tool for Optimizely teams',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      discovery: '/discovery',
      createTicket: '/tools/create_jira_ticket_DHK'
    }
  });
});

// Start server (only for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Optimizely Internal Tools server running on port ${PORT}`);
  });
}

// Export for Vercel serverless function
module.exports = app;

