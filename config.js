/**
 * CONFIGURACIÓN - Plataforma Anti-Violencia Escolar
 * 
 * Para usar Supabase:
 * 1. Crea un proyecto en https://supabase.com
 * 2. Ejecuta el SQL en supabase/migrations/001_initial_schema.sql
 * 3. Ve a Project Settings > API y copia las credenciales
 * 4. Reemplaza los valores abajo
 */

const CONFIG = {
    // Supabase - Deja null para desactivar (el bot funcionará sin BD, solo con correos)
    SUPABASE_URL: 'https://wcjvalkkhyddfxvhacai.supabase.co',  // 'https://TU_PROYECTO.supabase.co'
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjanZhbGtraHlkZGZ4dmhhY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDU2MzEsImV4cCI6MjA4OTA4MTYzMX0.V0Ujcm4rSIRYNKSdBnh-KNPQOFIO-Y2VmyYltqn3G-8',
    
    // Correo principal para recibir reportes y consultas de contacto
    EMAIL_DESTINO_PRINCIPAL: 'jlsc4443@gmail.com',
    
    // EmailJS - Obtén las credenciales en https://dashboard.emailjs.com/admin/account
    EMAILJS_PUBLIC_KEY: '0KQyO1q78qKuIjf81',  // Account > General > Public Key
    EMAILJS_SERVICE_ID: 'service_wcirvym',
    EMAILJS_TEMPLATE_REPORTE: 'template_mbh1q0k',
    
    // Plantilla EmailJS para formulario de contacto (opcional, usa template de reporte por defecto)
    // Crea en EmailJS una plantilla con: to_email, from_email, message, subject
    // EMAILJS_TEMPLATE_CONTACTO: 'template_contacto',
     GEMINI_API_KEY: 'AIzaSyAMLNMg4Muns3A9HGHOQHvhcExEXWJff0Y',
    // Entidades gubernamentales - Ley 1620 Art. 24, 26
    // tipos_caso: ['todos'] = recibe todos | específicos = solo esos casos
    ENTIDADES_NOTIFICACION: [
        { nombre: 'Alcaldía Duitama', email: 'contactenos@duitama-boyaca.gov.co', tipos_caso: ['todos'] },
        { nombre: 'Personería Duitama', email: 'personeria@duitama-boyaca.gov.co', tipos_caso: ['todos', 'ciberviolencia'] },
        { nombre: 'Comisaría de Familia', email: 'comisaria@duitama-boyaca.gov.co', tipos_caso: ['violencia_fisica', 'violencia_verbal', 'violencia_sexual', 'bullying'] },
        { nombre: 'Secretaría Educación Boyacá', email: 'convivencia@sedboyaca.gov.co', tipos_caso: ['todos'] },
        { nombre: 'ICBF / Línea 141', email: 'atencion@icbf.gov.co', tipos_caso: ['violencia_sexual', 'violencia_fisica', 'bullying', 'ciberviolencia'] }
    ]
};
