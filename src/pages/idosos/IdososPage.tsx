import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, Edit, Trash2, Users, Calendar, Phone, MapPin, Clock, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddIdosoModal } from "@/components/idosos/AddIdosoModal";
import { EditIdosoModal } from "@/components/idosos/EditIdosoModal";
import { DeleteIdosoModal } from "@/components/idosos/DeleteIdosoModal";
import { formatCPF, formatPhone, parseISOToLocalDate, calculateAge } from "@/lib/utils";
import { Idoso } from "@/types";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function IdososPage() {
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIdoso, setSelectedIdoso] = useState<Idoso | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchIdosos = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('idosos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      setIdosos(data || []);
    } catch (error) {
      console.error('Erro ao carregar idosos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os idosos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIdosos();
  }, [fetchIdosos]);

  const filteredIdosos = useMemo(() => {
    const termText = searchTerm.trim().toLowerCase();
    const termDigits = searchTerm.replace(/\D/g, "");

    if (!termText && !termDigits) return idosos;

    return idosos.filter((idoso) => {
      const nomeMatches = idoso.nome.toLowerCase().includes(termText);
      const cpfDigits = (idoso.cpf ?? "").replace(/\D/g, "");
      const telefoneDigits = (idoso.telefone ?? "").replace(/\D/g, "");

      const cpfMatches = termDigits.length > 0 && cpfDigits.includes(termDigits);
      const telefoneMatches = termDigits.length > 0 && telefoneDigits.includes(termDigits);

      return nomeMatches || cpfMatches || telefoneMatches;
    });
  }, [searchTerm, idosos]);

  const handleEdit = (idoso: Idoso) => {
    setSelectedIdoso(idoso);
    setShowEditModal(true);
  };

  const handleDelete = (idoso: Idoso) => {
    setSelectedIdoso(idoso);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedIdoso(null);
    fetchIdosos();
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Cabeçalho Institucional
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Crevin", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text("Comunidade de Renovacao Esperanca e Vida Nova", pageWidth / 2, 30, { align: "center" });
    doc.text("01.600.253/0001-69", pageWidth / 2, 36, { align: "center" });

    // Título do Relatório
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Lista de Idosos", pageWidth / 2, 50, { align: "center" });

    // Data de geração
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 58, { align: "center" });

    const tableData = filteredIdosos.map((idoso) => {
      const dataNasc = parseISOToLocalDate(idoso.data_nascimento);
      return [
        idoso.nome,
        formatCPF(idoso.cpf),
        dataNasc ? dataNasc.toLocaleDateString('pt-BR') : '-',
        calculateAge(idoso.data_nascimento).toString(),
        idoso.telefone ? formatPhone(idoso.telefone) : '-',
        idoso.ativo ? 'Ativo' : 'Inativo'
      ];
    });

    autoTable(doc, {
      startY: 65,
      head: [['Nome', 'CPF', 'Data Nasc.', 'Idade', 'Telefone', 'Status']],
      body: tableData,
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 },
    });

    doc.save("lista-idosos.pdf");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case 'inativo':
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case 'transferido':
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case 'falecido':
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Idosos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie o cadastro dos idosos atendidos pela instituição
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => navigate('/idosos/lista-espera')} 
            variant="outline" 
            className="w-full sm:w-auto"
          >
            <Clock className="h-4 w-4 mr-2" />
            Lista de Espera
          </Button>
          <Button 
            onClick={handleGeneratePDF} 
            variant="outline" 
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Idoso
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Idosos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{idosos.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idosos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {idosos.filter(i => i.ativo).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idosos Inativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {idosos.filter(i => !i.ativo).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idade Média</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {idosos.length > 0 
                ? Math.round(idosos.reduce((acc, idoso) => acc + calculateAge(idoso.data_nascimento), 0) / idosos.length)
                : 0
              } anos
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Idosos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os idosos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[120px]">CPF</TableHead>
                  <TableHead className="min-w-[80px]">Idade</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[120px]">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[150px]">Quarto/Ala</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdosos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum idoso encontrado." : "Nenhum idoso cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIdosos.map((idoso) => (
                    <TableRow key={idoso.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{idoso.nome}</span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {formatCPF(idoso.cpf)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatCPF(idoso.cpf)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{calculateAge(idoso.data_nascimento)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {idoso.telefone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {formatPhone(idoso.telefone)}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {idoso.endereco ? (
                          <div className="flex items-center gap-1 max-w-[200px]">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">
                              {idoso.endereco}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(idoso.ativo ? 'ativo' : 'inativo')}>
                          {idoso.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/idosos/${idoso.id}/prontuario-nutricional`)}
                          className="h-8 w-8 p-0"
                          title="Evolução Nutricional"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                          <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/idosos/${idoso.id}/prontuario-fisioterapeutico`)}
                          className="h-8 w-8 p-0"
                          title="Avaliação Fisioterapêutica"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(idoso)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(idoso)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <AddIdosoModal
        open={showAddModal}
        onClose={handleModalClose}
      />

      {selectedIdoso && (
        <>
          <EditIdosoModal
            open={showEditModal}
            onClose={handleModalClose}
            idoso={selectedIdoso}
          />

          <DeleteIdosoModal
            open={showDeleteModal}
            onClose={handleModalClose}
            idoso={selectedIdoso}
          />
        </>
      )}
    </div>
  );
}