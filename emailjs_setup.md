# Configuración de EmailJS (Correo Gratuito)

EmailJS permite enviar correos desde el navegador sin backend. Plan gratuito: **200 correos/mes**.

---

## 1. Crear cuenta en EmailJS

1. Ve a [https://www.emailjs.com](https://www.emailjs.com)
2. Haz clic en **Sign Up** y crea una cuenta gratuita
3. Confirma tu correo si te lo piden

---

## 2. Conectar tu correo (Email Service)

1. En el dashboard, ve a **Email Services** > **Add New Service**
2. Elige un proveedor:
   - **Gmail** – Si usas Gmail (recomendado)
   - **Outlook** – Si usas Outlook/Hotmail
   - **Yahoo** – Si usas Yahoo
3. Haz clic en **Connect Account** y autoriza con tu cuenta
4. Anota el **Service ID** (ej: `service_abc123` o `default_service`)

---

## 3. Crear plantilla de correo (Template)

**Plantillas listas para usar:** En la carpeta `emailjs_templates/` tienes:
- `plantilla_reporte_violencia.html` – Para reportes del chatbot (HTML con diseño)
- `plantilla_contacto.html` – Para el formulario de contacto
- `INSTRUCCIONES.md` – Guía paso a paso

1. Ve a **Email Templates** > **Create New Template**
2. **Content**: Abre `emailjs_templates/plantilla_reporte_violencia.html` y copia todo el contenido en el editor de EmailJS
3. En **Settings**:
   - **To Email**: `{{to_email}}` (se reemplaza dinámicamente)
   - **From Name**: `Plataforma Anti-Violencia Duitama`
   - **Reply To**: `{{from_email}}`

4. Guarda y anota el **Template ID** (ej: `template_reporte_violencia`)

---

## 4. Obtener Public Key

1. Ve a **Account** > **General**
2. Copia tu **Public Key** (ej: `mlsn.b2c11ff093ee28fd69704d1f694da20cd2607a8938a3c950e8b6fec12540e176`)

---

## 5. Configurar en tu proyecto

### Opción A: Editar index.html (ya está ahí)

Busca esta línea en `index.html`:
```javascript
emailjs.init("TU_PUBLIC_KEY_AQUI");
```

Reemplaza `TU_PUBLIC_KEY_AQUI` con tu Public Key de EmailJS.

### Opción B: Usar config.js (recomendado)

1. En `config.js` agrega:
```javascript
EMAILJS_PUBLIC_KEY: 'tu_public_key_aqui',
EMAILJS_SERVICE_ID: 'default_service',  // o el Service ID que te dio EmailJS
EMAILJS_TEMPLATE_REPORTE: 'template_reporte_violencia',  // tu Template ID
```

2. En `index.html`, cambia la línea de init para usar la config:
```javascript
emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY || "mlsn.b2c11ff093ee28fd69704d1f694da20cd2607a8938a3c950e8b6fec12540e176");
```

---

## 6. Variables que usa la plantilla

| Variable       | Descripción                    |
|----------------|--------------------------------|
| `{{to_email}}` | Correo destino (entidad o admin) |
| `{{from_email}}`| Correo del reportante          |
| `{{report_code}}` | Radicado (DUIT-YYYYMMDD-XXXX) |
| `{{report_date}}` | Fecha del reporte            |
| `{{motivo_caso}}` | Descripción del caso        |
| `{{institucion}}` | Institución educativa       |
| `{{tipo_violencia}}` | Tipo de violencia        |
| `{{answers}}`   | JSON con todos los datos      |

---

## 7. Correo de destino

En `config.js` define quién recibe los reportes:

```javascript
EMAIL_DESTINO_PRINCIPAL: 'tu_correo@gmail.com',
```

---

## Alternativas gratuitas a EmailJS

| Servicio    | Límite gratis      | Uso                          |
|-------------|--------------------|------------------------------|
| **EmailJS** | 200/mes            | Ya integrado en tu proyecto  |
| **Resend**  | 3,000/mes          | Requiere backend (Node.js)   |
| **SendGrid**| 100/día            | Requiere backend             |
| **Brevo**   | 300/día            | Requiere backend             |

Para tu caso (frontend estático), **EmailJS es la opción más sencilla**.

---

## Solución de problemas

**Los correos no llegan:**
- Revisa la carpeta de **Spam**
- Verifica que el Service esté conectado en EmailJS
- Comprueba que el Template ID coincida con el de tu código

**Error "Invalid public key":**
- Copia de nuevo la Public Key desde EmailJS > Account

**Límite excedido:**
- Plan gratuito: 200 correos/mes
- Para más, considera el plan de pago o usar otro servicio
