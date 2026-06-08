import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Search, User, Calendar, Activity, Download, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Idoso } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProntuarioNutricionalListItem {
  id: string;
  idoso_id: string;
  created_at: string;
  updated_at: string;
  // Antropometria
  peso_atual: number | null;
  altura: number | null;
  imc: number | null;
  peso_usual: number | null;
  aj: number | null;
  cb: number | null;
  cp: number | null;
  // Estado Geral
  lucido: string | null;
  comunica: string | null;
  audicao: string | null;
  caminha: string | null;
  // Alimentação
  mastiga: string | null;
  denticao: string | null;
  protese_adaptada: string | null;
  apetite: string | null;
  consistencia_alimentacao: string | null;
  aceitacao_alimentos: string | null;
  mastigacao: string | null;
  // Hidratação
  aceitacao_liquidos: string | null;
  restricao_liquidos: boolean | null;
  restricao_detalhes: string | null;
  // Preferências
  aceita_carnes: string | null;
  preferencias_alimentares: string | null;
  recusa_alimentares: string | null;
  alergias_intolerancia: string | null;
  // Suplementação
  uso_suplemento: boolean | null;
  suplemento_detalhes: string | null;
  // Outros
  habito_intestinal: string | null;
  observacoes: string | null;
  evolucao_nutricional: string | null;
  conduta_dietetica: string | null;
  prescricao_dietetica: string | null;
  diagnostico: string | null;
  // Triagem
  mna_score: number | null;
  escore_triagem: number | null;
  status_nutricional: string;
  diagnostico_nutricional: string;
  triagem_a: number | null;
  triagem_b: number | null;
  triagem_c: number | null;
  triagem_d: number | null;
  triagem_e: number | null;
  triagem_f1: number | null;
  triagem_cp: number | null;
  idoso: {
    nome: string;
    data_nascimento: string;
    quarto: string;
  };
}

export default function ProntuarioNutricionalList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [prontuarios, setProntuarios] = useState<ProntuarioNutricionalListItem[]>([]);

  useEffect(() => {
    fetchProntuarios();
  }, []);

  const fetchProntuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prontuario_nutricional')
        .select(`
          *,
          idoso:idosos!inner(
            nome,
            data_nascimento,
            quarto
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar prontuários:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os prontuários nutricionais.",
          variant: "destructive",
        });
        return;
      }

      setProntuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar prontuários:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProntuarios = prontuarios.filter(prontuario =>
    prontuario.idoso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prontuario.idoso.quarto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    if (!status) return "secondary";
    if (status.includes("normal")) return "default";
    if (status.includes("risco")) return "secondary";
    return "destructive";
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const generatePDF = (prontuario: ProntuarioNutricionalListItem) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Título e Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Prontuário Nutricional", pageWidth / 2, 20, { align: "center" });
    
    // Cabeçalho Institucional
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text("Crevin", pageWidth / 2, 30, { align: "center" });
    doc.text("Comunidade de Renovacao Esperanca e Vida Nova", pageWidth / 2, 36, { align: "center" });
    doc.text("01.600.253/0001-69", pageWidth / 2, 42, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 50, { align: "center" });

    // Helper functions
    const fmt = (val: any) => val === null || val === undefined || val === '' ? '-' : val;
    const boolFmt = (val: boolean | null) => val === true ? 'Sim' : (val === false ? 'Não' : '-');

    let currentY = 58;

    // 1. Informações do Idoso
    autoTable(doc, {
      startY: currentY,
      head: [['Informações do Idoso', '']],
      body: [
        ['Nome', prontuario.idoso.nome],
        ['Idade', `${calculateAge(prontuario.idoso.data_nascimento)} anos`],
        ['Data de Nascimento', formatDate(prontuario.idoso.data_nascimento)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66], halign: 'center' },
      columnStyles: { 0: { fontStyle: 'bold', width: 60 } },
      styles: { fontSize: 10, cellPadding: 2 }
    });

    const afterInfoY = (doc as any).lastAutoTable.finalY + 10;

    const longTextData = [
      ['Evolução Nutricional', fmt(prontuario.evolucao_nutricional)],
    ];

    autoTable(doc, {
      startY: afterInfoY,
      head: [['Evolução Nutricional', 'Descrição']],
      body: longTextData,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], halign: 'left' },
      columnStyles: { 0: { fontStyle: 'bold', width: 60 } },
      styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' }
    });

    // Assinatura do Responsável Técnico
    const finalY = (doc as any).lastAutoTable.finalY;
    const pageHeight = doc.internal.pageSize.height;
    
    // Verificar se há espaço para assinatura (aprox 60 unidades necessárias antes da área do rodapé)
    // Rodapé começa por volta de pageHeight - 40
    if (pageHeight - finalY < 70) {
      doc.addPage();
      currentY = 50; // Reset Y para nova página
    } else {
      currentY = finalY + 40; // Adicionar espaçamento
    }

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(pageWidth / 2 - 50, currentY, pageWidth / 2 + 50, currentY); // Linha para assinatura
    
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text("Nutricionista Responsável Técnico", pageWidth / 2, currentY + 5, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Carimbo / Assinatura", pageWidth / 2, currentY + 10, { align: "center" });

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      
      // Adicionar endereço apenas na última página
      if (i === pageCount) {
        const footerText = "Crevin - Lar do Idoso Comunidade de Renovacao Esperanca e Vida Nova Avenida Floriano Peixoto Quadra 63 Lote 12 Setor Tradicional Planaltina Brasília DF 73330-083";
        const splitFooter = doc.splitTextToSize(footerText, pageWidth - 28);
        
        // Ajustar posição Y baseado no tamanho do texto
        const footerHeight = splitFooter.length * 4; // Aproximadamente 4 pontos por linha
        doc.text(splitFooter, pageWidth / 2, doc.internal.pageSize.height - 15 - footerHeight, { align: "center" });
      }
      
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: "center" });
    }

    doc.save(`prontuario_${prontuario.idoso.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Prontuários Nutricionais
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie os prontuários nutricionais dos idosos
            </p>
          </div>
          <Button
            onClick={() => navigate("/idosos")}
            className="w-fit"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Prontuário
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome do idoso ou quarto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Prontuários</p>
                  <p className="text-2xl font-bold">{prontuarios.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Estado Normal</p>
                  <p className="text-2xl font-bold">
                    {prontuarios.filter(p => p.status_nutricional?.includes("normal")).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Em Risco</p>
                  <p className="text-2xl font-bold">
                    {prontuarios.filter(p => p.status_nutricional?.includes("risco")).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prontuários List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProntuarios.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum prontuário encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Não há prontuários que correspondam à sua busca."
                    : "Ainda não há prontuários nutricionais cadastrados."
                  }
                </p>
                <Button onClick={() => navigate("/idosos")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Prontuário
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredProntuarios.map((prontuario) => (
              <Card key={prontuario.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{prontuario.idoso.nome}</CardTitle>
                        <CardDescription>
                          {calculateAge(prontuario.idoso.data_nascimento)} anos
                          {prontuario.idoso.quarto && ` • Quarto ${prontuario.idoso.quarto}`}
                        </CardDescription>
                      </div>
                    </div>
                    {prontuario.status_nutricional && (
                      <Badge variant={getStatusBadgeVariant(prontuario.status_nutricional)}>
                        {prontuario.status_nutricional}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {prontuario.mna_score !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>Score MNA: {prontuario.mna_score}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Atualizado em {formatDate(prontuario.updated_at)}</span>
                    </div>
                    {prontuario.diagnostico_nutricional && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {prontuario.diagnostico_nutricional}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/idosos/${prontuario.idoso_id}/prontuario-nutricional`)}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Prontuário
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/idosos/${prontuario.idoso_id}/historico-nutricional`)}
                      className="w-full"
                    >
                      <History className="h-4 w-4 mr-2" />
                      Ver Histórico
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        generatePDF(prontuario);
                      }}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
