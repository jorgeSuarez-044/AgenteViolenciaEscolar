-- 1. Tabla de administradores
CREATE TABLE public.administradores (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    usuario character varying NOT NULL UNIQUE,
    password_hash character varying NOT NULL, 
    -- NOTA: Se recomienda en producción usar Supabase Auth, pero para este esquema personalizado usaremos texto plano o hash simple a nivel app.
    nombre character varying,
    rol character varying DEFAULT 'admin',
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT administradores_pkey PRIMARY KEY (id)
);

-- 2. Asegúrate de habilitar RLS si necesitas seguridad o déjalo público para el prototipo
-- ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

-- 3. Insertamos un administrador por defecto (usuario: admin, password: admin123)
-- El hash o texto plano depende de cómo configures tu admin.js
INSERT INTO public.administradores (usuario, password_hash, nombre) 
VALUES ('admin', 'admin123', 'Administrador Principal');
