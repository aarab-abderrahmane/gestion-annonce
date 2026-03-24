import { json, requireFullAdminUser } from '@/app/api/_utils'
import {
  DASHBOARD_ACCOUNT_SELECT,
  normalizeManagedDashboardAccount,
} from '@/lib/dashboard-accounts'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getFirstZodError,
  managedDashboardAccountUpdateSchema,
} from '@/lib/validations'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireFullAdminUser()
  if (auth.response) return auth.response

  const { id } = await context.params
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return json({ error: 'تعذر قراءة البيانات المرسلة.' }, { status: 400 })
  }

  const validation = managedDashboardAccountUpdateSchema.safeParse(body)
  if (!validation.success) {
    return json({ error: getFirstZodError(validation.error) }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const payload = validation.data
    const { data: existingAccount, error: existingAccountError } = await supabase
      .from('dashboard_accounts')
      .select(DASHBOARD_ACCOUNT_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (existingAccountError) {
      return json({ error: existingAccountError.message }, { status: 400 })
    }

    if (!existingAccount) {
      return json({ error: 'الحساب غير موجود.' }, { status: 404 })
    }

    const previousAccount = normalizeManagedDashboardAccount(existingAccount as never)
    const { error: accountUpdateError } = await supabase
      .from('dashboard_accounts')
      .update({
        full_name: payload.full_name,
        email: payload.email,
        status: payload.status,
      })
      .eq('id', id)

    if (accountUpdateError) {
      return json({ error: accountUpdateError.message }, { status: 400 })
    }

    const { error: deletePermissionsError } = await supabase
      .from('dashboard_account_permissions')
      .delete()
      .eq('account_id', id)

    if (deletePermissionsError) {
      return json({ error: deletePermissionsError.message }, { status: 400 })
    }

    const { error: insertPermissionsError } = await supabase
      .from('dashboard_account_permissions')
      .insert(
        payload.permissions.map((permission) => ({
          account_id: id,
          ...permission,
        })),
      )

    if (insertPermissionsError) {
      await supabase
        .from('dashboard_accounts')
        .update({
          full_name: previousAccount.full_name,
          email: previousAccount.email,
          status: previousAccount.status,
        })
        .eq('id', id)

      await supabase
        .from('dashboard_account_permissions')
        .insert(
          previousAccount.permissions.map((permission) => ({
            account_id: id,
            ...permission,
          })),
        )

      return json({ error: insertPermissionsError.message }, { status: 400 })
    }

    const authPayload: { email?: string; password?: string } = {}
    if (payload.email !== previousAccount.email) authPayload.email = payload.email
    if (payload.password) authPayload.password = payload.password

    if (authPayload.email || authPayload.password) {
      const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
        previousAccount.user_id,
        authPayload,
      )

      if (userUpdateError) {
        await supabase
          .from('dashboard_accounts')
          .update({
            full_name: previousAccount.full_name,
            email: previousAccount.email,
            status: previousAccount.status,
          })
          .eq('id', id)

        await supabase
          .from('dashboard_account_permissions')
          .delete()
          .eq('account_id', id)

        await supabase
          .from('dashboard_account_permissions')
          .insert(
            previousAccount.permissions.map((permission) => ({
              account_id: id,
              ...permission,
            })),
          )

        return json({ error: userUpdateError.message }, { status: 400 })
      }
    }

    const { data: storedAccount, error: fetchError } = await supabase
      .from('dashboard_accounts')
      .select(DASHBOARD_ACCOUNT_SELECT)
      .eq('id', id)
      .single()

    if (fetchError || !storedAccount) {
      return json({ error: fetchError?.message ?? 'تعذر تحميل الحساب بعد التحديث.' }, { status: 500 })
    }

    return json({ account: normalizeManagedDashboardAccount(storedAccount as never) })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'تعذر تحديث الحساب حالياً.' },
      { status: 500 },
    )
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const auth = await requireFullAdminUser()
  if (auth.response) return auth.response

  const { id } = await context.params

  try {
    const supabase = createAdminClient()
    const { data: existingAccount, error: existingAccountError } = await supabase
      .from('dashboard_accounts')
      .select('user_id')
      .eq('id', id)
      .maybeSingle()

    if (existingAccountError) {
      return json({ error: existingAccountError.message }, { status: 400 })
    }

    if (!existingAccount) {
      return json({ error: 'الحساب غير موجود.' }, { status: 404 })
    }

    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(existingAccount.user_id)
    if (deleteUserError) {
      return json({ error: deleteUserError.message }, { status: 400 })
    }

    return json({ success: true })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'تعذر حذف الحساب حالياً.' },
      { status: 500 },
    )
  }
}
