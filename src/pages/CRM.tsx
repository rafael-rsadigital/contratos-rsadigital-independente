import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, LogOut, Search, Users, FileText, TrendingUp, DollarSign, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Client {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  celular: string;
  municipio: string;
  estado: string;
  status: string;
  tags: string[];
  created_at: string;
  contract_count: number;
  total_value: number;
}

interface Contract {
  id: string;
  numero_contrato: string | null;
  client_nome: string;
  valor_total: number;
  status: string;
  created_at: string;
  servicos: string[];
  tipo: string;
}

const contractStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  rascunho: { label: "📝 Rascunho", variant: "outline" },
  enviado: { label: "📤 Enviado", variant: "secondary" },
  a_confirmar: { label: "⏳ A Confirmar", variant: "secondary" },
  confirmado: { label: "✅ Confirmado", variant: "default" },
  cancelado: { label: "❌ Cancelado", variant: "destructive" },
};

const clientStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  lead: { label: "🟡 Lead", variant: "outline" },
  ativo: { label: "🟢 Ativo", variant: "default" },
  recorrente: { label: "🔵 Recorrente", variant: "secondary" },
  inativo: { label: "⚫ Inativo", variant: "destructive" },
};

export default function CRM() {
  const { signOut } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchClients, setSearchClients] = useState("");
  const [searchContracts, setSearchContracts] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [clientStatusFilter, setClientStatusFilter] = useState<string>("todos");
  const [activeTab, setActiveTab] = useState("clientes");

  const [stats, setStats] = useState({
    totalClients: 0,
    totalContracts: 0,
    totalValue: 0,
    confirmedContracts: 0,
  });

  const loadData = async () => {
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, numero_contrato, valor_total, status, created_at, servicos, tipo, client_id, clients(nome)')
        .order('created_at', { ascending: false });

      if (clientsData) {
        const clientsWithStats = clientsData.map(client => {
          const clientContracts = contractsData?.filter(c => c.client_id === client.id) || [];
          return {
            ...client,
            status: (client as any).status || 'lead',
            tags: (client as any).tags || [],
            contract_count: clientContracts.length,
            total_value: clientContracts.reduce((sum, c) => sum + Number(c.valor_total), 0),
          };
        });
        setClients(clientsWithStats);
      }

      if (contractsData) {
        const formattedContracts = contractsData.map((c: any) => ({
          id: c.id,
          numero_contrato: c.numero_contrato,
          client_nome: c.clients?.nome || '—',
          valor_total: c.valor_total,
          status: c.status,
          created_at: c.created_at,
          servicos: c.servicos || [],
          tipo: c.tipo,
        }));
        setContracts(formattedContracts);

        setStats({
          totalClients: clientsData?.length || 0,
          totalContracts: contractsData.length,
          totalValue: contractsData.reduce((sum, c) => sum + Number(c.valor_total), 0),
          confirmedContracts: contractsData.filter(c => c.status === 'confirmado').length,
        });
      }
    } catch (error) {
      console.error('Error loading CRM data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchClients.toLowerCase()) ||
      c.cpf_cnpj.includes(searchClients) ||
      c.email.toLowerCase().includes(searchClients.toLowerCase()) ||
      c.celular.includes(searchClients);
    const matchesStatus = clientStatusFilter === 'todos' || c.status === clientStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.client_nome.toLowerCase().includes(searchContracts.toLowerCase()) ||
      (c.numero_contrato || '').includes(searchContracts);
    const matchesStatus = statusFilter === 'todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pipeline counts
  const pipeline = {
    lead: clients.filter(c => c.status === 'lead').length,
    ativo: clients.filter(c => c.status === 'ativo').length,
    recorrente: clients.filter(c => c.status === 'recorrente').length,
    inativo: clients.filter(c => c.status === 'inativo').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="font-bold text-lg text-primary">CRM - Gestão Completa</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalClients}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalContracts}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.confirmedContracts}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">R$ {formatBRL(stats.totalValue)}</div></CardContent>
          </Card>
        </div>

        {/* Pipeline mini */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pipeline de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { key: 'lead', label: '🟡 Lead', count: pipeline.lead },
                { key: 'ativo', label: '🟢 Ativo', count: pipeline.ativo },
                { key: 'recorrente', label: '🔵 Recorrente', count: pipeline.recorrente },
                { key: 'inativo', label: '⚫ Inativo', count: pipeline.inativo },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => { setClientStatusFilter(p.key); setActiveTab('clientes'); }}
                  className={`p-3 rounded-lg border transition-all hover:border-primary/40 ${
                    clientStatusFilter === p.key ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="text-2xl font-bold">{p.count}</div>
                  <div className="text-xs text-muted-foreground">{p.label}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="border-0 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="clientes">Clientes</TabsTrigger>
                <TabsTrigger value="contratos">Contratos</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* CLIENTES TAB */}
              <TabsContent value="clientes" className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, CPF/CNPJ, e-mail ou celular..."
                      value={searchClients}
                      onChange={(e) => setSearchClients(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={clientStatusFilter} onValueChange={setClientStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="recorrente">Recorrente</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
                ) : filteredClients.length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground">Nenhum cliente encontrado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF/CNPJ</TableHead>
                        <TableHead>Celular</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Contratos</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map(c => {
                        const st = clientStatusLabels[c.status] || clientStatusLabels.lead;
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.nome}</TableCell>
                            <TableCell className="text-xs font-mono">{c.cpf_cnpj}</TableCell>
                            <TableCell className="text-sm">{c.celular || '—'}</TableCell>
                            <TableCell className="text-sm">{c.municipio}/{c.estado}</TableCell>
                            <TableCell>
                              <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {(c.tags || []).slice(0, 3).map(t => (
                                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{c.contract_count}</TableCell>
                            <TableCell className="text-sm font-medium">R$ {formatBRL(c.total_value)}</TableCell>
                            <TableCell>
                              <Link to={`/cliente/${c.id}`}>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Eye className="w-3 h-3" /> Ver
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* CONTRATOS TAB */}
              <TabsContent value="contratos" className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por cliente ou número do contrato..."
                      value={searchContracts}
                      onChange={(e) => setSearchContracts(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="enviado">Enviado</SelectItem>
                      <SelectItem value="a_confirmar">A Confirmar</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
                ) : filteredContracts.length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground">Nenhum contrato encontrado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Serviços</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContracts.map(c => {
                        const st = contractStatusLabels[c.status] || contractStatusLabels.rascunho;
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="text-xs font-mono">{c.numero_contrato || '—'}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(c.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="font-medium text-sm">{c.client_nome}</TableCell>
                            <TableCell className="text-sm capitalize">{c.tipo}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">
                              {c.servicos.join(', ')}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              R$ {formatBRL(Number(c.valor_total))}
                            </TableCell>
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
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
