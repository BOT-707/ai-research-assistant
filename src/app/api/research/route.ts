import { NextResponse } from 'next/server';
import { searchCompany } from '@/services/serper';
import { crawlWebsite } from '@/services/crawler';
import { generateReport } from '@/services/openrouter';
import { enhanceCompetitors } from '@/services/competitors';
import { ResearchData } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, model, openRouterKey, serperKey } = body;
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (step: string, status: 'pending'|'active'|'completed'|'error', details?: string) => {
          const event = { step, status, details };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'progress', data: event })}\n\n`));
        };

        const sendComplete = (data: ResearchData) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', data })}\n\n`));
        };

        const sendError = (error: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error })}\n\n`));
          controller.close();
        };

        try {
          let companyName = input.trim();
          let website = '';
          let phone = undefined;
          let address = undefined;

          // 1. Determine if input is URL or Name
          // Basic URL regex
          const isUrl = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i.test(companyName);

          if (isUrl) {
            website = companyName.startsWith('http') ? companyName : `https://${companyName}`;
            sendProgress('Analyzing URL...', 'completed');
          } else {
            // Search via Serper
            sendProgress('Searching company...', 'active', `Looking up ${companyName}`);
            const searchResult = await searchCompany(companyName, serperKey);
            
            if (!searchResult || !searchResult.website) {
              sendProgress('Searching company...', 'error', 'Could not find official website.');
              sendError('Could not find the official website for the provided company name. Make sure your Serper API Key is set.');
              return;
            }
            
            companyName = searchResult.name;
            website = searchResult.website;
            phone = searchResult.phone;
            address = searchResult.address;
            
            sendProgress('Searching company...', 'completed');
          }

          // 2. Crawl Website
          sendProgress('Crawling website...', 'active', `Target: ${website}`);
          const websiteContent = await crawlWebsite(website);

          let finalContent = websiteContent;
          if (!websiteContent || websiteContent.trim().length === 0) {
            sendProgress('Crawling website...', 'completed', 'Content blocked, using AI knowledge');
            finalContent = `[Website crawler was blocked. Please generate the report for ${companyName} using your pre-existing internal knowledge.]`;
          } else {
            sendProgress('Crawling website...', 'completed');
          }

          // 3. AI Analysis
          sendProgress('Generating AI analysis...', 'active', `Model: ${model || 'default'}`);
          let aiReport = await generateReport(companyName, finalContent, model, openRouterKey);
          
          if (!aiReport) {
            sendProgress('Generating AI analysis...', 'error', 'AI analysis failed.');
            sendError('Failed to generate report using the selected AI model. Make sure your OpenRouter API Key is set.');
            return;
          }
          sendProgress('Generating AI analysis...', 'completed');

          // 4. Competitor Enhancement
          sendProgress('Finding competitors...', 'active', 'Validating websites');
          aiReport = await enhanceCompetitors(aiReport, serperKey);
          sendProgress('Finding competitors...', 'completed');

          // 5. Final Result
          const finalData: ResearchData = {
            company: {
              name: companyName,
              website,
              phone,
              address
            },
            report: aiReport
          };

          sendComplete(finalData);
          controller.close();
        } catch (err: any) {
          sendError(err.message || 'An unexpected error occurred during the research process.');
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Research Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
