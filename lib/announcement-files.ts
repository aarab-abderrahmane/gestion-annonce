import { getErrorMessage } from '@/lib/errors';

type AnnouncementRow = {
  id: string;
  announcement_files?: AnnouncementFileInputRow[] | null;
};

type AnnouncementFileInputRow = {
  id?: string;
  announcement_id?: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: 'pdf' | 'image' | null;
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
        ) => PromiseLike<{ data: AnnouncementFileRow[] | null; error: { message: string } | null }>;
      };
    };
  };
};

type AnnouncementWithFiles<T extends AnnouncementRow> = T & {
  announcement_files: AnnouncementFileRow[];
};

type HydrateAnnouncementFileOptions = {
  includeId?: boolean;
  onError?: (message: string) => void;
};

function normalizeExistingFiles(
  announcementId: string,
  files?: AnnouncementFileInputRow[] | null,
): AnnouncementFileRow[] {
  return (files ?? []).map((file) => ({
    id: file.id,
    announcement_id: file.announcement_id ?? announcementId,
    file_url: file.file_url ?? null,
    file_name: file.file_name ?? null,
    file_type: file.file_type ?? null,
  }));
}

export async function hydrateAnnouncementFiles<T extends AnnouncementRow>(
  supabase: SupabaseLikeClient,
  announcements: T[],
  options?: HydrateAnnouncementFileOptions
) : Promise<AnnouncementWithFiles<T>[]> {
  if (!announcements.length) return [];

  const announcementIds = announcements.map((announcement) => announcement.id).filter(Boolean);
  if (!announcementIds.length) {
    return announcements.map((announcement) => ({
      ...announcement,
      announcement_files: normalizeExistingFiles(
        announcement.id,
        announcement.announcement_files,
      ),
    }));
  }

  const columns = options?.includeId
    ? 'id, announcement_id, file_url, file_name, file_type'
    : 'announcement_id, file_url, file_name, file_type';

  const { data, error } = await supabase
    .from('announcement_files')
    .select(columns)
    .in('announcement_id', announcementIds)
    .order('created_at', { ascending: true });

  if (error) {
    options?.onError?.(getErrorMessage(error));
    return announcements.map((announcement) => ({
      ...announcement,
      announcement_files: normalizeExistingFiles(
        announcement.id,
        announcement.announcement_files,
      ),
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
    announcement_files:
      filesByAnnouncementId.get(announcement.id) ??
      normalizeExistingFiles(announcement.id, announcement.announcement_files),
  }));
}
