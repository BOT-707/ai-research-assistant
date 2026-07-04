import axios from 'axios';
import { AIReport } from '../types';

export async function generateReport(companyName: string, websiteContent: string, model: string, apiKey?: string): Promise<AIReport | null> {
  const OPENROUTER_API_KEY = apiKey || process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is missing.');
  }

  const systemPrompt = `You are an expert business analyst and AI research assistant. Your task is to analyze the provided content from the company's website and generate a professional company report.
You MUST output ONLY a valid JSON object. Do not include markdown formatting, backticks, or any other text before or after the JSON.
The JSON MUST strictly follow this structure:
{
  "summary": "Short professional summary of the company.",
  "products": ["Product 1", "Product 2"],
  "services": ["Service 1", "Service 2"],
  "pain_points": ["Pain point 1", "Pain point 2"],
  "competitors": [
    {
      "name": "Competitor Name",
      "website": "Competitor Website (if known, else empty string)"
    }
  ]
}

Instructions:
- summary: Short professional summary.
- products: List of products they offer. If none found, return an empty array.
- services: List of services they offer. If none found, return an empty array.
- pain_points: Infer realistic, business-oriented pain points their customers might have (e.g., Manual workflows, Customer support scaling). State uncertainty if confidence is low.
- competitors: Suggest competitors operating in the same industry, similar products, or same region whenever possible. Provide their website if you know it.
`;

  // Truncate content to avoid exceeding context window for some models
  const maxContentLength = 60000; // ~15k-20k tokens safe margin for most modern models
  const truncatedContent = websiteContent.length > maxContentLength 
    ? websiteContent.substring(0, maxContentLength) + '\n...[Content Truncated]' 
    : websiteContent;

  const userMessage = `Company Name: ${companyName}\n\nWebsite Content:\n${truncatedContent}`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model || 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Company Research Assistant',
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
       console.error('Empty response from OpenRouter');
       return null;
    }

    let parsed: AIReport;
    
    try {
      // Strip potential markdown wrappers just in case
      const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI output as JSON:', content);
      throw new Error('AI produced invalid JSON output.');
    }

    return parsed;
  } catch (error: any) {
    console.error('OpenRouter AI request failed:', error?.response?.data || error.message);
    return null;
  }
}
