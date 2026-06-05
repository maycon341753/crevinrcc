import { useState, useEffect } from "react";
import { Calendar, Gift, Users, Heart, Cake } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatBrazilianDate, parseISOToLocalDate, calculateAge } from "@/lib/utils";

interface Aniversariante {
  id: string;
  nome: string;
  data_nascimento: string;
  tipo: 'funcionario' | 'idoso';
  cargo?: string;
  departamento?: string;
  idade: number;
  diasParaAniversario: number;
}

export default function AniversariantesPage() {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const hoje = new Date();
    const nomesMeses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    setMesAtual(nomesMeses[hoje.getMonth()]);
    fetchAniversariantes();
  }, []);

  const calcularDiasParaAniversario = (dataNascimento: string): number => {
    const hoje = new Date();
    // Resetar horas para comparação justa de dias
    hoje.setHours(0, 0, 0, 0);
    
    const nascimento = parseISOToLocalDate(dataNascimento);
    if (!nascimento) return 0;
    
    const anoAtual = hoje.getFullYear();
    
    // Criar data do aniversário no ano atual (usando o ano atual, mas mês e dia do nascimento)
    const aniversarioEsteAno = new Date(anoAtual, nascimento.getMonth(), nascimento.getDate());
    
    // Se o aniversário já passou este ano, calcular para o próximo ano
    if (aniversarioEsteAno < hoje) {
      aniversarioEsteAno.setFullYear(anoAtual + 1);
    }
    
    // Calcular diferença em dias
    const diffTime = aniversarioEsteAno.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const fetchAniversariantes = async () => {
    try {
      setLoading(true);
      
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1; // getMonth() retorna 0-11, precisamos 1-12
      
      // Buscar funcionários aniversariantes do mês
      const { data: funcionarios, error: errorFuncionarios } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          data_nascimento,
          cargo,
          departamento_id,
          departamentos!inner(nome)
        `)
        .eq('status', 'ativo')
        .not('data_nascimento', 'is', null);

      if (errorFuncionarios) {
        console.error('Erro ao buscar funcionários:', errorFuncionarios);
      }

      // Buscar idosos aniversariantes do mês
      const { data: idosos, error: errorIdosos } = await supabase
        .from('idosos')
        .select('id, nome, data_nascimento')
        .eq('ativo', true)
        .not('data_nascimento', 'is', null);

      if (errorIdosos) {
        console.error('Erro ao buscar idosos:', errorIdosos);
      }

      const aniversariantesDoMes: Aniversariante[] = [];

      // Processar funcionários
      if (funcionarios) {
        funcionarios.forEach((funcionario) => {
          if (funcionario.data_nascimento) {
            const dataNasc = parseISOToLocalDate(funcionario.data_nascimento);
            if (dataNasc) {
              const mesNascimento = dataNasc.getMonth() + 1;
              
              if (mesNascimento === mesAtual) {
                aniversariantesDoMes.push({
                  id: funcionario.id,
                  nome: funcionario.nome,
                  data_nascimento: funcionario.data_nascimento,
                  tipo: 'funcionario',
                  cargo: funcionario.cargo,
                departamento: funcionario.departamentos?.nome,
                idade: calculateAge(funcionario.data_nascimento),
                diasParaAniversario: calcularDiasParaAniversario(funcionario.data_nascimento)
              });
            }
          }
        }
      });
    }

    // Processar idosos
      if (idosos) {
        idosos.forEach((idoso) => {
          if (idoso.data_nascimento) {
            const dataNasc = parseISOToLocalDate(idoso.data_nascimento);
            if (dataNasc) {
              const mesNascimento = dataNasc.getMonth() + 1;
              
              if (mesNascimento === mesAtual) {
                aniversariantesDoMes.push({
                  id: idoso.id,
                  nome: idoso.nome,
                  data_nascimento: idoso.data_nascimento,
                  tipo: 'idoso',
                  idade: calculateAge(idoso.data_nascimento),
                  diasParaAniversario: calcularDiasParaAniversario(idoso.data_nascimento)
                });
              }
            }
          }
        });
      }

      // Ordenar por dias para o aniversário (mais próximos primeiro)
      aniversariantesDoMes.sort((a, b) => a.diasParaAniversario - b.diasParaAniversario);
      
      setAniversariantes(aniversariantesDoMes);

    } catch (error) {
      console.error('Erro ao buscar aniversariantes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar aniversariantes do mês.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (tipo: 'funcionario' | 'idoso') => {
    return tipo === 'funcionario' ? 'default' : 'secondary';
  };

  const getBadgeIcon = (tipo: 'funcionario' | 'idoso') => {
    return tipo === 'funcionario' ? <Users className="w-3 h-3 mr-1" /> : <Heart className="w-3 h-3 mr-1" />;
  };

  const formatarDataAniversario = (dataNascimento: string) => {
    const data = parseISOToLocalDate(dataNascimento);
    if (!data) return "";
    return `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const getDiasTexto = (dias: number) => {
    if (dias === 0) return "Hoje! 🎉";
    if (dias === 1) return "Amanhã";
    return `${dias} dias`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cake className="w-8 h-8 text-pink-500" />
            Aniversariantes de {mesAtual}
          </h1>
          <p className="text-muted-foreground">
            Funcionários e idosos que fazem aniversário este mês
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aniversariantes</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aniversariantes.length}</div>
            <p className="text-xs text-muted-foreground">
              neste mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aniversariantes.filter(a => a.tipo === 'funcionario').length}
            </div>
            <p className="text-xs text-muted-foreground">
              aniversariantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idosos</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aniversariantes.filter(a => a.tipo === 'idoso').length}
            </div>
            <p className="text-xs text-muted-foreground">
              aniversariantes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Aniversariantes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Aniversariantes</CardTitle>
          <CardDescription>
            Todos os aniversariantes do mês de {mesAtual.toLowerCase()}, ordenados por proximidade da data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando aniversariantes...</div>
            </div>
          ) : aniversariantes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Nenhum aniversariante encontrado para este mês.</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Cargo/Departamento</TableHead>
                  <TableHead>Dias para Aniversário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aniversariantes.map((aniversariante) => (
                  <TableRow key={`${aniversariante.tipo}-${aniversariante.id}`}>
                    <TableCell className="font-medium">
                      {aniversariante.nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(aniversariante.tipo)} className="flex items-center w-fit">
                        {getBadgeIcon(aniversariante.tipo)}
                        {aniversariante.tipo === 'funcionario' ? 'Funcionário' : 'Idoso'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatarDataAniversario(aniversariante.data_nascimento)}
                    </TableCell>
                    <TableCell>
                      {aniversariante.idade + (aniversariante.diasParaAniversario === 0 ? 1 : 0)} anos
                    </TableCell>
                    <TableCell>
                      {aniversariante.tipo === 'funcionario' 
                        ? `${aniversariante.cargo}${aniversariante.departamento ? ` - ${aniversariante.departamento}` : ''}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={aniversariante.diasParaAniversario === 0 ? "destructive" : "outline"}
                        className={aniversariante.diasParaAniversario === 0 ? "animate-pulse" : ""}
                      >
                        {getDiasTexto(aniversariante.diasParaAniversario)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}