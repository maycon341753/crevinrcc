import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Edit, Eye, Search, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatBrazilianCurrency } from "@/lib/utils";
import { Idoso } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { EditIdosoModal } from "@/components/idosos/EditIdosoModal";

type ContratoDoc = {
  id: string;
  idoso_id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho_arquivo: number | null;
  caminho_storage: string;
  descricao: string | null;
  created_at: string;
};

export default function ContratoIdososPage() {
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const [contratos, setContratos] = useState<Record<string, ContratoDoc | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContratoDoc | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIdoso, setSelectedIdoso] = useState<Idoso | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: idososData, error: idososError } = await supabase
        .from("idosos")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (idososError) throw idososError;

      const list = (idososData || []) as Idoso[];
      setIdosos(list);

      const ids = list.map((i) => i.id);
      if (ids.length === 0) {
        setContratos({});
        return;
      }

      const { data: docsData, error: docsError } = await supabase
        .from("documentos_medicos")
        .select("id, idoso_id, nome_arquivo, tipo_arquivo, tamanho_arquivo, caminho_storage, descricao, created_at")
        .in("idoso_id", ids)
        .eq("descricao", "Contrato")
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;

      const map: Record<string, ContratoDoc | undefined> = {};
      (docsData || []).forEach((d: any) => {
        if (!map[d.idoso_id]) map[d.idoso_id] = d as ContratoDoc;
      });
      setContratos(map);
    } catch (error) {
      console.error("Erro ao carregar contratos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contratos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
  }, [idosos, searchTerm]);

  const getValorContrato = (idoso: Idoso) => {
    const beneficio = idoso.beneficio_valor ?? 0;
    const percentual = idoso.contribuicao_percentual ?? 0;
    if (!beneficio || !percentual) return null;
    return (beneficio * percentual) / 100;
  };

  const openFilePicker = (idosoId: string) => {
    setUploadingId(idosoId);
    fileInputRef.current?.click();
  };

  const handleEditIdoso = (idoso: Idoso) => {
    setSelectedIdoso(idoso);
    setShowEditModal(true);
  };

  const removeContrato = async (doc: ContratoDoc, silent?: boolean) => {
    try {
      await supabase.storage.from("documentos-medicos").remove([doc.caminho_storage]);
      const { error } = await supabase.from("documentos_medicos").delete().eq("id", doc.id);
      if (error) throw error;

      setContratos((prev) => {
        const next = { ...prev };
        delete next[doc.idoso_id];
        return next;
      });

      if (!silent) toast({ title: "Sucesso", description: "Contrato excluído." });
    } catch (error) {
      console.error("Erro ao excluir contrato:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (file: File, idosoId: string) => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    if (file.type !== "application/pdf") {
      toast({ title: "Erro", description: "Envie um arquivo PDF.", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Erro", description: "Arquivo muito grande (máximo 50MB).", variant: "destructive" });
      return;
    }

    const existing = contratos[idosoId];

    try {
      setUploadingId(idosoId);

      if (existing) {
        await removeContrato(existing, true);
      }

      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${idosoId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documentos-medicos")
        .upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase
        .from("documentos_medicos")
        .insert({
          idoso_id: idosoId,
          nome_arquivo: file.name,
          tipo_arquivo: file.type,
          tamanho_arquivo: file.size,
          caminho_storage: filePath,
          descricao: "Contrato",
          uploaded_by: user.id,
        })
        .select("id, idoso_id, nome_arquivo, tipo_arquivo, tamanho_arquivo, caminho_storage, descricao, created_at")
        .single();

      if (dbError) {
        await supabase.storage.from("documentos-medicos").remove([filePath]);
        throw dbError;
      }

      setContratos((prev) => ({ ...prev, [idosoId]: data as any }));
      toast({ title: "Sucesso", description: "Contrato enviado." });
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro",
        description: `Não foi possível enviar o contrato${error?.message ? `: ${error.message}` : ""}`,
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const viewContrato = async (doc: ContratoDoc) => {
    try {
      const { data, error } = await supabase.storage.from("documentos-medicos").createSignedUrl(doc.caminho_storage, 3600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Erro ao abrir contrato:", error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o contrato.",
        variant: "destructive",
      });
    }
  };

  const downloadContrato = async (doc: ContratoDoc) => {
    try {
      const { data, error } = await supabase.storage.from("documentos-medicos").download(doc.caminho_storage);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nome_arquivo;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar contrato:", error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o contrato.",
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contrato Idosos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Upload do contrato e visualização do valor de contribuição de cada idoso ativo
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contratos</CardTitle>
          <CardDescription>Um contrato por idoso (PDF)</CardDescription>
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

          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !uploadingId) {
                setUploadingId(null);
                return;
              }
              handleUpload(file, uploadingId);
            }}
          />

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Nome</TableHead>
                  <TableHead className="min-w-[140px]">Valor do Contrato</TableHead>
                  <TableHead className="min-w-[120px]">Arquivo</TableHead>
                  <TableHead className="text-right min-w-[220px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdosos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum idoso encontrado." : "Nenhum idoso ativo."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIdosos.map((idoso) => {
                    const valor = getValorContrato(idoso);
                    const doc = contratos[idoso.id];
                    const busy = uploadingId === idoso.id;
                    return (
                      <TableRow key={idoso.id}>
                        <TableCell className="font-medium">{idoso.nome}</TableCell>
                        <TableCell>{valor ? formatBrazilianCurrency(valor) : "-"}</TableCell>
                        <TableCell>
                          {doc ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enviado</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => openFilePicker(idoso.id)} disabled={busy}>
                              <Upload className="h-4 w-4 mr-2" />
                              {doc ? "Trocar" : "Upload"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() => handleEditIdoso(idoso)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() => doc && viewContrato(doc)}
                              disabled={!doc}
                              title="Ver"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() => doc && downloadContrato(doc)}
                              disabled={!doc}
                              title="Baixar"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() => {
                                if (!doc) return;
                                setDeleteTarget(doc);
                                setDeleteOpen(true);
                              }}
                              disabled={!doc}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600">Tem certeza que deseja excluir este contrato?</div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteTarget(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                await removeContrato(deleteTarget);
                setDeleteOpen(false);
                setDeleteTarget(null);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedIdoso && (
        <EditIdosoModal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedIdoso(null);
            fetchData();
          }}
          idoso={selectedIdoso}
        />
      )}
    </div>
  );
}
