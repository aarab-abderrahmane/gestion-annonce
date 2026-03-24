import { json, requireAnyAdminPermission } from '@/app/api/_utils'
import {
  ANNOUNCEMENTS_BUCKET,
  EVENTS_BUCKET,
  getStorageErrorMessage,
  HOME_CAROUSEL_BUCKET,
} from '@/lib/storage'
import { validateUploadFile } from '@/lib/validations'

const allowedBuckets = new Set([ANNOUNCEMENTS_BUCKET, EVENTS_BUCKET, HOME_CAROUSEL_BUCKET])
const bucketPermissionChecks = {
  [ANNOUNCEMENTS_BUCKET]: [
    { resource: 'announcements', action: 'create' },
    { resource: 'announcements', action: 'update' },
  ],
  [EVENTS_BUCKET]: [
    { resource: 'events', action: 'create' },
    { resource: 'events', action: 'update' },
  ],
  [HOME_CAROUSEL_BUCKET]: [
    { resource: 'home_carousel', action: 'create' },
    { resource: 'home_carousel', action: 'update' },
  ],
} as const;

export async function POST(request: Request) {
  const formData = await request.formData()
  const bucket = formData.get('bucket')
  const file = formData.get('file')
  const folderValue = formData.get('folder')
  const folder =
    typeof folderValue === 'string'
      ? folderValue
          .trim()
          .replace(/^\/+|\/+$/g, '')
          .replace(/\.\./g, '')
      : ''

  if (typeof bucket !== 'string' || !allowedBuckets.has(bucket)) {
    return json({ error: 'Invalid bucket' }, { status: 400 })
  }

  const auth = await requireAnyAdminPermission([...bucketPermissionChecks[bucket]])
  if (auth.response) return auth.response

  if (!(file instanceof File)) {
    return json({ error: 'file is required' }, { status: 400 })
  }

  const validation = validateUploadFile(file)
  if (!validation.success) {
    return json({ error: validation.error }, { status: 400 })
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop() : ''
  const pathBase = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path = `${folder ? `${folder}/` : ''}${pathBase}${extension ? `.${extension}` : ''}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await auth.supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || undefined,
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    return json({ error: getStorageErrorMessage(error.message, bucket) }, { status: 500 })
  }

  const { data } = auth.supabase.storage.from(bucket).getPublicUrl(path)

  return json(
    {
      bucket,
      path,
      url: data.publicUrl,
    },
    { status: 201 }
  )
}
