import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Upload, Eye, Pencil, Info, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AddLicencaModal from "@/components/obrigacoes/AddLicencaModal";
import PdfViewerModal from "@/components/obrigacoes/PdfViewerModal";
import EditLicencaModal from "@/components/obrigacoes/EditLicencaModal";
import LicencaInfoModal from "@/components/obrigacoes/LicencaInfoModal";

type LicencaFuncionamento = {
  id: string;
  titulo: string;
  emissor?: string | null;
  numero?: string | null;
  data_emissao?: string | null;
  data_validade?: string | null;
  arquivo_url?: string | null;
  arquivo_storage_path?: string | null;
  observacoes?: string | null;
  created_by?: string | null;
};

function formatDate(date?: string | null) {
  if (!date) return "-";
  try {
    // Formato ISO sem hora (yyyy-mm-dd)
    const isoMatch = /^\d{4}-\d{2}-\d{2}$/;
    if (isoMatch.test(date)) {
      const [year, month, day] = date.split("-");
      return `${day}/${month}/${year}`;
    }
    // Outros formatos: fallback seguro
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR");
    }
    return date;
  } catch {
    return date;
  }
}

function calcStatus(validade?: string | null) {
  if (!validade) return { label: "Sem validade", variant: "outline" as const };
  const today = new Date();
  const d = new Date(validade);
  if (isNaN(d.getTime())) return { label: "Data inválida", variant: "destructive" as const };
  if (d < today) return { label: "Expirada", variant: "destructive" as const };
  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) return { label: `Vence em ${diffDays}d`, variant: "secondary" as const };
  return { label: "Válida", variant: "default" as const };
}

export default function LicencasFuncionamentoPage() {
  const [licencas, setLicencas] = useState<LicencaFuncionamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>("Visualizar PDF");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedLicenca, setSelectedLicenca] = useState<LicencaFuncionamento | null>(null);

  const fetchLicencas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("licencas_funcionamento")
        .select("*")
        .order("data_validade", { ascending: true });
      if (error) throw error;
      setLicencas(data ?? []);
    } catch (err) {
      console.error("Erro ao carregar licenças:", err);
      const code = (err as { code?: string } | null)?.code ?? null;
      setErrorCode(code);
      if (code === "PGRST205") {
        toast.error("Tabela 'licencas_funcionamento' não encontrada. Aplique a migration.");
      } else {
        toast.error("Erro ao carregar licenças de funcionamento");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicencas();
  }, []);

  const filtered = licencas.filter((l) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      l.titulo.toLowerCase().includes(s) ||
      (l.emissor ?? "").toLowerCase().includes(s) ||
      (l.numero ?? "").toLowerCase().includes(s)
    );
  });

  const triggerUpload = (id: string) => {
    setUploadingId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Selecione um arquivo PDF");
      return;
    }

    if (!uploadingId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? "anon";
      const bucket = "licencas"; // certifique-se que o bucket existe no Supabase Storage
      const path = `${userId}/${uploadingId}.pdf`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: "application/pdf", upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = pub?.publicUrl ?? null;

      const { error: updErr } = await supabase
        .from("licencas_funcionamento")
        .update({ arquivo_url: publicUrl, arquivo_storage_path: path })
        .eq("id", uploadingId);
      if (updErr) throw updErr;

      toast.success("PDF enviado com sucesso");
      fetchLicencas();
    } catch (err) {
      console.error("Erro ao enviar PDF:", err);
      const rawMessage = (err as { message?: unknown } | null)?.message;
      const msg = typeof rawMessage === "string" ? rawMessage : "";
      if (msg.includes("Bucket not found")) {
        toast.error("Bucket 'licencas' não encontrado. Aplique a migration crevin-care-hub/supabase/migrations/20251112090500_create_storage_bucket_licencas.sql.");
      } else if (
        msg.includes("row-level security policy") ||
        msg.toLowerCase().includes("rls") ||
        msg.toLowerCase().includes("violates row-level security")
      ) {
        toast.error(
          "Upload bloqueado por RLS no Storage. Crie uma política de INSERT para o bucket 'licencas' permitindo usuários autenticados."
        );
        console.warn(
          "Dica de política SQL:",
          "CREATE POLICY licencas_insert_auth ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'licencas');"
        );
      } else {
        toast.error("Falha no upload. Verifique se o bucket 'licencas' existe.");
      }
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openPdf = (l: LicencaFuncionamento) => {
    setPdfUrl(l.arquivo_url ?? null);
    setPdfTitle(l.titulo);
    setShowPdf(true);
  };

  const openEdit = (l: LicencaFuncionamento) => {
    setSelectedLicenca(l);
    setShowEdit(true);
  };

  const openInfo = (l: LicencaFuncionamento) => {
    setSelectedLicenca(l);
    setShowInfo(true);
  };

  const handleDelete = async (l: LicencaFuncionamento) => {
    try {
      setDeletingId(l.id);
      // Remove arquivo do Storage se existir (best-effort)
      if (l.arquivo_storage_path) {
        const { error: storageErr } = await supabase.storage
          .from("licencas")
          .remove([l.arquivo_storage_path]);
        if (storageErr) {
          toast.warning("Arquivo não removido do Storage. Prosseguindo com exclusão do registro.");
        }
      }

      const { error } = await supabase
        .from("licencas_funcionamento")
        .delete()
        .eq("id", l.id);
      if (error) throw error;

      setLicencas((prev) => prev.filter((x) => x.id !== l.id));
      toast.success("Licença excluída com sucesso.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(`Falha ao excluir licença: ${msg || "erro desconhecido"}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = (updated: LicencaFuncionamento) => {
    // Atualização otimista: reflete imediatamente na tabela e status
    setLicencas((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
    setSelectedLicenca(updated);
  };

  return (
    <div className="container mx-auto p-4 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Licenças de Funcionamento</h1>
          <p className="text-muted-foreground">Gerencie licenças no módulo Obrigações</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setShowAdd(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Licença
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Input
            placeholder="Buscar por título, emissor ou número"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Licenças</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Carregando...</div>
          ) : errorCode === "PGRST205" ? (
            <div className="text-sm">
              <div className="p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive mb-3">
                Tabela <code>public.licencas_funcionamento</code> não existe.
              </div>
              <div className="text-muted-foreground">
                Aplique a migration em <code>supabase/migrations/20251112090000_create_licencas_funcionamento.sql</code>
                pelo SQL Editor do Supabase ou via CLI (<code>supabase db push</code>), e garanta o bucket
                <code>licencas</code> no Storage.
              </div>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Título</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[160px]">Emissor</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[140px]">Número</TableHead>
                    <TableHead className="hidden lg:table-cell min-w-[120px]">Emissão</TableHead>
                    <TableHead className="min-w-[120px]">Validade</TableHead>
                    <TableHead className="min-w-[140px]">Status</TableHead>
                    <TableHead className="text-right min-w-[180px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const s = calcStatus(l.data_validade);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{l.titulo}</span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              {(l.emissor ?? "-")}{l.numero ? ` • ${l.numero}` : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{l.emissor ?? "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{l.numero ?? "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDate(l.data_emissao)}</TableCell>
                        <TableCell>{formatDate(l.data_validade)}</TableCell>
                        <TableCell>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                              onClick={() => triggerUpload(l.id)}
                              title="Upload PDF"
                            >
                              <Upload className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Upload</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                              onClick={() => openPdf(l)}
                              disabled={!l.arquivo_url}
                              title="Ver PDF"
                            >
                              <Eye className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Ver</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                              onClick={() => openEdit(l)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                              onClick={() => openInfo(l)}
                              title="Detalhes"
                            >
                              <Info className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Detalhes</span>
                            </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingId === l.id}
                            title="Excluir licença"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a licença "{l.titulo}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(l)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deletingId === l.id}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhuma licença encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <AddLicencaModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSuccess={fetchLicencas} />
      <PdfViewerModal isOpen={showPdf} onClose={() => setShowPdf(false)} pdfUrl={pdfUrl} title={pdfTitle} />
      <EditLicencaModal isOpen={showEdit} onClose={() => setShowEdit(false)} onSuccess={handleEditSuccess} licenca={selectedLicenca} />
      <LicencaInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} licenca={selectedLicenca} />
    </div>
  );
}
