import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, FileText, Scale, Activity, AlertCircle } from "lucide-react";
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
        updated_at: new Date().toISOString(),
      };

      if (prontuario.id) {
        // Atualizar prontuário existente
        const { error } = await supabase
          .from('prontuario_nutricional')
          .update(dataToSave)
          .eq('id', prontuario.id);

        if (error) throw error;

        // Salvar no histórico
        const { error: historyError } = await supabase
          .from('historico_prontuario_nutricional')
          .insert([{
            prontuario_id: prontuario.id,
            idoso_id: prontuario.idoso_id,
            peso_atual: prontuario.peso_atual,
            altura: prontuario.altura,
            imc: prontuario.imc,
            peso_usual: prontuario.peso_usual,
            aj: prontuario.aj,
            cb: prontuario.cb,
            cp: prontuario.cp,
            diagnostico: prontuario.diagnostico,
            mna_score: prontuario.mna_score,
            observacoes: prontuario.observacoes,
            evolucao_nutricional: prontuario.evolucao_nutricional,
            diagnostico_nutricional: prontuario.diagnostico_nutricional,
            conduta_dietetica: prontuario.conduta_dietetica,
            prescricao_dietetica: prontuario.prescricao_dietetica,
            triagem_a: prontuario.triagem_a,
            triagem_b: prontuario.triagem_b,
            triagem_c: prontuario.triagem_c,
            triagem_d: prontuario.triagem_d,
            triagem_e: prontuario.triagem_e,
            triagem_f1: prontuario.triagem_f1,
            triagem_cp: prontuario.triagem_cp,
            escore_triagem: prontuario.escore_triagem,
            status_nutricional: prontuario.status_nutricional
          }]);

        if (historyError) {
          console.error('Erro ao salvar histórico:', historyError);
          // Não lançamos erro aqui para não travar o salvamento principal, 
          // mas logamos o erro para depuração
        }
      } else {
        // Criar novo prontuário
        const { data: newProntuario, error } = await supabase
          .from('prontuario_nutricional')
          .insert([{ ...dataToSave, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) throw error;

        // Salvar primeiro registro no histórico
        if (newProntuario) {
          await supabase
            .from('historico_prontuario_nutricional')
            .insert([{
              prontuario_id: newProntuario.id,
              idoso_id: newProntuario.idoso_id,
              peso_atual: newProntuario.peso_atual,
              altura: newProntuario.altura,
              imc: newProntuario.imc,
              peso_usual: newProntuario.peso_usual,
              aj: newProntuario.aj,
              cb: newProntuario.cb,
              cp: newProntuario.cp,
              diagnostico: newProntuario.diagnostico,
              mna_score: newProntuario.mna_score,
              observacoes: newProntuario.observacoes,
              evolucao_nutricional: newProntuario.evolucao_nutricional,
              diagnostico_nutricional: newProntuario.diagnostico_nutricional,
              conduta_dietetica: newProntuario.conduta_dietetica,
              prescricao_dietetica: newProntuario.prescricao_dietetica,
              triagem_a: newProntuario.triagem_a,
              triagem_b: newProntuario.triagem_b,
              triagem_c: newProntuario.triagem_c,
              triagem_d: newProntuario.triagem_d,
              triagem_e: newProntuario.triagem_e,
              triagem_f1: newProntuario.triagem_f1,
              triagem_cp: newProntuario.triagem_cp,
              escore_triagem: newProntuario.escore_triagem,
              status_nutricional: newProntuario.status_nutricional
            }]);
        }
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
