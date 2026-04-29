import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, formatPhone } from "@/lib/utils";
import { Idoso } from "@/types";
import { useNavigate } from "react-router-dom";

export default function IdososInativosPage() {
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetIdoso, setTargetIdoso] = useState<Idoso | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchIdososInativos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("idosos")
        .select("*")
        .eq("ativo", false)
        .order("nome");

      if (error) throw error;
      setIdosos(data || []);
    } catch (error) {
      console.error("Erro ao carregar idosos inativos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os idosos inativos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIdososInativos();
  }, [fetchIdososInativos]);

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

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const askReactivate = (idoso: Idoso) => {
    setTargetIdoso(idoso);
    setConfirmOpen(true);
  };

  const confirmReactivate = async () => {
    if (!targetIdoso) return;
    try {
      const { error } = await supabase.from("idosos").update({ ativo: true }).eq("id", targetIdoso.id);
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Idoso reativado.",
      });

      setIdosos((prev) => prev.filter((i) => i.id !== targetIdoso.id));
      setConfirmOpen(false);
      setTargetIdoso(null);
    } catch (error) {
      console.error("Erro ao reativar idoso:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reativar o idoso.",
        variant: "destructive",
      });
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Idosos Inativos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Visualize idosos inativados e reative quando necessário
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => navigate("/idosos")} variant="outline" className="w-full sm:w-auto">
            Voltar para Idosos
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Idosos Inativos</CardTitle>
          <CardDescription>Reative um idoso para que ele volte a aparecer na lista principal</CardDescription>
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
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="text-right min-w-[140px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdosos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum idoso encontrado." : "Nenhum idoso inativo."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIdosos.map((idoso) => (
                    <TableRow key={idoso.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{idoso.nome}</span>
                          <span className="text-xs text-muted-foreground sm:hidden">{formatCPF(idoso.cpf)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCPF(idoso.cpf)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{calculateAge(idoso.data_nascimento)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {idoso.telefone ? formatPhone(idoso.telefone) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inativo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => askReactivate(idoso)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reativar
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Confirmar reativação</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600">
            Tem certeza que deseja reativar{" "}
            <span className="font-medium text-gray-900">{targetIdoso?.nome || ""}</span>?
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setTargetIdoso(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmReactivate}>Reativar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
