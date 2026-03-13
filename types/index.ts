export type RiskLevel = 'low' | 'medium' | 'high';

export interface Announcement {
  id: string;
  slug: string;
  title: string;
  category: string;
  department?: string;
  publishDate: string;
  expiryDate: string;
  attachments?: { name: string; url: string }[];
  content: string;
}

export interface NewsAlert {
  id: string;
  slug: string;
  title: string;
  description: string;
  riskLevel?: RiskLevel;
  publishDate: string;
  expiryDate: string;
}

export interface Speaker {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
}

export interface ProgramItem {
  time: string;
  activity: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  endDate?: string;
  location: string;
  shortDescription: string;
  detailedDescription?: string;
  logo?: string;
  activities?: string[];
  targetAudience?: string[];
  program?: ProgramItem[];
  gallery?: string[];
  speakers?: Speaker[];
  results?: string[];
  documents?: { name: string; url: string }[];
  isUpcoming: boolean;
  category?: string;
}
