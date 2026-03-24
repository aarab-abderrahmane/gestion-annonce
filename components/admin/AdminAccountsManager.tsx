"use client";

import { FormEvent, useMemo, useState } from 'react';
import { ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useErrorToast } from '@/components/ui/useErrorToast';
import {
  ADMIN_ACCOUNT_LIMIT,
  ADMIN_RESOURCE_DESCRIPTIONS,
  ADMIN_RESOURCE_LABELS,
  ADMIN_RESOURCE_VALUES,
  createEmptyPermissionMap,
  mapPermissionRowsToMap,
  permissionMapToRows,
  type AdminPermissionAction,
  type AdminResource,
  type DashboardAccountStatus,
  type ResourcePermissionMap,
} from '@/lib/admin-permissions';
import type { ManagedDashboardAccount } from '@/lib/dashboard-accounts';
import {
  getFirstZodError,
  managedDashboardAccountCreateSchema,
  managedDashboardAccountUpdateSchema,
} from '@/lib/validations';

type Props = {
  initialAccounts: ManagedDashboardAccount[];
  serviceRoleConfigured: boolean;
};

type FormState = {
  full_name: string;
  email: string;
  password: string;
  status: DashboardAccountStatus;
  permissions: ResourcePermissionMap;
};

const permissionActionLabels: Array<{
  action: Exclude<AdminPermissionAction, 'view'>;
  label: string;
}> = [
  { action: 'create', label: 'إنشاء' },
  { action: 'update', label: 'تعديل' },
  { action: 'delete', label: 'حذف' },
  { action: 'publish', label: 'نشر' },
];

function createEmptyForm(): FormState {
  return {
    full_name: '',
    email: '',
    password: '',
    status: 'active',
    permissions: createEmptyPermissionMap(),
  };
}

function buildFormFromAccount(account: ManagedDashboardAccount): FormState {
  return {
    full_name: account.full_name,
    email: account.email,
    password: '',
    status: account.status,
    permissions: mapPermissionRowsToMap(account.permissions),
  };
}

function getEnabledResources(permissions: ResourcePermissionMap) {
  return ADMIN_RESOURCE_VALUES.filter((resource) => permissions[resource].view);
}

export default function AdminAccountsManager({
  initialAccounts,
  serviceRoleConfigured,
}: Props) {
  const toast = useToast();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => createEmptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useErrorToast(error);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedId) ?? null,
    [accounts, selectedId],
  );
  const isEditing = Boolean(selectedAccount);
  const isLimitReached = accounts.length >= ADMIN_ACCOUNT_LIMIT;
  const enabledResources = getEnabledResources(form.permissions);

  function resetForm() {
    setSelectedId(null);
    setForm(createEmptyForm());
    setError('');
  }

  function startEdit(account: ManagedDashboardAccount) {
    setSelectedId(account.id);
    setForm(buildFormFromAccount(account));
    setError('');
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleResource(resource: AdminResource, enabled: boolean) {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [resource]: enabled
          ? {
              ...current.permissions[resource],
              view: true,
            }
          : {
              view: false,
              create: false,
              update: false,
              delete: false,
              publish: false,
            },
      },
    }));
  }

  function togglePermission(
    resource: AdminResource,
    action: Exclude<AdminPermissionAction, 'view'>,
    checked: boolean,
  ) {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [resource]: {
          ...current.permissions[resource],
          view: true,
          [action]: checked,
        },
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!serviceRoleConfigured) {
      setError('أضف المفتاح SUPABASE_SERVICE_ROLE_KEY أولاً لتفعيل إدارة الحسابات المفوضة.');
      return;
    }

    if (!isEditing && isLimitReached) {
      setError(`لا يمكن إنشاء أكثر من ${ADMIN_ACCOUNT_LIMIT} حسابات مفوضة.`);
      return;
    }

    const rawPayload = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password.trim(),
      status: form.status,
      permissions: permissionMapToRows(form.permissions),
    };
    const validation = isEditing
      ? managedDashboardAccountUpdateSchema.safeParse(rawPayload)
      : managedDashboardAccountCreateSchema.safeParse(rawPayload);

    if (!validation.success) {
      setError(getFirstZodError(validation.error));
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        isEditing ? `/api/admin-accounts/${selectedId}` : '/api/admin-accounts',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validation.data),
        },
      );
      const result = (await response.json().catch(() => null)) as
        | { error?: string; account?: ManagedDashboardAccount }
        | null;

      if (!response.ok || !result?.account) {
        throw new Error(result?.error ?? 'تعذر حفظ الحساب حالياً.');
      }

      const nextAccounts = isEditing
        ? accounts.map((account) =>
            account.id === result.account?.id ? result.account : account,
          )
        : [result.account, ...accounts];

      setAccounts(nextAccounts);
      setSelectedId(result.account.id);
      setForm(buildFormFromAccount(result.account));
      toast.success(isEditing ? 'تم تحديث الحساب بنجاح.' : 'تم إنشاء الحساب بنجاح.');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'تعذر حفظ الحساب حالياً.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(account: ManagedDashboardAccount) {
    if (!serviceRoleConfigured) {
      setError('أضف المفتاح SUPABASE_SERVICE_ROLE_KEY أولاً لتفعيل حذف الحسابات المفوضة.');
      return;
    }

    if (!window.confirm(`حذف الحساب ${account.full_name} نهائياً؟`)) return;

    setDeletingId(account.id);
    setError('');

    try {
      const response = await fetch(`/api/admin-accounts/${account.id}`, {
        method: 'DELETE',
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string; success?: boolean }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? 'تعذر حذف الحساب حالياً.');
      }

      const nextAccounts = accounts.filter((item) => item.id !== account.id);
      setAccounts(nextAccounts);

      if (selectedId === account.id) {
        resetForm();
      }

      toast.success('تم حذف الحساب بنجاح.');
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'تعذر حذف الحساب حالياً.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="md-card-outlined p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)' }}>
              الحسابات المفوضة
            </h2>
            <p className="md-body-medium mt-2 max-w-3xl" style={{ color: 'var(--md-on-surface-variant)' }}>
              أنشئ حسابات فرعية لإدارة صفحات محددة داخل اللوحة، مع سقف أقصى قدره {ADMIN_ACCOUNT_LIMIT} حسابات.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            disabled={!selectedId && isLimitReached}
            className="md-btn md-btn-filled md-state disabled:opacity-50"
          >
            <UserPlus size={18} />
            حساب جديد
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <span
            className="rounded-full px-3 py-1.5 md-label-small"
            style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
          >
            الحسابات الحالية: {accounts.length} / {ADMIN_ACCOUNT_LIMIT}
          </span>
          <span
            className="rounded-full px-3 py-1.5 md-label-small"
            style={{ background: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}
          >
            المساحات المتبقية: {Math.max(0, ADMIN_ACCOUNT_LIMIT - accounts.length)}
          </span>
        </div>

        {!serviceRoleConfigured ? (
          <div
            className="mt-4 rounded-[var(--md-shape-l)] px-4 py-3 md-body-small"
            style={{ background: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
          >
            لإكمال إنشاء وتحديث وحذف الحسابات أضف المتغير البيئي `SUPABASE_SERVICE_ROLE_KEY`.
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
        <section className="md-card-outlined p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[var(--md-shape-l)]"
              style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
            >
              <Users size={20} />
            </div>
            <div>
              <h3 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
                الحسابات الحالية
              </h3>
              <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                اختر أي حساب لتعديل الصلاحيات أو حذفه.
              </p>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div
              className="rounded-[var(--md-shape-xl)] border border-dashed px-5 py-10 text-center"
              style={{ borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-surface-variant)' }}
            >
              لا توجد حسابات مفوضة بعد.
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const active = account.id === selectedId;

                return (
                  <div
                    key={account.id}
                    className="rounded-[var(--md-shape-xl)] border p-4"
                    style={{
                      background: active ? 'var(--md-secondary-container)' : 'var(--md-surface-container-low)',
                      borderColor: active ? 'var(--md-primary)' : 'var(--md-outline-variant)',
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(account)}
                        className="min-w-0 flex-1 text-right"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>
                            {account.full_name}
                          </p>
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              background:
                                account.status === 'active'
                                  ? 'var(--md-primary-container)'
                                  : 'var(--md-surface-container-highest)',
                              color:
                                account.status === 'active'
                                  ? 'var(--md-on-primary-container)'
                                  : 'var(--md-on-surface-variant)',
                            }}
                          >
                            {account.status === 'active' ? 'نشط' : 'معطل'}
                          </span>
                        </div>
                        <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                          {account.email}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {account.permissions.map((permission) => (
                            <span
                              key={`${account.id}-${permission.resource}`}
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{ background: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}
                            >
                              {ADMIN_RESOURCE_LABELS[permission.resource]}
                            </span>
                          ))}
                        </div>
                      </button>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(account)}
                          className="md-btn md-btn-tonal md-state"
                          style={{ height: 36, padding: '0 14px', fontSize: 13 }}
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(account)}
                          disabled={deletingId === account.id || !serviceRoleConfigured}
                          className="md-btn md-state disabled:opacity-50"
                          style={{
                            height: 36,
                            padding: '0 14px',
                            fontSize: 13,
                            background: 'var(--md-error-container)',
                            color: 'var(--md-on-error-container)',
                            borderRadius: 'var(--md-shape-full)',
                          }}
                        >
                          {deletingId === account.id ? '...' : 'حذف'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="md-card-outlined p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="md-title-medium" style={{ color: 'var(--md-on-surface)' }}>
                {isEditing ? 'تحديث الحساب' : 'إنشاء حساب جديد'}
              </h3>
              <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                حدّد الصفحات المستهدفة ثم اختر ما إذا كان الحساب يستطيع الإنشاء أو التعديل أو الحذف أو النشر.
              </p>
            </div>
            {isEditing ? (
              <button type="button" onClick={resetForm} className="md-btn md-btn-outlined md-state">
                حساب جديد
              </button>
            ) : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <label className="md-label-medium block" style={{ color: 'var(--md-on-surface-variant)' }}>
                الاسم الكامل
              </label>
              <input
                value={form.full_name}
                onChange={(event) => setField('full_name', event.target.value)}
                className="w-full md-body-medium px-4 h-12 rounded-[var(--md-shape-s)] border outline-none transition-colors"
                style={{ background: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}
                onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                placeholder="مثال: مسؤول الفعاليات"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="md-label-medium block" style={{ color: 'var(--md-on-surface-variant)' }}>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                className="w-full md-body-medium px-4 h-12 rounded-[var(--md-shape-s)] border outline-none transition-colors"
                style={{ background: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}
                onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                placeholder="staff@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="md-label-medium block" style={{ color: 'var(--md-on-surface-variant)' }}>
                {isEditing ? 'كلمة مرور جديدة' : 'كلمة المرور'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setField('password', event.target.value)}
                className="w-full md-body-medium px-4 h-12 rounded-[var(--md-shape-s)] border outline-none transition-colors"
                style={{ background: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}
                onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
                placeholder={isEditing ? 'اتركها فارغة إن لم تُرد تغييرها' : '6 أحرف على الأقل'}
                required={!isEditing}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="md-label-medium block" style={{ color: 'var(--md-on-surface-variant)' }}>
                حالة الحساب
              </label>
              <select
                value={form.status}
                onChange={(event) => setField('status', event.target.value as DashboardAccountStatus)}
                className="w-full md-body-medium px-4 h-12 rounded-[var(--md-shape-s)] border outline-none transition-colors"
                style={{ background: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline)', color: 'var(--md-on-surface)' }}
                onFocus={(event) => (event.target.style.borderColor = 'var(--md-primary)')}
                onBlur={(event) => (event.target.style.borderColor = 'var(--md-outline)')}
              >
                <option value="active">نشط</option>
                <option value="disabled">معطل</option>
              </select>
            </div>
          </div>

          <section
            className="rounded-[var(--md-shape-xl)] border"
            style={{ borderColor: 'var(--md-outline-variant)', background: 'var(--md-surface-container-low)' }}
          >
            <div className="border-b px-4 py-4" style={{ borderColor: 'var(--md-outline-variant)' }}>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--md-shape-l)]"
                  style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>
                    الصفحات المستهدفة والصلاحيات
                  </h4>
                  <p className="md-body-small mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                    تفعيل الصفحة يعني أن الحساب سيظهر له رابطها داخل الشريط الجانبي.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              {ADMIN_RESOURCE_VALUES.map((resource) => {
                const permission = form.permissions[resource];
                const enabled = permission.view;

                return (
                  <div
                    key={resource}
                    className="rounded-[var(--md-shape-l)] border px-4 py-4"
                    style={{ borderColor: 'var(--md-outline-variant)', background: 'var(--md-surface)' }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) => toggleResource(resource, event.target.checked)}
                          />
                          <span className="md-title-small" style={{ color: 'var(--md-on-surface)' }}>
                            {ADMIN_RESOURCE_LABELS[resource]}
                          </span>
                        </label>
                        <p className="md-body-small mt-2 pr-7" style={{ color: 'var(--md-on-surface-variant)' }}>
                          {ADMIN_RESOURCE_DESCRIPTIONS[resource]}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {permissionActionLabels.map(({ action, label }) => (
                          <label
                            key={`${resource}-${action}`}
                            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                              enabled ? '' : 'opacity-50'
                            }`}
                            style={{
                              background: enabled ? 'var(--md-surface-container-highest)' : 'var(--md-surface-container)',
                              color: 'var(--md-on-surface-variant)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={permission[action]}
                              onChange={(event) => togglePermission(resource, action, event.target.checked)}
                              disabled={!enabled}
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div
            className="rounded-[var(--md-shape-l)] px-4 py-3 md-body-small"
            style={{ background: 'var(--md-surface-container-low)', color: 'var(--md-on-surface-variant)' }}
          >
            الصفحات المختارة حالياً: {enabledResources.length > 0 ? enabledResources.map((resource) => ADMIN_RESOURCE_LABELS[resource]).join('، ') : 'لا توجد صفحات محددة بعد.'}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || (!isEditing && isLimitReached) || !serviceRoleConfigured}
              className="md-btn md-btn-filled md-state disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إنشاء الحساب'}
            </button>
            <button type="button" onClick={resetForm} className="md-btn md-btn-outlined md-state">
              إعادة تعيين
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
