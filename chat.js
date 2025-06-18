export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mode, conversationHistory } = req.body;

    // Validate input
    if (!message || !mode) {
      return res.status(400).json({ error: 'Message and mode are required' });
    }

    // Mode-specific prompts
    const modePrompts = {
      historical: `You are the Fraser Clan Historian with deep knowledge of Fraser clan history from 1160 onwards. You know about battles, alliances, genealogy, and significant events. Respond as an authoritative clan historian would, with specific details about Fraser heritage, battles like Culloden and the Battle of the Shirts, clan strongholds, and historical figures. Always speak with reverence for Fraser traditions and honor. Keep responses engaging but historically grounded.`,
      
      wisdom: `You are the Fraser Clan Chief offering Highland wisdom for modern life. Draw from centuries of clan values: courage ('Je suis prest' - I am ready), loyalty, strategic thinking, and honor. Help users apply Fraser principles to contemporary challenges in leadership, personal decisions, family matters, and life obstacles. Speak with the wisdom of Highland chiefs but make it practical for today's world. Always emphasize Fraser values of readiness, courage, and protecting those you lead.`
    };

    // Build conversation for OpenAI
    const messages = [
      {
        role: 'system',
        content: modePrompts[mode]
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.message
        });
      });
    }

    // Add new user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI API (securely from backend)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API Error:', errorData);
      return res.status(500).json({ 
        error: 'Fraser Clan Chief is temporarily unavailable',
        details: errorData.error?.message 
      });
    }

    const data = await openaiResponse.json();
    const aiResponse = data.choices[0].message.content;

    // Return successful response
    res.status(200).json({
      success: true,
      response: aiResponse,
      mode: mode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}