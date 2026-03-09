import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Repeat, Plus, MessageCircle, History } from "lucide-react";
import { CONTRATADO } from "@/types/contract";
import { formatBRL } from "@/lib/utils";

interface Utilizacao {
  id: string;
  descricao: string;
  valor_utilizado: number;
  data_utilizacao: string;
}

interface Props {
  contractId: string;
  permutaValor: number;
  clienteNome: string;
}

export function PermutaControl({ contractId, permutaValor, clienteNome }: Props) {
  const [utilizacoes, setUtilizacoes] = useState<Utilizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUtilizacoes = async () => {
    const { data } = await supabase
      .from('permuta_utilizacoes')
      .select('*')
      .eq('contract_id', contractId)
      .order('data_utilizacao', { ascending: false });
    
    setUtilizacoes((data || []).map((u: any) => ({
      id: u.id,
      descricao: u.descricao,
      valor_utilizado: Number(u.valor_utilizado),
      data_utilizacao: u.data_utilizacao,
    })));
    setLoading(false);
  };

  useEffect(() => {
    loadUtilizacoes();
  }, [contractId]);

  const totalUtilizado = utilizacoes.reduce((sum, u) => sum + u.valor_utilizado, 0);
  const saldoRestante = permutaValor - totalUtilizado;

  const handleAddUtilizacao = async () => {
    if (!descricao.trim() || !valor) return;
    const valorNum = Number(valor);
    if (valorNum <= 0 || valorNum > saldoRestante) {
      toast.error("Valor inválido ou superior ao saldo disponível.");
      return;
    }

    setSaving(true);
    try {
      await supabase.from('permuta_utilizacoes').insert({
        contract_id: contractId,
        descricao: descricao.trim(),
        valor_utilizado: valorNum,
      });
      toast.success("Utilização registrada!");
      setDescricao("");
      setValor("");
      setShowDialog(false);
      loadUtilizacoes();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar utilização.");
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    const link = window.location.href;
    const message = encodeURIComponent(
      `Olá ${clienteNome}!\n\n*Extrato de Permuta*\n\nValor inicial: R$ ${formatBRL(permutaValor)}\nValor utilizado: R$ ${formatBRL(totalUtilizado)}\n*Saldo restante: R$ ${formatBRL(saldoRestante)}*\n\n${utilizacoes.length > 0 ? `Últimas utilizações:\n${utilizacoes.slice(0, 5).map(u => `• ${new Date(u.data_utilizacao).toLocaleDateString('pt-BR')} - R$ ${formatBRL(u.valor_utilizado)} - ${u.descricao}`).join('\n')}` : 'Nenhuma utilização registrada.'}\n\nAcesse o contrato:\n${link}`
    );
    window.open(`https://wa.me/55${CONTRATADO.whatsapp}?text=${message}`, '_blank');
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Carregando...</div>;
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-accent">
          <Repeat className="w-5 h-5" />
          Controle de Permuta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-xs text-muted-foreground">Crédito Inicial</p>
            <p className="text-lg font-bold">R$ {formatBRL(permutaValor)}</p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-xs text-muted-foreground">Utilizado</p>
            <p className="text-lg font-bold text-destructive">R$ {totalUtilizado.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-background border">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-bold ${saldoRestante > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
              R$ {saldoRestante.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {saldoRestante > 0 && (
            <Button onClick={() => setShowDialog(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Registrar Utilização
            </Button>
          )}
          <Button onClick={handleShareWhatsApp} variant="outline" size="sm" className="gap-2">
            <MessageCircle className="w-4 h-4" /> Enviar Extrato
          </Button>
        </div>

        {/* History */}
        {utilizacoes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="w-4 h-4" /> Histórico
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {utilizacoes.map((u) => (
                <div key={u.id} className="p-3 rounded border bg-background text-sm flex justify-between items-start">
                  <div>
                    <p className="font-medium">{u.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(u.data_utilizacao).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className="font-mono text-destructive">-R$ {u.valor_utilizado.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Utilização de Permuta</DialogTitle>
            <DialogDescription>
              Saldo disponível: R$ {saldoRestante.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="valor-util">Valor utilizado (R$)</Label>
              <Input
                id="valor-util"
                type="number"
                step="0.01"
                min="0.01"
                max={saldoRestante}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="desc-util">Descrição</Label>
              <Textarea
                id="desc-util"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: 2 sessões de fotografia"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddUtilizacao} disabled={saving || !descricao.trim() || !valor}>
              {saving ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
