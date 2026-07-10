/**
 * Ollama Integration Service
 */

const OLLAMA_URL = 'http://localhost:11434/api/chat';

async function generateAnswer(question, relevantChunks) {
  const model = process.env.OLLAMA_MODEL || 'llama3.2';
  
  // Format the context from retrieved chunks
  const contextText = relevantChunks
    .map((chunk, index) => `[Source: ${chunk.docName}] (Excerpt ${index + 1}):\n${chunk.text}`)
    .join('\n\n');
  
  const systemPrompt = `You are a helpful assistant named DocuMind. You answer questions based ONLY on the provided context retrieved from the user's uploaded documents.
  
Instructions:
1. Answer the question accurately using ONLY the information contained in the Context section below.
2. Do NOT use any external knowledge, assumptions, or logic not directly supported by the context.
3. If the context does not contain enough information to answer the question, or if there is no context, you MUST reply EXACTLY with: "I could not find this information in the uploaded documents." and nothing else.
4. Keep the answer professional and factual.

Context:
${contextText || 'No document context available.'}
`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question }
  ];

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Model '${model}' not found in Ollama. Please run: ollama pull ${model}`);
      }
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      throw new Error('Ollama is not running. Please start Ollama using: ollama serve');
    }
    throw error;
  }
}

module.exports = { generateAnswer };
