import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DateInput from '@/components/ui/date-input';

interface Lembrete {
  id: string;
  titulo: string;
  descricao?: string;
  data_lembrete: string;
  hora_lembrete?: string;
  tipo: string;
  prioridade: string;
  status: string;
  funcionario_id?: string;
  idoso_id?: string;
  observacoes?: string;
  recorrente: boolean;
  tipo_recorrencia?: string;
}

interface EditLembreteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lembrete: Lembrete;
  onSuccess: () => void;
}

interface Funcionario {
  id: string;
  nome: string;
  cargo?: string;
}

interface Idoso {
  id: string;
  nome: string;
}

export default function EditLembreteModal({ open, onOpenChange, lembrete, onSuccess }: EditLembreteModalProps) {
  const [loading, setLoading] = useState(false);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [idosos, setIdosos] = useState<Idoso[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_lembrete: "",
    hora_lembrete: "",
    tipo: "geral",
    prioridade: "media",
    status: "pendente",
    funcionario_id: "",
    idoso_id: "",
    observacoes: "",
    recorrente: false,
    tipo_recorrencia: ""
  });

  useEffect(() => {
    if (open && lembrete) {
      setFormData({
        titulo: lembrete.titulo || "",
        descricao: lembrete.descricao || "",
        data_lembrete: lembrete.data_lembrete || "",
        hora_lembrete: lembrete.hora_lembrete || "",
        tipo: lembrete.tipo || "geral",
        prioridade: lembrete.prioridade || "media",
        status: lembrete.status || "pendente",
        funcionario_id: lembrete.funcionario_id || "none",
        idoso_id: lembrete.idoso_id || "none",
        observacoes: lembrete.observacoes || "",
        recorrente: lembrete.recorrente || false,
        tipo_recorrencia: lembrete.tipo_recorrencia || ""
      });

      fetchFuncionarios();
      fetchIdosos();
    }
  }, [open, lembrete]);

  const fetchFuncionarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['admin', 'developer'])
        .eq('active', true)
        .order('full_name');

      if (error) {
        console.error('Erro ao buscar administradores:', error);
        return;
      }

      // Mapear os dados para o formato esperado
      const administradores = data?.map(profile => ({
        id: profile.id,
        nome: profile.full_name || 'Sem nome',
        cargo: profile.role === 'developer' ? 'Desenvolvedor' : 'Administrador'
      })) || [];

      setFuncionarios(administradores);
    } catch (error) {
      console.error('Erro ao buscar administradores:', error);
    }
  };

  const fetchIdosos = async () => {
    try {
      const { data, error } = await supabase
        .from('idosos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar idosos:', error);
        return;
      }

      setIdosos(data || []);
    } catch (error) {
      console.error('Erro ao buscar idosos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.data_lembrete) {
      toast({
        title: "Erro",
        description: "A data do lembrete é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const lembreteData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        data_lembrete: formData.data_lembrete,
        hora_lembrete: formData.hora_lembrete || null,
        tipo: formData.tipo,
        prioridade: formData.prioridade,
        status: formData.status,
        funcionario_id: formData.funcionario_id === 'none' ? null : formData.funcionario_id || null,
        idoso_id: formData.idoso_id === 'none' ? null : formData.idoso_id || null,
        observacoes: formData.observacoes.trim() || null,
        recorrente: formData.recorrente,
        tipo_recorrencia: formData.recorrente ? formData.tipo_recorrencia : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('lembretes')
        .update(lembreteData)
        .eq('id', lembrete.id);

      if (error) {
        console.error('Erro ao atualizar lembrete:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o lembrete.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Lembrete atualizado com sucesso!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar lembrete:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar lembrete.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Lembrete</DialogTitle>
          <DialogDescription>
            Edite as informações do lembrete
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Digite o título do lembrete"
                required
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Digite uma descrição detalhada (opcional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_lembrete">Data do Lembrete *</Label>
                <DateInput
                  id="data_lembrete"
                  value={formData.data_lembrete}
                  onChange={(value) => handleInputChange('data_lembrete', value)}
                  placeholder="dd/mm/aaaa"
                  required
                />
              </div>

              <div>
                <Label htmlFor="hora_lembrete">Hora do Lembrete</Label>
                <Input
                  id="hora_lembrete"
                  type="time"
                  value={formData.hora_lembrete}
                  onChange={(e) => handleInputChange('hora_lembrete', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="medicamento">Medicamento</SelectItem>
                    <SelectItem value="consulta">Consulta</SelectItem>
                    <SelectItem value="atividade">Atividade</SelectItem>
                    <SelectItem value="alimentacao">Alimentação</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(value) => handleInputChange('prioridade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="funcionario_id">Funcionário Responsável</Label>
                <Select value={formData.funcionario_id} onValueChange={(value) => handleInputChange('funcionario_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {funcionarios.map((funcionario) => (
                      <SelectItem key={funcionario.id} value={funcionario.id}>
                        {funcionario.nome} {funcionario.cargo && `(${funcionario.cargo})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="idoso_id">Idoso Relacionado</Label>
                <Select value={formData.idoso_id} onValueChange={(value) => handleInputChange('idoso_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um idoso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {idosos.map((idoso) => (
                      <SelectItem key={idoso.id} value={idoso.id}>
                        {idoso.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações adicionais (opcional)"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => handleInputChange('recorrente', checked)}
              />
              <Label htmlFor="recorrente">Lembrete recorrente</Label>
            </div>

            {formData.recorrente && (
              <div>
                <Label htmlFor="tipo_recorrencia">Tipo de Recorrência</Label>
                <Select value={formData.tipo_recorrencia} onValueChange={(value) => handleInputChange('tipo_recorrencia', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a recorrência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}