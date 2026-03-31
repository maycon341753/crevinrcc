import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Idoso } from "@/types";

interface DeleteIdosoModalProps {
  open: boolean;
  onClose: () => void;
  idoso: Idoso;
}

export function DeleteIdosoModal({ open, onClose, idoso }: DeleteIdosoModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('idosos')
        .delete()
        .eq('id', idoso.id);

      if (error) {
        const { error: softDeleteError } = await supabase
          .from('idosos')
          .update({ ativo: false })
          .eq('id', idoso.id);

        if (softDeleteError) throw error;

        toast({
          title: "Sucesso",
          description: "Idoso inativado com sucesso!",
        });

        onClose();
        return;
      }

      toast({
        title: "Sucesso",
        description: "Idoso removido com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Erro ao remover idoso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o idoso.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o idoso <strong>{idoso.nome}</strong>?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>CPF:</strong> {idoso.cpf}</p>
          <p><strong>Status:</strong> {idoso.ativo ? 'Ativo' : 'Inativo'}</p>
          {idoso.endereco && <p><strong>Endereço:</strong> {idoso.endereco}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}