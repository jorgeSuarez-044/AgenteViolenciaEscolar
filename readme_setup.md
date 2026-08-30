# Configuración - Plataforma Anti-Violencia Escolar Duitama

## Base de Datos Supabase (IMPORTANTE)

### Si los datos NO llegan a la base de datos:

1. Ve a tu proyecto en [supabase.com](https://supabase.com) > **SQL Editor**
2. Copia y ejecuta **todo** el contenido de `supabase/setup_tablas.sql`
3. Verifica que las tablas `usuarios` y `casos` existan en Table Editor
4. Abre la consola del navegador (F12) al usar el bot - si hay errores de Supabase, aparecerán ahí

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta/proyecto
2. En el dashboard, ve a **SQL Editor**
3. Ejecuta `supabase/setup_tablas.sql` (más simple) o `supabase/migrations/001_initial_schema.sql`

### 2. Obtener credenciales

1. Ve a **Project Settings** > **API**
2. Copia la **Project URL** y la **anon public** key

### 3. Configurar config.js

Edita `config.js` y reemplaza:

```javascript
SUPABASE_URL: 'https://TU_PROYECTO.supabase.co',
SUPABASE_ANON_KEY: 'tu_anon_key_aqui',
```

## Tablas creadas

| Tabla | Descripción |
|-------|-------------|
| **usuarios** | Correos de estudiantes/usuarios que reportan |
| **casos** | Casos con radicado único (DUIT-YYYYMMDD-XXXX), motivo, estado |
| **seguimiento** | Historial de seguimiento por caso |
| **entidades_gubernamentales** | Correos para notificación (Ley 1620) |

## Flujo del bot (Ley 1620 de 2013)

1. **Email** (obligatorio) - Para seguimiento y notificación
2. **Motivo del caso** (obligatorio) - Descripción de la situación
3. **Institución educativa** - Dónde ocurre
4. **Tipo de violencia** - Bullying, ciberacoso, etc.
5. **Frecuencia** - Con qué frecuencia ocurre

Al completar, el sistema:
- Genera un **radicado único** (ej: DUIT-20250314-0001)
- Guarda en Supabase (si está configurado)
- Envía correo al administrador
- Notifica a entidades: Alcaldía, Personería, Comisaría de Familia, Secretaría de Educación

## Correo electrónico (EmailJS - gratuito)

**Guía completa:** Ver [EMAILJS_SETUP.md](EMAILJS_SETUP.md)

Resumen: crea cuenta en [emailjs.com](https://www.emailjs.com), conecta Gmail/Outlook, crea una plantilla y pega tu Public Key en `index.html` (línea `emailjs.init(...)`).

## EmailJS - Plantilla para entidades

Para que los correos lleguen a las entidades, configura en EmailJS una plantilla que use:
- `{{to_email}}` - Correo destino
- `{{report_code}}` - Radicado
- `{{motivo_caso}}` - Motivo del reporte
- `{{answers}}` - Detalles completos

## Enrutamiento por tipo de caso

Las notificaciones se envían **solo a las entidades que atienden ese tipo de caso**:

| Tipo de caso | Entidades que reciben |
|--------------|------------------------|
| **Ciberviolencia** (redes, internet, WhatsApp, etc.) | Personería, ICBF, Secretaría Educación |
| **Violencia física/bullying** | Comisaría de Familia, ICBF, Alcaldía, Personería, Secretaría |
| **Violencia sexual** | ICBF, Comisaría de Familia, Personería |
| **Violencia verbal/psicológica** | Comisaría de Familia |
| **General** (no especificado) | Alcaldía, Personería, Secretaría Educación |

Configura `tipos_caso` en cada entidad en `config.js`:
- `['todos']` = recibe todos los casos
- `['ciberviolencia', 'bullying']` = solo esos tipos

## Entidades según Ley 1620

- **Art. 24**: ICBF - Casos que superan función del colegio
- **Art. 26**: Personería - Cuando el Comité no da solución (incl. ciberacoso)
- **Comisaría de Familia**: Violencia intrafamiliar, cuando padres no acuden
- **Secretaría de Educación**: Supervisión del Sistema de Convivencia

## Líneas de ayuda

- **141**: ICBF - Violencia, maltrato, acoso escolar
- **143**: Línea de vida
