#!/usr/bin/env tsx

/**
 * TNF PDF Lineup Agent
 * 
 * New architecture:
 * 1. User uploads PDF of projections to Slack channel
 * 2. Slack bot receives PDF and extracts projection data
 * 3. GPT analyzes projections and generates optimal lineups
 * 4. Bot responds with lineup recommendations
 */

import { WebClient } from '@slack/web-api';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

// Types
interface PlayerProjection {
  name: string;
  position: string;
  team: string;
  salary: number;
  projection: number;
  ownership?: number;
}

interface Lineup {
  players: PlayerProjection[];
  totalSalary: number;
  totalProjection: number;
  confidence: number;
  reasoning: string;
}

interface SlackEvent {
  type: string;
  event: {
    type: string;
    files?: Array<{
      id: string;
      name: string;
      url_private_download: string;
      mimetype: string;
    }>;
    channel: string;
    user: string;
    text?: string;
  };
}

class PDFLineupAgent {
  private slack: WebClient;
  private openai: OpenAI;
  private allowedChannels: string[];

  constructor() {
    this.slack = new WebClient(process.env.SLACK_BOT_TOKEN);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.allowedChannels = (process.env.ALLOWED_CHANNELS || '').split(',').filter(Boolean);
  }

  async handleSlackEvent(event: SlackEvent): Promise<void> {
    console.log('[slack] Received event:', event.type);

    if (event.type === 'url_verification') {
      return; // Handle Slack URL verification
    }

    if (event.type === 'event_callback' && event.event.type === 'file_shared') {
      await this.handleFileUpload(event.event);
    }
  }

  private async handleFileUpload(event: SlackEvent['event']): Promise<void> {
    if (!event.files || event.files.length === 0) {
      console.log('[slack] No files in upload event');
      return;
    }

    const file = event.files[0];
    
    // Check if it's a PDF
    if (!file.mimetype.includes('pdf')) {
      console.log('[slack] File is not a PDF, ignoring');
      return;
    }

    // Check if channel is allowed
    if (this.allowedChannels.length > 0 && !this.allowedChannels.includes(event.channel)) {
      console.log('[slack] Channel not allowed, ignoring');
      return;
    }

    console.log('[slack] Processing PDF:', file.name);
    
    try {
      // Download PDF
      const pdfPath = await this.downloadPDF(file);
      
      // Extract projection data
      const projections = await this.extractProjectionsFromPDF(pdfPath);
      
      // Generate lineups
      const lineups = await this.generateOptimalLineups(projections);
      
      // Send response to Slack
      await this.sendLineupRecommendations(event.channel, lineups, file.name);
      
      // Cleanup
      fs.unlinkSync(pdfPath);
      
    } catch (error) {
      console.error('[error] Failed to process PDF:', error);
      await this.sendErrorMessage(event.channel, error.message);
    }
  }

  private async downloadPDF(file: SlackEvent['event']['files'][0]): Promise<string> {
    console.log('[download] Downloading PDF...');
    
    const response = await this.slack.files.info({ file: file.id });
    const downloadUrl = response.file?.url_private_download;
    
    if (!downloadUrl) {
      throw new Error('Could not get download URL for file');
    }

    // Download file
    const pdfResponse = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
      }
    });

    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfPath = path.join(process.cwd(), `temp_${Date.now()}.pdf`);
    
    fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));
    console.log('[download] PDF saved to:', pdfPath);
    
    return pdfPath;
  }

  private async extractProjectionsFromPDF(pdfPath: string): Promise<PlayerProjection[]> {
    console.log('[extract] Extracting projections from PDF...');
    
    // For now, we'll use a simple approach with OpenAI's vision API
    // In production, you might want to use a dedicated PDF parsing library
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64PDF = pdfBuffer.toString('base64');
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all player projections from this PDF. Return ONLY a JSON array with this exact format:
              [
                {
                  "name": "Player Name",
                  "position": "QB|RB|WR|TE|K|DST",
                  "team": "Team Abbreviation",
                  "salary": 8500,
                  "projection": 18.5,
                  "ownership": 12.3
                }
              ]
              
              Include ALL players with salary and projection data. If ownership is not available, omit that field.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64PDF}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;
    console.log('[extract] GPT response length:', content?.length);
    
    try {
      const projections = JSON.parse(content || '[]');
      console.log('[extract] Extracted', projections.length, 'projections');
      return projections;
    } catch (error) {
      console.error('[extract] Failed to parse GPT response:', error);
      throw new Error('Failed to extract projection data from PDF');
    }
  }

  private async generateOptimalLineups(projections: PlayerProjection[]): Promise<Lineup[]> {
    console.log('[lineup] Generating optimal lineups...');
    
    const prompt = `You are a DFS expert analyzing NFL Thursday Night Football projections.

Available players:
${projections.map(p => `${p.name} (${p.position}, ${p.team}) - $${p.salary} - ${p.projection} pts${p.ownership ? ` - ${p.ownership}% owned` : ''}`).join('\n')}

Generate 3 optimal DraftKings Showdown lineups with this strategy:
1. BALANCED: Mix of high-floor and ceiling players
2. CONTRARIAN: Lower ownership, higher upside
3. CASH: High-floor, safe plays

For each lineup, provide:
- Total salary (must be ≤ $50,000)
- Expected total points
- Confidence level (1-10)
- Brief reasoning

Return ONLY a JSON array with this format:
[
  {
    "strategy": "BALANCED|CONTRARIAN|CASH",
    "players": ["Player1", "Player2", "Player3", "Player4", "Player5", "Player6"],
    "totalSalary": 49500,
    "totalProjection": 125.5,
    "confidence": 8,
    "reasoning": "Brief explanation of lineup strategy"
  }
]`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    try {
      const lineups = JSON.parse(content || '[]');
      console.log('[lineup] Generated', lineups.length, 'lineups');
      return lineups;
    } catch (error) {
      console.error('[lineup] Failed to parse lineup response:', error);
      throw new Error('Failed to generate lineup recommendations');
    }
  }

  private async sendLineupRecommendations(channel: string, lineups: Lineup[], fileName: string): Promise<void> {
    console.log('[slack] Sending lineup recommendations...');
    
    let message = `🏈 *TNF Lineup Analysis* - ${fileName}\n\n`;
    
    lineups.forEach((lineup, index) => {
      message += `*${index + 1}. ${lineup.strategy} Lineup*\n`;
      message += `💰 Salary: $${lineup.totalSalary.toLocaleString()} | 📊 Projection: ${lineup.totalProjection} pts | 🎯 Confidence: ${lineup.confidence}/10\n\n`;
      
      lineup.players.forEach(player => {
        message += `• ${player}\n`;
      });
      
      message += `\n💭 *Reasoning:* ${lineup.reasoning}\n\n`;
      message += '---\n\n';
    });
    
    message += `🤖 *Generated by TNF Lineup Agent*`;
    
    await this.slack.chat.postMessage({
      channel,
      text: message,
      mrkdwn: true
    });
  }

  private async sendErrorMessage(channel: string, error: string): Promise<void> {
    await this.slack.chat.postMessage({
      channel,
      text: `❌ *Error processing PDF:* ${error}\n\nPlease ensure the PDF contains clear projection data with player names, positions, salaries, and projections.`
    });
  }
}

// Express server for Slack events
import express from 'express';

const app = express();
const agent = new PDFLineupAgent();

app.use(express.json());

app.post('/slack/events', async (req, res) => {
  try {
    await agent.handleSlackEvent(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('[server] Error handling Slack event:', error);
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] TNF PDF Lineup Agent running on port ${PORT}`);
  console.log(`[server] Waiting for PDF uploads in Slack...`);
});

export default PDFLineupAgent;
