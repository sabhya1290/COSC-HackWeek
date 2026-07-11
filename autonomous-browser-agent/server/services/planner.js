import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const SYSTEM_PROMPT = `You are a web automation planner. Your job is to break down a user's web browsing request into a series of structured browser execution steps.
You MUST output a JSON array of step objects, and NOTHING else. No markdown formatting (like \`\`\`json), no preamble, no text. Just raw JSON.
Each step object in the array must have the following structure:
{
  "action": "navigate" | "click" | "type" | "extract" | "wait",
  "url": "https://example.com" (only for navigate action, check safety list),
  "selector": "CSS selector to interact with" (for click, type, extract),
  "value": "text to type or action modifier" (only for type or wait action),
  "description": "Short human readable explanation of the step"
}

Safety Rule: The only allowed domains are:
- example.com
- wikipedia.org
- wikipedia.com
- developer.mozilla.org
- httpbin.org
- http://localhost:5000/demo/contact.html (and other demo subpages)

Here is a list of common selectors for demo sites:
- Wikipedia Search Box: 'input[name="search"]'
- MDN Search Box: 'input[type="search"]'
- Local Contact Form:
  - Name input: '#name'
  - Email input: '#email'
  - Message input: '#message'
  - Submit Button: 'button[type="submit"]'
- Local Shopping Page:
  - Product title/description extract: '.product-card'
  - Compare checkbox: 'input[type="checkbox"]'
  - Compare action button: '#compare-btn'

Example Output for visiting example.com:
[
  {"action": "navigate", "url": "https://example.com", "description": "Navigate to example.com"},
  {"action": "extract", "selector": "h1", "description": "Extract the main heading text"},
  {"action": "extract", "selector": "p", "description": "Extract the paragraph text"}
]`;

export async function generatePlan(prompt, port = 5000) {
  try {
    // Attempt local Ollama chat endpoint
    const response = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: {
        temperature: 0.1
      }
    }, { timeout: 4000 });

    let content = response.data?.message?.content || '';
    
    // Cleanup markdown wrapping if the LLM didn't obey
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const steps = JSON.parse(content);
    if (Array.isArray(steps) && steps.length > 0) {
      return steps.map((s, idx) => ({ ...s, id: idx, status: 'pending' }));
    }
  } catch (error) {
    // Fallback to rule-based planner if Ollama is not available or throws parsing errors
  }

  return generateRuleBasedPlan(prompt, port);
}

function extractSearchTerm(prompt, defaultVal = 'Artificial Intelligence') {
  const patterns = [
    /search wikipedia for\s+["']?([^"'\?\.]+)/i,
    /wikipedia search for\s+["']?([^"'\?\.]+)/i,
    /search for\s+["']?([^"'\?\.]+)/i,
    /wikipedia\s+["']?([^"'\?\.]+)/i,
    /about\s+["']?([^"'\?\.]+)/i
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      const val = match[1].trim();
      if (val && !val.toLowerCase().includes('wikipedia')) {
        return val;
      }
    }
  }
  const cleanWords = prompt.split(/\s+/).filter(w => {
    const lw = w.toLowerCase();
    return !['search', 'wikipedia', 'for', 'on', 'about', 'and', 'extract', 'the', 'first', 'paragraph'].includes(lw);
  });
  return cleanWords.length > 0 ? cleanWords.join(' ') : defaultVal;
}

function extractMdnSearchTerm(prompt, defaultVal = 'JavaScript fetch API') {
  const patterns = [
    /search mdn for\s+["']?([^"'\?\.]+)/i,
    /mdn search for\s+["']?([^"'\?\.]+)/i,
    /search for\s+["']?([^"'\?\.]+)/i,
    /mdn\s+["']?([^"'\?\.]+)/i
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      const val = match[1].trim();
      if (val && !val.toLowerCase().includes('mdn')) {
        return val;
      }
    }
  }
  const cleanWords = prompt.split(/\s+/).filter(w => {
    const lw = w.toLowerCase();
    return !['search', 'mdn', 'for', 'on', 'about', 'and', 'extract', 'the', 'page', 'title'].includes(lw);
  });
  return cleanWords.length > 0 ? cleanWords.join(' ') : defaultVal;
}

function extractContactDetails(prompt) {
  let name = 'John Doe';
  let email = 'john.doe@example.com';
  let message = 'This is a sample contact message from the Autonomous Browser Agent in Demo Mode.';

  const nameMatch = prompt.match(/(?:name is|name|named)\s+["']?([a-zA-Z\s]+?)(?:["']?,\s*|["']?\s+(?:email|message|and|is|with))/i)
    || prompt.match(/named\s+([a-zA-Z\s]+)$/i);
  if (nameMatch && nameMatch[1]) name = nameMatch[1].trim();

  const emailMatch = prompt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch && emailMatch[1]) email = emailMatch[1].trim();

  const msgMatch = prompt.match(/(?:message is|message|saying)\s+["']?([^"'\.]+)/i);
  if (msgMatch && msgMatch[1]) message = msgMatch[1].trim();

  return { name, email, message };
}

function extractAppointmentDetails(prompt) {
  let name = 'Jane Smith';
  let date = '2026-10-15';
  let department = 'General Consulting';

  const nameMatch = prompt.match(/(?:patient name|patient|for)\s+["']?([a-zA-Z\s]+?)(?:["']?,\s*|["']?\s+(?:date|on|appointment|dept|department|is|with))/i);
  if (nameMatch && nameMatch[1]) name = nameMatch[1].trim();

  const dateMatch = prompt.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch && dateMatch[1]) date = dateMatch[1].trim();

  if (prompt.toLowerCase().includes('cardiology')) department = 'Cardiology';
  else if (prompt.toLowerCase().includes('pediatrics')) department = 'Pediatrics';
  else if (prompt.toLowerCase().includes('orthopedics')) department = 'Orthopedics';

  return { name, date, department };
}

function generateRuleBasedPlan(prompt, port) {
  const normalized = prompt.toLowerCase();
  
  // Rule 1: Wikipedia Search
  if (normalized.includes('wikipedia') || normalized.includes('artificial intelligence')) {
    const searchTerm = extractSearchTerm(prompt, 'Artificial Intelligence');
    return [
      {
        id: 0,
        action: 'navigate',
        url: 'https://en.wikipedia.org/wiki/Main_Page',
        description: 'Navigate to the Wikipedia Main Page',
        status: 'pending'
      },
      {
        id: 1,
        action: 'type',
        selector: 'input[name="search"]',
        value: searchTerm,
        description: `Search for "${searchTerm}"`,
        status: 'pending'
      },
      {
        id: 2,
        action: 'click',
        selector: 'button.cdx-search-input__end-button, button[type="submit"]',
        description: 'Click the Search button',
        status: 'pending'
      },
      {
        id: 3,
        action: 'extract',
        selector: '.mw-parser-output > p:not(.mw-empty-elt)',
        description: 'Extract the first paragraph of the page content',
        status: 'pending'
      }
    ];
  }

  // Rule 2: MDN Search
  if (normalized.includes('mdn') || normalized.includes('fetch api') || normalized.includes('javascript fetch')) {
    const query = extractMdnSearchTerm(prompt, 'JavaScript fetch API');
    
    // Direct shortcut if it is exactly the preset
    if (normalized.includes('fetch api') || normalized.includes('javascript fetch')) {
      return [
        {
          id: 0,
          action: 'navigate',
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
          description: 'Navigate directly to MDN Web Docs for Fetch API',
          status: 'pending'
        },
        {
          id: 1,
          action: 'extract',
          selector: 'h1',
          description: 'Extract the main header/title of the page',
          status: 'pending'
        },
        {
          id: 2,
          action: 'extract',
          selector: 'article p',
          description: 'Extract first paragraphs of the API description',
          status: 'pending'
        }
      ];
    }

    // Otherwise, perform direct search via MDN search query URL
    return [
      {
        id: 0,
        action: 'navigate',
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(query)}`,
        description: `Navigate to MDN Search results for "${query}"`,
        status: 'pending'
      },
      {
        id: 1,
        action: 'click',
        selector: '.search-results-list a, .search-result h3 a, h3 a',
        description: 'Click the first search result',
        status: 'pending'
      },
      {
        id: 2,
        action: 'extract',
        selector: 'h1',
        description: 'Extract the main page heading',
        status: 'pending'
      }
    ];
  }

  // Rule 3: Contact Form
  if (normalized.includes('contact form') || normalized.includes('contact') || normalized.includes('fill')) {
    const details = extractContactDetails(prompt);
    return [
      {
        id: 0,
        action: 'navigate',
        url: `http://localhost:${port}/demo/contact.html`,
        description: 'Navigate to the local contact form demo page',
        status: 'pending'
      },
      {
        id: 1,
        action: 'type',
        selector: '#name',
        value: details.name,
        description: `Fill name field with "${details.name}"`,
        status: 'pending'
      },
      {
        id: 2,
        action: 'type',
        selector: '#email',
        value: details.email,
        description: `Fill email field with "${details.email}"`,
        status: 'pending'
      },
      {
        id: 3,
        action: 'type',
        selector: '#message',
        value: details.message,
        description: 'Fill message content text area',
        status: 'pending'
      },
      {
        id: 4,
        action: 'click',
        selector: '#contact-form button[type="submit"]',
        description: 'Click Submit Contact Form button',
        status: 'pending'
      },
      {
        id: 5,
        action: 'extract',
        selector: '#success-msg',
        description: 'Extract the confirmation success message',
        status: 'pending'
      }
    ];
  }

  // Rule 4: Compare Products/Shopping
  if (normalized.includes('compare') || normalized.includes('shopping') || normalized.includes('product') || normalized.includes('laptop')) {
    return [
      {
        id: 0,
        action: 'navigate',
        url: `http://localhost:${port}/demo/shopping.html`,
        description: 'Navigate to local demo shopping product list page',
        status: 'pending'
      },
      {
        id: 1,
        action: 'click',
        selector: 'input[data-id="1"]',
        description: 'Check item 1: Premium UltraBook',
        status: 'pending'
      },
      {
        id: 2,
        action: 'click',
        selector: 'input[data-id="2"]',
        description: 'Check item 2: Budget Developer Laptop',
        status: 'pending'
      },
      {
        id: 3,
        action: 'click',
        selector: 'input[data-id="3"]',
        description: 'Check item 3: Pro Gaming Machine',
        status: 'pending'
      },
      {
        id: 4,
        action: 'click',
        selector: '#compare-btn',
        description: 'Click on the Compare Selected Products button',
        status: 'pending'
      },
      {
        id: 5,
        action: 'extract',
        selector: '#comparison-table',
        description: 'Extract the product comparisons table contents',
        status: 'pending'
      }
    ];
  }

  // Rule 5: example.com
  if (normalized.includes('example.com') || normalized.includes('example')) {
    return [
      {
        id: 0,
        action: 'navigate',
        url: 'https://example.com',
        description: 'Navigate to example.com site',
        status: 'pending'
      },
      {
        id: 1,
        action: 'extract',
        selector: 'h1',
        description: 'Extract heading title text',
        status: 'pending'
      },
      {
        id: 2,
        action: 'extract',
        selector: 'p',
        description: 'Extract paragraph content description',
        status: 'pending'
      }
    ];
  }

  // Rule 6: Dummy Appointment
  if (normalized.includes('appointment') || normalized.includes('book')) {
    const details = extractAppointmentDetails(prompt);
    return [
      {
        id: 0,
        action: 'navigate',
        url: `http://localhost:${port}/demo/appointment.html`,
        description: 'Navigate to local demo booking appointment page',
        status: 'pending'
      },
      {
        id: 1,
        action: 'type',
        selector: '#patient-name',
        value: details.name,
        description: `Type name "${details.name}"`,
        status: 'pending'
      },
      {
        id: 2,
        action: 'type',
        selector: '#appointment-date',
        value: details.date,
        description: `Input desired date ${details.date}`,
        status: 'pending'
      },
      {
        id: 3,
        action: 'type',
        selector: '#department',
        value: details.department,
        description: `Select consulting department "${details.department}"`,
        status: 'pending'
      },
      {
        id: 4,
        action: 'click',
        selector: '#book-form button[type="submit"]',
        description: 'Submit Appointment booking request',
        status: 'pending'
      },
      {
        id: 5,
        action: 'extract',
        selector: '#booking-summary',
        description: 'Scrape booking success summary details',
        status: 'pending'
      }
    ];
  }

  // Default Fallback
  return [
    {
      id: 0,
      action: 'navigate',
      url: 'https://example.com',
      description: 'Default Action: Navigate to example.com',
      status: 'pending'
    },
    {
      id: 1,
      action: 'extract',
      selector: 'h1',
      description: 'Extract heading text',
      status: 'pending'
    }
  ];
}
