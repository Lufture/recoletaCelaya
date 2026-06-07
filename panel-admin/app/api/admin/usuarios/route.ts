import { type NextRequest } from 'next/server';
import { withAuth, jsonOk, jsonCreated, jsonError, getPaginationParams, buildPagination } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/usuarios
export const GET = withAuth(async (request, _context, _user) => {
  const { page, limit, offset } = getPaginationParams(request);
  const searchParams = request.nextUrl.searchParams;
  const rol = searchParams.get('rol');
  const search = searchParams.get('search');
  const activo = searchParams.get('activo');

  const supabase = await createClient();

  let query = supabase.from('perfiles').select('*, choferes_camiones(camion_id, activo)', { count: 'exact' });

  if (rol) query = query.eq('rol', rol);
  if (activo !== null && activo !== undefined) query = query.eq('activo', activo === 'true');
  if (search) query = query.or(`nombre.ilike.%${search}%,correo.ilike.%${search}%,apellidos.ilike.%${search}%`);

  query = query.range(offset, offset + limit - 1).order('creado_en', { ascending: false });

  const { data, count, error } = await query;

  if (error) return jsonError(error.message, 500);

  return jsonOk({
    data: data ?? [],
    pagination: buildPagination(page, limit, count ?? 0),
  });
});

// POST /api/admin/usuarios
export const POST = withAuth(async (request, _context, _user) => {
  const body = await request.json();
  const { nombre, apellidos, correo, telefono, rol, password, activo, camion_id } = body;

  if (!nombre || !correo || !rol || !password) {
    return jsonError('nombre, correo, rol y password son requeridos', 400);
  }

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = createAdminClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: correo,
      password: password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellidos,
      }
    });

    if (authError) {
      return jsonError(`Error creando autenticación: ${authError.message}`, 400);
    }

    const userId = authData.user.id;

    // 2. Upsert profile in perfiles table
    const profileData = {
      id: userId,
      nombre,
      apellidos: apellidos || null,
      correo,
      telefono: telefono || null,
      rol,
      activo: activo ?? true,
      actualizado_en: new Date().toISOString()
    };

    const { error: profileError } = await adminClient
      .from('perfiles')
      .upsert(profileData);

    if (profileError) {
      // Rollback logic could go here
      return jsonError(`Usuario creado pero falló el perfil: ${profileError.message}`, 500);
    }

    // 3. Assign truck if role is chofer and camion_id is provided
    if (rol === 'chofer' && camion_id) {
      const { error: asignacionError } = await adminClient
        .from('choferes_camiones')
        .insert({
          chofer_id: userId,
          camion_id: camion_id,
          activo: true
        });
        
      if (asignacionError) {
        console.error('Error assigning truck:', asignacionError);
      }
    }

    return jsonCreated(profileData);
  } catch (error: any) {
    console.error('Create User Error:', error);
    return jsonError('Error interno del servidor', 500);
  }
});
