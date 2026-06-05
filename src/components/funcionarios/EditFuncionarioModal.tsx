import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Funcionario } from "@/types";
import { Edit } from "lucide-react";
import { formatCPF, formatPhone, formatBrazilianSalary, parseBrazilianSalary, isValidBrazilianSalary, formatCurrencyInput, parseISOToLocalDate, formatLocalDateToISO } from "@/lib/utils";
import DateInput from '@/components/ui/date-input';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditFuncionarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: Funcionario | null;
  onSuccess: (funcionario: Funcionario) => void;
}

export function EditFuncionarioModal({
  open,
  onOpenChange,
  funcionario,
  onSuccess,
}: EditFuncionarioModalProps) {
  console.log('EditFuncionarioModal renderizado com:', { open, funcionario: !!funcionario });
  
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    cargo: "",
    departamento_id: "",
    salario: "",
    data_admissao: "",
    data_nascimento: "",
    status: "ativo",
  });

  const [departamentos, setDepartamentos] = useState<Array<{id: string, nome: string}>>([]);

  // Carregar departamentos
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const { data, error } = await supabase
          .from('departamentos')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');
        
        if (error) {
          console.error('Erro ao carregar departamentos:', error);
          // Usar departamentos padrão se houver erro
          setDepartamentos([
            { id: 'dept-1', nome: 'Enfermagem' },
            { id: 'dept-2', nome: 'Cuidados' },
            { id: 'dept-3', nome: 'Nutrição' },
            { id: 'dept-4', nome: 'Transporte' },
            { id: 'dept-5', nome: 'Administração' }
          ]);
        } else {
          setDepartamentos(data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
        // Usar departamentos padrão em caso de erro
        setDepartamentos([
          { id: 'dept-1', nome: 'Enfermagem' },
          { id: 'dept-2', nome: 'Cuidados' },
          { id: 'dept-3', nome: 'Nutrição' },
          { id: 'dept-4', nome: 'Transporte' },
          { id: 'dept-5', nome: 'Administração' }
        ]);
      }
    };

    if (open) {
      fetchDepartamentos();
    }
  }, [open]);

  const [isLoading, setIsLoading] = useState(false);



  // Carregar dados do funcionário quando o modal abrir
  useEffect(() => {
    if (funcionario && open) {
      console.log('Carregando dados do funcionário:', funcionario);
      
      // Formatar data de admissão para o formato do input (YYYY-MM-DD)
      let dataAdmissaoFormatada = "";
      if (funcionario.data_admissao) {
        try {
          const date = parseISOToLocalDate(funcionario.data_admissao);
          if (date) {
            dataAdmissaoFormatada = formatLocalDateToISO(date);
          }
        } catch (error) {
          console.error('Erro ao formatar data de admissão:', error);
        }
      }

      // Formatar data de nascimento para o formato do input (YYYY-MM-DD)
      let dataNascimentoFormatada = "";
      if (funcionario.data_nascimento) {
        try {
          const date = parseISOToLocalDate(funcionario.data_nascimento);
          if (date) {
            dataNascimentoFormatada = formatLocalDateToISO(date);
          }
        } catch (error) {
          console.error('Erro ao formatar data de nascimento:', error);
        }
      }

      // Formatar salário para exibição
      let salarioFormatado = "";
      if (funcionario.salario) {
        try {
          // Se o salário já está como string formatada, usar diretamente
          if (typeof funcionario.salario === 'string') {
            salarioFormatado = funcionario.salario;
          } else {
            // Se é número, formatar
            salarioFormatado = formatBrazilianSalary(funcionario.salario.toString());
          }
        } catch (error) {
          console.error('Erro ao formatar salário:', error);
          salarioFormatado = funcionario.salario?.toString() || "";
        }
      }

      setFormData({
        nome: funcionario.nome || "",
        cpf: formatCPF(funcionario.cpf || ""),
        telefone: funcionario.telefone || "",
        email: funcionario.email || "",
        cargo: funcionario.cargo || "",
        departamento_id: funcionario.departamento_id || "",
        salario: salarioFormatado,
        data_admissao: dataAdmissaoFormatada,
        data_nascimento: dataNascimentoFormatada,
        status: funcionario.status || "ativo",
      });
    }
  }, [funcionario, open]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'salario') {
      const formatted = formatCurrencyInput(value);
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }));
    } else if (field === 'cpf') {
      const formatted = formatCPF(value);
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!funcionario) {
      toast.error('Funcionário não encontrado');
      return;
    }

    // Validações básicas
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.cpf.trim()) {
      toast.error('CPF é obrigatório');
      return;
    }

    if (!formData.cargo.trim()) {
      toast.error('Cargo é obrigatório');
      return;
    }

    if (!formData.departamento_id) {
      toast.error('Departamento é obrigatório');
      return;
    }

    if (!formData.salario.trim()) {
      toast.error('Salário é obrigatório');
      return;
    }

    if (!formData.data_admissao) {
      toast.error('Data de admissão é obrigatória');
      return;
    }

    setIsLoading(true);

    try {
      // Processar salário - remover formatação para salvar como número
      let salarioNumerico: number;
      try {
        if (isValidBrazilianSalary(formData.salario)) {
          salarioNumerico = parseBrazilianSalary(formData.salario);
        } else {
          // Tentar converter diretamente se não estiver no formato brasileiro
          const salarioLimpo = formData.salario.replace(/[^\d,]/g, '').replace(',', '.');
          salarioNumerico = parseFloat(salarioLimpo);
          if (isNaN(salarioNumerico)) {
            throw new Error('Salário inválido');
          }
        }
      } catch (error) {
        toast.error('Formato de salário inválido');
        return;
      }

      // Processar data de admissão
      let dataAdmissaoFormatada: string;
      try {
        const date = parseISOToLocalDate(formData.data_admissao);
        if (!date) {
          throw new Error('Data inválida');
        }
        dataAdmissaoFormatada = formatLocalDateToISO(date);
      } catch (error) {
        toast.error('Data de admissão inválida');
        return;
      }

      // Processar data de nascimento (opcional)
      let dataNascimentoFormatada: string | null = null;
      if (formData.data_nascimento) {
        try {
          const date = parseISOToLocalDate(formData.data_nascimento);
          if (!date) {
            throw new Error('Data inválida');
          }
          dataNascimentoFormatada = formatLocalDateToISO(date);
        } catch (error) {
          toast.error('Data de nascimento inválida');
          return;
        }
      }

      const dadosAtualizados = {
        nome: formData.nome.trim(),
        cpf: formData.cpf.trim(),
        telefone: formData.telefone.trim(),
        email: formData.email.trim(),
        cargo: formData.cargo.trim(),
        departamento_id: formData.departamento_id,
        salario: salarioNumerico,
        data_admissao: dataAdmissaoFormatada,
        data_nascimento: dataNascimentoFormatada,
        status: formData.status,
      };

      console.log('Dados para atualização:', dadosAtualizados);

      const { data, error } = await supabase
        .from('funcionarios')
        .update(dadosAtualizados)
        .eq('id', funcionario.id)
        .select(`
          *,
          departamentos (
            id,
            nome
          )
        `)
        .single();

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Funcionário atualizado com sucesso:', data);
      
      toast.success('Funcionário atualizado com sucesso!');
      onSuccess(data);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar funcionário:", error);
      toast.error(error.message || 'Erro ao atualizar funcionário');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      cargo: "",
      departamento_id: "",
      salario: "",
      data_admissao: "",
      data_nascimento: "",
      status: "ativo",
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Funcionário
          </DialogTitle>
          <DialogDescription>
            {funcionario ? `Atualize as informações do funcionário ${funcionario.nome}` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        {!funcionario ? (
          <div className="flex justify-center items-center py-8">
            <p>Carregando dados do funcionário...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Pessoais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  required
                  maxLength={14}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="funcionario@crevin.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="(61) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <DateInput
                  id="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={(value) => handleInputChange("data_nascimento", value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Profissionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo *</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => handleInputChange("cargo", e.target.value)}
                  placeholder="Ex: Técnico de Enfermagem"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento *</Label>
                <Select
                  value={formData.departamento_id}
                  onValueChange={(value) => {
                    console.log('Departamento selecionado:', value); // Debug
                    handleInputChange("departamento_id", value);
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salario">Salário *</Label>
                <Input
                  id="salario"
                  type="text"
                  value={formData.salario}
                  onChange={(e) => handleInputChange("salario", e.target.value)}
                  placeholder="Digite o salário"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_admissao">Data de Admissão *</Label>
                <DateInput
                  id="data_admissao"
                  value={formData.data_admissao}
                  onChange={(value) => handleInputChange("data_admissao", value)}
                  required
                  placeholder="dd/mm/aaaa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="licenca">Licença</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}