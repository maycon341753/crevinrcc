import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserCheck } from "lucide-react";
import { parseISOToLocalDate } from "@/lib/utils";

interface ListaEsperaIdoso {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone?: string;
  endereco?: string;
  responsavel_nome?: string;
  responsavel_telefone?: string;
  responsavel_parentesco?: string;
  observacoes?: string;
}

interface TransferirIdosoModalProps {
  isOpen: boolean;
  onClose: () => void;
  idoso: ListaEsperaIdoso | null;
  onTransferSuccess: () => void;
}

export function TransferirIdosoModal({
  isOpen,
  onClose,
  idoso,
  onTransferSuccess,
}: TransferirIdosoModalProps) {
  const [observacoesTransferencia, setObservacoesTransferencia] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleTransfer = async () => {
    if (!idoso || !user) return;

    setLoading(true);
    try {
      // 1. Inserir o idoso na tabela principal (idosos)
      const { data: novoIdoso, error: insertError } = await supabase
        .from("idosos")
        .insert({
          nome: idoso.nome,
          cpf: idoso.cpf,
          data_nascimento: idoso.data_nascimento,
          telefone: idoso.telefone,
          endereco: idoso.endereco,
          contato_emergencia: idoso.responsavel_nome && idoso.responsavel_telefone 
            ? `${idoso.responsavel_nome} (${idoso.responsavel_parentesco || 'Responsável'}) - ${idoso.responsavel_telefone}`
            : idoso.responsavel_telefone,
          observacoes_medicas: [
            idoso.observacoes,
            observacoesTransferencia && `Transferência: ${observacoesTransferencia}`
          ].filter(Boolean).join('\n\n'),
          ativo: true,
          created_by: user.id, // Adicionar o ID do usuário autenticado
        })
        .select()
        .single();

      if (insertError) {
        console.error("Erro ao inserir idoso:", insertError);
        throw insertError;
      }

      // 2. Atualizar o status na lista de espera para 'transferido'
      const { error: updateError } = await supabase
        .from("lista_espera_idosos")
        .update({ 
          status: "transferido",
          updated_at: new Date().toISOString()
        })
        .eq("id", idoso.id);

      if (updateError) {
        console.error("Erro ao atualizar lista de espera:", updateError);
        // Se falhar ao atualizar a lista de espera, remover o idoso inserido
        await supabase.from("idosos").delete().eq("id", novoIdoso.id);
        throw updateError;
      }

      // 3. Reorganizar posições na fila (opcional - pode ser feito por trigger)
      const { error: reorganizeError } = await supabase.rpc('reorganizar_fila_espera');
      if (reorganizeError) {
        console.warn("Aviso ao reorganizar fila:", reorganizeError);
        // Não é crítico, apenas um aviso
      }

      toast({
        title: "Transferência realizada com sucesso!",
        description: `${idoso.nome} foi transferido(a) para a lista de idosos ativos.`,
      });

      onTransferSuccess();
      onClose();
      setObservacoesTransferencia("");
    } catch (error: any) {
      console.error("Erro na transferência:", error);
      toast({
        title: "Erro na transferência",
        description: error.message || "Não foi possível transferir o idoso. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setObservacoesTransferencia("");
      onClose();
    }
  };

  if (!idoso) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Transferir para Lista Ativa
          </DialogTitle>
          <DialogDescription>
            Confirme a transferência de <strong>{idoso.nome}</strong> da lista de espera 
            para a lista de idosos ativos da instituição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do idoso */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <p className="font-medium">{idoso.nome}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">CPF</Label>
                <p className="font-medium">{idoso.cpf}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data de Nascimento</Label>
                <p className="font-medium">
                  {parseISOToLocalDate(idoso.data_nascimento)?.toLocaleDateString('pt-BR') || idoso.data_nascimento}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <p className="font-medium">{idoso.telefone || "Não informado"}</p>
              </div>
            </div>
            {idoso.responsavel_nome && (
              <div>
                <Label className="text-xs text-muted-foreground">Responsável</Label>
                <p className="font-medium">
                  {idoso.responsavel_nome} ({idoso.responsavel_parentesco || 'Responsável'})
                  {idoso.responsavel_telefone && ` - ${idoso.responsavel_telefone}`}
                </p>
              </div>
            )}
          </div>

          {/* Observações da transferência */}
          <div className="space-y-2">
            <Label htmlFor="observacoes-transferencia">
              Observações da Transferência (opcional)
            </Label>
            <Textarea
              id="observacoes-transferencia"
              placeholder="Adicione observações sobre a transferência, como data de admissão, quarto designado, etc."
              value={observacoesTransferencia}
              onChange={(e) => setObservacoesTransferencia(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleTransfer}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferindo...
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Confirmar Transferência
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TransferirIdosoModal;