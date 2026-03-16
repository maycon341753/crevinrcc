import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatBrazilianCurrency, formatBrazilianDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AtivoStatus = "ativo" | "manutencao" | "baixado" | "emprestado";
type AtivoCondicao = "novo" | "bom" | "regular" | "ruim" | "inservivel";

type AtivoInventario = {
  id: string;
  patrimonio_numero: string;
  nome: string;
  categoria: string | null;
  localizacao: string | null;
  responsavel: string | null;
  status: AtivoStatus;
  condicao: AtivoCondicao;
  data_aquisicao: string | null;
  valor_aquisicao: number | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const statusLabels: Record<AtivoStatus, string> = {
  ativo: "Ativo",
  manutencao: "Manutenção",
  baixado: "Baixado",
  emprestado: "Emprestado",
};

const condicaoLabels: Record<AtivoCondicao, string> = {
  novo: "Novo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  inservivel: "Inservível",
};

function statusBadgeVariant(status: AtivoStatus) {
  if (status === "ativo") return "default" as const;
  if (status === "manutencao") return "secondary" as const;
  if (status === "emprestado") return "outline" as const;
  return "destructive" as const;
}

function condicaoBadgeVariant(condicao: AtivoCondicao) {
  if (condicao === "novo" || condicao === "bom") return "default" as const;
  if (condicao === "regular") return "secondary" as const;
  return "destructive" as const;
}

const emptyForm = {
  patrimonio_numero: "",
  nome: "",
  categoria: "",
  localizacao: "",
  responsavel: "",
  status: "ativo" as AtivoStatus,
  condicao: "bom" as AtivoCondicao,
  data_aquisicao: "",
  valor_aquisicao: "",
  marca: "",
  modelo: "",
  numero_serie: "",
  observacoes: "",
};

export default function InventarioAtivosPage() {
  const [loading, setLoading] = useState(true);
  const [ativos, setAtivos] = useState<AtivoInventario[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AtivoStatus | "todos">("todos");
  const [openForm, setOpenForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AtivoInventario | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AtivoInventario | null>(null);

  const fetchAtivos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventario_ativos")
        .select("*")
        .order("patrimonio_numero", { ascending: true });
      if (error) throw error;
      setAtivos((data as AtivoInventario[]) ?? []);
    } catch (err: unknown) {
      toast.error("Erro ao carregar inventário de ativos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtivos();
  }, []);

  const filteredAtivos = useMemo(() => {
    const s = search.trim().toLowerCase();
    return ativos.filter((a) => {
      if (filterStatus !== "todos" && a.status !== filterStatus) return false;
      if (!s) return true;
      const hay = [
        a.patrimonio_numero,
        a.nome,
        a.categoria ?? "",
        a.localizacao ?? "",
        a.responsavel ?? "",
        a.marca ?? "",
        a.modelo ?? "",
        a.numero_serie ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [ativos, search, filterStatus]);

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Inventário de Ativos", pageWidth / 2, 32, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      48,
      { align: "center" }
    );

    const fmt = (v: string | null | undefined) => (v && v.trim() ? v : "—");
    const fmtDate = (d: string | null | undefined) => (d ? formatBrazilianDate(d) : "—");
    const fmtMoney = (n: number | null | undefined) => (n === null || n === undefined ? "—" : formatBrazilianCurrency(n));

    const body = filteredAtivos.map((a) => [
      a.patrimonio_numero,
      a.nome,
      fmt(a.categoria),
      fmt(a.localizacao),
      fmt(a.responsavel),
      statusLabels[a.status],
      condicaoLabels[a.condicao],
      fmtDate(a.data_aquisicao),
      fmtMoney(a.valor_aquisicao),
      fmt(a.marca),
      fmt(a.modelo),
      fmt(a.numero_serie),
      fmt(a.observacoes),
    ]);

    const columnWidths = [52, 90, 58, 60, 60, 48, 48, 48, 48, 48, 48, 54, 90];
    const tableWidth = columnWidths.reduce((acc, w) => acc + w, 0);
    const baseMargin = 24;
    const leftMargin = Math.max(baseMargin, Math.floor((pageWidth - tableWidth) / 2));

    autoTable(doc, {
      startY: 62,
      margin: { left: leftMargin, right: baseMargin },
      head: [[
        "Patrimônio",
        "Nome",
        "Categoria",
        "Localização",
        "Responsável",
        "Status",
        "Condição",
        "Aquisição",
        "Valor",
        "Marca",
        "Modelo",
        "Série",
        "Obs.",
      ]],
      body,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        0: { cellWidth: columnWidths[0] },
        1: { cellWidth: columnWidths[1] },
        2: { cellWidth: columnWidths[2] },
        3: { cellWidth: columnWidths[3] },
        4: { cellWidth: columnWidths[4] },
        5: { cellWidth: columnWidths[5] },
        6: { cellWidth: columnWidths[6] },
        7: { cellWidth: columnWidths[7] },
        8: { halign: "right", cellWidth: columnWidths[8] },
        9: { cellWidth: columnWidths[9] },
        10: { cellWidth: columnWidths[10] },
        11: { cellWidth: columnWidths[11] },
        12: { cellWidth: columnWidths[12] },
      },
    });

    const today = new Date();
    const filename = `inventario-ativos-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
      today.getDate()
    ).padStart(2, "0")}.pdf`;
    doc.save(filename);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setOpenForm(true);
  };

  const openEdit = (a: AtivoInventario) => {
    setEditing(a);
    setForm({
      patrimonio_numero: a.patrimonio_numero ?? "",
      nome: a.nome ?? "",
      categoria: a.categoria ?? "",
      localizacao: a.localizacao ?? "",
      responsavel: a.responsavel ?? "",
      status: a.status ?? "ativo",
      condicao: a.condicao ?? "bom",
      data_aquisicao: a.data_aquisicao ?? "",
      valor_aquisicao: a.valor_aquisicao === null || a.valor_aquisicao === undefined ? "" : String(a.valor_aquisicao),
      marca: a.marca ?? "",
      modelo: a.modelo ?? "",
      numero_serie: a.numero_serie ?? "",
      observacoes: a.observacoes ?? "",
    });
    setOpenForm(true);
  };

  const onSave = async () => {
    try {
      setSaving(true);
      const patrimonio_numero = (form.patrimonio_numero || "").trim();
      const nome = (form.nome || "").trim();
      if (!patrimonio_numero || !nome) {
        toast.error("Preencha Patrimônio e Nome");
        return;
      }

      const payload = {
        patrimonio_numero,
        nome,
        categoria: (form.categoria || "").trim() || null,
        localizacao: (form.localizacao || "").trim() || null,
        responsavel: (form.responsavel || "").trim() || null,
        status: form.status,
        condicao: form.condicao,
        data_aquisicao: form.data_aquisicao || null,
        valor_aquisicao: form.valor_aquisicao === "" ? null : Number(form.valor_aquisicao),
        marca: (form.marca || "").trim() || null,
        modelo: (form.modelo || "").trim() || null,
        numero_serie: (form.numero_serie || "").trim() || null,
        observacoes: (form.observacoes || "").trim() || null,
      };

      if (editing) {
        const { error } = await supabase.from("inventario_ativos").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Ativo atualizado");
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const created_by = userData.user?.id ?? null;
        const { error } = await supabase.from("inventario_ativos").insert([{ ...payload, created_by }]);
        if (error) throw error;
        toast.success("Ativo cadastrado");
      }

      setOpenForm(false);
      setEditing(null);
      await fetchAtivos();
    } catch (err: unknown) {
      toast.error("Erro ao salvar ativo");
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (a: AtivoInventario) => {
    setDeleteTarget(a);
    setDeleteOpen(true);
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("inventario_ativos").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Ativo removido");
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchAtivos();
    } catch (err: unknown) {
      toast.error("Erro ao remover ativo");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventário de Ativos</h1>
          <p className="text-muted-foreground">Gerencie o patrimônio e bens da instituição</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportPdf} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Novo Ativo
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por patrimônio, nome, categoria, localização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-[240px]">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as AtivoStatus | "todos")}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="emprestado">Emprestado</SelectItem>
                <SelectItem value="baixado">Baixado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[110px]">Patrimônio</TableHead>
                  <TableHead className="min-w-[220px]">Nome</TableHead>
                  <TableHead className="min-w-[160px]">Categoria</TableHead>
                  <TableHead className="min-w-[180px]">Localização</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Condição</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[140px]">Aquisição</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[140px]">Valor</TableHead>
                  <TableHead className="text-right min-w-[110px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredAtivos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum ativo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAtivos.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.patrimonio_numero}</TableCell>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell>{a.categoria || "—"}</TableCell>
                      <TableCell>{a.localizacao || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(a.status)}>{statusLabels[a.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={condicaoBadgeVariant(a.condicao)}>{condicaoLabels[a.condicao]}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {a.data_aquisicao ? formatBrazilianDate(a.data_aquisicao) : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {a.valor_aquisicao !== null && a.valor_aquisicao !== undefined
                          ? formatBrazilianCurrency(a.valor_aquisicao)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                            onClick={() => openEdit(a)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                            onClick={() => askDelete(a)}
                            title="Excluir"
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

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[720px] w-[95vw] max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Ativo" : "Novo Ativo"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Patrimônio</Label>
              <Input value={form.patrimonio_numero} onChange={(e) => setForm((p) => ({ ...p, patrimonio_numero: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input value={form.localizacao} onChange={(e) => setForm((p) => ({ ...p, localizacao: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={(e) => setForm((p) => ({ ...p, responsavel: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as AtivoStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="emprestado">Emprestado</SelectItem>
                  <SelectItem value="baixado">Baixado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condição</Label>
              <Select value={form.condicao} onValueChange={(v) => setForm((p) => ({ ...p, condicao: v as AtivoCondicao }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="bom">Bom</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="ruim">Ruim</SelectItem>
                  <SelectItem value="inservivel">Inservível</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Aquisição</Label>
              <Input type="date" value={form.data_aquisicao} onChange={(e) => setForm((p) => ({ ...p, data_aquisicao: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Valor de Aquisição (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_aquisicao}
                onChange={(e) => setForm((p) => ({ ...p, valor_aquisicao: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input value={form.marca} onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={form.modelo} onChange={(e) => setForm((p) => ({ ...p, modelo: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Número de Série</Label>
              <Input value={form.numero_serie} onChange={(e) => setForm((p) => ({ ...p, numero_serie: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Input value={form.observacoes} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancelar
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] w-[95vw]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Tem certeza que deseja excluir o ativo {deleteTarget?.patrimonio_numero}? Esta ação não pode ser desfeita.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
