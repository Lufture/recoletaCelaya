import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// Standard JSON responses
// ============================================================

export function jsonOk(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function jsonCreated(data: unknown) {
  return Response.json(data, { status: 201 });
}

export function jsonError(error: string, status = 400, details?: unknown) {
  return Response.json({ ok: false, error, details: details ?? null }, { status });
}

export function jsonSuccess(message: string) {
  return Response.json({ ok: true, message });
}

// ============================================================
// Pagination helpers
// ============================================================

export function getPaginationParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildPagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================================
// Auth wrapper for API routes
// ============================================================

type AuthenticatedHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  user: { id: string; role: string }
) => Promise<Response>;

/**
 * Wraps an API route handler with authentication + admin role check.
 * Usage:
 *   export const GET = withAuth(async (request, context, user) => { ... });
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<Response> => {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return jsonError('No autenticado', 401);
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!profile || profile.rol !== 'admin') {
      return jsonError('No autorizado — se requiere rol de administrador', 403);
    }

    return handler(request, context, { id: user.id, role: profile.rol });
  };
}
