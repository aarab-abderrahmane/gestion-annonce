export const ADMIN_ACCOUNT_LIMIT = 4;

export const ADMIN_ACCOUNT_STATUS_VALUES = ['active', 'disabled'] as const;
export type DashboardAccountStatus = (typeof ADMIN_ACCOUNT_STATUS_VALUES)[number];

export const ADMIN_RESOURCE_VALUES = [
  'breaking_news',
  'danger_news',
  'home_carousel',
  'announcements',
  'events',
  'categories',
  'structure',
] as const;
export type AdminResource = (typeof ADMIN_RESOURCE_VALUES)[number];

export const ADMIN_PERMISSION_ACTION_VALUES = [
  'view',
  'create',
  'update',
  'delete',
  'publish',
] as const;
export type AdminPermissionAction = (typeof ADMIN_PERMISSION_ACTION_VALUES)[number];

export type ResourcePermissionState = {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  publish: boolean;
};

export type ResourcePermissionMap = Record<AdminResource, ResourcePermissionState>;

export type DashboardPermissionRow = {
  resource: AdminResource;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_publish: boolean;
};

export type AdminNavIconKey =
  | 'house'
  | 'bell'
  | 'alert'
  | 'images'
  | 'newspaper'
  | 'calendar'
  | 'folder'
  | 'building'
  | 'users'
  | 'settings';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminNavIconKey;
  resource?: AdminResource;
  fullAdminOnly?: boolean;
};

const EMPTY_RESOURCE_PERMISSION: ResourcePermissionState = {
  view: false,
  create: false,
  update: false,
  delete: false,
  publish: false,
};

export const ADMIN_RESOURCE_LABELS: Record<AdminResource, string> = {
  breaking_news: 'الأخبار العاجلة',
  danger_news: 'الشريط الخطير',
  home_carousel: 'كاروسيل الرئيسية',
  announcements: 'الإعلانات',
  events: 'الفعاليات',
  categories: 'الأصناف',
  structure: 'الأقسام والمجموعات',
};

export const ADMIN_RESOURCE_DESCRIPTIONS: Record<AdminResource, string> = {
  breaking_news: 'إنشاء الأخبار العاجلة وتحديثها ونشرها.',
  danger_news: 'إدارة محتوى الشريط الخطير وتخصيصه في الصفحة الرئيسية.',
  home_carousel: 'إدارة شرائح الصفحة الرئيسية وصورها.',
  announcements: 'إضافة الإعلانات والملفات والأصناف المرتبطة بها.',
  events: 'إضافة الفعاليات والصور والمشاركين والأصناف.',
  categories: 'إدارة أصناف الإعلانات والفعاليات.',
  structure: 'إدارة الأقسام والمجموعات الدراسية.',
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: 'house', fullAdminOnly: true },
  { href: '/dashboard/breaking-news', label: 'أخبار عاجلة', icon: 'bell', resource: 'breaking_news' },
  { href: '/dashboard/danger-news', label: 'الشريط الخطير', icon: 'alert', resource: 'danger_news' },
  { href: '/dashboard/home-carousel', label: 'كاروسيل الرئيسية', icon: 'images', resource: 'home_carousel' },
  { href: '/dashboard/announcements', label: 'الإعلانات', icon: 'newspaper', resource: 'announcements' },
  { href: '/dashboard/events', label: 'الفعاليات', icon: 'calendar', resource: 'events' },
  { href: '/dashboard/categories', label: 'الأصناف', icon: 'folder', resource: 'categories' },
  { href: '/dashboard/structure', label: 'الأقسام والمجموعات', icon: 'building', resource: 'structure' },
  { href: '/dashboard/accounts', label: 'الحسابات المفوضة', icon: 'users', fullAdminOnly: true },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: 'settings', fullAdminOnly: true },
];

export const ADMIN_ROUTE_TITLES: Record<string, string> = Object.fromEntries(
  ADMIN_NAV_ITEMS.map((item) => [item.href, item.label]),
);

export function isAdminResource(value: string): value is AdminResource {
  return (ADMIN_RESOURCE_VALUES as readonly string[]).includes(value);
}

export function createEmptyPermissionMap(): ResourcePermissionMap {
  return Object.fromEntries(
    ADMIN_RESOURCE_VALUES.map((resource) => [
      resource,
      { ...EMPTY_RESOURCE_PERMISSION },
    ]),
  ) as ResourcePermissionMap;
}

export function createFullAdminPermissionMap(): ResourcePermissionMap {
  return Object.fromEntries(
    ADMIN_RESOURCE_VALUES.map((resource) => [
      resource,
      {
        view: true,
        create: true,
        update: true,
        delete: true,
        publish: true,
      },
    ]),
  ) as ResourcePermissionMap;
}

export function mapPermissionRowsToMap(
  rows?: Array<DashboardPermissionRow | null> | null,
): ResourcePermissionMap {
  const map = createEmptyPermissionMap();

  for (const row of rows ?? []) {
    if (!row || !isAdminResource(row.resource)) continue;

    map[row.resource] = {
      view: Boolean(row.can_view),
      create: Boolean(row.can_create),
      update: Boolean(row.can_update),
      delete: Boolean(row.can_delete),
      publish: Boolean(row.can_publish),
    };
  }

  return map;
}

export function permissionMapToRows(map: ResourcePermissionMap): DashboardPermissionRow[] {
  return ADMIN_RESOURCE_VALUES.flatMap((resource) => {
    const permission = map[resource];
    const enabled =
      permission.view ||
      permission.create ||
      permission.update ||
      permission.delete ||
      permission.publish;

    if (!enabled) return [];

    return [
      {
        resource,
        can_view: true,
        can_create: permission.create,
        can_update: permission.update,
        can_delete: permission.delete,
        can_publish: permission.publish,
      },
    ];
  });
}

export function hasAdminPermission(
  permissions: ResourcePermissionMap,
  resource: AdminResource,
  action: AdminPermissionAction,
) {
  return permissions[resource][action];
}

export function getVisibleAdminNavItems({
  isFullAdmin,
  permissions,
}: {
  isFullAdmin: boolean;
  permissions: ResourcePermissionMap;
}) {
  return ADMIN_NAV_ITEMS.filter((item) => {
    if (item.fullAdminOnly) return isFullAdmin;
    if (!item.resource) return false;
    return permissions[item.resource].view;
  });
}

export function getFirstAccessibleAdminPath({
  isFullAdmin,
  permissions,
}: {
  isFullAdmin: boolean;
  permissions: ResourcePermissionMap;
}) {
  return getVisibleAdminNavItems({ isFullAdmin, permissions })[0]?.href ?? null;
}
