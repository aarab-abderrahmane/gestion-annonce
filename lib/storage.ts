export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'announcements';

export function getStorageErrorMessage(message: string) {
  if (message === 'Bucket not found') {
    return `Storage bucket "${STORAGE_BUCKET}" was not found. Create it in Supabase Storage or set NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET to an existing bucket.`;
  }

  return message;
}
