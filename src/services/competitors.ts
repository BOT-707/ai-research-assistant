import { AIReport } from '../types';
import { searchCompany } from './serper';

export async function enhanceCompetitors(report: AIReport, apiKey?: string): Promise<AIReport> {
  if (!report.competitors || !Array.isArray(report.competitors)) {
    return report;
  }

  const enhancedCompetitors = [...report.competitors];

  for (let i = 0; i < enhancedCompetitors.length; i++) {
    const comp = enhancedCompetitors[i];
    
    // If the AI didn't provide a website, try to find it via Serper
    if (!comp.website || comp.website.trim() === '') {
      try {
        const info = await searchCompany(comp.name, apiKey);
        if (info && info.website) {
          enhancedCompetitors[i] = {
            ...comp,
            website: info.website
          };
        }
      } catch (e) {
        console.warn(`Could not find website for competitor ${comp.name}`);
      }
    }
  }

  return {
    ...report,
    competitors: enhancedCompetitors
  };
}
