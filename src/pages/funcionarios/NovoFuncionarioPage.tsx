import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User, Building2, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, formatPhone, formatCurrencyInput, parseBrazilianSalary, isValidBrazilianSalary } from "@/lib/utils";
import DateInput from '@/components/ui/date-input';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { Departamento } from "@/types";

// Schema de validação
const funcionarioSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00"),
  rg: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  data_nascimento: z.string().optional(),
  cargo: z.string().min(2, "Cargo deve ter pelo menos 2 caracteres"),
  departamento_id: z.string().min(1, "Selecione um departamento"),
  salario: z.string().refine((val) => !val || isValidBrazilianSalary(val), {
    message: "Formato de salário inválido. Use o formato 1.234,56"
  }).optional(),
  data_admissao: z.string().min(1, "Data de admissão é obrigatória"),
  status: z.enum(["ativo", "inativo", "ferias", "afastado"]),
  observacoes: z.string().optional(),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

export default function NovoFuncionarioPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      rg: "",
      telefone: "",
      email: "",
      endereco: "",
      data_nascimento: "",
      cargo: "",
      departamento_id: "",
      salario: 0,
      data_admissao: new Date().toISOString().split('T')[0],
      status: "ativo",
      observacoes: "",
    },
  });

  // Carregar departamentos
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const { data, error } = await supabase
          .from('departamentos')
          .select('id, nome, descricao, ativo')
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        setDepartamentos(data || []);
      } catch (error) {
        console.error('Erro ao carregar departamentos:', error);
        toast.error('Erro ao carregar departamentos');
      }
    };

    fetchDepartamentos();
  }, []);

  const onSubmit = async (data: FuncionarioFormData) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('funcionarios')
        .insert({
          nome: data.nome,
          cpf: data.cpf.replace(/\D/g, ''), // Remove formatação do CPF
          rg: data.rg || null,
          telefone: data.telefone.replace(/\D/g, ''), // Remove formatação do telefone
          email: data.email || null,
          endereco: data.endereco || null,
          data_nascimento: data.data_nascimento || null,
          cargo: data.cargo,
          departamento_id: data.departamento_id,
          salario: data.salario ? parseBrazilianSalary(data.salario) : null,
          data_admissao: data.data_admissao,
          status: data.status,
          observacoes: data.observacoes || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Funcionário cadastrado com sucesso!');
      navigate('/funcionarios');
    } catch (error: any) {
      console.error('Erro ao cadastrar funcionário:', error);
      toast.error(error.message || 'Erro ao cadastrar funcionário');
    } finally {
      setLoading(false);
    }
  };

  // Formatação automática de CPF
  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    form.setValue('cpf', formatted);
  };

  // Formatação automática de telefone
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    form.setValue('telefone', formatted);
  };

  // Formatação automática de salário
  const handleSalaryChange = (value: string) => {
    const formatted = formatCurrencyInput(value);
    form.setValue('salario', formatted);
  };



  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/funcionarios')}
            className="w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Novo Funcionário</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Cadastre um novo funcionário no sistema
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Dados pessoais do funcionário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                          onChange={(e) => handleCPFChange(e.target.value)}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o RG" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          {...field}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <div className="grid gap-4 grid-cols-1">
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o endereço completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Building2 className="h-5 w-5" />
                Informações Profissionais
              </CardTitle>
              <CardDescription>
                Dados relacionados ao trabalho
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o cargo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="salario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="1.234,56"
                            className="pl-10"
                            {...field}
                            onChange={(e) => {
                              handleSalaryChange(e.target.value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

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

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre o funcionário..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/funcionarios')}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Funcionário'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}