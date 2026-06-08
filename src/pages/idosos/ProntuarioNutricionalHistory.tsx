import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Calendar, User, History, Download, Activity, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Idoso } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface HistoricoNutricional {
  id: string;
  prontuario_id: string;
  idoso_id: string;
  data_registro: string;
  peso_atual: number | null;
  altura: number | null;
  imc: number | null;
  peso_usual: number | null;
  aj: number | null;
  cb: number | null;
  cp: number | null;
  diagnostico: string | null;
  mna_score: number | null;
  observacoes: string | null;
  evolucao_nutricional: string | null;
  diagnostico_nutricional: string | null;
  conduta_dietetica: string | null;
  prescricao_dietetica: string | null;
  escore_triagem: number | null;
  status_nutricional: string | null;
  idoso?: {
    nome: string;
    data_nascimento: string;
    quarto: string;
  };
}

export default function ProntuarioNutricionalHistory() {
  const { idosoId } = useParams<{ idosoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<HistoricoNutricional[]>([]);
  const [idoso, setIdoso] = useState<Idoso | null>(null);

  useEffect(() => {
    if (idosoId) {
      fetchIdoso();
      fetchHistorico();
    }
  }, [idosoId]);

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
      console.error('Erro ao buscar idoso:', error);
    }
  };

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('historico_prontuario_nutricional')
        .select(`
          *,
          idoso:idosos(nome, data_nascimento, quarto)
        `)
        .eq('idoso_id', idosoId)
        .order('data_registro', { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return "secondary";
    if (status.includes("normal")) return "default";
    if (status.includes("risco")) return "secondary";
    return "destructive";
  };

  const generatePDF = (registro: HistoricoNutricional) => {
    if (!idoso) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Título e Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Histórico de Prontuário Nutricional", pageWidth / 2, 20, { align: "center" });
    
    // Cabeçalho Institucional
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text("Crevin - Comunidade de Renovação Esperança e Vida Nova", pageWidth / 2, 30, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Registro de: ${formatDate(registro.data_registro)}`, pageWidth / 2, 40, { align: "center" });

    // Helper functions
    const fmt = (val: any) => val === null || val === undefined || val === '' ? '-' : val;

    let currentY = 50;

    // 1. Informações do Idoso
    autoTable(doc, {
      startY: currentY,
      head: [['Informações do Idoso', '']],
      body: [
        ['Nome', idoso.nome],
        ['Data de Nascimento', new Date(idoso.data_nascimento).toLocaleDateString('pt-BR')],
        ['Quarto', idoso.quarto || '-'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66], halign: 'center' },
      columnStyles: { 0: { fontStyle: 'bold', width: 60 } },
      styles: { fontSize: 10, cellPadding: 2 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 2. Dados Antropométricos
    autoTable(doc, {
      startY: currentY,
      head: [['Dados Antropométricos', 'Valor']],
      body: [
        ['Peso Atual (kg)', fmt(registro.peso_atual)],
        ['Altura (cm)', fmt(registro.altura)],
        ['IMC', fmt(registro.imc)],
        ['Peso Estimado (kg)', fmt(registro.peso_usual)],
        ['A.J (cm)', fmt(registro.aj)],
        ['CB (cm)', fmt(registro.cb)],
        ['CP (cm)', fmt(registro.cp)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80] },
      columnStyles: { 0: { fontStyle: 'bold', width: 60 } },
      styles: { fontSize: 10, cellPadding: 2 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 3. Avaliação e Evolução
    autoTable(doc, {
      startY: currentY,
      head: [['Avaliação', 'Descrição']],
      body: [
        ['Escore MNA', `${fmt(registro.escore_triagem)}/14`],
        ['Status Nutricional', fmt(registro.status_nutricional)],
        ['Diagnóstico', fmt(registro.diagnostico)],
        ['Evolução Nutricional', fmt(registro.evolucao_nutricional)],
        ['Observações', fmt(registro.observacoes)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80] },
      columnStyles: { 0: { fontStyle: 'bold', width: 60 } },
      styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' }
    });

    doc.save(`historico_nutricional_${idoso.nome.replace(/\s+/g, '_').toLowerCase()}_${registro.data_registro.split('T')[0]}.pdf`);
  };

  if (loading) {
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
            onClick={() => navigate(-1)}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <History className="h-8 w-8" />
              Histórico Nutricional
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Histórico de prontuários de <span className="font-semibold">{idoso?.nome}</span>
            </p>
          </div>
        </div>

        {historico.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum histórico encontrado</h3>
              <p className="text-muted-foreground">
                Este idoso ainda não possui registros de atualizações no prontuário nutricional.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {historico.map((registro) => (
              <Card key={registro.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Calendar className="h-4 w-4" />
                      {formatDate(registro.data_registro)}
                    </div>
                    <div className="flex items-center gap-2">
                      {registro.status_nutricional && (
                        <Badge variant={getStatusBadgeVariant(registro.status_nutricional)}>
                          {registro.status_nutricional}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePDF(registro)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium border-b pb-1">
                      <Scale className="h-4 w-4" />
                      Dados Antropométricos
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Peso:</span>
                      <span>{registro.peso_atual ? `${registro.peso_atual} kg` : '-'}</span>
                      <span className="text-muted-foreground">Altura:</span>
                      <span>{registro.altura ? `${registro.altura} cm` : '-'}</span>
                      <span className="text-muted-foreground">IMC:</span>
                      <span>{registro.imc || '-'}</span>
                      <span className="text-muted-foreground">MNA Score:</span>
                      <span>{registro.escore_triagem ? `${registro.escore_triagem}/14` : '-'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium border-b pb-1">
                      <Activity className="h-4 w-4" />
                      Evolução e Diagnóstico
                    </div>
                    <div className="space-y-2">
                      {registro.evolucao_nutricional ? (
                        <p className="text-sm line-clamp-3 italic text-muted-foreground">
                          "{registro.evolucao_nutricional}"
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma evolução registrada.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
