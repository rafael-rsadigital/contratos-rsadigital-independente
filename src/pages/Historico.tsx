import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, LogOut } from "lucide-react";

interface ContractSummary {
  id: string;
  valor_total: number;
  status: string;
  created_at: string;
  client_nome: string;
  servicos: string[];
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  rascunho: { label: "📝 Rascunho", variant: "outline" },
  enviado: { label: "📤 Enviado", variant: "secondary" },
  confirmado: { label: "✅ Confirmado", variant: "default" },
  cancelado: { label: "❌ Cancelado", variant: "destructive" },
};

export default function Historico() {
  const { signOut } = useAuth();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('contracts')
        .select('id, valor_total, status, created_at, servicos, clients(nome)')
        .order('created_at', { ascending: false });

      if (data) {
        setContracts(data.map((c: any) => ({
          id: c.id,
          valor_total: c.valor_total,
          status: c.status,
          created_at: c.created_at,
          client_nome: c.clients?.nome || '—',
          servicos: c.servicos || [],
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

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
      <main className="container py-8 max-w-4xl">
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
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(c => {
                    const st = statusLabels[c.status] || statusLabels.rascunho;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-medium text-sm">{c.client_nome}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{c.servicos.join(', ')}</TableCell>
                        <TableCell className="text-sm">R$ {Number(c.valor_total).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                        </TableCell>
                        <TableCell>
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
    </div>
  );
}
