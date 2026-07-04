import axios from 'axios';
import { CompanyInfo } from '../types';

export async function searchCompany(query: string, apiKey?: string): Promise<CompanyInfo | null> {
  const SERPER_API_KEY = apiKey || process.env.SERPER_API_KEY;
  if (!SERPER_API_KEY) {
    console.warn('SERPER_API_KEY is missing. Search functionality might fail.');
  }

  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: `${query} official website` },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY || '',
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;
    
    let website = '';
    let phone = undefined;
    let address = undefined;
    let name = query;

    if (data.knowledgeGraph) {
      if (data.knowledgeGraph.title) name = data.knowledgeGraph.title;
      if (data.knowledgeGraph.website) website = data.knowledgeGraph.website;
    }

    if (!website && data.organic && data.organic.length > 0) {
      // Filter out common directories or social media
      const organicSites = data.organic.filter((o: any) => {
        const url = o.link.toLowerCase();
        return !url.includes('linkedin.com') && 
               !url.includes('wikipedia.org') &&
               !url.includes('facebook.com') &&
               !url.includes('twitter.com') &&
               !url.includes('bloomberg.com') &&
               !url.includes('crunchbase.com');
      });
      
      if (organicSites.length > 0) {
        website = organicSites[0].link;
      } else {
        website = data.organic[0].link;
      }
    }

    if (!website) return null;

    // Optional: Extract a clean origin URL without deep paths
    try {
      const urlObj = new URL(website);
      website = `${urlObj.protocol}//${urlObj.hostname}`;
    } catch(e) {
      // Keep website as is if parsing fails
    }

    return {
      name,
      website,
      phone,
      address
    };
  } catch (error) {
    console.error('Serper search failed:', error);
    return null;
  }
}
