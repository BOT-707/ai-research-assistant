export interface Competitor {
  name: string;
  website: string;
}

export interface AIReport {
  summary: string;
  products: string[];
  services: string[];
  pain_points: string[];
  competitors: Competitor[];
}

export interface CompanyInfo {
  name: string;
  website: string;
  phone?: string;
  address?: string;
}

export interface ResearchData {
  company: CompanyInfo;
  report: AIReport | null;
}

export interface ProgressEvent {
  step: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  details?: string;
}
