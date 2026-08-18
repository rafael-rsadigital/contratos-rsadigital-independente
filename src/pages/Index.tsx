import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  FilePlus, LogOut, FileText, Users, DollarSign, Clock,
  TrendingUp, ArrowRight, CalendarDays, Repeat, Settings
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Index() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [permutas, setPermutas] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [cRes, pRes, clRes] = await Promise.all([
        supabase.from("contracts").select("*, clients(nome, email)"),
        supabase.from("permuta_utilizacoes").select("*"),
        supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      setContracts(cRes.data || []);
      setPermutas(pRes.data || []);
      setClients(clRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Monthly stats
  const thisMonthContracts = contracts.filter(c =>
    isWithinInterval(new Date(c.created_at), { start: monthStart, end: monthEnd })
  );
  const confirmedThisMonth = thisMonthContracts.filter(c => c.status === "confirmado");
  const valorFechado = confirmedThisMonth.reduce((s, c) => s + Number(c.valor_total || 0), 0);
  const entradasRecebidas = confirmedThisMonth.reduce((s, c) => s + Number(c.valor_entrada || 0), 0);
  const pendentes = thisMonthContracts
    .filter(c => c.status !== "confirmado" && c.status !== "cancelado")
    .reduce((s, c) => s + Number(c.valor_total || 0), 0);

  // Status counts
  const statusMap: Record<string, { label: string; emoji: string }> = {
    rascunho: { label: "Em negociação", emoji: "📝" },
    enviado: { label: "Enviado", emoji: "📤" },
    a_confirmar: { label: "Enviado", emoji: "📤" },
    confirmado: { label: "Assinado", emoji: "✅" },
    cancelado: { label: "Cancelado", emoji: "❌" },
  };
  const statusCount = { rascunho: 0, enviado: 0, confirmado: 0, cancelado: 0 };
  contracts.forEach(c => {
    if (c.status === "a_confirmar") statusCount.enviado++;
    else if (c.status in statusCount) (statusCount as any)[c.status]++;
  });

  // Financial summary (all confirmed)
  const allConfirmed = contracts.filter(c => c.status === "confirmado");
  const totalContratado = allConfirmed.reduce((s, c) => s + Number(c.valor_total || 0), 0);
  const totalEntradas = allConfirmed.reduce((s, c) => s + Number(c.valor_entrada || 0), 0);
  const totalPendente = totalContratado - totalEntradas;

  // Permutas
  const totalPermutaCreditos = allConfirmed.reduce((s, c) => s + Number(c.permuta_valor || 0), 0);
  const totalPermutaUsado = permutas.reduce((s, p) => s + Number(p.valor_utilizado || 0), 0);
  const saldoPermuta = totalPermutaCreditos - totalPermutaUsado;

  // Chart data (12 months)
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    const ms = startOfMonth(d);
    const me = endOfMonth(d);
    const total = contracts
      .filter(c => c.status === "confirmado" && isWithinInterval(new Date(c.created_at), { start: ms, end: me }))
      .reduce((s, c) => s + Number(c.valor_total || 0), 0);
    return { mes: format(d, "MMM/yy", { locale: ptBR }), valor: total };
  });

  // Próximos serviços
  const upcoming = contracts
    .filter(c => c.data_primeiro_vencimento && new Date(c.data_primeiro_vencimento) >= now)
    .sort((a, b) => new Date(a.data_primeiro_vencimento).getTime() - new Date(b.data_primeiro_vencimento).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="font-bold text-xl text-primary">{profile?.nome_fantasia || "Gerador de Contratos"}</h1>
          <div className="flex items-center gap-3">
            <Link to="/novo-contrato">
              <Button size="sm" className="gap-1.5">
                <FilePlus className="w-4 h-4" /> Novo Contrato
              </Button>
            </Link>
            <Link to="/configuracoes">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-6xl space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={FileText} title="Contratos este mês" value={String(thisMonthContracts.length)} />
          <SummaryCard icon={DollarSign} title="Valor fechado no mês" value={`R$ ${formatBRL(valorFechado)}`} />
          <SummaryCard icon={TrendingUp} title="Entradas recebidas" value={`R$ ${formatBRL(entradasRecebidas)}`} />
          <SummaryCard icon={Clock} title="Pagamentos pendentes" value={`R$ ${formatBRL(pendentes)}`} />
        </div>

        {/* Chart + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Faturamento por mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`R$ ${formatBRL(v)}`, "Valor"]} />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status dos contratos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "rascunho", label: "Em negociação", emoji: "📝", count: statusCount.rascunho },
                { key: "enviado", label: "Enviado para cliente", emoji: "📤", count: statusCount.enviado },
                { key: "confirmado", label: "Assinado", emoji: "✅", count: statusCount.confirmado },
                { key: "cancelado", label: "Cancelado", emoji: "❌", count: statusCount.cancelado },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm">{s.emoji} {s.label}</span>
                  <Badge variant="secondary" className="text-sm font-semibold">{s.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Financial + Permutas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Resumo financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FinRow label="Valor total contratado" value={totalContratado} />
              <FinRow label="Total de entradas recebidas" value={totalEntradas} />
              <FinRow label="Total pendente de pagamento" value={totalPendente} />
              <FinRow label="Valor total já recebido" value={totalEntradas} highlight />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Repeat className="w-4 h-4 text-primary" /> Permutas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FinRow label="Créditos de permuta ativos" value={totalPermutaCreditos} />
              <FinRow label="Valor já utilizado" value={totalPermutaUsado} />
              <FinRow label="Saldo disponível" value={saldoPermuta} highlight />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming + Recent clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Próximos serviços
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum serviço agendado.</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{c.clients?.nome || "—"}</p>
                        <p className="text-xs text-muted-foreground">{c.servico_principal || c.servicos?.[0]}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.data_primeiro_vencimento).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Clientes recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum cliente cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {clients.map(cl => (
                    <div key={cl.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{cl.nome}</p>
                        <p className="text-xs text-muted-foreground">{cl.email || cl.celular}</p>
                      </div>
                      <Link to={`/novo-contrato?clientId=${cl.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs gap-1">
                          Gerar contrato <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-3 justify-center pb-4">
          <Link to="/historico"><Button variant="outline" size="sm">Ver todos os contratos</Button></Link>
          <Link to="/crm"><Button variant="outline" size="sm">CRM</Button></Link>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold tracking-tight mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FinRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-primary" : ""}`}>
        R$ {formatBRL(value)}
      </span>
    </div>
  );
}
