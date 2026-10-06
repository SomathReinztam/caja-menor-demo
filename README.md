# Caja Menor — Demo (prototipo web)

Prototipo **web en React** que imita el look & feel de la app móvil Flutter
(*Unergy Visitadores*) para mostrarle a colegas cómo se vería el flujo nuevo de
**caja menor**: crear proveedor, registrar un gasto (factura o cuenta de cobro) y
el perfil fiscal del trabajador.

No es la app real (esa es Flutter): es un clon de las pantallas necesarias, con
el mismo tema visual (morado #68548E, botones pill, Roboto…), que **llama al
backend real** de `cajita_menor` en originabot. La extracción con IA (Gemini), la
persistencia, el PDF (WeasyPrint) y el enlace de firma (ZapSign) son de verdad.

## Requisitos
- Node 18+.
- El backend de originabot corriendo en `http://localhost:8000` en **modo demo**.

## 1. Backend (originabot) en modo demo
En el repo `origina-bot`, con Postgres + Redis + MinIO arriba y el `.env` con
`GOOGLE_GEMINI_API_KEY` y las `MINIO_*` configuradas, añade al `.env`:

```
CAJITA_MENOR_DEMO_MODE=True
EXCEPTIONS_AUTH=/admin,/api/cajita-menor
```

- `CAJITA_MENOR_DEMO_MODE` habilita `DemoVisitorAuthentication` (el front manda
  `X-Demo-Visitor: <id>` y el backend arma el `owner` de ese visitador).
- `EXCEPTIONS_AUTH` hace que el middleware gRPC no exija token en esas rutas.

Corre el servidor:
```
python manage.py runserver 0.0.0.0:8000
```

## 2. Frontend (este proyecto)
```
npm install
npm run dev
```
Abre **http://localhost:5173**. El proxy de Vite manda `/api` → `localhost:8000`
(sin líos de CORS).

## Cómo usarlo
- Arriba eliges el **visitador** con el que "actúas" (son visitadores reales de
  la BD restaurada).
- **Crear proveedor:** sube un RUT (PDF/imagen) → Gemini autocompleta el
  formulario → corriges → guardas.
- **Registrar gasto:** eliges proveedor (o "usar mis datos") → subes la factura →
  Gemini autocompleta ítems/total → registras.
  - Proveedor **facturador** → se guarda la factura.
  - Proveedor **no facturador** o "usar mis datos" → se genera la **cuenta de
    cobro** (PDF) y, si ZapSign está configurado, un **enlace de firma**.
- **Mi perfil fiscal:** los datos del trabajador (con su RUT) — **necesarios**
  para la cuenta de cobro. Configúralo antes de probar ese caso.
- **Mis gastos:** seguimiento con estado y firma.

## Notas
- Para el **enlace de firma** real necesitas `ZAPSIGN_*` en el `.env` del backend
  y el webhook de la cuenta ZapSign apuntando a
  `/whatsapp_bot/webhook/zapsign/doc_signed`. Sin eso, la cuenta de cobro igual
  genera el PDF; solo falta el `sign_url`.
- El `source_file` de la factura no se re-sube al persistir (el archivo ya se usó
  para la extracción); es una simplificación del demo.
