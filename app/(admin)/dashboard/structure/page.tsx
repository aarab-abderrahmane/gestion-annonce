import StructureManager from '@/components/admin/StructureManager';
import ErrorToastTrigger from '@/components/ui/ErrorToastTrigger';
import { requireAdminPageAccess } from '@/lib/admin-access';
import { collectErrorMessages } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export default async function StructurePage() {
  const access = await requireAdminPageAccess('structure');
  const supabase = await createClient();
  const [{ data: divisions, error: divisionsError }, { data: groups, error: groupsError }] = await Promise.all([
    supabase.from('divisions').select('id, name, slug').order('name'),
    supabase.from('groups').select('id, name, slug, division_id').order('name'),
  ]);

  const pageErrors = collectErrorMessages([divisionsError, groupsError]);

  return (
    <>
      <ErrorToastTrigger messages={pageErrors} />
      <StructureManager
        divisions={divisions ?? []}
        groups={groups ?? []}
        permissions={access.permissions.structure}
      />
    </>
  );
}
