-- Criar tabela de histórico de prontuários nutricionais
CREATE TABLE IF NOT EXISTS public.historico_prontuario_nutricional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prontuario_id UUID REFERENCES public.prontuario_nutricional(id) ON DELETE CASCADE,
    idoso_id UUID REFERENCES public.idosos(id) ON DELETE CASCADE,
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Dados Antropométricos
    peso_atual NUMERIC(6,2),
    altura NUMERIC(6,2),
    imc NUMERIC(6,2),
    peso_usual NUMERIC(6,2),
    aj NUMERIC(6,2),
    cb NUMERIC(6,2),
    cp NUMERIC(6,2),
    
    -- Diagnóstico e Avaliação
    diagnostico TEXT,
    mna_score INTEGER,
    observacoes TEXT,
    evolucao_nutricional TEXT,
    diagnostico_nutricional TEXT,
    conduta_dietetica TEXT,
    prescricao_dietetica TEXT,
    
    -- Triagem MNA
    triagem_a INTEGER,
    triagem_b INTEGER,
    triagem_c INTEGER,
    triagem_d INTEGER,
    triagem_e INTEGER,
    triagem_f1 INTEGER,
    triagem_cp INTEGER,
    escore_triagem INTEGER,
    status_nutricional TEXT,
    
    -- Metadados
    criado_por UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.historico_prontuario_nutricional ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Permitir leitura para usuários autenticados" ON public.historico_prontuario_nutricional
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção para usuários autenticados" ON public.historico_prontuario_nutricional
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Criar índice para busca rápida por idoso
CREATE INDEX IF NOT EXISTS idx_historico_nutricional_idoso ON public.historico_prontuario_nutricional(idoso_id);
CREATE INDEX IF NOT EXISTS idx_historico_nutricional_data ON public.historico_prontuario_nutricional(data_registro DESC);
