/**
 * Converts markdown text to JIRA's Atlassian Document Format (ADF)
 * Supports: headers, bold, italic, code, lists, links, paragraphs
 */

interface ADFNode {
  type: string;
  version?: number;
  content?: ADFNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: any }>;
  attrs?: any;
}

/**
 * Converts markdown text to JIRA ADF format
 * @param markdown - Markdown text to convert
 * @returns ADF document structure
 */
export function markdownToADF(markdown: string): ADFNode {
  if (!markdown || markdown.trim().length === 0) {
    return {
      type: 'doc',
      version: 1,
      content: [{
        type: 'paragraph',
        content: []
      }]
    };
  }

  const lines = markdown.split('\n');
  const content: ADFNode[] = [];
  let currentList: ADFNode[] | null = null;
  let listType: 'bulletList' | 'orderedList' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    
    // Empty line - close current list if any, add paragraph break
    if (line === '') {
      if (currentList) {
        content.push({
          type: listType!,
          content: currentList
        });
        currentList = null;
        listType = null;
      }
      continue;
    }

    // Header detection (# ## ###)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      if (currentList) {
        content.push({
          type: listType!,
          content: currentList
        });
        currentList = null;
        listType = null;
      }
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      content.push({
        type: 'heading',
        attrs: { level },
        content: parseInlineMarkdown(text)
      });
      continue;
    }

    // Unordered list (- or *)
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (listType !== 'bulletList') {
        if (currentList && listType) {
          content.push({
            type: listType,
            content: currentList
          });
        }
        currentList = [];
        listType = 'bulletList';
      }
      currentList!.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: parseInlineMarkdown(bulletMatch[1])
        }]
      });
      continue;
    }

    // Ordered list (1. 2. 3.)
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (listType !== 'orderedList') {
        if (currentList && listType) {
          content.push({
            type: listType,
            content: currentList
          });
        }
        currentList = [];
        listType = 'orderedList';
      }
      currentList!.push({
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: parseInlineMarkdown(orderedMatch[1])
        }]
      });
      continue;
    }

    // Regular paragraph
    if (currentList) {
      content.push({
        type: listType!,
        content: currentList
      });
      currentList = null;
      listType = null;
    }

    // Check if line has any content (not just whitespace)
    if (line.trim()) {
      content.push({
        type: 'paragraph',
        content: parseInlineMarkdown(line)
      });
    }
  }

  // Close any remaining list
  if (currentList) {
    content.push({
      type: listType!,
      content: currentList
    });
  }

  // If no content, add empty paragraph
  if (content.length === 0) {
    content.push({
      type: 'paragraph',
      content: []
    });
  }

  return {
    type: 'doc',
    version: 1,
    content
  };
}

/**
 * Parses inline markdown (bold, italic, code, links) within a line
 * Uses a simple approach: find all matches, then build nodes
 * @param text - Text with inline markdown
 * @returns Array of ADF text nodes with marks
 */
function parseInlineMarkdown(text: string): ADFNode[] {
  if (!text) {
    return [];
  }

  // Find all markdown patterns with their positions
  const segments: Array<{ start: number; end: number; type: string; content: string; url?: string; marks: Array<{ type: string; attrs?: any }> }> = [];
  
  // Match patterns in order of specificity (code and links first to avoid conflicts)
  let searchIndex = 0;
  
  while (searchIndex < text.length) {
    const remaining = text.substring(searchIndex);
    let matched = false;

    // Code `code` - highest priority
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      segments.push({
        start: searchIndex,
        end: searchIndex + codeMatch[0].length,
        type: 'formatted',
        content: codeMatch[1],
        marks: [{ type: 'code' }]
      });
      searchIndex += codeMatch[0].length;
      matched = true;
      continue;
    }

    // Links [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      segments.push({
        start: searchIndex,
        end: searchIndex + linkMatch[0].length,
        type: 'formatted',
        content: linkMatch[1],
        url: linkMatch[2],
        marks: [{ type: 'link', attrs: { href: linkMatch[2] } }]
      });
      searchIndex += linkMatch[0].length;
      matched = true;
      continue;
    }

    // Bold **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)([^*_\n]+?)\1/);
    if (boldMatch) {
      segments.push({
        start: searchIndex,
        end: searchIndex + boldMatch[0].length,
        type: 'formatted',
        content: boldMatch[2],
        marks: [{ type: 'strong' }]
      });
      searchIndex += boldMatch[0].length;
      matched = true;
      continue;
    }

    // Italic *text* or _text_ (but not if it's part of ** or __)
    const italicMatch = remaining.match(/^([*_])([^*_\n]+?)\1/);
    if (italicMatch) {
      // Check it's not part of bold
      const before = text.substring(Math.max(0, searchIndex - 1), searchIndex + 1);
      const after = text.substring(searchIndex + italicMatch[0].length - 1, searchIndex + italicMatch[0].length + 1);
      if (!before.match(/\*\*/) && !after.match(/\*\*/) && 
          !before.match(/__/) && !after.match(/__/)) {
        segments.push({
          start: searchIndex,
          end: searchIndex + italicMatch[0].length,
          type: 'formatted',
          content: italicMatch[2],
          marks: [{ type: 'em' }]
        });
        searchIndex += italicMatch[0].length;
        matched = true;
        continue;
      }
    }

    if (!matched) {
      searchIndex++;
    }
  }

  // Remove overlapping segments (keep first match)
  const nonOverlapping: typeof segments = [];
  for (const seg of segments) {
    const overlaps = nonOverlapping.some(s => 
      (seg.start < s.end && seg.end > s.start)
    );
    if (!overlaps) {
      nonOverlapping.push(seg);
    }
  }

  // Sort by position
  nonOverlapping.sort((a, b) => a.start - b.start);

  // Build nodes
  const nodes: ADFNode[] = [];
  let lastIndex = 0;

  for (const seg of nonOverlapping) {
    // Add plain text before this segment
    if (seg.start > lastIndex) {
      const plainText = text.substring(lastIndex, seg.start);
      if (plainText) {
        nodes.push({ type: 'text', text: plainText });
      }
    }

    // Add formatted segment
    nodes.push({
      type: 'text',
      text: seg.content,
      marks: seg.marks
    });

    lastIndex = seg.end;
  }

  // Add remaining plain text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    if (remaining) {
      nodes.push({ type: 'text', text: remaining });
    }
  }

  // If no markdown found, return plain text
  if (nodes.length === 0) {
    return [{ type: 'text', text }];
  }

  return nodes;
}

/**
 * Simple fallback: if markdown parsing fails, convert to plain text paragraph
 */
export function plainTextToADF(text: string): ADFNode {
  return {
    type: 'doc',
    version: 1,
    content: [{
      type: 'paragraph',
      content: text ? [{ type: 'text', text }] : []
    }]
  };
}

