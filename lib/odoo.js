/**
 * lib/odoo.js
 * ─────────────────────────────────────────────────────────
 * Cliente XML-RPC para Odoo — Capa de abstracción del servidor.
 * ¡NUNCA importar este módulo desde componentes del cliente!
 * Solo debe usarse en Route Handlers (app/api/.../route.js)
 * y en Server Components que corren exclusivamente en Node.js.
 * ─────────────────────────────────────────────────────────
 */

import xmlrpc from 'xmlrpc';

// ── 1. Validación de variables de entorno ───────────────────
const REQUIRED_ENV = ['ODOO_URL', 'ODOO_DB', 'ODOO_USERNAME', 'ODOO_PASSWORD'];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(
      `[odoo.js] Variable de entorno faltante: "${key}". ` +
      `Asegúrate de definirla en .env.local`
    );
  }
}

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_PASSWORD = process.env.ODOO_PASSWORD;

// ── 2. Factory de cliente XML-RPC ───────────────────────────

/**
 * Parsea la URL de Odoo y crea un cliente xmlrpc correctamente
 * configurado para HTTP o HTTPS.
 * @param {string} path  - Ruta del endpoint (ej. '/xmlrpc/2/common')
 */
function createOdooClient(path) {
  const url = new URL(ODOO_URL + path);
  const isHttps = url.protocol === 'https:';
  const port = url.port ? parseInt(url.port, 10) : (isHttps ? 443 : 80);

  const options = {
    host: url.hostname,
    port,
    path: url.pathname,
  };

  return isHttps
    ? xmlrpc.createSecureClient(options)
    : xmlrpc.createClient(options);
}

// ── 3. Wrapper promisificado para llamadas XML-RPC ──────────

/**
 * Ejecuta una llamada XML-RPC y devuelve una Promesa.
 * @param {object} client  - Cliente xmlrpc
 * @param {string} method  - Nombre del método RPC
 * @param {Array}  params  - Parámetros del método
 * @returns {Promise<any>}
 */
function callAsync(client, method, params) {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, value) => {
      if (err) {
        reject(new Error(`[Odoo RPC] ${method} → ${err.message || JSON.stringify(err)}`));
      } else {
        resolve(value);
      }
    });
  });
}

// ── 4. Autenticación — obtiene uid de sesión ────────────────

/** Cache de UID por sesión (vive durante el ciclo de vida del proceso Node) */
let _cachedUid = null;

/**
 * Autentica con Odoo y devuelve el UID del usuario.
 * Cachea el resultado para evitar llamadas repetidas durante el mismo ciclo.
 * @returns {Promise<number>} UID del usuario autenticado
 */
export async function authenticate() {
  if (_cachedUid) return _cachedUid;

  const common = createOdooClient('/xmlrpc/2/common');
  const uid = await callAsync(common, 'authenticate', [
    ODOO_DB,
    ODOO_USERNAME,
    ODOO_PASSWORD,
    {},
  ]);

  if (!uid) {
    throw new Error('[Odoo] Autenticación fallida. Verifica ODOO_USERNAME y ODOO_PASSWORD.');
  }

  _cachedUid = uid;
  return uid;
}

// ── 5. Función principal de consulta (search_read) ──────────

/**
 * Ejecuta un search_read en un modelo de Odoo.
 * @param {string}   model   - Nombre del modelo (ej. 'gift.registry')
 * @param {Array}    domain  - Dominio de filtro (ej. [['token', '=', 'abc123']])
 * @param {string[]} fields  - Campos a retornar
 * @param {object}   [opts]  - Opciones: { limit, offset, order }
 * @returns {Promise<object[]>}
 */
export async function searchRead(model, domain, fields, opts = {}) {
  const uid = await authenticate();
  const models = createOdooClient('/xmlrpc/2/object');

  const kwargs = {
    fields,
    ...(opts.limit !== undefined && { limit: opts.limit }),
    ...(opts.offset !== undefined && { offset: opts.offset }),
    ...(opts.order !== undefined && { order: opts.order }),
  };

  return callAsync(models, 'execute_kw', [
    ODOO_DB, uid, ODOO_PASSWORD,
    model, 'search_read',
    [domain],
    kwargs,
  ]);
}

// ── 6. Crear registro (create) ──────────────────────────────

/**
 * Crea un nuevo registro en Odoo.
 * @param {string} model  - Nombre del modelo
 * @param {object} values - Valores del nuevo registro
 * @returns {Promise<number>} ID del registro creado
 */
export async function createRecord(model, values) {
  const uid = await authenticate();
  const models = createOdooClient('/xmlrpc/2/object');

  return callAsync(models, 'execute_kw', [
    ODOO_DB, uid, ODOO_PASSWORD,
    model, 'create',
    [values],
  ]);
}

// ── 7. Escribir en registro (write) ─────────────────────────

/**
 * Actualiza registros existentes en Odoo.
 * @param {string}   model  - Nombre del modelo
 * @param {number[]} ids    - IDs a actualizar
 * @param {object}   values - Nuevos valores
 * @returns {Promise<boolean>}
 */
export async function writeRecord(model, ids, values) {
  const uid = await authenticate();
  const models = createOdooClient('/xmlrpc/2/object');

  return callAsync(models, 'execute_kw', [
    ODOO_DB, uid, ODOO_PASSWORD,
    model, 'write',
    [ids, values],
  ]);
}

// ── 8. Llamada genérica a método de Odoo ───────────────────

/**
 * Llama a cualquier método de Odoo (para métodos personalizados).
 * @param {string} model  - Nombre del modelo
 * @param {string} method - Método a llamar
 * @param {Array}  args   - Argumentos posicionales
 * @param {object} kwargs - Argumentos por nombre
 * @returns {Promise<any>}
 */
export async function callMethod(model, method, args = [], kwargs = {}) {
  const uid = await authenticate();
  const models = createOdooClient('/xmlrpc/2/object');

  return callAsync(models, 'execute_kw', [
    ODOO_DB, uid, ODOO_PASSWORD,
    model, method,
    args,
    kwargs,
  ]);
}

// ── 9. Constantes de modelo y campos de Lista de Regalos ──────

export const ODOO_MODELS = {
  REGISTRY: 'gift.registry',
  LINE: 'gift.registry.line',
  ORDER: 'gift.registry.order',
};

/**
 * Campos estrictos del modelo gift.registry.line
 */
export const REGISTRY_LINE_FIELDS = [
  'id',
  'product_id',
  'product_price',
  'qty_wanted',
  'qty_gifted',
  'qty_available',
];

/**
 * Consulta las líneas de una lista de regalos con los campos estrictos.
 * @param {number} registryId - ID del gift.registry
 * @returns {Promise<object[]>}
 */
export async function getRegistryLines(registryId) {
  return searchRead(
    ODOO_MODELS.LINE,
    [['registry_id', '=', registryId]],
    REGISTRY_LINE_FIELDS
  );
}

/**
 * Calcula el estado de un regalo según qty_wanted, qty_gifted y qty_available:
 * - 'comprado':   si qty_gifted >= qty_wanted (y qty_wanted > 0)
 * - 'agotado':    si qty_available <= 0
 * - 'disponible': si aún falta regalar y hay stock físico en tienda
 * @param {object} line - Objeto de línea con qty_wanted, qty_gifted, qty_available
 * @returns {'disponible' | 'comprado' | 'agotado'}
 */
export function calculateGiftState(line) {
  const wanted = Number(line?.qty_wanted ?? 0);
  const gifted = Number(line?.qty_gifted ?? 0);
  const available = Number(line?.qty_available ?? 0);

  if (wanted > 0 && gifted >= wanted) {
    return 'comprado';
  }
  if (available <= 0) {
    return 'agotado';
  }
  return 'disponible';
}

