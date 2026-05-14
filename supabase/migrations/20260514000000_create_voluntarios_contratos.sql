-- Voluntários (terceirizados) + contratos (PDF) via Supabase Storage

CREATE TABLE IF NOT EXISTS public.voluntarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voluntarios_nome ON public.voluntarios (nome);

CREATE TABLE IF NOT EXISTS public.contratos_voluntarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voluntario_id UUID NOT NULL REFERENCES public.voluntarios(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL DEFAULT 'application/pdf',
  tamanho_arquivo BIGINT,
  caminho_storage TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contratos_voluntarios_voluntario_id ON public.contratos_voluntarios (voluntario_id);
CREATE INDEX IF NOT EXISTS idx_contratos_voluntarios_created_at ON public.contratos_voluntarios (created_at);

ALTER TABLE public.voluntarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_voluntarios ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'voluntarios' AND policyname = 'voluntarios_select_authenticated'
    ) THEN
      CREATE POLICY voluntarios_select_authenticated ON public.voluntarios
        FOR SELECT TO authenticated
        USING (true);
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy voluntarios_select_authenticated: insufficient privileges';
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'voluntarios' AND policyname = 'voluntarios_insert_authenticated'
    ) THEN
      CREATE POLICY voluntarios_insert_authenticated ON public.voluntarios
        FOR INSERT TO authenticated
        WITH CHECK (true);
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy voluntarios_insert_authenticated: insufficient privileges';
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'voluntarios' AND policyname = 'voluntarios_update_authenticated'
    ) THEN
      CREATE POLICY voluntarios_update_authenticated ON public.voluntarios
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy voluntarios_update_authenticated: insufficient privileges';
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contratos_voluntarios' AND policyname = 'contratos_voluntarios_select_authenticated'
    ) THEN
      CREATE POLICY contratos_voluntarios_select_authenticated ON public.contratos_voluntarios
        FOR SELECT TO authenticated
        USING (true);
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy contratos_voluntarios_select_authenticated: insufficient privileges';
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contratos_voluntarios' AND policyname = 'contratos_voluntarios_insert_authenticated'
    ) THEN
      CREATE POLICY contratos_voluntarios_insert_authenticated ON public.contratos_voluntarios
        FOR INSERT TO authenticated
        WITH CHECK (true);
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy contratos_voluntarios_insert_authenticated: insufficient privileges';
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contratos_voluntarios' AND policyname = 'contratos_voluntarios_delete_authenticated'
    ) THEN
      CREATE POLICY contratos_voluntarios_delete_authenticated ON public.contratos_voluntarios
        FOR DELETE TO authenticated
        USING (true);
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy contratos_voluntarios_delete_authenticated: insufficient privileges';
  END;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contratos-voluntarios',
  'contratos-voluntarios',
  false,
  52428800,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'contratos_voluntarios_select_authenticated'
    ) THEN
      CREATE POLICY contratos_voluntarios_select_authenticated ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'contratos-voluntarios');
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy contratos_voluntarios_select_authenticated: insufficient privileges';
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'contratos_voluntarios_insert_authenticated'
    ) THEN
      CREATE POLICY contratos_voluntarios_insert_authenticated ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'contratos-voluntarios');
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy contratos_voluntarios_insert_authenticated: insufficient privileges';
  END;

  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'contratos_voluntarios_delete_authenticated'
    ) THEN
      CREATE POLICY contratos_voluntarios_delete_authenticated ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'contratos-voluntarios');
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy contratos_voluntarios_delete_authenticated: insufficient privileges';
  END;
END $$;

