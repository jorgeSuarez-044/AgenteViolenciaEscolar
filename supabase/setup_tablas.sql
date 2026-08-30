-- =====================================================
-- SETUP RÁPIDO - Ejecuta este SQL en Supabase SQL Editor
-- Dashboard > SQL Editor > New query > Pegar y Run
-- =====================================================

-- 1. Tablas
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255),
    telefono VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS casos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    radicado VARCHAR(50) NOT NULL UNIQUE,
    email_usuario VARCHAR(255) NOT NULL,
    usuario_id UUID REFERENCES usuarios(id),
    motivo_caso TEXT NOT NULL,
    tipo_violencia VARCHAR(100),
    institucion_educativa VARCHAR(255),
    descripcion_detallada TEXT,
    frecuencia VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'registrado',
    componente_ruta VARCHAR(50) DEFAULT 'atencion',
    entidades_notificadas JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_casos_radicado ON casos(radicado);
CREATE INDEX IF NOT EXISTS idx_casos_email ON casos(email_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 2. RLS - Permitir inserciones públicas (para el bot)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen (evita error "already exists")
DROP POLICY IF EXISTS "Permitir inserción de usuarios" ON usuarios;
DROP POLICY IF EXISTS "Lectura usuarios" ON usuarios;
DROP POLICY IF EXISTS "Permitir inserción de casos" ON casos;
DROP POLICY IF EXISTS "Lectura casos" ON casos;
DROP POLICY IF EXISTS "Actualizar casos" ON casos;

-- Crear políticas permisivas
CREATE POLICY "Permitir inserción de usuarios" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura usuarios" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Permitir inserción de casos" ON casos FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura casos" ON casos FOR SELECT USING (true);
CREATE POLICY "Actualizar casos" ON casos FOR UPDATE USING (true) WITH CHECK (true);

-- Listo. Prueba el bot nuevamente.
