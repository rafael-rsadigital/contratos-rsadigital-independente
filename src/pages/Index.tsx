import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FilePlus, History, FileText, LogOut, LayoutDashboard } from "lucide-react";

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

export default function Index() {
  const { signOut } = useAuth();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('contracts')
        .select('id, valor_total, status, created_at, servicos, clients(nome)')
        .order('created_at', { ascending: false })
        .limit(10);

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
          <h1 className="font-bold text-xl text-primary">RSA Digital</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Painel Administrativo</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl space-y-8">
        <div className="text-center space-y-4 py-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Gerador de Contratos</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Crie contratos profissionais em menos de 2 minutos. Preencha os dados, gere o documento e envie para confirmação.
          </p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <Link to="/novo-contrato">
              <Button size="lg" className="gap-2">
                <FilePlus className="w-5 h-5" /> Novo Contrato
              </Button>
            </Link>
            <Link to="/crm">
              <Button size="lg" variant="outline" className="gap-2">
                <LayoutDashboard className="w-5 h-5" /> CRM
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-primary" />
              Contratos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
            ) : contracts.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">Nenhum contrato gerado ainda.</p>
              </div>
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
                        <TableCell className="text-sm">
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
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
            {contracts.length > 0 && (
              <div className="mt-4 text-center">
                <Link to="/historico">
                  <Button variant="link" className="text-sm">Ver todos os contratos →</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
