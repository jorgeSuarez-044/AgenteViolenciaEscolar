-- =====================================================
-- ESQUEMA DE BASE DE DATOS - PLATAFORMA ANTI-VIOLENCIA ESCOLAR
-- Ley 1620 de 2013 - Sistema Nacional de Convivencia Escolar
-- Decreto 1965 de 2013 - Ruta de Atención Integral
-- =====================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: usuarios
-- Almacena datos de estudiantes/usuarios que reportan
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255),
    telefono VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por email
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- =====================================================
-- TABLA: casos
-- Casos de violencia escolar con radicado único
-- Según Art. 28 Ley 1620 - Sistema de Información Unificado
-- =====================================================
CREATE TABLE IF NOT EXISTS casos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radicado VARCHAR(50) NOT NULL UNIQUE,
    email_usuario VARCHAR(255) NOT NULL,
    usuario_id UUID REFERENCES usuarios(id),
    
    -- Motivo y clasificación del caso (Art. 31 - Protocolos)
    motivo_caso TEXT NOT NULL,
    tipo_violencia VARCHAR(100), -- bullying, ciberacoso, violencia_fisica, violencia_verbal, violencia_sexual, etc.
    
    -- Datos del reporte
    institucion_educativa VARCHAR(255),
    descripcion_detallada TEXT,
    frecuencia VARCHAR(100),
    personas_involucradas TEXT,
    
    -- Ruta de atención (Art. 30 Ley 1620)
    -- 1. Promoción 2. Prevención 3. Atención 4. Seguimiento
    estado VARCHAR(50) DEFAULT 'registrado', -- registrado, en_atencion, escalado, cerrado
    componente_ruta VARCHAR(50) DEFAULT 'atencion', -- promocion, prevencion, atencion, seguimiento
    
    -- Entidades notificadas (ICBF, Comisaría Familia, Personería)
    entidades_notificadas JSONB DEFAULT '[]',
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cerrado_at TIMESTAMPTZ
);

-- Índices para consultas frecuentes
CREATE INDEX idx_casos_radicado ON casos(radicado);
CREATE INDEX idx_casos_email ON casos(email_usuario);
CREATE INDEX idx_casos_estado ON casos(estado);
CREATE INDEX idx_casos_created ON casos(created_at DESC);

-- =====================================================
-- TABLA: seguimiento
-- Historial de seguimiento del caso (Art. 30 - Componente Seguimiento)
-- =====================================================
CREATE TABLE IF NOT EXISTS seguimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    descripcion TEXT NOT NULL,
    entidad_responsable VARCHAR(255),
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seguimiento_caso ON seguimiento(caso_id);

-- =====================================================
-- TABLA: entidades_gubernamentales
-- Correos de entidades para notificación automática
-- =====================================================
CREATE TABLE IF NOT EXISTS entidades_gubernamentales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    tipo VARCHAR(100), -- personeria, comisaria_familia, icbf, secretaria_educacion, alcaldia
    municipio VARCHAR(100) DEFAULT 'Duitama',
    departamento VARCHAR(100) DEFAULT 'Boyacá',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar entidades por defecto (Duitama/Boyacá) - Ley 1620 Art. 24, 26
-- Ejecutar manualmente si la tabla está vacía
INSERT INTO entidades_gubernamentales (nombre, email, tipo, municipio, departamento) VALUES
('Alcaldía Municipal Duitama', 'contactenos@duitama-boyaca.gov.co', 'alcaldia', 'Duitama', 'Boyacá'),
('Personería Municipal Duitama', 'personeria@duitama-boyaca.gov.co', 'personeria', 'Duitama', 'Boyacá'),
('Comisaría de Familia Duitama', 'comisaria@duitama-boyaca.gov.co', 'comisaria_familia', 'Duitama', 'Boyacá'),
('Secretaría Educación Boyacá', 'convivencia@sedboyaca.gov.co', 'secretaria_educacion', 'Tunja', 'Boyacá');

-- =====================================================
-- FUNCIÓN: Generar radicado único
-- Formato: DUIT-YYYYMMDD-XXXX (Duitama + fecha + secuencia)
-- =====================================================
CREATE OR REPLACE FUNCTION generar_radicado()
RETURNS VARCHAR(50) AS $$
DECLARE
    fecha_part VARCHAR(8);
    secuencia INT;
    nuevo_radicado VARCHAR(50);
BEGIN
    fecha_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(radicado FROM 14 FOR 4) AS INT)
    ), 0) + 1 INTO secuencia
    FROM casos
    WHERE radicado LIKE 'DUIT-' || fecha_part || '-%';
    
    nuevo_radicado := 'DUIT-' || fecha_part || '-' || LPAD(secuencia::TEXT, 4, '0');
    RETURN nuevo_radicado;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Para producción: permitir inserción pública de casos
-- =====================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE entidades_gubernamentales ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede insertar usuarios (reportes)
CREATE POLICY "Permitir inserción de usuarios" ON usuarios
    FOR INSERT WITH CHECK (true);

-- Política: Lectura de usuarios (para verificar existencia al crear caso)
CREATE POLICY "Lectura usuarios" ON usuarios
    FOR SELECT USING (true);

-- Política: Cualquiera puede insertar casos
CREATE POLICY "Permitir inserción de casos" ON casos
    FOR INSERT WITH CHECK (true);

-- Política: Lectura de casos (para consultas y seguimiento)
CREATE POLICY "Lectura casos" ON casos
    FOR SELECT USING (true);

-- Política: Permitir actualización de casos (para completar datos del formulario)
CREATE POLICY "Actualizar casos" ON casos
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política: Lectura de entidades (solo para notificación)
CREATE POLICY "Lectura entidades" ON entidades_gubernamentales
    FOR SELECT USING (activo = true);

-- Política: Inserción de seguimiento (admin/backend)
CREATE POLICY "Inserción seguimiento" ON seguimiento
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- TRIGGER: Actualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER casos_updated_at
    BEFORE UPDATE ON casos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
