#!/usr/bin/env tsx

/**
 * Test script for PDF Lineup Agent
 * Tests the core functionality without Slack integration
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// Mock projection data for testing
const mockProjections = [
  { name: "Lamar Jackson", position: "QB", team: "BAL", salary: 9500, projection: 24.5, ownership: 15.2 },
  { name: "Tua Tagovailoa", position: "QB", team: "MIA", salary: 8800, projection: 22.1, ownership: 12.8 },
  { name: "Gus Edwards", position: "RB", team: "BAL", salary: 7200, projection: 18.3, ownership: 8.5 },
  { name: "Raheem Mostert", position: "RB", team: "MIA", salary: 6800, projection: 16.7, ownership: 6.2 },
  { name: "Zay Flowers", position: "WR", team: "BAL", salary: 6400, projection: 14.2, ownership: 11.3 },
  { name: "Tyreek Hill", position: "WR", team: "MIA", salary: 9200, projection: 20.8, ownership: 18.7 },
  { name: "Mark Andrews", position: "TE", team: "BAL", salary: 5800, projection: 12.5, ownership: 9.1 },
  { name: "Justin Tucker", position: "K", team: "BAL", salary: 4200, projection: 8.5, ownership: 3.2 },
  { name: "Ravens DST", position: "DST", team: "BAL", salary: 3800, projection: 7.8, ownership: 4.5 }
];

async function testLineupGeneration() {
  console.log('🧪 Testing PDF Lineup Agent Core Functionality\n');
  
  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set in environment');
    console.log('Please add your OpenAI API key to the .env file');
    return;
  }
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  console.log('📊 Mock projection data:');
  mockProjections.forEach(p => {
    console.log(`  ${p.name} (${p.position}, ${p.team}) - $${p.salary} - ${p.projection} pts - ${p.ownership}% owned`);
  });
  
  console.log('\n🤖 Generating optimal lineups...');
  
  const prompt = `You are a DFS expert analyzing NFL Thursday Night Football projections.

Available players:
${mockProjections.map(p => `${p.name} (${p.position}, ${p.team}) - $${p.salary} - ${p.projection} pts${p.ownership ? ` - ${p.ownership}% owned` : ''}`).join('\n')}

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

  try {
    const response = await openai.chat.completions.create({
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
    console.log('\n📋 GPT Response:');
    console.log(content);
    
    try {
      const lineups = JSON.parse(content || '[]');
      console.log('\n✅ Successfully parsed', lineups.length, 'lineups');
      
      lineups.forEach((lineup, index) => {
        console.log(`\n${index + 1}. ${lineup.strategy} Lineup:`);
        console.log(`   Salary: $${lineup.totalSalary?.toLocaleString()} | Projection: ${lineup.totalProjection} pts | Confidence: ${lineup.confidence}/10`);
        console.log(`   Players: ${lineup.players?.join(', ')}`);
        console.log(`   Reasoning: ${lineup.reasoning}`);
      });
      
    } catch (parseError) {
      console.error('❌ Failed to parse lineup response:', parseError);
    }
    
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
  }
}

// Run the test
testLineupGeneration().catch(console.error);
