import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, LogOut, Eye, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ContractView {
  viewed_at: string;
  ip: string;
  navegador: string;
}

interface ContractSummary {
  id: string;
  valor_total: number;
  status: string;
  created_at: string;
  client_nome: string;
  servicos: string[];
  numero_contrato: string | null;
  views_count: number;
  last_viewed: string | null;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  rascunho: { label: "📝 Rascunho", variant: "outline" },
  enviado: { label: "📤 Enviado", variant: "secondary" },
  a_confirmar: { label: "⏳ A Confirmar", variant: "secondary" },
  confirmado: { label: "✅ Confirmado", variant: "default" },
  cancelado: { label: "❌ Cancelado", variant: "destructive" },
};

export default function Historico() {
  const { signOut } = useAuth();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViews, setSelectedViews] = useState<ContractView[]>([]);
  const [showViewsDialog, setShowViewsDialog] = useState(false);
  const [viewsClientName, setViewsClientName] = useState("");

  const loadContracts = async () => {
    const { data } = await supabase
      .from('contracts')
      .select('id, valor_total, status, created_at, servicos, numero_contrato, clients(nome)')
      .order('created_at', { ascending: false });

    if (data) {
      const ids = data.map((c: any) => c.id);
      const { data: views } = await (supabase.from('contract_views') as any)
        .select('contract_id, viewed_at')
        .in('contract_id', ids)
        .order('viewed_at', { ascending: false });

      const viewsMap: Record<string, { count: number; last: string | null }> = {};
      (views || []).forEach((v: any) => {
        if (!viewsMap[v.contract_id]) {
          viewsMap[v.contract_id] = { count: 0, last: v.viewed_at };
        }
        viewsMap[v.contract_id].count++;
      });

      setContracts(data.map((c: any) => ({
        id: c.id,
        valor_total: c.valor_total,
        status: c.status,
        created_at: c.created_at,
        client_nome: c.clients?.nome || '—',
        servicos: c.servicos || [],
        numero_contrato: c.numero_contrato,
        views_count: viewsMap[c.id]?.count || 0,
        last_viewed: viewsMap[c.id]?.last || null,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleConfirmContract = async (contractId: string) => {
    await supabase.from('contracts').update({ status: 'confirmado' }).eq('id', contractId);
    toast.success("Contrato confirmado!");
    loadContracts();
  };

  const handleShowViews = async (contractId: string, clientName: string) => {
    setViewsClientName(clientName);
    const { data } = await (supabase.from('contract_views') as any)
      .select('viewed_at, ip, navegador')
      .eq('contract_id', contractId)
      .order('viewed_at', { ascending: false });
    setSelectedViews(data || []);
    setShowViewsDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="font-bold text-lg text-primary">Histórico de Contratos</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
      </header>
      <main className="container py-8 max-w-5xl">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Todos os Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
            ) : contracts.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">Nenhum contrato encontrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visualizações</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(c => {
                    const st = statusLabels[c.status] || statusLabels.rascunho;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs font-mono">{c.numero_contrato || '—'}</TableCell>
                        <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-medium text-sm">{c.client_nome}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{c.servicos.join(', ')}</TableCell>
                        <TableCell className="text-sm">R$ {formatBRL(Number(c.valor_total))}</TableCell>
                        <TableCell>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {c.views_count > 0 ? (
                            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleShowViews(c.id, c.client_nome)}>
                              <Eye className="w-3 h-3" /> {c.views_count}x
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="flex gap-1">
                          {c.status === 'a_confirmar' && (
                            <Button variant="default" size="sm" className="gap-1" onClick={() => handleConfirmContract(c.id)}>
                              <CheckCircle className="w-3 h-3" /> Confirmar
                            </Button>
                          )}
                          <Link to={`/contrato/${c.id}`}>
                            <Button variant="ghost" size="sm">Ver</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Views Dialog */}
      <Dialog open={showViewsDialog} onOpenChange={setShowViewsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Visualizações — {viewsClientName}</DialogTitle>
            <DialogDescription>Histórico de acessos ao contrato.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedViews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma visualização.</p>
            ) : selectedViews.map((v, i) => (
              <div key={i} className="border rounded-md p-3 text-sm space-y-1">
                <p className="font-medium">
                  {new Date(v.viewed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-muted-foreground">IP: {v.ip || '—'}</p>
                <p className="text-xs text-muted-foreground truncate">Navegador: {v.navegador || '—'}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
