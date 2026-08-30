/**
 * CONFIGURACIÓN - Plataforma Anti-Violencia Escolar
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo y renómbralo a: config.js
 * 2. Supabase: crea proyecto en https://supabase.com > Project Settings > API
 * 3. EmailJS: ver guía en EMAILJS_SETUP.md (gratis, 200 correos/mes)
 * 4. Reemplaza los valores placeholder con tus credenciales reales
 */

const CONFIG = {
    // Supabase - Obtén estas credenciales en: https://supabase.com/dashboard/project/_/settings/api
    SUPABASE_URL: 'https://TU_PROYECTO.supabase.co',
    SUPABASE_ANON_KEY: 'tu_anon_key_aqui',
    
    // EmailJS - Ver EMAILJS_SETUP.md. Obtén credenciales en https://dashboard.emailjs.com/admin/account
    EMAILJS_PUBLIC_KEY: 'tu_public_key_aqui',  // Account > General > Public Key (obligatorio)
    EMAILJS_SERVICE_ID: 'service_xxx',
    EMAILJS_TEMPLATE_REPORTE: 'template_reporte_violencia',
    
    // Correo donde recibirás reportes y consultas
    EMAIL_DESTINO_PRINCIPAL: 'tu_correo@gmail.com',
    
    // Entidades - tipos_caso: ['todos'] recibe todo | específicos = solo esos casos
    ENTIDADES_NOTIFICACION: [
        { nombre: 'Alcaldía Duitama', email: 'contactenos@duitama-boyaca.gov.co', tipos_caso: ['todos'] },
        { nombre: 'Personería Duitama', email: 'personeria@duitama-boyaca.gov.co', tipos_caso: ['todos', 'ciberviolencia'] },
        { nombre: 'Comisaría de Familia', email: 'comisaria@duitama-boyaca.gov.co', tipos_caso: ['violencia_fisica', 'violencia_verbal', 'violencia_sexual', 'bullying'] },
        { nombre: 'Secretaría Educación Boyacá', email: 'convivencia@sedboyaca.gov.co', tipos_caso: ['todos'] },
        { nombre: 'ICBF', email: 'atencion@icbf.gov.co', tipos_caso: ['violencia_sexual', 'violencia_fisica', 'bullying', 'ciberviolencia'] }
    ]
};
