# Product Requirements Document (PRD)
## JIRA Integration Tool Enhancements: Markdown Conversion & Field Updates

### Document Information
- **Repository**: https://github.com/alexwaldOptimizely/internal-tools-experimentation-eap
- **Version**: 1.0.0
- **Date**: January 2025
- **Author**: Alex Wald
- **Status**: Draft

---

## 1. Executive Summary

### 1.1 High-Level Goal

**Enhance the existing JIRA integration tool to automatically convert all user-provided content to JIRA-friendly markdown format when creating tickets, and add the capability to update any field on tickets created by this tool (with optional support for updating any existing JIRA ticket), enabling comprehensive ticket management through Opal.**

This enhancement will:
- **Primary Focus**: Fix markdown rendering in JIRA by properly converting markdown syntax to JIRA's Atlassian Document Format (ADF)
- **Primary Use Case**: Enable the agent to update fields on tickets that this tool creates in JIRA (currently can only edit summary and description)
- **Secondary Use Case**: Optionally support updating any existing JIRA ticket if implementation is straightforward
- Maintain backward compatibility with existing ticket creation functionality
- Provide a more flexible and powerful tool for JIRA ticket management

### 1.2 Purpose

This document defines the requirements for two major enhancements to the Optimizely Internal Tools JIRA integration:

1. **Automatic Markdown Conversion**: Convert all user-provided content (summary, description, and any other text fields) to JIRA's native markdown format (Atlassian Document Format) before creating tickets, ensuring proper formatting and rich text display in JIRA.

2. **Ticket Update Capability**: Add a new tool function that allows the agent to update any field on JIRA tickets created by this tool. The primary use case is enabling the agent to update fields (beyond just summary and description) on tickets it creates. Optionally support updating any existing JIRA ticket if the implementation is straightforward.

### 1.3 Objectives

- Automatically convert plain text and markdown content to JIRA's Atlassian Document Format (ADF)
- Support common markdown elements (headers, lists, links, bold, italic, code blocks, etc.)
- Enable updates to any JIRA field on existing tickets
- Maintain existing ticket creation functionality without breaking changes
- Provide clear error messages for invalid field updates
- Support both create and update operations through Opal

### 1.4 Success Criteria

- [ ] All text content is automatically converted to JIRA-friendly format when creating tickets
- [ ] Markdown syntax (headers, lists, links, formatting) is properly rendered in JIRA
- [ ] New `update_jira_ticket` tool function is available in Opal discovery
- [ ] Users can update any JIRA field (summary, description, assignee, issue type, custom fields, etc.)
- [ ] Update operations validate ticket existence and user permissions
- [ ] Error handling provides clear guidance for invalid updates
- [ ] Backward compatibility maintained for existing ticket creation
- [ ] All changes deploy successfully to Vercel
- [ ] Tool registration in Opal remains functional

---

## 2. Current State Analysis

### 2.1 Existing Functionality

**Current Tool: `create_jira_ticket_DHK`**

The current implementation:
- Creates new JIRA tickets in the DHK project
- Accepts parameters: `Summary`, `Description`, `issueType`, `assigneeEmail`
- Converts description to JIRA's document format (ADF) but only as plain text paragraphs
- Does not support markdown conversion
- Does not support ticket updates
- Limited to creating new tickets only

**Current Description Handling:**
```typescript
description: {
  type: 'doc',
  version: 1,
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: issueData.description || 'Created via Optimizely Internal Tools'
        }
      ]
    }
  ]
}
```

This approach:
- Only supports plain text
- Does not parse markdown
- Does not support rich formatting
- Does not handle multiple paragraphs, lists, or other markdown elements

### 2.2 Limitations

1. **No Markdown Support**: User-provided markdown is not converted to JIRA format
2. **Plain Text Only**: Rich formatting is lost when creating tickets
3. **No Update Capability**: Cannot modify existing tickets
4. **Limited Field Support**: Only supports basic fields (summary, description, issue type, assignee)
5. **No Custom Field Support**: Cannot set custom fields during creation or updates

---

## 3. Functional Requirements

### 3.1 Feature 1: Automatic Markdown Conversion

#### 3.1.1 Overview

Convert all user-provided text content to JIRA's Atlassian Document Format (ADF) before creating tickets. This includes:
- Summary field
- Description field
- Any other text fields provided by the user

#### 3.1.2 Markdown Elements to Support

The conversion should support the following markdown elements:

| Markdown Element | JIRA ADF Equivalent | Priority |
|-----------------|---------------------|----------|
| Headers (# ## ###) | `heading` nodes with `level` 1-6 | High |
| Bold (**text** or __text__) | `text` with `marks: [{type: 'strong'}]` | High |
| Italic (*text* or _text_) | `text` with `marks: [{type: 'em'}]` | High |
| Code inline (`code`) | `text` with `marks: [{type: 'code'}]` | High |
| Code blocks (```code```) | `codeBlock` node | High |
| Unordered lists (- or *) | `bulletList` with `listItem` nodes | High |
| Ordered lists (1. 2. 3.) | `orderedList` with `listItem` nodes | High |
| Links ([text](url)) | `text` with `marks: [{type: 'link', attrs: {href}}]` | High |
| Line breaks | Multiple `paragraph` nodes or `hardBreak` | Medium |
| Blockquotes (> text) | `blockquote` node | Medium |
| Horizontal rules (---) | `rule` node | Low |
| Tables | `table` node with `tableRow` and `tableCell` | Low |
| Strikethrough (~~text~~) | `text` with `marks: [{type: 'strike'}]` | Low |

#### 3.1.3 Implementation Approach

**Option A: Use a Markdown-to-ADF Library**
- Research and select a TypeScript/JavaScript library that converts markdown to JIRA ADF
- Examples: `@atlaskit/adf-utils`, custom parser, or community libraries
- Pros: Faster implementation, well-tested
- Cons: Dependency on external library, may need customization

**Option B: Custom Markdown Parser**
- Build a custom parser for common markdown elements
- Pros: Full control, no dependencies
- Cons: More development time, need to maintain parser

**Recommendation**: Start with Option A (library) for faster implementation, with fallback to Option B if no suitable library exists.

#### 3.1.4 Conversion Flow

1. **Receive Content from Opal**
   - User provides summary and/or description (may contain markdown)
   - Content arrives as plain text string

2. **Parse Markdown**
   - Detect markdown syntax in the content
   - Parse markdown elements (headers, lists, formatting, etc.)

3. **Convert to ADF**
   - Transform parsed markdown to JIRA's Atlassian Document Format
   - Create proper ADF structure with nodes and marks

4. **Create Ticket**
   - Use converted ADF in JIRA API request
   - JIRA renders the formatted content

5. **Fallback Handling**
   - If markdown parsing fails, fall back to plain text (current behavior)
   - Log parsing errors for debugging
   - Ensure ticket creation still succeeds even if conversion fails

#### 3.1.5 Edge Cases

- **Empty Content**: Handle empty strings gracefully
- **Plain Text Only**: If no markdown detected, convert to simple paragraph
- **Mixed Content**: Handle content with both markdown and plain text
- **Invalid Markdown**: Gracefully handle malformed markdown (fallback to plain text)
- **Special Characters**: Preserve special characters that aren't markdown
- **Very Long Content**: Ensure conversion handles large content blocks
- **Nested Elements**: Support nested markdown (e.g., bold text in a list item)

#### 3.1.6 Testing Requirements

- Test with various markdown formats
- Test with plain text (no markdown)
- Test with mixed content
- Test with invalid markdown
- Test with empty content
- Test with very long content
- Verify rendered output in JIRA matches expected format

### 3.2 Feature 2: Update JIRA Ticket Fields

#### 3.2.1 Overview

Add a new tool function `update_jira_ticket` that allows the agent to update any field on JIRA tickets. **Primary focus**: Enable updating fields on tickets created by this tool (currently limited to summary and description). **Secondary**: Optionally support updating any existing JIRA ticket if implementation is straightforward.

This includes:
- Standard fields (summary, description, assignee, issue type, priority, status, etc.)
- Custom fields (any custom field defined in the JIRA project)
- Multiple fields in a single update operation
- **Note**: The main use case is for the agent to update tickets it creates, not necessarily all tickets in JIRA

#### 3.2.2 New Tool Function

**Tool Name**: `update_jira_ticket_DHK`

**Tool Description**: "Update any field on an existing JIRA ticket in Optimizely's internal DHK project"

**Endpoint**: `POST /tools/update_jira_ticket_DHK`

**Authentication**: Bearer token (same as create ticket)

#### 3.2.3 Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketKey` | string | Yes | JIRA ticket key (e.g., "DHK-123") |
| `fields` | object | Yes | Object containing fields to update (key-value pairs) |
| `fields.summary` | string | No | New summary text |
| `fields.description` | string | No | New description (supports markdown, will be converted) |
| `fields.assigneeEmail` | string | No | Email of new assignee |
| `fields.issueType` | string | No | New issue type name |
| `fields.priority` | string | No | Priority name (e.g., "High", "Medium", "Low") |
| `fields.labels` | array | No | Array of label strings |
| `fields.customFields` | object | No | Object with custom field IDs and values |

**Example Request:**
```json
{
  "ticketKey": "DHK-123",
  "fields": {
    "summary": "Updated summary",
    "description": "## New Description\n\nThis is an **updated** description with markdown.",
    "assigneeEmail": "new.assignee@optimizely.com",
    "priority": "High",
    "labels": ["urgent", "customer-request"],
    "customFields": {
      "customfield_10001": "Custom value",
      "customfield_10002": 12345
    }
  }
}
```

#### 3.2.4 Field Update Logic

**Standard Fields:**
- Map common field names to JIRA API field IDs
- Support both field names and field IDs
- Validate field values before sending to JIRA

**Custom Fields:**
- Accept custom field IDs (e.g., `customfield_10001`)
- Support different field types (text, number, select, date, etc.)
- Validate custom field values based on field type

**Field Validation:**
- Verify ticket exists before attempting update
- Verify user has permission to update the ticket
- Validate field names/IDs are valid for the project
- Validate field values match field type requirements
- Provide clear error messages for invalid fields

#### 3.2.5 Update Flow

1. **Receive Update Request**
   - Extract ticket key and fields to update
   - Validate ticket key format (e.g., "DHK-123")

2. **Verify Ticket Exists**
   - Call JIRA API to fetch ticket details
   - Return error if ticket doesn't exist or user doesn't have access

3. **Process Fields**
   - Convert description to ADF if provided (using markdown conversion)
   - Map field names to JIRA field IDs
   - Validate field values

4. **Build Update Payload**
   - Construct JIRA API update payload
   - Include only fields that are being updated
   - Format fields according to JIRA API requirements

5. **Execute Update**
   - Call JIRA API to update ticket
   - Handle errors gracefully

6. **Return Response**
   - Return updated ticket details
   - Include ticket URL and updated field summary

#### 3.2.6 Supported Field Types

**Standard Fields:**
- `summary` (string)
- `description` (string, supports markdown)
- `assigneeEmail` (string, email address)
- `issueType` (string, issue type name)
- `priority` (string, priority name)
- `labels` (array of strings)
- `components` (array of component names or IDs)
- `fixVersions` (array of version names or IDs)
- `affectsVersions` (array of version names or IDs)
- `dueDate` (string, ISO date format)

**Custom Fields:**
- Text fields
- Number fields
- Select fields (single and multi-select)
- Date fields
- User fields
- URL fields
- Any other custom field type supported by JIRA

#### 3.2.7 Field Discovery

**Option A: Dynamic Field Discovery**
- Fetch available fields from JIRA API when needed
- Cache field metadata for performance
- Pros: Supports any field, no hardcoding
- Cons: Additional API calls, more complex

**Option B: Predefined Field Mapping**
- Maintain a mapping of common field names to IDs
- Support custom field IDs directly
- Pros: Simpler, faster
- Cons: May not support all fields without configuration

**Recommendation**: Hybrid approach - support common fields by name, allow custom fields by ID, with optional dynamic discovery for validation.

#### 3.2.8 Error Handling

**Ticket Not Found (404):**
- Error: "Ticket DHK-123 not found or you don't have access to it"
- Guidance: Verify ticket key is correct and you have permission

**Invalid Field (400):**
- Error: "Field 'invalidField' is not valid for this ticket"
- Guidance: Check field name/ID and ensure it exists in the project

**Permission Denied (403):**
- Error: "You don't have permission to update this ticket"
- Guidance: Contact project administrator for access

**Invalid Field Value (400):**
- Error: "Invalid value for field 'priority'. Valid values are: High, Medium, Low"
- Guidance: Use one of the valid values

**Update Conflict (409):**
- Error: "Ticket was modified by another user. Please refresh and try again"
- Guidance: Fetch latest ticket state and retry

#### 3.2.9 Testing Requirements

- Test updating single field
- Test updating multiple fields
- Test updating standard fields
- Test updating custom fields
- Test with invalid ticket key
- Test with invalid field names
- Test with invalid field values
- Test permission scenarios
- Test markdown conversion in description updates
- Test concurrent update scenarios

---

## 4. Technical Requirements

### 4.1 Dependencies

**New Dependencies (for Markdown Conversion):**
- Markdown parsing library (to be determined)
- ADF conversion library or custom implementation

**Existing Dependencies:**
- No changes to existing dependencies
- Maintain compatibility with current stack

### 4.2 Code Changes

#### 4.2.1 New Files

1. **`api/markdown-converter.ts`**
   - Markdown parsing and ADF conversion logic
   - Functions to convert markdown strings to JIRA ADF format
   - Fallback handling for plain text

2. **`api/jira-update-tools.ts`**
   - Business logic for ticket updates
   - Field validation and mapping
   - Update operation handling

#### 4.2.2 Modified Files

1. **`api/jira-tools.ts`**
   - Update `createJiraTicket` to use markdown converter
   - Apply markdown conversion to summary and description

2. **`api/jira-client.ts`**
   - Add `updateIssue` method
   - Add field discovery/validation methods (if needed)
   - Enhance error handling for update operations

3. **`api/index.ts`**
   - Add new `/tools/update_jira_ticket_DHK` endpoint
   - Update discovery endpoint to include new tool
   - Add authentication middleware (reuse existing)

### 4.3 API Changes

#### 4.3.1 Discovery Endpoint Updates

**Current:**
```json
{
  "functions": [
    {
      "name": "create_jira_ticket_DHK",
      ...
    }
  ]
}
```

**Updated:**
```json
{
  "functions": [
    {
      "name": "create_jira_ticket_DHK",
      ...
    },
    {
      "name": "update_jira_ticket_DHK",
      "description": "Update any field on an existing JIRA ticket in Optimizely's internal DHK project",
      "parameters": [
        {
          "name": "ticketKey",
          "type": "string",
          "description": "JIRA ticket key (e.g., DHK-123)",
          "required": true
        },
        {
          "name": "fields",
          "type": "object",
          "description": "Object containing fields to update",
          "required": true
        }
      ],
      "endpoint": "/tools/update_jira_ticket_DHK",
      "httpMethod": "POST"
    }
  ]
}
```

#### 4.3.2 New Endpoint

**POST /tools/update_jira_ticket_DHK**

**Request:**
```json
{
  "ticketKey": "DHK-123",
  "fields": {
    "summary": "Updated summary",
    "description": "## Markdown description",
    "assigneeEmail": "user@optimizely.com"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "ticket": {
    "key": "DHK-123",
    "summary": "Updated summary",
    "url": "https://optimizely-ext.atlassian.net/browse/DHK-123",
    "updatedFields": ["summary", "description", "assignee"]
  },
  "message": "Successfully updated JIRA ticket DHK-123"
}
```

**Response (Error):**
```json
{
  "error": "Ticket not found",
  "message": "Ticket DHK-123 not found or you don't have access to it",
  "details": "Please verify the ticket key is correct and you have permission to view this ticket"
}
```

### 4.4 Backward Compatibility

**Critical Requirements:**
- Existing `create_jira_ticket_DHK` endpoint must continue to work
- Existing Opal registrations must not break
- Current request/response formats must remain valid
- Markdown conversion should be transparent (users can still send plain text)

**Migration Path:**
- No migration needed - changes are additive
- Existing integrations continue to work
- New functionality is opt-in through new endpoint

---

## 5. Implementation Plan

### 5.1 Phase 1: Markdown Conversion (Week 1)

**Tasks:**
1. Research markdown-to-ADF conversion libraries
2. Select and install appropriate library
3. Create `markdown-converter.ts` module
4. Implement conversion for common markdown elements
5. Update `createJiraTicket` to use converter
6. Test markdown conversion with various inputs
7. Update tests

**Deliverables:**
- Markdown converter module
- Updated ticket creation with markdown support
- Tests for markdown conversion

### 5.2 Phase 2: Ticket Update Functionality (Week 2)

**Tasks:**
1. Design update API structure
2. Implement `updateIssue` in JIRA client
3. Create `jira-update-tools.ts` module
4. Implement field validation and mapping
5. Add update endpoint to Express app
6. Update discovery endpoint
7. Test update functionality
8. Test error scenarios

**Deliverables:**
- Ticket update tool function
- Update endpoint
- Field validation logic
- Tests for update operations

### 5.3 Phase 3: Integration & Testing (Week 3)

**Tasks:**
1. End-to-end testing of both features
2. Test with Opal integration
3. Test error handling
4. Performance testing
5. Documentation updates
6. Code review

**Deliverables:**
- Fully tested implementation
- Updated documentation
- Deployment-ready code

### 5.4 Phase 4: Deployment (Week 4)

**Tasks:**
1. Deploy to Vercel
2. Test in production environment
3. Verify Opal tool registration
4. Test with real JIRA tickets
5. Monitor for errors
6. Gather user feedback

**Deliverables:**
- Production deployment
- Verified Opal integration
- Monitoring setup

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Markdown Converter:**
- Test each markdown element conversion
- Test plain text fallback
- Test invalid markdown handling
- Test edge cases (empty, very long, special characters)

**Update Tools:**
- Test field validation
- Test field mapping
- Test error handling
- Test permission checks

### 6.2 Integration Tests

**Ticket Creation:**
- Test creating tickets with markdown
- Test creating tickets with plain text
- Verify rendered output in JIRA

**Ticket Updates:**
- Test updating various fields
- Test updating multiple fields
- Test error scenarios
- Verify updates in JIRA

### 6.3 End-to-End Tests

- Test full flow from Opal → API → JIRA
- Test both create and update operations
- Test error handling in real scenarios
- Test with actual JIRA project

### 6.4 Manual Testing

- Test markdown rendering in JIRA UI
- Test update operations through Opal
- Test various field types
- Test permission scenarios
- Test concurrent operations

---

## 7. Error Handling & Edge Cases

### 7.1 Markdown Conversion Errors

**Scenario**: Markdown parsing fails
**Handling**: Fall back to plain text, log error, still create ticket
**User Impact**: Ticket created but without formatting

**Scenario**: Invalid markdown syntax
**Handling**: Attempt to parse, fall back to plain text if fails
**User Impact**: Ticket created, formatting may be lost

**Scenario**: Very large content
**Handling**: Process in chunks if needed, validate size limits
**User Impact**: Large content may be truncated

### 7.2 Update Operation Errors

**Scenario**: Ticket doesn't exist
**Handling**: Return 404 with clear error message
**User Impact**: User informed ticket not found

**Scenario**: No permission to update
**Handling**: Return 403 with permission error
**User Impact**: User informed of permission issue

**Scenario**: Invalid field name
**Handling**: Return 400 with list of valid fields
**User Impact**: User can correct field name

**Scenario**: Invalid field value
**Handling**: Return 400 with valid values
**User Impact**: User can correct field value

**Scenario**: Concurrent updates
**Handling**: Return 409 conflict error
**User Impact**: User can retry after refreshing

---

## 8. Security Considerations

### 8.1 Input Validation

- Validate ticket keys format (e.g., "DHK-123")
- Sanitize markdown input to prevent injection
- Validate field names and values
- Limit content size to prevent DoS

### 8.2 Authentication & Authorization

- Bearer token required for update endpoint (same as create)
- JIRA API authentication validates permissions
- No additional authentication needed

### 8.3 Data Privacy

- No sensitive data logged
- Error messages don't expose internal details
- Ticket content handled securely

---

## 9. Performance Considerations

### 9.1 Markdown Conversion

- Conversion should be fast (< 100ms for typical content)
- Consider caching for repeated conversions
- Optimize for common markdown patterns

### 9.2 Update Operations

- Field validation should be efficient
- Minimize JIRA API calls
- Cache field metadata if using dynamic discovery

### 9.3 API Response Times

- Target: < 2 seconds for ticket creation
- Target: < 2 seconds for ticket updates
- Monitor and optimize slow operations

---

## 10. Documentation Updates

### 10.1 README Updates

- Document markdown support in ticket creation
- Document new update tool function
- Update API endpoint documentation
- Add examples for markdown usage
- Add examples for ticket updates

### 10.2 Code Documentation

- Document markdown converter functions
- Document update tool functions
- Add JSDoc comments for new functions
- Document field mapping logic

### 10.3 User Documentation

- Guide for using markdown in tickets
- Guide for updating tickets
- Common markdown examples
- Field update examples
- Troubleshooting guide

---

## 11. Success Metrics

### 11.1 Technical Metrics

- Markdown conversion success rate: > 95%
- Update operation success rate: > 98%
- API response time: < 2 seconds (p95)
- Error rate: < 2%

### 11.2 User Metrics

- Adoption of markdown in ticket creation
- Usage of update functionality
- User satisfaction with formatting
- Reduction in manual JIRA edits

### 11.3 Quality Metrics

- Test coverage: > 80%
- Zero breaking changes to existing functionality
- All edge cases handled gracefully

---

## 12. Risk Mitigation

### 12.1 Identified Risks

**Risk 1: Markdown Library Compatibility**
- **Impact**: High - Core functionality depends on library
- **Mitigation**: Research multiple libraries, have fallback plan, test thoroughly

**Risk 2: Field Update Complexity**
- **Impact**: Medium - JIRA fields vary by project
- **Mitigation**: Start with common fields, support custom fields by ID, provide clear errors

**Risk 3: Breaking Existing Functionality**
- **Impact**: High - Could break current integrations
- **Mitigation**: Extensive testing, backward compatibility checks, gradual rollout

**Risk 4: Performance Issues**
- **Impact**: Medium - Could slow down API
- **Mitigation**: Performance testing, optimization, monitoring

### 12.2 Mitigation Strategies

1. **Staging Environment**: Test all changes in staging first
2. **Feature Flags**: Consider feature flags for gradual rollout
3. **Monitoring**: Set up monitoring and alerting
4. **Rollback Plan**: Maintain ability to rollback quickly
5. **User Communication**: Communicate changes to users

---

## 13. Dependencies and Assumptions

### 13.1 Dependencies

- JIRA Cloud API v3 (existing)
- Markdown parsing library (to be selected)
- ADF conversion capability (library or custom)
- Opal tool registration (existing)
- Vercel deployment platform (existing)

### 13.2 Assumptions

- JIRA project supports standard fields
- Users have appropriate JIRA permissions
- Opal can handle new tool function
- Markdown library is available and maintained
- ADF format is stable (JIRA API)

---

## 14. Open Questions

### 14.1 Technical Questions

1. **Markdown Library Selection**
   - Do you have a preference for a markdown-to-ADF conversion library?
   - Are there any libraries already in use at Optimizely we should consider?
   - Should we build a custom parser or use an existing library?

2. **Field Discovery Approach**
   - Should we implement dynamic field discovery or use a predefined mapping?
   - Do you have a list of commonly used custom fields in the DHK project?
   - Should we cache field metadata for performance?

3. **Markdown Support Scope**
   - Which markdown elements are most important? (All listed, or prioritize some?)
   - Should we support advanced features like tables, blockquotes, etc.?
   - What's the priority for markdown elements (High/Medium/Low)?

4. **Update Functionality Scope**
   - Should the update function support updating multiple tickets at once?
   - Should we support bulk operations?
   - Are there any fields that should NOT be updatable (e.g., ticket key, creation date)?

5. **Custom Fields**
   - How should users specify custom field IDs? (Do they know the IDs, or should we support names?)
   - Should we provide a way to discover available custom fields?
   - Are there specific custom field types we need to prioritize?

### 14.2 Operational Questions

6. **Error Handling**
   - How detailed should error messages be? (Technical details vs. user-friendly?)
   - Should we log all conversion errors, or only critical ones?
   - What's the preferred approach for handling partial failures (e.g., some fields update, others fail)?

7. **Testing**
   - Do you have a test JIRA project we can use for testing?
   - Should we create test tickets for validation?
   - What's the testing process before production deployment?

8. **Deployment**
   - Should we deploy both features together or separately?
   - Do you want to test in a staging environment first?
   - What's the rollback plan if issues arise?

9. **Documentation**
   - Who will be the primary users of this tool?
   - What level of technical knowledge do they have?
   - Should we create user guides or just update technical documentation?

10. **Monitoring**
    - What metrics should we track?
    - Should we set up alerts for errors?
    - How should we monitor markdown conversion success rates?

### 14.3 Business Questions

11. **Priority**
    - Which feature is more important: markdown conversion or update functionality?
    - Should we implement them in a specific order?
    - Are there any deadlines we need to meet?

12. **User Communication**
    - Should we notify users about the new markdown support?
    - Should we provide training or examples for using markdown?
    - How should we communicate the new update functionality?

13. **Future Enhancements**
    - Are there other JIRA operations you'd like to support (e.g., add comments, add attachments)?
    - Should we plan for additional markdown features?
    - Are there other integrations beyond JIRA we should consider?

---

## 15. Timeline and Milestones

### 15.1 Proposed Timeline

- **Week 1**: Markdown conversion implementation
- **Week 2**: Ticket update functionality
- **Week 3**: Integration, testing, and documentation
- **Week 4**: Deployment and validation

**Total Estimated Time**: 4 weeks

### 15.2 Milestones

- [ ] Week 1: Markdown conversion complete and tested
- [ ] Week 2: Update functionality complete and tested
- [ ] Week 3: End-to-end testing complete, documentation updated
- [ ] Week 4: Production deployment successful, Opal integration verified

---

## 16. Appendices

### 16.1 JIRA ADF Format Reference

JIRA uses Atlassian Document Format (ADF) for rich text content. Key elements:
- Document structure: `{type: 'doc', version: 1, content: [...]}`
- Paragraphs: `{type: 'paragraph', content: [...]}`
- Headings: `{type: 'heading', attrs: {level: 1-6}, content: [...]}`
- Text with marks: `{type: 'text', text: '...', marks: [{type: 'strong'}]}`
- Lists: `{type: 'bulletList'/'orderedList', content: [...]}`

### 16.2 Example Markdown Conversions

**Input:**
```markdown
# Header
This is **bold** and this is *italic*.
- List item 1
- List item 2
```

**Output (ADF):**
```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "heading",
      "attrs": {"level": 1},
      "content": [{"type": "text", "text": "Header"}]
    },
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "This is "},
        {"type": "text", "text": "bold", "marks": [{"type": "strong"}]},
        {"type": "text", "text": " and this is "},
        {"type": "text", "text": "italic", "marks": [{"type": "em"}]},
        {"type": "text", "text": "."}
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{"type": "text", "text": "List item 1"}]
          }]
        },
        {
          "type": "listItem",
          "content": [{
            "type": "paragraph",
            "content": [{"type": "text", "text": "List item 2"}]
          }]
        }
      ]
    }
  ]
}
```

### 16.3 JIRA Update API Reference

JIRA REST API v3 update endpoint:
- **Endpoint**: `PUT /rest/api/3/issue/{issueIdOrKey}`
- **Body**: `{fields: {fieldId: value, ...}}`
- **Field IDs**: Standard fields use names, custom fields use IDs like `customfield_10001`

---

## Document Approval

- **Product Owner**: [To be filled]
- **Technical Lead**: [To be filled]
- **Date Approved**: [To be filled]
- **Version**: 1.0.0

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-XX | Alex Wald | Initial PRD creation |

