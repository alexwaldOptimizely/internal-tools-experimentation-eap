import express from 'express';
import { createJiraTicket, updateJiraTicket } from './jira-tools';
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
    functions: [
      {
        name: 'create_jira_ticket_DHK',
        description: 'Create a new JIRA ticket in Optimizely\'s internal DHK project',
        parameters: [
          {
            name: 'Summary',
            type: 'string',
            description: 'Brief summary of the ticket',
            required: true
          },
          {
            name: 'Description',
            type: 'string',
            description: 'Detailed description of the ticket (supports markdown)',
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
        httpMethod: 'POST'
      },
      {
        name: 'update_jira_ticket_DHK',
        description: 'Update any field on an existing JIRA ticket in Optimizely\'s internal DHK project. Supports updating summary, description, assignee, issue type, priority, labels, and any custom fields.',
        parameters: [
          {
            name: 'ticketKey',
            type: 'string',
            description: 'JIRA ticket key (e.g., DHK-123)',
            required: true
          },
          {
            name: 'fields',
            type: 'object',
            description: 'Object containing fields to update. Supported field names: summary, description (supports markdown), assigneeEmail, issueType, priority, labels (array), components (array), fixVersions (array), dueDate (ISO date string), and any custom field IDs (e.g., customfield_10001). Example: {"summary": "New summary", "assigneeEmail": "user@optimizely.com", "priority": "High"}',
            required: true
          }
        ],
        endpoint: '/tools/update_jira_ticket_DHK',
        httpMethod: 'POST'
      }
    ]
  });
});

// Tool execution endpoint (protected with Bearer token)
app.post('/tools/create_jira_ticket_DHK', authenticateBearerToken, async (req, res) => {
  try {
    // Log the request body for debugging
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Opal may send parameters nested in a 'parameters' object or directly in the body
    // Try multiple possible formats
    const bodyParams = req.body.parameters || req.body.arguments || req.body;
    
    // Handle both lowercase and capitalized parameter names (Opal may use capitalized)
    const summary = bodyParams.Summary || bodyParams.summary;
    const description = bodyParams.Description || bodyParams.description;
    const issueType = bodyParams.issueType || bodyParams.IssueType;
    const assigneeEmail = bodyParams.assigneeEmail || bodyParams.AssigneeEmail;

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

// Tool execution endpoint for updating tickets (protected with Bearer token)
app.post('/tools/update_jira_ticket_DHK', authenticateBearerToken, async (req, res) => {
  try {
    // Log the request body for debugging
    console.log('Update request body:', JSON.stringify(req.body, null, 2));
    
    // Opal may send parameters nested in a 'parameters' object or directly in the body
    const bodyParams = req.body.parameters || req.body.arguments || req.body;
    
    // Handle both lowercase and capitalized parameter names
    const ticketKey = bodyParams.ticketKey || bodyParams.TicketKey;
    const fields = bodyParams.fields || bodyParams.Fields || {};

    if (!ticketKey) {
      return res.status(400).json({
        error: 'Missing required field: ticketKey',
        message: 'Please provide a ticket key (e.g., DHK-123)'
      });
    }

    if (!fields || Object.keys(fields).length === 0) {
      return res.status(400).json({
        error: 'Missing required field: fields',
        message: 'Please provide at least one field to update'
      });
    }

    const result = await updateJiraTicket({
      ticketKey,
      fields
    });

    res.json({
      success: true,
      ticket: result,
      message: `Successfully updated JIRA ticket ${result.key}. Updated fields: ${result.updatedFields.join(', ')}. View at ${result.url}`
    });

  } catch (error) {
    console.error('Error updating JIRA ticket:', error);
    
    if (error instanceof Error) {
      // Provide specific error messages
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Ticket not found',
          message: error.message
        });
      } else if (error.message.includes('permission') || error.message.includes('Access denied')) {
        return res.status(403).json({
          error: 'Permission denied',
          message: error.message
        });
      } else if (error.message.includes('Invalid') || error.message.includes('format')) {
        return res.status(400).json({
          error: 'Invalid request',
          message: error.message
        });
      } else {
        return res.status(500).json({
          error: 'Failed to update JIRA ticket',
          message: error.message,
          details: 'Please check your JIRA permissions and field values'
        });
      }
    } else {
      return res.status(500).json({
        error: 'Unknown error occurred',
        message: 'An unexpected error occurred while updating the JIRA ticket'
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
      createTicket: '/tools/create_jira_ticket_DHK',
      updateTicket: '/tools/update_jira_ticket_DHK'
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

