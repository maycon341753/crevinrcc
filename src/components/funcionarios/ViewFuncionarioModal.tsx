import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Funcionario } from "@/types";
import { User, Mail, Phone, MapPin, Calendar, DollarSign, Building2, FileText, Clock, Briefcase, Building } from "lucide-react";
import { formatBrazilianSalary, formatBrazilianDate, formatBrazilianDateTime } from "@/lib/utils";

interface ViewFuncionarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: Funcionario | null;
}

export function ViewFuncionarioModal({
  open,
  onOpenChange,
  funcionario,
}: ViewFuncionarioModalProps) {
  if (!funcionario) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "inativo":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "ferias":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "licenca":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo":
        return "Ativo";
      case "inativo":
        return "Inativo";
      case "ferias":
        return "Férias";
      case "licenca":
        return "Licença";
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Funcionário
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações detalhadas do funcionário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Pessoais */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{funcionario.nome}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">CPF</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{funcionario.cpf}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">E-mail</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{funcionario.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Telefone</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{funcionario.telefone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Data de Nascimento</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {funcionario.data_nascimento ? formatBrazilianDate(funcionario.data_nascimento) : 'Não informada'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações Profissionais */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações Profissionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Cargo</label>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{funcionario.cargo}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Departamento</label>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Departamento</span> {/* Será substituído por lookup real */}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Salário</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">R$ {funcionario.salario.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Data de Admissão</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {formatBrazilianDate(funcionario.data_admissao)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div>
                  <Badge className={getStatusBadge(funcionario.status)}>
                    {getStatusLabel(funcionario.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações do Sistema */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Data de Criação</label>
                <span className="text-sm">
                  {formatBrazilianDateTime(funcionario.created_at)}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Última Atualização</label>
                <span className="text-sm">
                  {formatBrazilianDateTime(funcionario.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}