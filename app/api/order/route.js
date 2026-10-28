/**
 * app/api/order/route.js
 * ─────────────────────────────────────────────────────────────
 * POST /api/order
 *
 * Procesa la reserva múltiple de regalos desde el carrito lateral,
 * conectándose a Odoo mediante XML-RPC.
 *
 * Payload esperado (JSON):
 * {
 *   guest_name:  string   — Nombre completo del invitado
 *   guest_dni:   string   — 8 dígitos numéricos
 *   guest_phone: string   — Número de celular
 *   guest_email: string   — Correo electrónico (opcional)
 *   items: [
 *     { registry_line_id: 12, qty: 2 },
 *     ...
 *   ]
 * }
 *
 * Retorna:
 * {
 *   success: true,
 *   reservation_code: "RSV-A9X2",
 *   message: "..."
 * }
 * ─────────────────────────────────────────────────────────────
 */

import {
  createRecord,
  writeRecord,
  searchRead,
  ODOO_MODELS,
  REGISTRY_LINE_FIELDS,
} from '@/lib/odoo';

// ── Sanitización y validación de strings ──────────────────────

function sanitizeString(value, maxLen = 200) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')         // Eliminar etiquetas HTML
    .replace(/[\x00-\x1F\x7F]/g, '') // Eliminar caracteres de control
    .trim()
    .slice(0, maxLen);
}

/**
 * Valida el payload de reserva múltiple (o soporte retrocompatible con individual).
 */
function validateOrderPayload(body) {
  const errors = {};

  // Normalización de campos del invitado
  const guestName = sanitizeString(body.guest_name ?? body.nombre ?? '', 120);
  const guestDni = sanitizeString(body.guest_dni ?? body.dni ?? '', 8);
  const guestPhone = sanitizeString(body.guest_phone ?? body.celular ?? '', 16);
  const guestEmail = sanitizeString(body.guest_email ?? body.correo ?? '', 150);

  // Validación DNI (8 dígitos)
  if (!/^\d{8}$/.test(guestDni)) {
    errors.guest_dni = 'El DNI debe contener exactamente 8 dígitos numéricos';
  }

  // Validación Nombre (mínimo 3 caracteres)
  if (guestName.length < 3) {
    errors.guest_name = 'El nombre completo es requerido (mínimo 3 caracteres)';
  }

  // Validación Celular (mínimo 9 dígitos)
  const phoneClean = guestPhone.replace(/\s/g, '');
  if (!/^\d{9,15}$/.test(phoneClean)) {
    errors.guest_phone = 'Ingresa un número de celular válido';
  }

  // Validación Correo (opcional)
  if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    errors.guest_email = 'Ingresa un correo electrónico válido';
  }

  // Validación de items
  let items = [];
  if (Array.isArray(body.items) && body.items.length > 0) {
    for (const item of body.items) {
      const lineId = Number(item.registry_line_id ?? item.id ?? item.itemId);
      const qty = Number(item.qty ?? 1);

      if (!Number.isInteger(lineId) || lineId <= 0) {
        errors.items = 'Identificador de regalo inválido en la lista.';
        break;
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        errors.items = 'La cantidad debe ser un número entero mayor a 0.';
        break;
      }

      items.push({ registry_line_id: lineId, qty });
    }
  } else if (body.itemId || body.registry_line_id) {
    // Compatibilidad retroactiva con llamadas de 1 item
    const lineId = Number(body.itemId ?? body.registry_line_id);
    const qty = Number(body.qty ?? 1);
    if (Number.isInteger(lineId) && lineId > 0 && Number.isInteger(qty) && qty > 0) {
      items.push({ registry_line_id: lineId, qty });
    } else {
      errors.items = 'Datos de producto inválidos.';
    }
  } else {
    errors.items = 'Debes seleccionar al menos un regalo para reservar.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      guest_name: guestName,
      guest_dni: guestDni,
      guest_phone: phoneClean,
      guest_email: guestEmail,
      items,
      listaId: body.listaId ? Number(body.listaId) : null,
    },
  };
}

/**
 * Genera un código de reserva con el formato requerido (ej. "RSV-A9X2")
 */
function generateReservationCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RSV-${randomPart}`;
}

// ── Handler Principal POST ────────────────────────────────────

export async function POST(request) {
  try {
    // ── 1. Parsear el body JSON ─────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: 'Cuerpo de la solicitud inválido o JSON mal formado.' },
        { status: 400 }
      );
    }

    // ── 2. Validar estructura de datos ──────────────────────
    const validation = validateOrderPayload(body);
    if (!validation.valid) {
      return Response.json(
        { error: 'Datos de reserva inválidos.', campos: validation.errors },
        { status: 422 }
      );
    }

    const { guest_name, guest_dni, guest_phone, guest_email, items, listaId } =
      validation.data;

    const lineIds = items.map((i) => i.registry_line_id);

    // ── 3. Consultar las líneas en Odoo para validar stock ──
    const lines = await searchRead(
      ODOO_MODELS.LINE,
      [['id', 'in', lineIds]],
      [...REGISTRY_LINE_FIELDS, 'registry_id', 'product_id']
    );

    if (!lines || lines.length === 0) {
      return Response.json(
        { error: 'Ninguno de los regalos seleccionados fue encontrado en Odoo.' },
        { status: 404 }
      );
    }

    const linesMap = new Map();
    for (const l of lines) {
      linesMap.set(l.id, l);
    }

    // Verificar disponibilidad para cada item solicitado
    for (const item of items) {
      const line = linesMap.get(item.registry_line_id);
      if (!line) {
        return Response.json(
          { error: `El regalo con ID #${item.registry_line_id} no existe.` },
          { status: 404 }
        );
      }

      const wanted = Number(line.qty_wanted ?? 0);
      const gifted = Number(line.qty_gifted ?? 0);
      const availablePhysical = Number(line.qty_available ?? 0);
      const remainingWanted = Math.max(0, wanted - gifted);

      // Si la cantidad pedida excede lo que falta por regalar
      if (wanted > 0 && item.qty > remainingWanted) {
        const prodName = Array.isArray(line.product_id)
          ? line.product_id[1]
          : 'Regalo seleccionado';
        return Response.json(
          {
            error: `Lo sentimos, "${prodName}" solo tiene ${remainingWanted} unidad(es) pendiente(s) por regalar.`,
          },
          { status: 409 }
        );
      }

      // Si no hay stock físico en tienda
      if (line.qty_available !== undefined && availablePhysical <= 0) {
        const prodName = Array.isArray(line.product_id)
          ? line.product_id[1]
          : 'Regalo seleccionado';
        return Response.json(
          {
            error: `El producto "${prodName}" se encuentra actualmente agotado en tienda.`,
          },
          { status: 409 }
        );
      }
    }

    // ── 4. Generar código de reserva único (ej. RSV-A9X2) ────
    const reservationCode = generateReservationCode();

    // ── 5. Registrar la reserva en Odoo vía XML-RPC (Padre-Hijo) ──────────

    const createdOrderIds = [];

    // Obtener el ID de la lista del primer item (para vincular todo el pedido a la lista correcta)
    const firstLine = linesMap.get(items[0].registry_line_id);
    const resolvedRegistryId = (Array.isArray(firstLine.registry_id) ? firstLine.registry_id[0] : firstLine.registry_id) || listaId;

    // A. CREAR EL PADRE (Una sola fila por invitado)
    const parentOrderId = await createRecord(ODOO_MODELS.ORDER, {
      registry_id: resolvedRegistryId,
      guest_dni,
      guest_name,
      guest_phone,
      guest_email: guest_email || false,
      reservation_code: reservationCode,
      state: 'reserved',
    });
    // Guardamos el ID del padre por si necesitas retornarlo al final
    createdOrderIds.push(parentOrderId);

    // B. CREAR LOS HIJOS (Líneas de los regalos) Y ACTUALIZAR STOCK VISUAL
    for (const item of items) {
      const line = linesMap.get(item.registry_line_id);

      // Crear la línea hija conectada al Padre (order_id)
      await createRecord('gift.registry.order.line', {
        order_id: parentOrderId,
        registry_line_id: item.registry_line_id,
        reserved_qty: item.qty,
      });

      // C. ACTUALIZAR LA LISTA (Restar stock visual)
      const currentGifted = Number(line.qty_gifted ?? 0);
      await writeRecord(ODOO_MODELS.LINE, [item.registry_line_id], {
        qty_gifted: currentGifted + item.qty,
      });
    }

    // ── 6. Responder con el reservation_code y éxito ─────────
    return Response.json(
      {
        success: true,
        reservation_code: reservationCode,
        // Compatibilidad retroactiva
        codigoRecojo: reservationCode,
        orderIds: createdOrderIds,
        message: `¡Reserva Exitosa! Tu código para pagar en caja es: ${reservationCode}`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[POST /api/order]', err);
    return Response.json(
      {
        error:
          'Error interno al procesar la reserva con Odoo. Por favor intenta nuevamente.',
      },
      { status: 500 }
    );
  }
}
