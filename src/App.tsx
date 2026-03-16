import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { SecurityGuard } from "@/components/auth/SecurityGuard";
import { useRecurringAccounts } from "@/hooks/useRecurringAccounts";
import { Loader2 } from "lucide-react";
import ExemploImagem from "@/components/ExemploImagem";
import TesteImagemSimples from "@/components/TesteImagemSimples";

// Pages
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import FuncionariosPage from "./pages/funcionarios/FuncionariosPage";
import NovoFuncionarioPage from "./pages/funcionarios/NovoFuncionarioPage";
import AdvertenciasPage from "./pages/funcionarios/AdvertenciasPage";
import AniversariantesPage from "./pages/funcionarios/AniversariantesPage";
import DepartamentosPage from "./pages/departamentos/DepartamentosPage";
import DoacoesPage from "./pages/doacoes/DoacoesPage";
import DoacoesDinheiroPage from "./pages/doacoes/DoacoesDinheiroPage";
import DoacoesRecibosPage from "./pages/doacoes/DoacoesRecibosPage";
import DoacoesRelatoriosPage from "./pages/doacoes/DoacoesRelatoriosPage";
import DoacoesItensPage from "./pages/doacoes/DoacoesItensPage";
import IdososPage from "./pages/idosos/IdososPage";
import QuartosPage from "./pages/idosos/QuartosPage";
import MedicoPage from "./pages/idosos/MedicoPage";
import { NovoIdosoPage } from "./pages/idosos/NovoIdosoPage";
import ListaEsperaPage from "./pages/idosos/ListaEsperaPage";
import ProntuarioNutricional from "./pages/idosos/ProntuarioNutricional";
import ProntuarioNutricionalList from "./pages/idosos/ProntuarioNutricionalList";
import ProntuarioMedico from "./pages/idosos/ProntuarioMedico";
import ProntuarioMedicoList from "./pages/idosos/ProntuarioMedicoList";
import ProntuarioFisioterapeutico from "./pages/idosos/ProntuarioFisioterapeutico";
import ProntuarioFisioterapeuticoList from "./pages/idosos/ProntuarioFisioterapeuticoList";
import FinanceiroPage from "./pages/financeiro/FinanceiroPage";
import ContasPagarPage from "./pages/financeiro/ContasPagarPage";
import ContasReceberPage from "./pages/financeiro/ContasReceberPage";
import ReceitasFuturasPage from "./pages/financeiro/ReceitasFuturasPage";
import ConciliacaoPage from "./pages/financeiro/ConciliacaoPage";
import ContasBancariasPage from "./pages/financeiro/ContasBancariasPage";
import MovimentoCaixaPage from "./pages/financeiro/MovimentoCaixaPage";
import NovoFornecedorPage from "./pages/fornecedores/NovoFornecedorPage";
import FornecedoresPage from "./pages/fornecedores/FornecedoresPage";
import EditarFornecedorPage from "./pages/fornecedores/EditarFornecedorPage";
import NotasFiscaisPage from "./pages/fornecedores/NotasFiscaisPage";
import LembretesPage from "./pages/LembretesPage";
import ProfilesPage from "./pages/profiles/ProfilesPage";
import AuditLogsPage from "./pages/audit/AuditLogsPage";
import UsuariosPage from "./pages/admin/UsuariosPage";
import ConfiguracoesPage from "./pages/admin/ConfiguracoesPage";
import AgendaPage from "./pages/agenda/AgendaPage";
import NotFound from "./pages/NotFound";
import LicencasFuncionamentoPage from "./pages/obrigacoes/LicencasFuncionamentoPage";
import InventarioAtivosPage from "./pages/obrigacoes/InventarioAtivosPage";
import Perfil from "./pages/Perfil";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  
  const { user, loading } = useAuth();
  
  // Inicializa o processamento de contas recorrentes quando o usuário está autenticado
  useRecurringAccounts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/auth" 
              element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              } 
            />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/funcionarios" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo de Funcionários" 
                  description="Acesso restrito a informações de funcionários."
                  storageKey="funcionarios_unlocked"
                >
                  <FuncionariosPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/funcionarios/novo" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo de Funcionários" 
                  description="Acesso restrito para cadastro de funcionários."
                  storageKey="funcionarios_unlocked"
                >
                  <NovoFuncionarioPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/funcionarios/advertencias" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo de Funcionários" 
                  description="Acesso restrito a advertências."
                  storageKey="funcionarios_unlocked"
                >
                  <AdvertenciasPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/funcionarios/aniversariantes" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo de Funcionários" 
                  description="Acesso restrito a aniversariantes."
                  storageKey="funcionarios_unlocked"
                >
                  <AniversariantesPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/funcionarios/departamentos" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo de Funcionários" 
                  description="Acesso restrito a departamentos."
                  storageKey="funcionarios_unlocked"
                >
                  <DepartamentosPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/doacoes" element={<ProtectedRoute><DoacoesPage /></ProtectedRoute>} />
            <Route path="/doacoes/dinheiro" element={<ProtectedRoute><DoacoesDinheiroPage /></ProtectedRoute>} />
            <Route path="/doacoes/recibos" element={<ProtectedRoute><DoacoesRecibosPage /></ProtectedRoute>} />
            <Route path="/doacoes/itens" element={<ProtectedRoute><DoacoesItensPage /></ProtectedRoute>} />
            <Route path="/doacoes/relatorios" element={<ProtectedRoute><DoacoesRelatoriosPage /></ProtectedRoute>} />
            <Route path="/departamentos" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo de Funcionários" 
                  description="Acesso restrito a departamentos."
                  storageKey="funcionarios_unlocked"
                >
                  <DepartamentosPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/idosos" element={<ProtectedRoute><IdososPage /></ProtectedRoute>} />
            <Route path="/idosos/novo" element={<ProtectedRoute><NovoIdosoPage /></ProtectedRoute>} />
            <Route path="/idosos/lista-espera" element={<ProtectedRoute><ListaEsperaPage /></ProtectedRoute>} />
            <Route path="/idosos/quartos" element={<ProtectedRoute><QuartosPage /></ProtectedRoute>} />
            <Route path="/idosos/medico" element={<ProtectedRoute><MedicoPage /></ProtectedRoute>} />
            <Route path="/idosos/prontuario-nutricional" element={<ProtectedRoute><ProntuarioNutricionalList /></ProtectedRoute>} />
            <Route path="/idosos/:idosoId/prontuario-nutricional" element={<ProtectedRoute><ProntuarioNutricional /></ProtectedRoute>} />
            <Route path="/idosos/prontuario-medico" element={<ProtectedRoute><ProntuarioMedicoList /></ProtectedRoute>} />
            <Route path="/idosos/:idosoId/prontuario-medico" element={<ProtectedRoute><ProntuarioMedico /></ProtectedRoute>} />
            <Route path="/idosos/prontuario-fisioterapeutico" element={<ProtectedRoute><ProntuarioFisioterapeuticoList /></ProtectedRoute>} />
            <Route path="/idosos/:idosoId/prontuario-fisioterapeutico" element={<ProtectedRoute><ProntuarioFisioterapeutico /></ProtectedRoute>} />
            <Route path="/profiles" element={<ProtectedRoute><ProfilesPage /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
            <Route path="/admin/logs" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Logs de Auditoria" 
                  description="Área restrita a administradores. Confirme sua senha para continuar."
                  storageKey="audit_logs_unlocked"
                >
                  <AuditLogsPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Gestão de Usuários" 
                  description="Acesso restrito. Confirme sua senha para gerenciar os usuários do sistema."
                  storageKey="users_management_unlocked"
                >
                  <UsuariosPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/admin/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />

            {/* Módulos Financeiros */}
            <Route path="/financeiro" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo Financeiro" 
                  storageKey="financial_unlocked"
                >
                  <FinanceiroPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/financeiro/contas-pagar" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo Financeiro" 
                  storageKey="financial_unlocked"
                >
                  <ContasPagarPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/financeiro/contas-receber" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo Financeiro" 
                  storageKey="financial_unlocked"
                >
                  <ContasReceberPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/financeiro/receitas-futuras" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo Financeiro" 
                  storageKey="financial_unlocked"
                >
                  <ReceitasFuturasPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/financeiro/contas-bancarias" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo Financeiro" 
                  storageKey="financial_unlocked"
                >
                  <ContasBancariasPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/financeiro/conciliacao" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo Financeiro" 
                  storageKey="financial_unlocked"
                >
                  <ConciliacaoPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/financeiro/movimento-caixa" element={
              <ProtectedRoute>
                <SecurityGuard 
                  title="Módulo Financeiro" 
                  storageKey="financial_unlocked"
                >
                  <MovimentoCaixaPage />
                </SecurityGuard>
              </ProtectedRoute>
            } />
            <Route path="/fornecedores" element={<ProtectedRoute><FornecedoresPage /></ProtectedRoute>} />
            <Route path="/fornecedores/novo" element={<ProtectedRoute><NovoFornecedorPage /></ProtectedRoute>} />
            <Route path="/fornecedores/editar/:id" element={<ProtectedRoute><EditarFornecedorPage /></ProtectedRoute>} />
            <Route path="/fornecedores/notas" element={<ProtectedRoute><NotasFiscaisPage /></ProtectedRoute>} />
            <Route path="/obrigacoes" element={<ProtectedRoute><div className="p-6"><h1 className="text-2xl font-bold">Módulo de Obrigações</h1><p className="text-muted-foreground mt-2">Selecione uma opção no menu</p></div></ProtectedRoute>} />
            <Route path="/obrigacoes/licencas" element={<ProtectedRoute><LicencasFuncionamentoPage /></ProtectedRoute>} />
            <Route path="/obrigacoes/ativos" element={<ProtectedRoute><InventarioAtivosPage /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
            <Route path="/lembretes" element={<ProtectedRoute><LembretesPage /></ProtectedRoute>} />
            <Route path="/exemplo-imagem" element={<ProtectedRoute><ExemploImagem /></ProtectedRoute>} />
            <Route path="/teste-imagem" element={<ProtectedRoute><TesteImagemSimples /></ProtectedRoute>} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
