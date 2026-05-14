import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Edit, Eye, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, formatPhone } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type Voluntario = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

type ContratoVoluntario = {
  id: string;
  voluntario_id: string;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho_arquivo: number | null;
  caminho_storage: string;
  created_at: string;
};

const BUCKET = "contratos-voluntarios";

export default function TerceirizadoPage() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [contratos, setContratos] = useState<Record<string, ContratoVoluntario | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContratoVoluntario | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Voluntario | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  const formatTelefoneInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const sanitizeEmailInput = (value: string) => {
    return value.replace(/\s+/g, "").toLowerCase();
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: vData, error: vErr } = await supabase
        .from("voluntarios")
        .select("*")
        .order("nome");
      if (vErr) {
        const code = (vErr as any)?.code;
        if (code === "PGRST205") {
          setVoluntarios([]);
          setContratos({});
          toast({
            title: "Banco não configurado",
            description: "Crie as tabelas/bucket de voluntários (SQL) para habilitar esta página.",
            variant: "destructive",
          });
          return;
        }
        throw vErr;
      }
      const list = (vData || []) as Voluntario[];
      setVoluntarios(list);

      const ids = list.map((v) => v.id);
      if (ids.length === 0) {
        setContratos({});
        return;
      }

      const { data: cData, error: cErr } = await supabase
        .from("contratos_voluntarios")
        .select("id, voluntario_id, nome_arquivo, tipo_arquivo, tamanho_arquivo, caminho_storage, created_at")
        .in("voluntario_id", ids)
        .order("created_at", { ascending: false });
      if (cErr) {
        const code = (cErr as any)?.code;
        if (code === "PGRST205") {
          setContratos({});
          return;
        }
        throw cErr;
      }

      const map: Record<string, ContratoVoluntario | undefined> = {};
      (cData || []).forEach((c: any) => {
        if (!map[c.voluntario_id]) map[c.voluntario_id] = c as ContratoVoluntario;
      });
      setContratos(map);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os voluntários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredVoluntarios = useMemo(() => {
    const termText = searchTerm.trim().toLowerCase();
    const termDigits = searchTerm.replace(/\D/g, "");
    if (!termText && !termDigits) return voluntarios;

    return voluntarios.filter((v) => {
      const nomeMatches = v.nome.toLowerCase().includes(termText);
      const cpfDigits = (v.cpf ?? "").replace(/\D/g, "");
      const telefoneDigits = (v.telefone ?? "").replace(/\D/g, "");
      const cpfMatches = termDigits.length > 0 && cpfDigits.includes(termDigits);
      const telefoneMatches = termDigits.length > 0 && telefoneDigits.includes(termDigits);
      return nomeMatches || cpfMatches || telefoneMatches;
    });
  }, [voluntarios, searchTerm]);

  const createVoluntario = async () => {
    const n = nome.trim();
    if (!n) {
      toast({ title: "Erro", description: "Informe o nome.", variant: "destructive" });
      return;
    }
    try {
      setCreating(true);
      const cpfDigits = cpf.replace(/\D/g, "");
      const telDigits = telefone.replace(/\D/g, "");

      const { data, error } = await supabase
        .from("voluntarios")
        .insert({
          nome: n,
          cpf: cpfDigits ? cpfDigits : null,
          telefone: telDigits ? telDigits : null,
          email: email.trim() ? email.trim() : null,
          ativo: true,
        })
        .select("*")
        .single();
      if (error) throw error;

      setVoluntarios((prev) => [...prev, data as Voluntario].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNome("");
      setCpf("");
      setTelefone("");
      setEmail("");
      toast({ title: "Sucesso", description: "Voluntário cadastrado." });
    } catch (error) {
      console.error("Erro ao criar voluntário:", error);
      toast({ title: "Erro", description: "Não foi possível cadastrar o voluntário.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (v: Voluntario) => {
    setEditing(v);
    setEditNome(v.nome || "");
    setEditCpf(v.cpf || "");
    setEditTelefone(v.telefone || "");
    setEditEmail(v.email || "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const n = editNome.trim();
    if (!n) {
      toast({ title: "Erro", description: "Informe o nome.", variant: "destructive" });
      return;
    }
    try {
      setSavingEdit(true);
      const cpfDigits = editCpf.replace(/\D/g, "");
      const telDigits = editTelefone.replace(/\D/g, "");

      const { error } = await supabase
        .from("voluntarios")
        .update({
          nome: n,
          cpf: cpfDigits ? cpfDigits : null,
          telefone: telDigits ? telDigits : null,
          email: editEmail.trim() ? editEmail.trim() : null,
        })
        .eq("id", editing.id);
      if (error) throw error;

      setVoluntarios((prev) =>
        prev
          .map((v) =>
            v.id === editing.id
              ? {
                  ...v,
                  nome: n,
                  cpf: cpfDigits ? cpfDigits : null,
                  telefone: telDigits ? telDigits : null,
                  email: editEmail.trim() ? editEmail.trim() : null,
                }
              : v
          )
          .sort((a, b) => a.nome.localeCompare(b.nome))
      );

      toast({ title: "Sucesso", description: "Voluntário atualizado." });
      setEditOpen(false);
      setEditing(null);
    } catch (error) {
      console.error("Erro ao editar voluntário:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o voluntário.", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const openFilePicker = (voluntarioId: string) => {
    setUploadingId(voluntarioId);
    fileInputRef.current?.click();
  };

  const removeContrato = async (doc: ContratoVoluntario, silent?: boolean) => {
    try {
      await supabase.storage.from(BUCKET).remove([doc.caminho_storage]);
      const { error } = await supabase.from("contratos_voluntarios").delete().eq("id", doc.id);
      if (error) throw error;

      setContratos((prev) => {
        const next = { ...prev };
        delete next[doc.voluntario_id];
        return next;
      });

      if (!silent) toast({ title: "Sucesso", description: "Contrato excluído." });
    } catch (error) {
      console.error("Erro ao excluir contrato:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o contrato.", variant: "destructive" });
    }
  };

  const handleUpload = async (file: File, voluntarioId: string) => {
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

    const existing = contratos[voluntarioId];

    try {
      setUploadingId(voluntarioId);
      if (existing) {
        await removeContrato(existing, true);
      }

      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${voluntarioId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase
        .from("contratos_voluntarios")
        .insert({
          voluntario_id: voluntarioId,
          nome_arquivo: file.name,
          tipo_arquivo: file.type,
          tamanho_arquivo: file.size,
          caminho_storage: filePath,
          uploaded_by: user.id,
        })
        .select("id, voluntario_id, nome_arquivo, tipo_arquivo, tamanho_arquivo, caminho_storage, created_at")
        .single();
      if (dbError) {
        await supabase.storage.from(BUCKET).remove([filePath]);
        throw dbError;
      }

      setContratos((prev) => ({ ...prev, [voluntarioId]: data as any }));
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

  const viewContrato = async (doc: ContratoVoluntario) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.caminho_storage, 3600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Erro ao abrir contrato:", error);
      toast({ title: "Erro", description: "Não foi possível abrir o contrato.", variant: "destructive" });
    }
  };

  const downloadContrato = async (doc: ContratoVoluntario) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).download(doc.caminho_storage);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.nome_arquivo;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar contrato:", error);
      toast({ title: "Erro", description: "Não foi possível baixar o contrato.", variant: "destructive" });
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Terceirizado (Voluntariado)</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Cadastre voluntários e envie o contrato (PDF)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Voluntário</CardTitle>
          <CardDescription>Preencha os dados e clique em Cadastrar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={telefone}
                inputMode="tel"
                onChange={(e) => setTelefone(formatTelefoneInput(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Email</Label>
              <Input
                value={email}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="md:col-span-2 flex items-end justify-end">
              <Button onClick={createVoluntario} disabled={creating}>
                Cadastrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voluntários</CardTitle>
          <CardDescription>Lista de voluntários cadastrados</CardDescription>
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
                  <TableHead className="min-w-[240px]">Nome</TableHead>
                  <TableHead className="min-w-[140px]">CPF</TableHead>
                  <TableHead className="min-w-[160px]">Telefone</TableHead>
                  <TableHead className="min-w-[140px]">Contrato</TableHead>
                  <TableHead className="text-right min-w-[260px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVoluntarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Nenhum voluntário encontrado." : "Nenhum voluntário cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVoluntarios.map((v) => {
                    const doc = contratos[v.id];
                    const busy = uploadingId === v.id;
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.nome}</TableCell>
                        <TableCell>{v.cpf ? formatCPF(v.cpf) : "-"}</TableCell>
                        <TableCell>{v.telefone ? formatPhone(v.telefone) : "-"}</TableCell>
                        <TableCell>
                          {doc ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enviado</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => openFilePicker(v.id)} disabled={busy}>
                              <Upload className="h-4 w-4 mr-2" />
                              {doc ? "Trocar" : "Upload"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                              onClick={() => openEdit(v)}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editar Voluntário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={editCpf} onChange={(e) => setEditCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={editTelefone}
                  inputMode="tel"
                  onChange={(e) => setEditTelefone(formatTelefoneInput(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editEmail}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                onChange={(e) => setEditEmail(sanitizeEmailInput(e.target.value))}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
