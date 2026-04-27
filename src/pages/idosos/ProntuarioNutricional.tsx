import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileText, User, Scale, Activity, Utensils, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Idoso } from "@/types";

interface ProntuarioNutricional {
  id?: string;
  idoso_id: string;
  peso_atual: number | null;
  altura: number | null;
  imc: number | null;
  peso_usual: number | null;
  aj: number | null;
  cb: number | null;
  cp: number | null;
  diagnostico: string;
  mna_score: number | null;
  lucido: string;
  comunica: string;
  audicao: string;
  caminha: string;
  mastiga: string;
  denticao: string;
  protese_adaptada: string;
  apetite: string;
  consistencia_alimentacao: string;
  aceitacao_alimentos: string;
  mastigacao: string;
  aceitacao_liquidos: string;
  restricao_liquidos: boolean;
  restricao_detalhes: string;
  aceita_carnes: string;
  preferencias_alimentares: string;
  recusa_alimentares: string;
  alergias_intolerancia: string;
  uso_suplemento: boolean;
  suplemento_detalhes: string;
  habito_intestinal: string;
  observacoes: string;
  evolucao_nutricional: string;
  diagnostico_nutricional: string;
  conduta_dietetica: string;
  prescricao_dietetica: string;
  triagem_a: number | null;
  triagem_b: number | null;
  triagem_c: number | null;
  triagem_d: number | null;
  triagem_e: number | null;
  triagem_f1: number | null;
  triagem_cp: number | null;
  escore_triagem: number | null;
  status_nutricional: string;
  created_at?: string;
  updated_at?: string;
}

export default function ProntuarioNutricional() {
  const { idosoId } = useParams<{ idosoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [idoso, setIdoso] = useState<Idoso | null>(null);
  const [imcManual, setImcManual] = useState(false);
  const [prontuario, setProntuario] = useState<ProntuarioNutricional>({
    idoso_id: idosoId || "",
    peso_atual: null,
    altura: null,
    imc: null,
    peso_usual: null,
    aj: null,
    cb: null,
    cp: null,
    diagnostico: "",
    mna_score: null,
    lucido: "",
    comunica: "",
    audicao: "",
    caminha: "",
    mastiga: "",
    denticao: "",
    protese_adaptada: "",
    apetite: "",
    consistencia_alimentacao: "",
    aceitacao_alimentos: "",
    mastigacao: "",
    aceitacao_liquidos: "",
    restricao_liquidos: false,
    restricao_detalhes: "",
    aceita_carnes: "",
    preferencias_alimentares: "",
    recusa_alimentares: "",
    alergias_intolerancia: "",
    uso_suplemento: false,
    suplemento_detalhes: "",
    habito_intestinal: "",
    observacoes: "",
    evolucao_nutricional: "",
    diagnostico_nutricional: "",
    conduta_dietetica: "",
    prescricao_dietetica: "",
    triagem_a: null,
    triagem_b: null,
    triagem_c: null,
    triagem_d: null,
    triagem_e: null,
    triagem_f1: null,
    triagem_cp: null,
    escore_triagem: null,
    status_nutricional: "",
  });

  useEffect(() => {
    if (idosoId) {
      fetchIdoso();
      fetchProntuario();
    }
  }, [idosoId]);

  useEffect(() => {
    if (!imcManual) {
      calculateIMC();
    }
  }, [prontuario.peso_atual, prontuario.altura, imcManual]);

  useEffect(() => {
    calculateTriagemScore();
  }, [prontuario.triagem_a, prontuario.triagem_b, prontuario.triagem_c, prontuario.triagem_d, prontuario.triagem_e, prontuario.triagem_f1]);

  const fetchIdoso = async () => {
    try {
      const { data, error } = await supabase
        .from('idosos')
        .select('*')
        .eq('id', idosoId)
        .single();

      if (error) throw error;
      setIdoso(data);
    } catch (error) {
      console.error('Erro ao carregar idoso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do idoso.",
        variant: "destructive",
      });
    }
  };

  const fetchProntuario = async () => {
    try {
      const { data, error } = await supabase
        .from('prontuario_nutricional')
        .select('*')
        .eq('idoso_id', idosoId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar prontuário:', error);
        return;
      }

      if (data) {
        setProntuario(data);
      }
    } catch (error) {
      console.error('Erro ao carregar prontuário:', error);
    }
  };

  const calculateIMC = () => {
    if (imcManual) return;
    if (prontuario.peso_atual && prontuario.altura) {
      const alturaMetros = prontuario.altura / 100;
      const imc = prontuario.peso_atual / (alturaMetros * alturaMetros);
      setProntuario(prev => ({ ...prev, imc: Math.round(imc * 100) / 100 }));
    }
  };

  const calculateTriagemScore = () => {
    const scores = [
      prontuario.triagem_a,
      prontuario.triagem_b,
      prontuario.triagem_c,
      prontuario.triagem_d,
      prontuario.triagem_e,
      prontuario.triagem_f1,
    ];

    const validScores = scores.filter(score => score !== null && score !== undefined);
    
    if (validScores.length === scores.length) {
      const total = validScores.reduce((sum, score) => sum + score, 0);
      let status = "";
      
      if (total >= 12) {
        status = "Estado nutricional normal";
      } else if (total >= 8) {
        status = "Sob risco de desnutrição";
      } else {
        status = "Desnutrido";
      }

      setProntuario(prev => ({ 
        ...prev, 
        escore_triagem: total,
        status_nutricional: status
      }));
    }
  };

  const handleInputChange = (field: keyof ProntuarioNutricional, value: any) => {
    setProntuario(prev => ({ ...prev, [field]: value }));
  };

  const handleDenticaoChange = (value: string, checked: boolean | string) => {
    // Checkbox onCheckedChange returns boolean | "indeterminate", we only care about boolean
    if (checked === "indeterminate") return;
    
    const currentValues = prontuario.denticao ? prontuario.denticao.split(',').filter(v => v !== '') : [];
    let newValues;
    
    if (checked) {
      if (!currentValues.includes(value)) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues;
      }
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    handleInputChange('denticao', newValues.join(','));
  };

  const isDenticaoSelected = (value: string) => {
    return prontuario.denticao ? prontuario.denticao.split(',').includes(value) : false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de campos numéricos para evitar overflow (numeric(6,2) = max 9999.99)
    const numericFields: (keyof ProntuarioNutricional)[] = [
      'peso_atual', 'altura', 'imc', 'peso_usual', 'aj', 'cb', 'cp', 
      'mna_score', 'escore_triagem', 
      'triagem_a', 'triagem_b', 'triagem_c', 'triagem_d', 'triagem_e', 'triagem_f1', 'triagem_cp'
    ];

    for (const field of numericFields) {
      const value = prontuario[field];
      if (typeof value === 'number' && value !== null) {
        if (value > 9999.99 || value < -9999.99) {
          toast({
            title: "Erro de validação",
            description: `O valor do campo "${field}" (${value}) é muito alto. Verifique se os dados estão corretos. No caso da altura, certifique-se de usar centímetros (ex: 170) e não metros (ex: 1.70).`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Sanitizar campos com CHECK constraints: converter string vazia para null
      const dataToSave = {
        ...prontuario,
        // Se não usa prótese ou não selecionado, enviar null
        protese_adaptada:
          (prontuario.denticao && (prontuario.denticao.includes('protese_sup') || prontuario.denticao.includes('protese_inf')))
            ? (prontuario.protese_adaptada || null)
            : null,
        // Campos com enum no banco: enviar null quando vazio
        mastigacao: prontuario.mastigacao || null,
        consistencia_alimentacao: prontuario.consistencia_alimentacao || null,
        aceitacao_alimentos: prontuario.aceitacao_alimentos || null,
        aceitacao_liquidos: prontuario.aceitacao_liquidos || null,
        habito_intestinal: prontuario.habito_intestinal || null,
        updated_at: new Date().toISOString(),
      };

      if (prontuario.id) {
        // Atualizar prontuário existente
        const { error } = await supabase
          .from('prontuario_nutricional')
          .update(dataToSave)
          .eq('id', prontuario.id);

        if (error) throw error;
      } else {
        // Criar novo prontuário
        const { error } = await supabase
          .from('prontuario_nutricional')
          .insert([{ ...dataToSave, created_at: new Date().toISOString() }]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Prontuário nutricional salvo com sucesso!",
      });

      navigate('/idosos');
    } catch (error) {
      console.error('Erro ao salvar prontuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o prontuário nutricional.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!idoso) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/idosos")}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Prontuário
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Paciente: <span className="font-semibold">{idoso.nome}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Antropométricos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Dados Antropométricos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="peso_atual">Peso atual (kg)</Label>
                <Input
                  id="peso_atual"
                  type="number"
                  step="0.1"
                  value={prontuario.peso_atual || ""}
                  onChange={(e) => handleInputChange('peso_atual', parseFloat(e.target.value) || null)}
                />
              </div>
              <div>
                <Label htmlFor="altura">Altura (cm)</Label>
                <Input
                  id="altura"
                  type="number"
                  step="0.1"
                  value={prontuario.altura || ""}
                  onChange={(e) => handleInputChange('altura', parseFloat(e.target.value) || null)}
                />
              </div>
              <div>
                <Label htmlFor="imc">IMC</Label>
                <Input
                  id="imc"
                  type="number"
                  step="0.01"
                  value={prontuario.imc || ""}
                  onChange={(e) => {
                    setImcManual(true);
                    handleInputChange('imc', parseFloat(e.target.value) || null);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="peso_usual">Peso Estimado (kg)</Label>
                <Input
                  id="peso_usual"
                  type="number"
                  step="0.1"
                  value={prontuario.peso_usual || ""}
                  onChange={(e) => handleInputChange('peso_usual', parseFloat(e.target.value) || null)}
                />
              </div>
              <div>
                <Label htmlFor="aj">A.J (cm)</Label>
                <Input
                  id="aj"
                  type="number"
                  step="0.1"
                  value={prontuario.aj || ""}
                  onChange={(e) => handleInputChange('aj', parseFloat(e.target.value) || null)}
                />
              </div>
              <div>
                <Label htmlFor="cb">CB (cm)</Label>
                <Input
                  id="cb"
                  type="number"
                  step="0.1"
                  value={prontuario.cb || ""}
                  onChange={(e) => handleInputChange('cb', parseFloat(e.target.value) || null)}
                />
              </div>
              <div>
                <Label htmlFor="cp">CP (cm)</Label>
                <Input
                  id="cp"
                  type="number"
                  step="0.1"
                  value={prontuario.cp || ""}
                  onChange={(e) => handleInputChange('cp', parseFloat(e.target.value) || null)}
                />
              </div>
              <div>
                <Label htmlFor="mna_score">MNA</Label>
                <Input
                  id="mna_score"
                  type="number"
                  value={prontuario.mna_score || ""}
                  onChange={(e) => handleInputChange('mna_score', parseInt(e.target.value) || null)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Diagnóstico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="diagnostico">Diagnóstico</Label>
                <Textarea
                  id="diagnostico"
                  value={prontuario.diagnostico}
                  onChange={(e) => handleInputChange('diagnostico', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Avaliação Cognitiva e Funcional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Avaliação Cognitiva e Funcional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Idoso é lúcido?</Label>
                <RadioGroup
                  value={prontuario.lucido}
                  onValueChange={(value) => handleInputChange('lucido', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="lucido-sim" />
                    <Label htmlFor="lucido-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="lucido-nao" />
                    <Label htmlFor="lucido-nao">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="as-vezes" id="lucido-as-vezes" />
                    <Label htmlFor="lucido-as-vezes">Às vezes</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Se comunica/expressa suas vontades:</Label>
                <RadioGroup
                  value={prontuario.comunica}
                  onValueChange={(value) => handleInputChange('comunica', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="comunica-sim" />
                    <Label htmlFor="comunica-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="comunica-nao" />
                    <Label htmlFor="comunica-nao">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="as-vezes" id="comunica-as-vezes" />
                    <Label htmlFor="comunica-as-vezes">Às vezes</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Tem audição normal?</Label>
                <RadioGroup
                  value={prontuario.audicao}
                  onValueChange={(value) => handleInputChange('audicao', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="audicao-sim" />
                    <Label htmlFor="audicao-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="audicao-nao" />
                    <Label htmlFor="audicao-nao">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aparelho" id="audicao-aparelho" />
                    <Label htmlFor="audicao-aparelho">Usa aparelho auditivo</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Pode caminhar?</Label>
                <RadioGroup
                  value={prontuario.caminha}
                  onValueChange={(value) => handleInputChange('caminha', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="caminha-sim" />
                    <Label htmlFor="caminha-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="caminha-nao" />
                    <Label htmlFor="caminha-nao">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auxilio" id="caminha-auxilio" />
                    <Label htmlFor="caminha-auxilio">Faz uso de bengala/andador/auxílio</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Dentição e Mastigação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Dentição e Mastigação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Mastiga bem?</Label>
                <RadioGroup
                  value={prontuario.mastiga}
                  onValueChange={(value) => handleInputChange('mastiga', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="mastiga-sim" />
                    <Label htmlFor="mastiga-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="mastiga-nao" />
                    <Label htmlFor="mastiga-nao">Não</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="as-vezes" id="mastiga-as-vezes" />
                    <Label htmlFor="mastiga-as-vezes">Às vezes</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Como é a dentição do idoso?</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="denticao-completa" 
                      checked={isDenticaoSelected('completa')}
                      onCheckedChange={(checked) => handleDenticaoChange('completa', checked)}
                    />
                    <Label htmlFor="denticao-completa">Completa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="denticao-protese-sup" 
                      checked={isDenticaoSelected('protese_sup')}
                      onCheckedChange={(checked) => handleDenticaoChange('protese_sup', checked)}
                    />
                    <Label htmlFor="denticao-protese-sup">Prótese superior</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="denticao-protese-inf" 
                      checked={isDenticaoSelected('protese_inf')}
                      onCheckedChange={(checked) => handleDenticaoChange('protese_inf', checked)}
                    />
                    <Label htmlFor="denticao-protese-inf">Prótese inferior</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="denticao-ausencia" 
                      checked={isDenticaoSelected('ausencia_dentes')}
                      onCheckedChange={(checked) => handleDenticaoChange('ausencia_dentes', checked)}
                    />
                    <Label htmlFor="denticao-ausencia">Ausência de dentes</Label>
                  </div>
                </div>
              </div>

              {(prontuario.denticao && (prontuario.denticao.includes('protese_sup') || prontuario.denticao.includes('protese_inf'))) && (
                <div>
                  <Label className="text-base font-medium">Se usa prótese, está bem adaptada?</Label>
                  <RadioGroup
                    value={prontuario.protese_adaptada}
                    onValueChange={(value) => handleInputChange('protese_adaptada', value)}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="protese-sim" />
                      <Label htmlFor="protese-sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="protese-nao" />
                      <Label htmlFor="protese-nao">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div>
                <Label className="text-base font-medium">Mastigação:</Label>
                <RadioGroup
                  value={prontuario.mastigacao}
                  onValueChange={(value) => handleInputChange('mastigacao', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="mastigacao-normal" />
                    <Label htmlFor="mastigacao-normal">Normal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rapida" id="mastigacao-rapida" />
                    <Label htmlFor="mastigacao-rapida">Rápida</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lenta" id="mastigacao-lenta" />
                    <Label htmlFor="mastigacao-lenta">Lenta</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Hábitos Alimentares */}
          <Card>
            <CardHeader>
              <CardTitle>Hábitos Alimentares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Como está o apetite?</Label>
                <RadioGroup
                  value={prontuario.apetite}
                  onValueChange={(value) => handleInputChange('apetite', value)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="preservado" id="apetite-preservado" />
                    <Label htmlFor="apetite-preservado">Preservado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="deficiente" id="apetite-deficiente" />
                    <Label htmlFor="apetite-deficiente">Deficiente</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Consistência da alimentação:</Label>
                <RadioGroup
                  value={prontuario.consistencia_alimentacao}
                  onValueChange={(value) => handleInputChange('consistencia_alimentacao', value)}
                  className="grid grid-cols-2 gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solida" id="consistencia-solida" />
                    <Label htmlFor="consistencia-solida">Sólida</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="branda" id="consistencia-branda" />
                    <Label htmlFor="consistencia-branda">Branda</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pastosa" id="consistencia-pastosa" />
                    <Label htmlFor="consistencia-pastosa">Pastosa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sonda" id="consistencia-sonda" />
                    <Label htmlFor="consistencia-sonda">Sonda</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Aceitação dos alimentos:</Label>
                <RadioGroup
                  value={prontuario.aceitacao_alimentos}
                  onValueChange={(value) => handleInputChange('aceitacao_alimentos', value)}
                  className="grid grid-cols-1 gap-2 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aceita-tudo" id="aceitacao-tudo" />
                    <Label htmlFor="aceitacao-tudo">Aceita tudo que se oferecer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aceita-metade" id="aceitacao-metade" />
                    <Label htmlFor="aceitacao-metade">Aceita a metade</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poucas-colheradas" id="aceitacao-poucas" />
                    <Label htmlFor="aceitacao-poucas">Aceita poucas colheradas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pede-repeticao" id="aceitacao-repeticao" />
                    <Label htmlFor="aceitacao-repeticao">Pede repetição</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Aceitação dos líquidos:</Label>
                <RadioGroup
                  value={prontuario.aceitacao_liquidos}
                  onValueChange={(value) => handleInputChange('aceitacao_liquidos', value)}
                  className="grid grid-cols-1 gap-2 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solicita-sede" id="liquidos-sede" />
                    <Label htmlFor="liquidos-sede">Solicita quando tem sede</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="aceita-oferecer" id="liquidos-aceita" />
                    <Label htmlFor="liquidos-aceita">Não solicita, mas aceita se oferecer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medicacao" id="liquidos-medicacao" />
                    <Label htmlFor="liquidos-medicacao">Bebe líquidos somente com medicação</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2-4-copos" id="liquidos-2-4" />
                    <Label htmlFor="liquidos-2-4">Bebe de 2 a 4 copos por dia</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mais-4-copos" id="liquidos-mais-4" />
                    <Label htmlFor="liquidos-mais-4">Bebe + de 4 copos</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Restrições e Preferências */}
          <Card>
            <CardHeader>
              <CardTitle>Restrições e Preferências Alimentares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restricao_liquidos"
                  checked={prontuario.restricao_liquidos}
                  onCheckedChange={(checked) => handleInputChange('restricao_liquidos', checked)}
                />
                <Label htmlFor="restricao_liquidos">Há alguma restrição de líquidos ou alimentos?</Label>
              </div>

              {prontuario.restricao_liquidos && (
                <div>
                  <Label htmlFor="restricao_detalhes">Quais restrições?</Label>
                  <Textarea
                    id="restricao_detalhes"
                    value={prontuario.restricao_detalhes}
                    onChange={(e) => handleInputChange('restricao_detalhes', e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="aceita_carnes">Aceita bem todos os tipos de carnes?</Label>
                <Textarea
                  id="aceita_carnes"
                  value={prontuario.aceita_carnes}
                  onChange={(e) => handleInputChange('aceita_carnes', e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="preferencias_alimentares">Quais alimentos tem preferência?</Label>
                <Textarea
                  id="preferencias_alimentares"
                  value={prontuario.preferencias_alimentares}
                  onChange={(e) => handleInputChange('preferencias_alimentares', e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="recusa_alimentares">E quais recusa?</Label>
                <Textarea
                  id="recusa_alimentares"
                  value={prontuario.recusa_alimentares}
                  onChange={(e) => handleInputChange('recusa_alimentares', e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="alergias_intolerancia">Alergias e intolerâncias?</Label>
                <Textarea
                  id="alergias_intolerancia"
                  value={prontuario.alergias_intolerancia}
                  onChange={(e) => handleInputChange('alergias_intolerancia', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Suplementação e Hábitos */}
          <Card>
            <CardHeader>
              <CardTitle>Hábitos Intestinais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="uso_suplemento"
                  checked={prontuario.uso_suplemento}
                  onCheckedChange={(checked) => handleInputChange('uso_suplemento', checked)}
                />
                <Label htmlFor="uso_suplemento">Faz uso de suplemento?</Label>
              </div>

              {prontuario.uso_suplemento && (
                <div>
                  <Label htmlFor="suplemento_detalhes">Quais suplementos?</Label>
                  <Textarea
                    id="suplemento_detalhes"
                    value={prontuario.suplemento_detalhes}
                    onChange={(e) => handleInputChange('suplemento_detalhes', e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <div>
                <Label className="text-base font-medium">Hábito intestinal:</Label>
                <RadioGroup
                  value={prontuario.habito_intestinal}
                  onValueChange={(value) => handleInputChange('habito_intestinal', value)}
                  className="grid grid-cols-2 gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="intestinal-normal" />
                    <Label htmlFor="intestinal-normal">Normal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="constipante" id="intestinal-constipante" />
                    <Label htmlFor="intestinal-constipante">Constipante</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="diarreico" id="intestinal-diarreico" />
                    <Label htmlFor="intestinal-diarreico">Diarreico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="variado" id="intestinal-variado" />
                    <Label htmlFor="intestinal-variado">Variado</Label>
                  </div>
                  <div className="flex items-center space-x-2 col-span-2">
                    <RadioGroupItem value="laxante" id="intestinal-laxante" />
                    <Label htmlFor="intestinal-laxante">Faz uso de laxante</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* TRIAGEM - Sistema de Pontuação MNA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                TRIAGEM - Mini Nutritional Assessment (MNA)
              </CardTitle>
              <CardDescription>
                Sistema de pontuação para avaliação do estado nutricional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">
                  A. Nos últimos três meses houve diminuição da ingesta alimentar devido à perda de apetite, problemas digestivos ou dificuldade para mastigar ou deglutir?
                </Label>
                <RadioGroup
                  value={prontuario.triagem_a?.toString() || ""}
                  onValueChange={(value) => handleInputChange('triagem_a', parseInt(value))}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="triagem-a-0" />
                    <Label htmlFor="triagem-a-0">0 = diminuição severa da ingesta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="triagem-a-1" />
                    <Label htmlFor="triagem-a-1">1 = diminuição moderada da ingesta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="triagem-a-2" />
                    <Label htmlFor="triagem-a-2">2 = sem diminuição da ingesta</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">B. Perda de peso nos últimos 3 meses</Label>
                <RadioGroup
                  value={prontuario.triagem_b?.toString() || ""}
                  onValueChange={(value) => handleInputChange('triagem_b', parseInt(value))}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="triagem-b-0" />
                    <Label htmlFor="triagem-b-0">0 = superior a três quilos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="triagem-b-1" />
                    <Label htmlFor="triagem-b-1">1 = não sabe informar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="triagem-b-2" />
                    <Label htmlFor="triagem-b-2">2 = entre um e três quilos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="triagem-b-3" />
                    <Label htmlFor="triagem-b-3">3 = sem perda de peso</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">C. Mobilidade</Label>
                <RadioGroup
                  value={prontuario.triagem_c?.toString() || ""}
                  onValueChange={(value) => handleInputChange('triagem_c', parseInt(value))}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="triagem-c-0" />
                    <Label htmlFor="triagem-c-0">0 = restrito ao leito ou à cadeira de rodas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="triagem-c-1" />
                    <Label htmlFor="triagem-c-1">1 = deambula mas não é capaz de sair de casa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="triagem-c-2" />
                    <Label htmlFor="triagem-c-2">2 = normal</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">D. Passou por algum estresse psicológico ou doença aguda nos últimos três meses?</Label>
                <RadioGroup
                  value={prontuario.triagem_d?.toString() || ""}
                  onValueChange={(value) => handleInputChange('triagem_d', parseInt(value))}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="triagem-d-0" />
                    <Label htmlFor="triagem-d-0">0 = sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="triagem-d-2" />
                    <Label htmlFor="triagem-d-2">2 = não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">E. Problemas neuropsicológicos</Label>
                <RadioGroup
                  value={prontuario.triagem_e?.toString() || ""}
                  onValueChange={(value) => handleInputChange('triagem_e', parseInt(value))}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="triagem-e-0" />
                    <Label htmlFor="triagem-e-0">0 = demência ou depressão graves</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="triagem-e-1" />
                    <Label htmlFor="triagem-e-1">1 = demência leve</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="triagem-e-2" />
                    <Label htmlFor="triagem-e-2">2 = sem problemas psicológicos</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">F1. Índice de Massa Corporal (IMC = peso [kg] / estatura [m²])</Label>
                <RadioGroup
                  value={prontuario.triagem_f1?.toString() || ""}
                  onValueChange={(value) => handleInputChange('triagem_f1', parseInt(value))}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="triagem-f1-0" />
                    <Label htmlFor="triagem-f1-0">0 = IMC &lt; 19</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="triagem-f1-1" />
                    <Label htmlFor="triagem-f1-1">1 = 19 ≤ IMC &lt; 21</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="triagem-f1-2" />
                    <Label htmlFor="triagem-f1-2">2 = 21 ≤ IMC &lt; 23</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="triagem-f1-3" />
                    <Label htmlFor="triagem-f1-3">3 = IMC ≥ 23</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Circunferência da Panturrilha (CP) em cm</Label>
                <RadioGroup
                  value={prontuario.triagem_cp?.toString() || ""}
                  onValueChange={(value) => handleInputChange('triagem_cp', parseInt(value))}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="triagem-cp-0" />
                    <Label htmlFor="triagem-cp-0">0 = CP menor que 31</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="triagem-cp-3" />
                    <Label htmlFor="triagem-cp-3">3 = CP maior ou igual a 31</Label>
                  </div>
                </RadioGroup>
              </div>

              {prontuario.escore_triagem !== null && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      Escore Total: {prontuario.escore_triagem}/14
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Interpretação:</strong></p>
                    <p>• 12-14 pontos: estado nutricional normal</p>
                    <p>• 8-11 pontos: sob risco de desnutrição</p>
                    <p>• 0-7 pontos: desnutrido</p>
                  </div>
                  {prontuario.status_nutricional && (
                    <div className="mt-2">
                      <Badge 
                        variant={
                          prontuario.status_nutricional === "Estado nutricional normal" ? "default" :
                          prontuario.status_nutricional === "Sob risco de desnutrição" ? "secondary" : "destructive"
                        }
                        className="text-sm"
                      >
                        {prontuario.status_nutricional}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações e Evolução */}
          <Card>
            <CardHeader>
              <CardTitle>Observações e Evolução Nutricional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="evolucao_nutricional">Evolução nutricional</Label>
                <Textarea
                  id="evolucao_nutricional"
                  value={prontuario.evolucao_nutricional}
                  onChange={(e) => handleInputChange('evolucao_nutricional', e.target.value)}
                  rows={6}
                  placeholder="Idoso(a) de __ anos, cadeirante ou deambula com auxílio, diagnosticado(a) com ___. Encontra-se em BEG (bom estado geral) / REG (regular estado geral), colaborativo(a) e respirando em ar ambiente..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/idosos')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Prontuário
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
