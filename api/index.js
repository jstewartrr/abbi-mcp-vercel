export default async function handler(req, res) {
  res.json({
    service: 'ABBI MCP',
    version: '1.0.0',
    status: 'healthy',
    description: 'ABBI voice interface with Hive Mind access via Grok',
    endpoints: {
      chat: '/api/chat',
      openai_compat: '/api/v1/chat/completions'
    },
    hive_mind: true,
    backend: 'Grok MCP'
  });
}
