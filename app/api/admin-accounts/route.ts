import { json, requireFullAdminUser } from '@/app/api/_utils'
import {
  DASHBOARD_ACCOUNT_SELECT,
  normalizeManagedDashboardAccount,
} from '@/lib/dashboard-accounts'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getFirstZodError,
  managedDashboardAccountCreateSchema,
} from '@/lib/validations'

export async function POST(request: Request) {
  const auth = await requireFullAdminUser()
  if (auth.response) return auth.response

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return json({ error: 'تعذر قراءة البيانات المرسلة.' }, { status: 400 })
  }

  const validation = managedDashboardAccountCreateSchema.safeParse(body)
  if (!validation.success) {
    return json({ error: getFirstZodError(validation.error) }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const payload = validation.data

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
    })

    if (createUserError || !createdUser.user) {
      return json({ error: createUserError?.message ?? 'تعذر إنشاء حساب المصادقة.' }, { status: 400 })
    }

    const { data: account, error: accountError } = await supabase
      .from('dashboard_accounts')
      .insert({
        user_id: createdUser.user.id,
        full_name: payload.full_name,
        email: payload.email,
        status: payload.status,
        created_by: auth.user.id,
      })
      .select('id')
      .single()

    if (accountError || !account) {
      await supabase.auth.admin.deleteUser(createdUser.user.id)

      return json(
        { error: accountError?.message ?? 'تعذر إنشاء الحساب داخل قاعدة البيانات.' },
        { status: 400 },
      )
    }

    const { error: permissionsError } = await supabase
      .from('dashboard_account_permissions')
      .insert(
        payload.permissions.map((permission) => ({
          account_id: account.id,
          ...permission,
        })),
      )

    if (permissionsError) {
      await supabase.auth.admin.deleteUser(createdUser.user.id)

      return json(
        { error: permissionsError.message },
        { status: 400 },
      )
    }

    const { data: storedAccount, error: fetchError } = await supabase
      .from('dashboard_accounts')
      .select(DASHBOARD_ACCOUNT_SELECT)
      .eq('id', account.id)
      .single()

    if (fetchError || !storedAccount) {
      return json({ error: fetchError?.message ?? 'تعذر تحميل الحساب بعد إنشائه.' }, { status: 500 })
    }

    return json(
      { account: normalizeManagedDashboardAccount(storedAccount as never) },
      { status: 201 },
    )
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'تعذر إنشاء الحساب حالياً.' },
      { status: 500 },
    )
  }
}
