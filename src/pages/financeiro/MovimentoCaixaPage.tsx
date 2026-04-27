import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatBrazilianCurrency, formatBrazilianDate, formatCurrencyInput, parseBrazilianCurrency, formatBrazilianCurrencyValue } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Lock, Edit, Trash2, FileText, Search } from 'lucide-react';
import { DatePickerBr } from '@/components/ui/date-picker-br';

interface CashCategory {
  id: string;
  name: string;
  active: boolean;
}

interface CashMovement {
  id: string;
  movement_date: string;
  description: string;
  type: 'entrada' | 'saida';
  amount: number;
  entrada: number;
  saida: number;
  category_id: string | null;
  source?: string | null;
  created_at: string;
}

type CashMovementWithSaldo = CashMovement & { saldo: number };

const MovimentoCaixaPage: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd');
    });
  const [categories, setCategories] = useState<CashCategory[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [openCloseModal, setOpenCloseModal] = useState(false);
  const [newType, setNewType] = useState<'entrada' | 'saida'>('saida');
  const [newDate, setNewDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<string | undefined>();
  const [newAmount, setNewAmount] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [historySummaries, setHistorySummaries] = useState<Array<{ key: string; start: string; end: string; entrada: number; saida: number; saldo: number }>>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CashMovement | null>(null);
  const [editType, setEditType] = useState<'entrada' | 'saida'>('saida');
  const [editDate, setEditDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<string | undefined>();
  const [editAmount, setEditAmount] = useState<string>('');
  const [openPdfModal, setOpenPdfModal] = useState(false);
  const [openCategoryPicker, setOpenCategoryPicker] = useState(false);
  const [openEditCategoryPicker, setOpenEditCategoryPicker] = useState(false);
  const [pdfFrom, setPdfFrom] = useState<Date | undefined>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [pdfTo, setPdfTo] = useState<Date | undefined>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailRows, setDetailRows] = useState<Array<CashMovement & { saldo: number }>>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteCategoryConfirmOpen, setDeleteCategoryConfirmOpen] = useState(false);
  const [deleteCategoryTargetId, setDeleteCategoryTargetId] = useState<string | null>(null);
  const [generatingPdfKey, setGeneratingPdfKey] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, movRes, histRes] = await Promise.all([
        supabase.from('cash_categories').select('*').order('name'),
        supabase.from('cash_movements').select('*').gte('movement_date', fromDate).order('movement_date', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('cash_movements').select('*').lt('movement_date', fromDate)
      ]);
      if (catRes.error) throw catRes.error;
      if (movRes.error) throw movRes.error;
      if (histRes.error) throw histRes.error;
      setCategories(catRes.data || []);
      const filteredMovements = (movRes.data || []).filter((r: any) => r.source === 'manual');
      setMovements(filteredMovements);
      const agg = new Map<string, { entrada: number; saida: number }>();
      ((histRes.data || []) as any[]).filter((r: any) => r.source === 'manual').forEach((r: any) => {
        const d = new Date(r.movement_date);
        const y = d.getFullYear();
        const m = d.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        const prev = agg.get(key) || { entrada: 0, saida: 0 };
        prev.entrada += Number(r.entrada || 0);
        prev.saida += Number(r.saida || 0);
        agg.set(key, prev);
      });
      const hist = Array.from(agg.entries()).map(([key, v]) => {
        const [y, mm] = key.split('-').map(Number);
        const startDate = new Date(y, (mm || 1) - 1, 1);
        const endDate = new Date(y, (mm || 1), 0);
        return {
          key,
          start: format(startDate, 'dd/MM/yyyy'),
          end: format(endDate, 'dd/MM/yyyy'),
          entrada: v.entrada,
          saida: v.saida,
          saldo: v.entrada - v.saida,
        };
      }).sort((a, b) => a.key < b.key ? 1 : -1);
      setHistorySummaries(hist);
    } catch (e: any) {
      toast.error('Erro ao carregar movimentos de caixa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate]);

  const rows = useMemo(() => {
    let running = 0;
    return (movements || []).map(m => {
      running += (m.entrada || 0) - (m.saida || 0);
      return { ...m, saldo: running };
    });
  }, [movements]);

  const saldoTotal = useMemo(() => {
    return rows.length ? rows[rows.length - 1].saldo : 0;
  }, [rows]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    (categories || []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const activeCategories = useMemo(() => {
    return (categories || []).filter((c) => c.active);
  }, [categories]);

  const deleteCategory = async (categoryId: string) => {
    setDeleteCategoryTargetId(categoryId);
    setDeleteCategoryConfirmOpen(true);
    setOpenCategoryPicker(false);
    setOpenEditCategoryPicker(false);
  };

  const openHistoryDetails = async (key: string) => {
    try {
      setDetailLoading(true);
      const [yStr, mStr] = key.split('-');
      const y = Number(yStr);
      const m = Number(mStr);
      const start = new Date(y, (m || 1) - 1, 1);
      const end = new Date(y, (m || 1), 0);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .gte('movement_date', startStr)
        .lte('movement_date', endStr)
        .order('movement_date', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) {
        toast.error('Erro ao carregar detalhes');
        return;
      }
      let running = 0;
      const list = ((data || []) as CashMovement[]).filter((m) => (m as any).source === 'manual');
      const detailed = list.map((m) => {
        running += (m.entrada || 0) - (m.saida || 0);
        return { ...m, saldo: running };
      });
      setDetailRows(detailed);
      setDetailTitle(`${String(m).padStart(2, '0')}/${y}`);
      setDetailOpen(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchMovementsForRange = async (start: Date, end: Date): Promise<CashMovementWithSaldo[]> => {
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('cash_movements')
      .select('*')
      .gte('movement_date', startStr)
      .lte('movement_date', endStr)
      .order('movement_date', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;

    let running = 0;
    const list = ((data || []) as CashMovement[]).filter((m) => (m as any).source === 'manual');
    return list.map((m) => {
      running += (m.entrada || 0) - (m.saida || 0);
      return { ...m, saldo: running };
    });
  };

  const gerarPDF = (start: Date, end: Date, list?: CashMovementWithSaldo[]) => {
    const filtered = (list ?? rows).filter((r) => {
      const movementDate = r.movement_date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(movementDate)) {
        const [year, month, day] = movementDate.split('-').map(Number);
        const dt = new Date(year, (month || 1) - 1, day || 1);
        return dt >= start && dt <= end;
      }
      return true;
    });

    const totalEntrada = filtered.reduce((s, r) => s + (r.entrada || 0), 0);
    const totalSaida = filtered.reduce((s, r) => s + (r.saida || 0), 0);
    const saldoPeriodo = totalEntrada - totalSaida;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    
    const marginLeft = 40;
    const marginRight = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidth = pageWidth - marginLeft - marginRight;
    const crevinName = 'CREVIN - Lar dos Idosos';
    const crevinAddress = 'St. Tradicional Q 63 lt 12 - Planaltina, Brasília - DF, 73330-630';
    const crevinPhone = 'Telefone: (61) 3389-9448';

    doc.setFontSize(12);
    doc.text(crevinName, marginLeft, 26);
    doc.setFontSize(18);
    doc.text('Movimento de Caixa', marginLeft, 50);
    doc.setFontSize(11);
    doc.text(`Período: ${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`, marginLeft, 70);
    doc.setDrawColor(50, 50, 50);
    doc.line(marginLeft, 78, pageWidth - marginRight, 78);

        const formatDateForPdf = (isoDate: string) => {
      const parts = (isoDate || '').split('-');
      let y = Number(parts[0] || 0);
      const m = Number(parts[1] || 1);
      const d = Number(parts[2] || 1);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      if (isNaN(dt.getTime())) return isoDate || '';
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const body = filtered.map(r => [
      formatDateForPdf(r.movement_date),
      r.category_id ? (categoryMap.get(r.category_id) || 'Sem categoria') : 'Sem categoria',
      r.entrada ? formatBrazilianCurrency(r.entrada) : '-',
      r.saida ? formatBrazilianCurrency(r.saida) : '-',
      formatBrazilianCurrency((r as any).saldo ?? 0),
    ]);

    autoTable(doc, {
      head: [['Data', 'Categoria', 'Entrada', 'Saída', 'Saldo']],
      body,
      startY: 95,
      styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
      headStyles: { fillColor: [33, 82, 255] },
      margin: { left: marginLeft, right: marginRight },
      tableWidth: usableWidth,
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 'auto' },
        2: { halign: 'right', cellWidth: 80 },
        3: { halign: 'right', cellWidth: 80 },
        4: { halign: 'right', cellWidth: 80 },
      },
      didDrawPage: () => {
        const page = doc.getCurrentPageInfo().pageNumber;
        const pageCount = (doc as any).getNumberOfPages();
        doc.setDrawColor(220, 220, 220);
        doc.line(marginLeft, pageHeight - 44, pageWidth - marginRight, pageHeight - 44);

        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(crevinName, marginLeft, pageHeight - 30);
        doc.text(crevinAddress, marginLeft, pageHeight - 18, { maxWidth: usableWidth });
        doc.text(crevinPhone, marginLeft, pageHeight - 8);
        doc.text(`Página ${page} de ${pageCount}`, pageWidth - marginRight, pageHeight - 8, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 85;
    doc.setFontSize(12);
    doc.text('Resumo do Período', marginLeft, finalY + 24);
    autoTable(doc, {
      body: [
        ['Total de Entradas', formatBrazilianCurrency(totalEntrada)],
        ['Total de Saídas', formatBrazilianCurrency(totalSaida)],
        ['Saldo do Período', formatBrazilianCurrency(saldoPeriodo)],
      ],
      startY: finalY + 32,
      styles: { fontSize: 10, cellPadding: 6 },
      margin: { left: marginLeft, right: marginRight },
      tableWidth: usableWidth * 0.6,
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 120 },
      },
      theme: 'plain',
    });

    const filename = `movimento-caixa-${format(start, 'yyyyMMdd')}-a-${format(end, 'yyyyMMdd')}.pdf`;
    doc.save(filename);
  };

  const gerarPDFMensal = () => {
    const y = Number(fromDate.slice(0, 4));
    const m = Number(fromDate.slice(5, 7)) - 1;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    gerarPDF(start, end);
  };

  const gerarPDFDoMesKey = async (key: string) => {
    const [yStr, mStr] = key.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const start = new Date(y, (m || 1) - 1, 1);
    const end = new Date(y, m || 1, 0);

    try {
      setGeneratingPdfKey(key);
      const list = await fetchMovementsForRange(start, end);
      gerarPDF(start, end, list);
    } catch {
      toast.error('Erro ao gerar PDF do mês');
    } finally {
      setGeneratingPdfKey(null);
    }
  };

  const onCreate = async () => {
    try {
      const amountNumber = parseBrazilianCurrency(newAmount || '');
      if (!newDescription || !amountNumber || !newDate) {
        toast.error('Preencha descrição, data e valor');
        return;
      }
      const payload = {
        movement_date: newDate,
        description: newDescription,
        type: newType,
        amount: amountNumber,
        category_id: newCategory || null,
      };
      const { error } = await supabase.from('cash_movements').insert([payload]);
      if (error) throw error;
      setOpenModal(false);
      setNewDescription('');
      setNewAmount('');
      setNewCategory(undefined);
      setNewType('saida');
      setNewDate(format(new Date(), 'yyyy-MM-dd'));
      await fetchData();
      toast.success('Movimentação registrada');
    } catch (e: any) {
      toast.error('Erro ao criar movimentação');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Movimento de Caixa</h1>
          <p className="text-sm text-gray-600">Movimento de caixa a partir de {formatBrazilianDate(fromDate)}</p>
        </div>
        <div className="flex gap-2">
          <Input
                type="month"
                value={fromDate.slice(0, 7)}
                onChange={(e) => {
                  const v = e.target.value; // yyyy-MM
                  if (v) {
                    setFromDate(`${v}-01`);
                  }
                }}
                className="w-[180px]"
              />
          <Button variant="outline" onClick={() => setOpenCategoryModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
          <Button variant="outline" onClick={() => setOpenCloseModal(true)}>
            <Lock className="w-4 h-4 mr-2" />
            Fechar Caixa
          </Button>
          <Button variant="outline" onClick={() => setOpenPdfModal(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Gerar PDF
          </Button>
          <Button onClick={() => setOpenModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
          <div className={`text-xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatBrazilianCurrency(saldoTotal)}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saída</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td className="px-6 py-3 text-sm">{formatBrazilianDate(m.movement_date)}</td>
                    <td className="px-6 py-3 text-sm">{m.category_id ? (categoryMap.get(m.category_id) ?? 'Sem categoria') : 'Sem categoria'}</td>
                    <td className="px-6 py-3 text-sm text-right text-green-700">{m.entrada ? formatBrazilianCurrency(m.entrada) : '-'}</td>
                    <td className="px-6 py-3 text-sm text-right text-red-700">{m.saida ? formatBrazilianCurrency(m.saida) : '-'}</td>
                    <td className="px-6 py-3 text-sm text-right">{formatBrazilianCurrency((m as any).saldo)}</td>
                    <td className="px-6 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(m);
                            setEditType(m.type);
                            setEditDate(m.movement_date);
                            setEditDescription(m.description);
                            setEditCategory(m.category_id || undefined);
                            setEditAmount(formatBrazilianCurrencyValue(m.amount));
                            setEditOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteTargetId(m.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">Sem movimentações para o período</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Histórico de Movimentações Anteriores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saída</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo do Mês</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historySummaries.map(h => (
                  <tr key={h.key}>
                    <td className="px-6 py-3 text-sm">{h.start} - {h.end}</td>
                    <td className="px-6 py-3 text-sm text-right text-green-700">{formatBrazilianCurrency(h.entrada)}</td>
                    <td className="px-6 py-3 text-sm text-right text-red-700">{formatBrazilianCurrency(h.saida)}</td>
                    <td className={`px-6 py-3 text-sm text-right ${h.saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatBrazilianCurrency(h.saldo)}</td>
                    <td className="px-6 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => gerarPDFDoMesKey(h.key)} disabled={generatingPdfKey === h.key}>
                          <FileText className="w-4 h-4" />
                          <span className="sr-only">Gerar PDF do mês</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openHistoryDetails(h.key)}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {historySummaries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">Sem histórico anterior</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[80vh] overflow-hidden grid grid-rows-[auto,1fr,auto]">
          <DialogHeader>
            <DialogTitle>Movimentações de {detailTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto min-h-0">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saída</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-white shadow-sm border-l z-10">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detailRows.map(r => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 text-sm">{formatBrazilianDate(r.movement_date)}</td>
                        <td className="px-4 py-2 text-sm">{r.description}</td>
                        <td className="px-4 py-2 text-sm">{r.category_id ? (categoryMap.get(r.category_id) ?? 'Sem categoria') : 'Sem categoria'}</td>
                        <td className="px-4 py-2 text-sm text-right text-green-700">{r.entrada ? formatBrazilianCurrency(r.entrada) : '-'}</td>
                        <td className="px-4 py-2 text-sm text-right text-red-700">{r.saida ? formatBrazilianCurrency(r.saida) : '-'}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatBrazilianCurrency((r as any).saldo)}</td>
                        <td className="px-4 py-2 text-sm text-right sticky right-0 bg-white shadow-sm border-l z-10">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditing(r);
                                setEditType(r.type);
                                setEditDate(r.movement_date);
                                setEditDescription(r.description);
                                setEditCategory(r.category_id || undefined);
                                setEditAmount(formatBrazilianCurrencyValue(r.amount));
                                setEditOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteTargetId(r.id);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {detailRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">Sem movimentações no período</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openPdfModal} onOpenChange={setOpenPdfModal}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Gerar PDF por Período</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>De</Label>
                <DatePickerBr date={pdfFrom} setDate={setPdfFrom} placeholder="Dia/Mês/Ano" />
              </div>
              <div className="space-y-2">
                <Label>Até</Label>
                <DatePickerBr date={pdfTo} setDate={setPdfTo} placeholder="Dia/Mês/Ano" />
              </div>
            </div>
            <p className="text-xs text-gray-500">O relatório usa as movimentações já carregadas na tela.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPdfModal(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!pdfFrom || !pdfTo) {
                  toast.error('Selecione o período');
                  return;
                }
                const start = pdfFrom;
                const end = pdfTo;
                if (start > end) {
                  toast.error('Data inicial maior que a final');
                  return;
                }
                gerarPDF(start, end);
                toast.success('PDF gerado com sucesso');
                setOpenPdfModal(false);
              }}
            >
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Descrição ou histórico" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Popover open={openCategoryPicker} onOpenChange={setOpenCategoryPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {newCategory ? (categories.find(c => c.id === newCategory)?.name || 'Selecione') : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar categoria..." />
                      <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {activeCategories.map(c => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => {
                                setNewCategory(c.id);
                                setOpenCategoryPicker(false);
                              }}
                            >
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="truncate">{c.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteCategory(c.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={newAmount}
                  onChange={(e) => setNewAmount(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button onClick={onCreate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCategoryModal} onOpenChange={setOpenCategoryModal}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex.: Compras Super Mercado"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCategoryModal(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                try {
                  const name = (newCategoryName || '').trim();
                  if (!name) {
                    toast.error('Informe o nome da categoria');
                    return;
                  }
                  const { data, error } = await supabase
                    .from('cash_categories')
                    .insert([{ name, active: true }])
                    .select()
                    .single();
                  if (error) throw error;
                  setCategories(prev => [...prev, data as CashCategory]);
                  setNewCategory((data as any).id);
                  setNewCategoryName('');
                  setOpenCategoryModal(false);
                  toast.success('Categoria criada');
                } catch (e: any) {
                  toast.error('Erro ao criar categoria');
                }
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Descrição ou histórico" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Popover open={openEditCategoryPicker} onOpenChange={setOpenEditCategoryPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {editCategory ? (categories.find(c => c.id === editCategory)?.name || 'Selecione') : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar categoria..." />
                      <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {activeCategories.map(c => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => {
                                setEditCategory(c.id);
                                setOpenEditCategoryPicker(false);
                              }}
                            >
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="truncate">{c.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteCategory(c.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!editing) return;
                try {
                  const amountNumber = parseBrazilianCurrency(editAmount || '');
                  if (!editDescription || !amountNumber || !editDate) {
                    toast.error('Preencha descrição, data e valor');
                    return;
                  }
                  const { error } = await supabase
                    .from('cash_movements')
                    .update({
                      movement_date: editDate,
                      description: editDescription,
                      type: editType,
                      amount: amountNumber,
                      category_id: editCategory || null,
                    })
                    .eq('id', editing.id);
                  if (error) throw error;
                  toast.success('Movimentação atualizada');
                  setEditOpen(false);
                  setEditing(null);
                  await fetchData();
                } catch (e: any) {
                  toast.error('Erro ao atualizar movimentação');
                }
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCloseModal} onOpenChange={setOpenCloseModal}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">Tem certeza que deseja fechar o caixa do período atual?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCloseModal(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                try {
                  const d = new Date(fromDate);
                  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
                  const nextStr = format(next, 'yyyy-MM-dd');
                  setFromDate(nextStr);
                  setOpenCloseModal(false);
                  await fetchData();
                  toast.success('Caixa fechado');
                } catch (e: any) {
                  toast.error('Erro ao fechar caixa');
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600">
            Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTargetId) return;
                const { error } = await supabase.from('cash_movements').delete().eq('id', deleteTargetId);
                if (error) {
                  toast.error('Erro ao excluir');
                } else {
                  toast.success('Movimentação excluída');
                  setDeleteConfirmOpen(false);
                  setDeleteTargetId(null);
                  await fetchData();
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteCategoryConfirmOpen} onOpenChange={setDeleteCategoryConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-600">
            Tem certeza que deseja excluir a categoria{' '}
            <span className="font-medium text-gray-900">
              {deleteCategoryTargetId ? (categories.find((c) => c.id === deleteCategoryTargetId)?.name || '') : ''}
            </span>
            ? Esta ação não pode ser desfeita.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteCategoryConfirmOpen(false);
                setDeleteCategoryTargetId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteCategoryTargetId) return;
                try {
                  const { error } = await supabase
                    .from('cash_categories')
                    .update({ active: false })
                    .eq('id', deleteCategoryTargetId);
                  if (error) throw error;

                  setCategories((prev) => prev.map((c) => (c.id === deleteCategoryTargetId ? { ...c, active: false } : c)));
                  if (newCategory === deleteCategoryTargetId) setNewCategory(undefined);
                  if (editCategory === deleteCategoryTargetId) setEditCategory(undefined);

                  toast.success('Categoria excluída');
                  setDeleteCategoryConfirmOpen(false);
                  setDeleteCategoryTargetId(null);
                } catch {
                  toast.error('Erro ao excluir categoria');
                }
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MovimentoCaixaPage;
