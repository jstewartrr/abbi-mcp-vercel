// ABBI MCP - OpenAI-compatible endpoint with Hive Mind access
// Simli uses OpenAI format for custom LLM

const GROK_MCP = 'https://grok-mcp.graygrass-be154dbb.eastus.azurecontainerapps.io';

async function getHiveMindContext() {
  try {
    const response = await fetch(`${GROK_MCP}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'sm_hive_mind_read', arguments: { limit: 3 } }
      })
    });
    const data = await response.json();
    return data.result?.content?.[0]?.text || '';
  } catch (e) { return ''; }
}

async function callGrokChat(message, context) {
  const response = await fetch(`${GROK_MCP}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { 
        name: 'grok_chat', 
        arguments: { 
          message: `[ABBI VOICE REQUEST]\nHive Mind Context: ${context}\n\nUser: ${message}\n\nRespond as ABBI - concise, Australian accent style, address user as Your Grace. Keep under 3 sentences.`,
          use_tools: true 
        } 
      }
    })
  });
  const data = await response.json();
  return data.result?.content?.[0]?.text || 'I apologize, Your Grace, I encountered an error.';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, model } = req.body;
    const userMessage = messages?.filter(m => m.role === 'user').pop()?.content || '';
    
    // Get Hive Mind context
    const context = await getHiveMindContext();
    
    // Get response from Grok
    const response = await callGrokChat(userMessage, context);
    
    // Return in OpenAI format
    return res.json({
      id: `chatcmpl-abbi-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'abbi-grok',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: response },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
