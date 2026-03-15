type AnnouncementRow = {
  id: string;
  announcement_files?: AnnouncementFileRow[];
};

type AnnouncementFileRow = {
  id?: string;
  announcement_id: string;
  file_url: string | null;
  file_name: string | null;
  file_type: 'pdf' | 'image' | null;
};

type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns: string) => {
      in: (column: string, values: string[]) => {
        order: (
          column: string,
          options: { ascending: boolean }
        ) => Promise<{ data: AnnouncementFileRow[] | null; error: { message: string } | null }>;
      };
    };
  };
};

export async function hydrateAnnouncementFiles<T extends AnnouncementRow>(
  supabase: SupabaseLikeClient,
  announcements: T[],
  options?: { includeId?: boolean }
): Promise<T[]> {
  if (!announcements.length) return announcements;

  const announcementIds = announcements.map((announcement) => announcement.id).filter(Boolean);
  if (!announcementIds.length) return announcements;

  const columns = options?.includeId
    ? 'id, announcement_id, file_url, file_name, file_type'
    : 'announcement_id, file_url, file_name, file_type';

  const { data, error } = await supabase
    .from('announcement_files')
    .select(columns)
    .in('announcement_id', announcementIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(error);
    return announcements.map((announcement) => ({
      ...announcement,
      announcement_files: announcement.announcement_files ?? [],
    }));
  }

  const filesByAnnouncementId = new Map<string, AnnouncementFileRow[]>();

  for (const file of data ?? []) {
    if (!file.announcement_id) continue;
    const existing = filesByAnnouncementId.get(file.announcement_id) ?? [];
    existing.push(file);
    filesByAnnouncementId.set(file.announcement_id, existing);
  }

  return announcements.map((announcement) => ({
    ...announcement,
    announcement_files: filesByAnnouncementId.get(announcement.id) ?? announcement.announcement_files ?? [],
  }));
}
