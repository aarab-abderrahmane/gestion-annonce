import type { Announcement, Event, NewsAlert } from '@/types';

const levelMap: Record<string, NewsAlert['riskLevel']> = {
  dangerous: 'high',
  urgent: 'medium',
  warning: 'low',
};

const dateOnly = (value?: string | null) => (value ? value.split('T')[0] : '');

export const normalizeAnnouncement = (row: any): Announcement => {
  const categories = (row.announcement_category_links ?? [])
    .map((link: any) => link.announcement_categories?.name)
    .filter(Boolean);

  const attachments = (row.announcement_files ?? []).map((file: any) => ({
    name: file.file_name || file.file_url?.split('/').pop() || 'file',
    url: file.file_url,
  }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: categories[0] || 'عام',
    department: row.groups?.name || row.divisions?.name || undefined,
    publishDate: dateOnly(row.published_at),
    expiryDate: dateOnly(row.expires_at),
    content: row.description || '',
    attachments,
  };
};

export const normalizeNews = (row: any): NewsAlert => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.title,
  riskLevel: levelMap[row.level] || 'medium',
  publishDate: row.created_at,
  expiryDate: row.expires_at,
});

export const normalizeEvent = (row: any): Event => {
  const categories = (row.event_category_links ?? [])
    .map((link: any) => link.event_categories?.name)
    .filter(Boolean);

  const photos = (row.event_photos ?? []).map((photo: any) => photo.photo_url).filter(Boolean);
  const gallery = [row.cover_image, ...photos].filter(Boolean);
  const people = (row.event_people ?? []).map((person: any, index: number) => ({
    id: person.id || `${row.id}-${index}`,
    name: person.name,
    role: person.role,
    type: person.type,
    image: `https://ui-avatars.com/api/?background=CCE8E4&color=051F1E&name=${encodeURIComponent(person.name)}`,
  }));
  const organizers = people.filter((person: any) => person.type === 'organizer');
  const participants = people.filter((person: any) => person.type === 'participant');
  const speakers = organizers.map((person: any) => ({
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
    isUpcoming: new Date(row.ends_at).getTime() >= Date.now(),
    category: categories[0] || 'عام',
  };
};
