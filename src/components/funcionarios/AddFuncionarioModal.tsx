import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, formatPhone, formatCurrencyInput, parseBrazilianSalary, isValidBrazilianSalary } from "@/lib/utils";
import DateInput from '@/components/ui/date-input';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Funcionario, Departamento } from "@/types";

// Schema de validação
const funcionarioSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00"),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  data_nascimento: z.string().optional(),
  cargo: z.string().min(2, "Cargo deve ter pelo menos 2 caracteres"),
  departamento_id: z.string().min(1, "Selecione um departamento"),
  // Salário digitado em formato brasileiro (ex: 1.234,56)
  salario: z.string()
    .min(1, "Salário é obrigatório")
    .refine((val) => isValidBrazilianSalary(val), {
      message: "Formato de salário inválido. Use o formato 1.234,56"
    }),
  data_admissao: z.string().min(1, "Data de admissão é obrigatória"),
  status: z.enum(["ativo", "inativo", "ferias", "afastado"]),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface AddFuncionarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddFuncionarioModal({ open, onOpenChange, onSuccess }: AddFuncionarioModalProps) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      telefone: "",
      email: "",
      data_nascimento: "",
      cargo: "",
      departamento_id: "",
      salario: "",
      data_admissao: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
      status: "ativo",
    },
  });

  // Carregar departamentos
  useEffect(() => {
    const loadDepartamentos = async () => {
      try {
        const { data, error } = await supabase
          .from('departamentos')
          .select('id, nome, descricao, ativo, created_at, updated_at')
          .order('nome');

        if (error) throw error;
        setDepartamentos(data || []);
      } catch (error) {
        console.error('Erro ao carregar departamentos:', error);
        toast.error('Erro ao carregar departamentos');
      }
    };

    if (open) {
      loadDepartamentos();
    }
  }, [open]);



  const onSubmit = async (data: FuncionarioFormData) => {
    setIsLoading(true);
    try {
      console.log('Dados do formulário:', data);
      console.log('Data de admissão enviada:', data.data_admissao);
      
      // Validação adicional da data de admissão
      if (!data.data_admissao) {
        toast.error('Data de admissão é obrigatória');
        return;
      }

      // Garantir que a data está no formato correto (YYYY-MM-DD)
      let dataAdmissaoFormatted = data.data_admissao;
      if (data.data_admissao.includes('/')) {
        const parts = data.data_admissao.split('/');
        if (parts.length === 3) {
          dataAdmissaoFormatted = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      
      console.log('Data de admissão formatada para banco:', dataAdmissaoFormatted);

      const { error } = await supabase
        .from('funcionarios')
        .insert([{
          nome: data.nome,
          cpf: data.cpf,
          telefone: data.telefone,
          email: data.email || null,
          data_nascimento: data.data_nascimento || null,
          cargo: data.cargo,
          departamento_id: data.departamento_id,
          salario: parseBrazilianSalary(data.salario),
          data_admissao: dataAdmissaoFormatted, // Enviando no formato ISO (YYYY-MM-DD)
          status: data.status,
          created_by: user?.id || '',
        }]);

      if (error) throw error;

      toast.success('Funcionário adicionado com sucesso!');
      form.reset({
        nome: "",
        cpf: "",
        telefone: "",
        email: "",
        data_nascimento: "",
        cargo: "",
        departamento_id: "",
        salario: "",
        data_admissao: new Date().toISOString().split('T')[0], // Reset com data atual
        status: "ativo",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar funcionário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo funcionário. Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF */}
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={14}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone */}
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(61) 99999-9999"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={15}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="funcionario@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data de Nascimento */}
              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <DateInput
                        id="data_nascimento"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="dd/mm/aaaa"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cargo */}
              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Técnico de Enfermagem" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Departamento */}
              <FormField
                control={form.control}
                name="departamento_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um departamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departamentos.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Salário */}
              <FormField
                control={form.control}
                name="salario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário *</FormLabel>
                    <FormControl>
                      <Input
                        id="salario"
                        type="text"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data de Admissão */}
              <FormField
                control={form.control}
                name="data_admissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Admissão *</FormLabel>
                    <FormControl>
                      <DateInput
                        id="data_admissao"
                        value={field.value}
                        onChange={field.onChange}
                        required
                        placeholder="dd/mm/aaaa"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="ferias">Férias</SelectItem>
                        <SelectItem value="afastado">Afastado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Funcionário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}