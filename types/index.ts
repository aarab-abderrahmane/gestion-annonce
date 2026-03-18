export type ContentStatus = 'draft' | 'published';
export type RiskLevel = 'low' | 'medium' | 'high';
export type BreakingNewsLevel = 'dangerous' | 'urgent' | 'warning';
export type AnnouncementFileType = 'pdf' | 'image';
export type EventPersonType = 'participant' | 'organizer';
export type SearchResultType = 'announcement' | 'event' | 'breaking-news';

export interface Division {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
}

export interface Group {
  id: string;
  divisionId?: string;
  name: string;
  slug: string;
  createdAt?: string;
  division?: Division | null;
}

export interface AnnouncementCategory {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
}

export interface AnnouncementFile {
  id?: string;
  announcementId?: string;
  name: string;
  url: string;
  fileType?: AnnouncementFileType;
  createdAt?: string;
}

export interface EventPhoto {
  id?: string;
  eventId?: string;
  url: string;
  createdAt?: string;
}

export interface BreakingNews {
  id: string;
  slug: string;
  title: string;
  description: string;
  level?: BreakingNewsLevel;
  riskLevel?: RiskLevel;
  status?: ContentStatus;
  publishDate: string;
  expiryDate: string;
  createdAt?: string;
}

export type NewsAlert = BreakingNews;

export interface Announcement {
  id: string;
  slug: string;
  title: string;
  category: string;
  categories?: string[];
  categoryRecords?: AnnouncementCategory[];
  division?: Division | null;
  group?: Group | null;
  department?: string;
  publishDate: string;
  expiryDate: string;
  status?: ContentStatus;
  attachments?: AnnouncementFile[];
  content: string;
  createdAt?: string;
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

export interface EventPerson {
  id: string;
  name: string;
  role: string;
  type: EventPersonType;
  image?: string;
  createdAt?: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  endDate?: string;
  startsAt?: string;
  endsAt?: string;
  location: string;
  shortDescription: string;
  detailedDescription?: string;
  logo?: string;
  activities?: string[];
  targetAudience?: string[];
  program?: ProgramItem[];
  gallery?: string[];
  photos?: EventPhoto[];
  speakers?: Speaker[];
  people?: EventPerson[];
  participants?: EventPerson[];
  organizers?: EventPerson[];
  attendeeCount?: number;
  categories?: string[];
  categoryRecords?: EventCategory[];
  results?: string[];
  documents?: AnnouncementFile[];
  isUpcoming: boolean;
  category?: string;
  status?: ContentStatus;
  createdAt?: string;
}

export interface SearchResultItem {
  id: string;
  slug: string;
  type: SearchResultType;
  title: string;
  excerpt: string;
  date: string;
  badge: string;
  href: string;
}
