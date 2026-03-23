import type { Announcement, Event, NewsAlert } from '@/types';

const levelMap: Record<string, NewsAlert['riskLevel']> = {
  dangerous: 'high',
  urgent: 'medium',
  warning: 'low',
};

const dateOnly = (value?: string | null) => (value ? value.split('T')[0] : '');

type CategoryRecord = { id?: string | null; name?: string | null; slug?: string | null };
type DivisionRecord = { name?: string | null };
type GroupRecord = { name?: string | null };
type AnnouncementFileRecord = {
  file_name?: string | null;
  file_url?: string | null;
  file_type?: 'pdf' | 'image' | null;
};
type AnnouncementCategoryLinkRecord = {
  announcement_categories?: CategoryRecord | CategoryRecord[] | null;
};
export type PortalAnnouncementRow = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  divisions?: DivisionRecord | DivisionRecord[] | null;
  groups?: GroupRecord | GroupRecord[] | null;
  announcement_files?: AnnouncementFileRecord[] | null;
  announcement_category_links?: AnnouncementCategoryLinkRecord[] | null;
};

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  level?: string | null;
  created_at: string;
  expires_at: string;
};

type EventPersonRecord = {
  id?: string | null;
  name: string;
  role: string;
  type: 'participant' | 'organizer';
};

type EventPhotoRecord = { photo_url?: string | null };
type EventCategoryLinkRecord = {
  event_categories?: CategoryRecord | CategoryRecord[] | null;
};
type EventRow = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  cover_image?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at: string;
  total_attendees?: number | null;
  event_people?: EventPersonRecord[] | null;
  event_photos?: EventPhotoRecord[] | null;
  event_category_links?: EventCategoryLinkRecord[] | null;
};

function getRelatedName(record?: CategoryRecord | CategoryRecord[] | null) {
  if (Array.isArray(record)) return record[0]?.name ?? null;
  return record?.name ?? null;
}

function getEntityName(record?: DivisionRecord | DivisionRecord[] | GroupRecord | GroupRecord[] | null) {
  if (Array.isArray(record)) return record[0]?.name ?? null;
  return record?.name ?? null;
}

export const normalizeAnnouncement = (row: PortalAnnouncementRow): Announcement => {
  const categories = (row.announcement_category_links ?? [])
    .map((link) => getRelatedName(link.announcement_categories))
    .filter((value): value is string => Boolean(value));
  const divisionName = getEntityName(row.divisions) || undefined;
  const groupName = getEntityName(row.groups) || undefined;

  const attachments = (row.announcement_files ?? [])
    .filter((file) => file.file_url)
    .map((file) => ({
      name: file.file_name || file.file_url?.split('/').pop() || 'file',
      url: file.file_url as string,
      fileType: file.file_type ?? undefined,
    }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: categories[0] || 'عام',
    categories,
    divisionName,
    groupName,
    department: divisionName,
    publishDate: dateOnly(row.published_at),
    expiryDate: dateOnly(row.expires_at),
    content: row.description || '',
    attachments,
  };
};

export const normalizeNews = (row: NewsRow): NewsAlert => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.title,
  riskLevel: row.level ? levelMap[row.level] ?? 'medium' : 'medium',
  publishDate: row.created_at,
  expiryDate: row.expires_at,
});

export const normalizeEvent = (row: EventRow): Event => {
  const categories = (row.event_category_links ?? [])
    .map((link) => getRelatedName(link.event_categories))
    .filter((value): value is string => Boolean(value));

  const photos = (row.event_photos ?? [])
    .map((photo) => photo.photo_url)
    .filter((value): value is string => Boolean(value));
  const gallery = [row.cover_image, ...photos].filter((value): value is string => Boolean(value));
  const people = (row.event_people ?? []).map((person, index: number) => ({
    id: person.id || `${row.id}-${index}`,
    name: person.name,
    role: person.role,
    type: person.type,
    image: `https://ui-avatars.com/api/?background=CCE8E4&color=051F1E&name=${encodeURIComponent(person.name)}`,
  }));
  const organizers = people.filter((person) => person.type === 'organizer');
  const participants = people.filter((person) => person.type === 'participant');
  const speakers = organizers.map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
    bio: 'منظّم الفعالية.',
    image: person.image,
  }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: dateOnly(row.starts_at),
    endDate: dateOnly(row.ends_at),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location || 'غير محدد',
    shortDescription: row.description || 'لا يوجد وصف متاح.',
    detailedDescription: row.description || undefined,
    logo: row.cover_image || undefined,
    gallery: gallery.length ? gallery : undefined,
    speakers: speakers.length ? speakers : undefined,
    people: people.length ? people : undefined,
    organizers: organizers.length ? organizers : undefined,
    participants: participants.length ? participants : undefined,
    attendeeCount: row.total_attendees ?? 0,
    categories: categories.length ? categories : undefined,
    photos: photos.map((url, index) => ({ id: `${row.id}-photo-${index}`, eventId: row.id, url })),
    isUpcoming: new Date(row.ends_at).getTime() >= Date.now(),
    category: categories[0] || 'عام',
  };
};
