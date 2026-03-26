import { revalidatePath } from 'next/cache'
import { json, requireAdminPermission } from '@/app/api/_utils'
import {
  getWorkflowNextState,
  isWorkflowAction,
  isWorkflowResource,
  WORKFLOW_RESOURCE_CONFIG,
  type WorkflowItemRow,
} from '@/lib/workflow-control'

type RouteContext = {
  params: Promise<{ resource: string; id: string }>
}

type WorkflowRequestBody = {
  action?: string
  notes?: string | null
}

export async function PATCH(request: Request, context: RouteContext) {
  const { resource, id } = await context.params

  if (!isWorkflowResource(resource)) {
    return json({ error: 'Unsupported workflow resource.' }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as WorkflowRequestBody | null
  const action = body?.action ?? ''
  const notes =
    typeof body?.notes === 'string' && body.notes.trim() ? body.notes.trim() : null

  if (!isWorkflowAction(action)) {
    return json({ error: 'Unsupported workflow action.' }, { status: 400 })
  }

  const auth = await requireAdminPermission(resource, 'view')
  if (auth.response) return auth.response

  const config = WORKFLOW_RESOURCE_CONFIG[resource]

  const { data: existing, error: existingError } = await auth.supabase
    .from(config.table)
    .select(
      'id, title, status, editorial_status, created_at, published_at, reviewed_at, review_notes, deleted_at',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (existingError) {
    return json({ error: existingError.message }, { status: 500 })
  }

  const requiredAction =
    action === 'submit_for_review'
      ? 'update'
      : action === 'move_to_draft' &&
          (existing as WorkflowItemRow).status !== 'published'
        ? 'update'
        : 'publish'
  const permissionCheck = await requireAdminPermission(resource, requiredAction)
  if (permissionCheck.response) return permissionCheck.response

  const nextState = getWorkflowNextState({
    existing: existing as WorkflowItemRow,
    action,
    actorUserId: permissionCheck.user.id,
    notes,
  })

  const { data, error } = await permissionCheck.supabase
    .from(config.table)
    .update(nextState)
    .eq('id', id)
    .select(
      'id, title, status, editorial_status, created_at, published_at, reviewed_at, review_notes, deleted_at',
    )
    .single()

  if (error) {
    return json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/dashboard/workflow')
  revalidatePath(config.dashboardHref)
  for (const path of config.publicRevalidatePaths) {
    revalidatePath(path)
  }

  return json({ item: data })
}
