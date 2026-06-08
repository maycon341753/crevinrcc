import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { History, Search, User, Calendar, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface IdosoComHistorico {
  id: string;
  nome: string;
  quarto: string | null;
  data_nascimento: string;
  total_registros: number;
  ultima_atualizacao: string;
}

export default function ProntuarioNutricionalHistoryList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [idosos, setIdosos] = useState<IdosoComHistorico[]>([]);

  useEffect(() => {
    fetchIdososComHistorico();
  }, []);

  const fetchIdososComHistorico = async () => {
    try {
      setLoading(true);
      
      // Buscar idosos que possuem pelo menos um registro no histórico
      const { data, error } = await supabase
        .from('historico_prontuario_nutricional')
        .select(`
          idoso_id,
          data_registro,
          idoso:idosos (
            id,
            nome,
            quarto,
            data_nascimento
          )
        `)
        .order('data_registro', { ascending: false });

      if (error) throw error;

      // Agrupar por idoso para mostrar apenas um card por idoso com o total de registros
      const grouped = data.reduce((acc: Record<string, IdosoComHistorico>, curr: any) => {
        const idoso = curr.idoso;
        if (!idoso) return acc;
        
        if (!acc[idoso.id]) {
          acc[idoso.id] = {
            id: idoso.id,
            nome: idoso.nome,
            quarto: idoso.quarto,
            data_nascimento: idoso.data_nascimento,
            total_registros: 1,
            ultima_atualizacao: curr.data_registro
          };
        } else {
          acc[idoso.id].total_registros += 1;
        }
        return acc;
      }, {});

      setIdosos(Object.values(grouped));
    } catch (error) {
      console.error('Erro ao carregar lista de histórico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de históricos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredIdosos = idosos.filter(idoso =>
    idoso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idoso.quarto?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
            <History className="h-8 w-8" />
            Histórico de Prontuários Nutricionais
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Selecione um idoso para visualizar seu histórico completo de evoluções
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome do idoso ou quarto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdosos.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum histórico encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Não há históricos que correspondam à sua busca."
                    : "Ainda não há registros no histórico nutricional."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredIdosos.map((idoso) => (
              <Card 
                key={idoso.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/idosos/${idoso.id}/historico-nutricional`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{idoso.nome}</CardTitle>
                        <CardDescription>
                          {calculateAge(idoso.data_nascimento)} anos
                          {idoso.quarto && ` • Quarto ${idoso.quarto}`}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Registros:
                      </span>
                      <span className="font-medium">{idoso.total_registros}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Última atualização:
                      </span>
                      <span className="font-medium">{formatDate(idoso.ultima_atualizacao)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Ver Histórico Completo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
