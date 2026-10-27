/**
 * app/api/list/[token]/route.js
 * ─────────────────────────────────────────────────────────────
 * GET /api/list/:token
 *
 * Proxy seguro entre el cliente y Odoo.
 * Busca una lista de regalos por su token único, valida que no
 * haya expirado y devuelve los productos con sus estados de stock.
 *
 * Nunca expone credenciales ni la IP de Odoo al navegador.
 * ─────────────────────────────────────────────────────────────
 */

import { searchRead, ODOO_MODELS, REGISTRY_LINE_FIELDS, calculateGiftState } from '@/lib/odoo';

/**
 * Sanitiza un string para evitar que llegue código inesperado
 * desde parámetros de URL al motor XML-RPC.
 */
function sanitizeToken(token) {
  // Solo permitir alfanuméricos, guiones y guiones bajos
  return String(token).replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 128);
}

/**
 * Mapea un registro de gift.registry.line al formato que consume el frontend.
 * Campos estrictos de Odoo:
 * - product_id     (Many2one: [id, name])
 * - product_price  (Float: precio unitario)
 * - qty_wanted     (Float: cantidad deseada)
 * - qty_gifted     (Float: cantidad regalada)
 * - qty_available  (Float: stock en almacén)
 */
function mapProduct(p) {
  const qtyWanted = Number(p.qty_wanted ?? 1);
  const qtyGifted = Number(p.qty_gifted ?? 0);
  const qtyAvailable = Number(p.qty_available ?? 0);
  const precio = Number(p.product_price ?? 0);

  // Cálculo de estado basado en qty_wanted y qty_gifted
  const estado = calculateGiftState({
    qty_wanted: qtyWanted,
    qty_gifted: qtyGifted,
    qty_available: qtyAvailable,
  });

  // En Odoo, Many2one devuelve [id, display_name]
  const productId = Array.isArray(p.product_id) ? p.product_id[0] : (p.product_id || p.id);
  const nombre = Array.isArray(p.product_id) ? p.product_id[1] : (p.name || 'Regalo UYAY');

  return {
    id: p.id,
    productId,
    nombre,
    descripcion: p.note || '',
    precio,
    imagenBase64: p.product_image || null,
    stockDisponible: qtyWanted,              // Total deseado para la barra de progreso
    cantidadComprada: qtyGifted,              // Cantidad ya regalada
    qty_wanted: qtyWanted,
    qty_gifted: qtyGifted,
    qty_available: qtyAvailable,
    estado,                                   // 'disponible' | 'comprado' | 'agotado'
  };
}

export async function GET(request, { params }) {
  try {
    // ── 1. Validar y sanitizar el token ─────────────────────
    const { token } = await params;
    const safeToken = sanitizeToken(token);

    if (!safeToken) {
      return Response.json(
        { error: 'Token inválido' },
        { status: 400 }
      );
    }

    // ── 2. Buscar la lista de regalos en Odoo ───────────────
    // Permite buscar tanto por ID numérico como por código (name)
    const isNumeric = /^\d+$/.test(safeToken);
    const domain = isNumeric
      ? ['|', ['id', '=', parseInt(safeToken, 10)], ['name', '=', safeToken]]
      : [['name', '=', safeToken]];

    const listas = await searchRead(
      ODOO_MODELS.REGISTRY,
      domain,
      ['id', 'name', 'title', 'event_date', 'close_date', 'message', 'line_ids'],
      { limit: 1 }
    );

    if (!listas || listas.length === 0) {
      return Response.json(
        { error: 'Lista de regalos no encontrada.' },
        { status: 404 }
      );
    }

    const lista = listas[0];

    // ── 3. Verificar si la lista está expirada ───────────────
    if (lista.close_date) {
      const fechaCierre = new Date(lista.close_date);
      if (fechaCierre < new Date()) {
        return Response.json(
          {
            error: 'Esta lista de regalos ha expirado.',
            fechaCierre: lista.close_date,
          },
          { status: 403 }
        );
      }
    }

    // ── 4. Obtener las líneas de la lista (gift.registry.line) ─
    // Consulta estrictamente los campos requeridos con product_image y note opcionales
    const rawLineas = await searchRead(
      ODOO_MODELS.LINE,
      [['registry_id', '=', lista.id]],
      [...REGISTRY_LINE_FIELDS, 'product_image', 'note']
    );

    const productos = (rawLineas || []).map(mapProduct);

    // ── 5. Construir y devolver el payload ───────────────────
    const payload = {
      id: lista.id,
      nombre: lista.title || lista.name,
      descripcion: lista.message || '',
      fechaEvento: lista.event_date || null,
      fechaCierre: lista.close_date || null,
      productos,
    };

    return Response.json(payload, { status: 200 });


  } catch (err) {
    console.error('[GET /api/list/[token]]', err);
    return Response.json(
      { error: 'Error interno del servidor. Intenta más tarde.' },
      { status: 500 }
    );
  }
}
