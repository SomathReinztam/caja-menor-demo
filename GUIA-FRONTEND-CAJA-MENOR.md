# Caja Menor — Guía de integración para el frontend

Esta guía es para quien implemente **caja menor** en la app móvil de visitas
(Flutter). Explica las APIs del backend (ya desarrolladas en `originabot`, app
`cajita_menor`) y la **visión de UX** de los dos flujos. Hay además un
**prototipo web en React** que sirve de referencia visual del comportamiento
esperado (ver §9).

> **Qué es:** los trabajadores de campo (visitadores) registran los gastos que
> hacen con el dinero de caja menor. Dos casos:
> - El proveedor **es facturador electrónico** → se sube y registra la **factura**.
> - El proveedor **no es facturador** (o no hay proveedor) → se genera una
>   **cuenta de cobro** con el RUT del propio visitador y se firma con ZapSign.
>
> El plus: al subir una foto/PDF del RUT o de la factura, una IA (Gemini)
> **pre-rellena** el formulario; el visitador solo corrige y guarda.

---

## 1. Base URL y autenticación

- **Base de todas las rutas:** `/{API_URL}/api/cajita-menor/app/v2/`
  (mismo patrón que `visitor`: `/api/visitor/app/v2/…`).
- **Autenticación:** la misma que ya usa la app — `Authorization: Bearer <token>`
  (JWT). El backend deriva el/los visitadores del usuario autenticado
  (`owner` del token) y **filtra todo por ahí**.
- En cada operación sobre un visitador concreto, el front manda su **`visitor`**
  (el `id` del visitador, el mismo que ya usa la app para las visitas):
  - en el **body** al crear (`providers/`, `expenses/`) o en el **PUT** de
    `tax-profile/`,
  - o como **query param** `?visitor=<id>` en el `GET` de `tax-profile/`.
  El backend valida que ese visitador pertenezca al usuario autenticado.

> **Nota (solo para el prototipo/demo):** el prototipo React corre sin el
> microservicio de auth y usa un header `X-Demo-Visitor: <id>` con un modo demo
> gateado en el backend. **Eso NO aplica a la app real**: la app usa el `Bearer`
> normal. Se menciona solo para que no sorprenda si ven ese header en el demo.

---

## 2. Convenciones generales

- **Dinero:** enteros en **pesos COP** (sin decimales ni centavos). Ej. `15000`.
- **Fechas:** formato `YYYY-MM-DD` (ej. `2026-09-30`).
- **Archivos (RUT, factura):** se mandan como **`multipart/form-data`** en los
  endpoints que reciben archivo (los `extract-*`, crear proveedor, PUT del perfil
  fiscal). El **crear gasto** (`POST expenses/`) va como **`application/json`**
  (por los ítems anidados; ver nota en §5.2).
- **IDs:** proveedor y perfil fiscal → enteros. **Gasto → UUID** (ese UUID es
  también el identificador de la cuenta de cobro).
- **La extracción con IA solo SUGIERE:** los endpoints `extract-*` **no guardan
  nada**; devuelven un JSON para pre-rellenar el formulario. El visitador corrige
  y luego el `POST/PUT` persiste. Cualquier campo puede venir `null`.
- **Listados:** pueden venir como arreglo plano `[...]` o paginados
  `{count, next, previous, results: [...]}`. Manejar ambos (usar `results` si
  existe).

---

## 3. Enums / valores válidos

| Campo | Valores |
|---|---|
| `document_type` | `CC` (cédula), `NIT` |
| `document_kind` (gasto) | `invoice` (factura), `charge_account` (cuenta de cobro) |
| `payment_method` | `cash` (efectivo), `card` (tarjeta; requiere `card`), `own` (dinero propio u otra tarjeta; Unergy se lo reembolsa al visitador, no lleva `card`) |
| `bank` (tarjeta) | `bancolombia`, `other` |
| `card_type` | `credit`, `debit` |
| `payer` (pagador) | `unergy` (por ahora **siempre** `unergy`; ver nota abajo). `solenium` existe en el backend pero **no se usa todavía** |
| `status` (gasto) | `submitted`, `pending_signature`, `verified`, `synced_to_odoo`, `rejected` |
| `signature_status` | `not_required`, `pending`, `signed`, `refused` |
| `review_status` (lo que ve el visitador) | `in_review` (En revisión), `accepted` (Aceptado), `rejected` (Rechazado) |

> **Pagador = Unergy por ahora.** Solenium tiene **otro Odoo**, y el envío a Odoo
> hoy solo está conectado al de Unergy. Mientras tanto, el front **no muestra el
> selector de pagador** y manda siempre `"payer": "unergy"`. Cuando se integre el
> Odoo de Solenium se vuelve a habilitar el selector (Unergy / Solenium).

---

## 4. Proveedores — `/providers/`

Un proveedor es el comercio/persona al que el visitador le compró. Se dan de alta
por visitador.

### 4.1 Sugerir datos desde el RUT (IA, sin guardar)
`POST providers/extract-rut/` — `multipart/form-data`

| Campo | Tipo |
|---|---|
| `rut_file` | archivo (PDF o imagen) |

**Respuesta 200** (para pre-rellenar; campos pueden ser `null`):
```json
{
  "name": "Ferretería El Tornillo",
  "document_type": "NIT",
  "document_number": "900123456-7",
  "is_electronic_biller": true,
  "department": "Antioquia",
  "municipality": "Medellín",
  "address": "Cra 45 # 30-20",
  "email": "contacto@ferreteria.co",
  "responsability_type": "52",
  "responsibilities": ["O-13 Gran contribuyente", "O-48 Impuesto sobre las ventas - IVA", "..."]
}
```
> `responsability_type` = códigos DIAN (ej. `"52"`, `"52-49"`) construidos desde las
> "Responsabilidades, Calidades y Atributos" del RUT; Odoo los usa para IVA/retenciones.
> `responsibilities` = el texto crudo de esa sección (solo para mostrar). Guarda el
> `responsability_type` tal cual (el contador lo valida después en TSF).
> `email` = el correo del RUT (suele venir en facturadores); puede ser `null`.
> **Odoo lo exige** para la factura electrónica, así que si viene `null`, el front
> debe **pedir que lo llenen** antes de guardar el proveedor.

### 4.2 Crear proveedor
`POST providers/` — `multipart/form-data`

| Campo | Tipo | Notas |
|---|---|---|
| `visitor` | int | id del visitador |
| `name` | string | razón social / establecimiento |
| `document_type` | enum | `CC` / `NIT` |
| `document_number` | string | NIT |
| `is_electronic_biller` | bool | `true`/`false` |
| `department` | string | opcional |
| `municipality` | string | opcional |
| `address` | string | opcional |
| `email` | string | **recomendado/obligatorio**: Odoo lo exige para la factura electrónica. Si `extract-rut` no lo trajo, pídelo al visitador |
| `responsability_type` | string | códigos DIAN del RUT (el que devolvió `extract-rut`); opcional pero recomendado |
| `rut_file` | archivo | opcional |

**Respuesta 201:** el proveedor creado (ver forma en 4.3).

### 4.3 Listar / detalle / editar / borrar
- `GET providers/` → lista de los proveedores del visitador (para el selector del
  flujo de gasto).
- `GET providers/{id}/`, `PATCH providers/{id}/`, `DELETE providers/{id}/`.

Forma de un proveedor:
```json
{
  "id": 12,
  "visitor": 1,
  "name": "Ferretería El Tornillo",
  "document_type": "NIT",
  "document_number": "900123456-7",
  "is_electronic_biller": true,
  "department": "Antioquia",
  "municipality": "Medellín",
  "address": "Cra 45 # 30-20",
  "email": "contacto@ferreteria.co",
  "rut_file": "https://…/cajita_menor/providers/rut/….pdf",
  "responsability_type": "52",
  "odoo_partner_id": null,
  "created_at": "2026-09-30T15:38:18Z",
  "updated_at": "2026-09-30T15:38:18Z"
}
```
> `odoo_partner_id` (solo lectura): id del tercero en Odoo una vez creado (al
> verificar el gasto en contabilidad); `null` = aún no está en Odoo.

---

## 5. Perfil fiscal del visitador — `/tax-profile/`

Son los datos fiscales del **propio visitador** (con su RUT). Se usan para emitir
la **cuenta de cobro** cuando el proveedor no es facturador. Es **uno por
visitador** y **prerequisito** de ese caso. Se llena una vez.

### 5.1 Consultar
`GET tax-profile/?visitor=<id>`
- **200** → el perfil.
- **404** → el visitador aún no tiene perfil (normal; hay que crearlo).

### 5.2 Crear / actualizar (upsert)
`PUT tax-profile/` — `multipart/form-data`

| Campo | Tipo |
|---|---|
| `visitor` | int |
| `full_name` | string |
| `document_type` | `CC` / `NIT` |
| `document_number` | string |
| `address` | string (opcional) |
| `department` | string (opcional) |
| `municipality` | string (opcional) |
| `email` | string (firmante ZapSign) |
| `phone_country_code` | string (ej. `57`) |
| `phone_number` | string (firmante ZapSign) |
| `rut_file` | archivo (opcional) |

**Respuesta:** `201` si se creó, `200` si se actualizó. Devuelve el perfil.

### 5.3 Sugerir desde el RUT propio (IA)
`POST tax-profile/extract-rut/` — `multipart` `rut_file` →
```json
{ "full_name": "Juan Pérez", "document_number": "1234567", "address": "…",
  "department": "…", "municipality": "…" }
```

### 5.4 Tarjetas del visitador — `/cards/`

Tarjetas con las que el visitador puede pagar gastos. Se registran en la pantalla
del perfil fiscal; **solo se guardan los últimos 4 dígitos** (nunca el número completo).

- `GET cards/?visitor=<id>` · `POST cards/` · `PATCH cards/{id}/` · `DELETE cards/{id}/`
- Body (JSON o multipart): `visitor` (int), `bank` (`bancolombia` / `other`, default `bancolombia`),
  `card_type` (`credit` / `debit`, default `credit`), `last4` (exactamente 4 dígitos),
  `alias` (opcional), `is_active`.
- `DELETE`: si la tarjeta ya tiene gastos, no se borra: se **desactiva** (`is_active=false`) y
  responde `200` con la tarjeta; si no tiene gastos, `204`.
- Duplicado (mismo visitador + banco + tipo + últimos 4) → `400`.

---

## 6. Gastos — `/expenses/`

### 6.1 Sugerir datos desde la factura (IA, sin guardar)
`POST expenses/extract-invoice/` — `multipart` `file` (PDF o imagen) →
```json
{
  "invoice_number": "FE-4521",
  "issue_date": "2026-09-28",
  "emitter_nit": "900123456-7",
  "items": [
    { "concept": "Gasolina", "value": 50000 },
    { "concept": "Peajes", "value": 30000 }
  ],
  "total_value": 80000
}
```

### 6.2 Registrar el gasto
`POST expenses/` — **`application/json`**

```json
{
  "visitor": 1,
  "provider": 12,
  "payment_method": "cash",
  "payer": "unergy",
  "project_name": "Granja Solar Norte",
  "invoice_number": "FE-4521",
  "issue_date": "2026-09-28",
  "emitter_nit": "900123456-7",
  "total_value": 80000,
  "items": [
    { "concept": "Gasolina", "value": 50000 },
    { "concept": "Peajes", "value": 30000 }
  ]
}
```

- `card`: **obligatorio si `payment_method = "card"`** (id de una tarjeta activa del mismo
  visitador, de `cards/`); debe ser `null`/omitirse si es `cash`. Si el visitador no tiene
  tarjetas, el front no debe dejar elegir "Tarjeta" y debe mandarlo a registrarla en su perfil
  fiscal. El gasto devuelve `card` (id) y `card_detail` (banco, tipo, `last4`). Sin tarjeta → `400`.
- `provider`: el `id` del proveedor, **o `null`** para "usar mis datos" (sin
  proveedor).
- `payer`: por ahora **siempre `"unergy"`** (fijo, sin selector en la UI; ver §3).
- **El backend decide el tipo de documento**:
  - proveedor **facturador** → `document_kind = "invoice"`, `status = "submitted"`.
    Se guarda la factura, sin firma.
  - proveedor **no facturador** o `provider = null` → `document_kind =
    "charge_account"`: se genera el **PDF de la cuenta de cobro** y se crea el
    documento en **ZapSign**; la respuesta trae **`zapsign_sign_url`**.
    `status = "pending_signature"`, `signature_status = "pending"`. **A nombre de
    quién va** (campo `charge_account_issuer`):
    - proveedor no facturador **con RUT** (`provider.rut_file` no nulo) →
      `"provider"`: la cuenta de cobro va a nombre del **proveedor** y **él la
      firma en persona, en el celular del visitador** (firma en pantalla, sin
      código por WhatsApp). No requiere el perfil fiscal del visitador.
    - proveedor **sin RUT** o `provider = null` → `"visitor"`: va a nombre del
      **visitador**, con su perfil fiscal; firma él (código por WhatsApp).
      **Precondición:** el visitador debe tener **perfil fiscal** (§5). Si no, el
      endpoint responde `400` con un mensaje claro → mandar al front a crear el
      perfil primero.
- **Validación:** `total_value` debe ser **igual a la suma** de los `value` de
  los ítems (si no, `400`).

**Respuesta 201:** el gasto creado (ver forma en 6.3). Para la cuenta de cobro,
usar `zapsign_sign_url` para abrir el enlace de firma.

### 6.2.1 Subir el soporte de la factura
`POST expenses/{id}/source-file/` — `multipart/form-data`

El `POST expenses/` va en **JSON** (por los ítems anidados) y **no** puede
transportar el archivo, así que el soporte se sube en una llamada aparte,
**después** de crear el gasto:

| Campo | Tipo |
|---|---|
| `source_file` | archivo (PDF o imagen de la factura) |

**Respuesta 200:** el gasto actualizado (con `source_file` ya poblado).

> **Flujo recomendado:** `POST expenses/` → con el `id` que devuelve, `POST
> expenses/{id}/source-file/` con la **misma imagen** que se usó en
> `extract-invoice/`. Es *best-effort*: si falla la subida, el gasto ya quedó
> registrado; muestra un aviso y deja reintentar, no bloquees el flujo.
> Sin este paso, el soporte de la factura **no** aparece en la revisión contable
> (TSF) ni se adjunta a Odoo. (La cuenta de cobro no lo necesita: su soporte es el
> PDF generado, `charge_account_pdf`.)

### 6.3 Seguimiento (listar / detalle)
- `GET expenses/` → los gastos del visitador (con estado y firma).
- `GET expenses/{id}/`.
- `DELETE expenses/{id}/` → **solo si `can_delete` es `true`**: antes de que
  contabilidad lo verifique (estados `pending_signature` / `submitted`). Si ya se
  verificó (se envió o se intentó enviar a Odoo) o se rechazó → **`409`** con
  `{"detail": "..."}`. Responde `204` si se borró. Borrar una cuenta de cobro
  elimina también su documento en ZapSign.

**Estado para el visitador (`review_status`)** — derivado de `status` por el
backend; es lo que se pinta en "Mis gastos":

| `review_status` | Etiqueta | `status` internos |
|---|---|---|
| `in_review` | En revisión | `pending_signature`, `submitted` |
| `accepted` | Aceptado | `verified`, `synced_to_odoo` |
| `rejected` | Rechazado | `rejected` (mostrar `rejection_reason`) |

Forma de un gasto:
```json
{
  "id": "946fac83-0e01-435c-a80a-70bd78da92a5",
  "visitor": 1,
  "provider": 12,
  "document_kind": "charge_account",
  "payment_method": "cash",
  "payer": "unergy",
  "project_name": "Granja Solar Norte",
  "invoice_number": "",
  "issue_date": "2026-09-28",
  "emitter_nit": "1234567",
  "total_value": 80000,
  "status": "pending_signature",
  "review_status": "in_review",
  "rejection_reason": "",
  "can_delete": true,
  "signature_status": "pending",
  "charge_account_issuer": "visitor",
  "zapsign_sign_url": "https://sandbox.app.zapsign.com.br/verificar/…",
  "charge_account_pdf": "https://…/cajita_menor/expenses/charge_account/….pdf",
  "source_file": null,
  "items": [
    { "id": 1, "concept": "Gasolina", "value": 50000 },
    { "id": 2, "concept": "Peajes", "value": 30000 }
  ],
  "created_at": "2026-09-30T15:54:34Z",
  "updated_at": "2026-09-30T15:54:34Z"
}
```

---

## 7. Los dos flujos (visión de UX)

### Flujo A — Crear proveedor
1. Pantalla con **zona de subida** del RUT (PDF/imagen).
2. Al subir → `POST providers/extract-rut/` (spinner "Leyendo el RUT…").
3. Se **pre-rellena** el formulario con la respuesta. Campos: nombre, NIT,
   **¿facturador electrónico?** (switch), departamento, municipio, dirección.
4. El visitador **corrige** lo que haga falta.
5. "Guardar" → `POST providers/` (multipart, con el mismo `rut_file`).

### Flujo B — Registrar gasto
1. **Elegir proveedor** de la lista (`GET providers/`) **o** "usar mis datos".
   - Mostrar un badge "Facturador" / "No facturador" por proveedor.
   - Si es no facturador o "mis datos" → avisar que se generará una **cuenta de
     cobro**, y a nombre de quién: si el proveedor tiene RUT (`rut_file`), "a nombre
     del proveedor; él debe firmarla en este celular"; si no tiene RUT o es "mis
     datos", "con tus datos fiscales" (y exigir perfil fiscal, ver abajo).
2. **Detalles:** medio de pago (efectivo/tarjeta) y proyecto (opcional). El
   pagador **no se pregunta**: va fijo `unergy` (Solenium se habilitará cuando se
   integre su Odoo, ver §3).
3. **Subir la factura** → `POST expenses/extract-invoice/` (spinner) →
   pre-rellena número, fecha, NIT emisor, **ítems** (concepto + valor) y total.
4. El visitador corrige/agrega ítems (el total se recalcula como suma de ítems).
5. "Registrar" → `POST expenses/`.
   - Si hay imagen cargada → acto seguido `POST expenses/{id}/source-file/` con
     esa imagen (ver §6.2.1), para guardar el soporte.
   - Si es **factura** → confirmación "Factura registrada".
   - Si es **cuenta de cobro** → confirmación + botón **"Firmar"** que abre
     `zapsign_sign_url`. Si `charge_account_issuer = "provider"`, indicar
     "entrégale el celular al proveedor para que firme" (botón "Firma del
     proveedor").

### Prerequisito — Perfil fiscal
Para la cuenta de cobro **a su nombre** (proveedor sin RUT o "mis datos"), el
visitador necesita su **perfil fiscal** (§5). Sugerido:
una pantalla "Mi perfil fiscal" (subir su RUT → `tax-profile/extract-rut/` →
corregir → `PUT tax-profile/`). Si intenta generar una cuenta de cobro sin perfil,
el backend responde `400`; el front debe mandarlo a completarlo.

### Seguimiento — Mis gastos
Lista (`GET expenses/`) con el badge de **`review_status`** (En revisión / Aceptado
/ Rechazado), monto, proveedor/fecha y:
- si está **en revisión** y la firma sigue pendiente (`signature_status =
  "pending"`), el badge de firma y el enlace `zapsign_sign_url`;
- si fue **rechazado**, el `rejection_reason`;
- un botón **"Eliminar gasto"** solo si `can_delete` (con confirmación). Si el
  backend responde `409` (contabilidad lo verificó mientras tanto), avisar y
  refrescar la lista.

---

## 8. Errores

- **401** — falta o es inválido el token (auth). En el demo, ruta no exceptuada.
- **400** — validación. Cuerpo tipo `{"campo": ["mensaje"], …}` (DRF). Casos
  típicos: `total_value` ≠ suma de ítems; `tax_profile` faltante para la cuenta de
  cobro; `visitor`/`provider` que no pertenece al usuario.
- **404** — recurso inexistente (ej. `tax-profile/` sin perfil aún).
- **5xx** — error del servidor (ej. si falta configurar Gemini/MinIO/ZapSign en
  el entorno).

---

## 9. Prototipo de referencia (React)

Hay un **prototipo web** que replica el look de la app Flutter (tema, colores,
componentes) y ejecuta estos flujos contra el backend real. Sirve como
**referencia de comportamiento y de UX**:
`/home/somath/Documents/dev/CajaMenor/caja-menor-demo` (ver su `README.md`).

Tokens de diseño (extraídos del tema Flutter, por si ayudan): primario `#68548E`,
botón `#635B70`, fondo `#FEF7FF`, cards `#F2ECF4` (radio 20), inputs radio 12 con
label encima, botones tipo *pill*, fuente Roboto.

---

## 10. Pendientes / a conversar

- **Pagador Solenium:** deshabilitado en el front (siempre `unergy`) porque
  Solenium usa otro Odoo. Al integrarlo, volver a mostrar el selector Unergy /
  Solenium en "Detalles" del registro de gasto.
- **Imagen de la factura (`source_file`): resuelto.** Se sube con
  `POST expenses/{id}/source-file/` (multipart) justo después de crear el gasto
  (§6.2.1). El frontend debe hacer esa segunda llamada; si no, el soporte no llega
  a TSF ni a Odoo.
- **Estado de firma en local:** el webhook de ZapSign (que marca `signed`) necesita
  una URL pública; en local no llega a `localhost` sin un túnel (ngrok).
- **Revisión contable y Odoo: implementados.** Contabilidad revisa en TSF y el gasto
  verificado se crea como borrador en Odoo; para la app solo se refleja en
  `review_status` (§6.3). **Pendiente:** el arqueo de caja (tarjetas/extractos), que
  no afecta estos endpoints todavía.
- **Ubicación como texto:** hoy `department`/`municipality` son texto libre (no FK
  a un catálogo). Si el front quiere selects de departamento/municipio, se puede
  enlazar a `territorial.City` más adelante.
