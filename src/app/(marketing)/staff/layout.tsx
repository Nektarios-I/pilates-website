import { redirect } from 'next/navigation';

import { resolve_caller_has_staff_access } from '@/lib/auth/staff-page-access';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const has_staff_access = await resolve_caller_has_staff_access();
  if (!has_staff_access) {
    redirect('/account');
  }

  return children;
}
