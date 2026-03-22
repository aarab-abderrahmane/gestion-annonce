import StructureManager from '@/components/admin/StructureManager';
import { createClient } from '@/lib/supabase/server';

export default async function StructurePage() {
  const supabase = await createClient();
  const [{ data: divisions, error: divisionsError }, { data: groups, error: groupsError }] = await Promise.all([
    supabase.from('divisions').select('id, name, slug').order('name'),
    supabase.from('groups').select('id, name, slug, division_id').order('name'),
  ]);

  if (divisionsError) console.error(divisionsError);
  if (groupsError) console.error(groupsError);

  return (
    <StructureManager
      divisions={divisions ?? []}
      groups={groups ?? []}
    />
  );
}
