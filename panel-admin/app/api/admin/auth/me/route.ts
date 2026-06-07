import { type NextRequest } from 'next/server';
import { withAuth, jsonOk } from '@/lib/api-helpers';

// GET /api/admin/auth/me
export const GET = withAuth(async (_request, _context, user) => {
  // TODO: Fetch full profile from Supabase
  return jsonOk({
    id: user.id,
    rol: user.role,
    // nombre, correo — fetch from perfiles table
  });
});
