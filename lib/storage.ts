export const ANNOUNCEMENTS_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'announcements';
export const EVENTS_BUCKET = 'events';

export function getStorageErrorMessage(
  message: string,
  bucketName: string = ANNOUNCEMENTS_BUCKET
) {
  if (message === 'Bucket not found') {
    return `Storage bucket "${bucketName}" was not found. Create it in Supabase Storage or set the correct bucket name in the app configuration.`;
  }

  return message;
}
