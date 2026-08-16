import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { formatBRL } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FilePlus, Save, User, FileText, DollarSign, TrendingUp, X, Clock, AlertCircle, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { getRenewalStatus, formatDateBR } from "@/lib/renewals";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const STATUS_OPTIONS = [
  { value: 'lead', label: '🟡 Lead' },
  { value: 'ativo', label: '🟢 Cliente Ativo' },
  { value: 'recorrente', label: '🔵 Recorrente' },
  { value: 'inativo', label: '⚫ Inativo' },
];

const ORIGEM_OPTIONS = [
  'Instagram', 'Indicação', 'Google', 'WhatsApp', 'Facebook', 'Outro',
];

const TAG_SUGGESTIONS = [
  'fotografia', 'evento', 'empresa', 'parceiro', 'permuta', 'ecommerce', 'saúde', 'advocacia', 'gastronomia',
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  rascunho: { label: "📝 Rascunho", variant: "outline" },
  enviado: { label: "📤 Enviado", variant: "secondary" },
  a_confirmar: { label: "⏳ A Confirmar", variant: "secondary" },
  confirmado: { label: "✅ Confirmado", variant: "default" },
  cancelado: { label: "❌ Cancelado", variant: "destructive" },
};

interface ClientDetails {
  id: string;
  nome: string;
  cpf_cnpj: string;
  celular: string;
  email: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  municipio: string;
  estado: string;
  empresa: string;
  observacoes: string;
  status: string;
  origem: string;
  tags: string[];
  created_at: string;
  proxima_acao: string | null;
  proxima_acao_data: string | null;
}

interface ContractItem {
  id: string;
  numero_contrato: string | null;
  valor_total: number;
  status: string;
  created_at: string;
  servicos: string[];
  servico_website: string | null;
  servico_google: string | null;
  servico_recorrente: boolean;
  data_inicio_servico: string | null;
  data_termino_servico: string | null;
}

interface Pagamento {
  id: string;
  contract_id: string;
  valor: number;
  data_pagamento: string;
  observacao: string | null;
}

export default function ClienteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Payment dialog
  const [paymentContractId, setPaymentContractId] = useState<string | null>(null);
  const [paymentValor, setPaymentValor] = useState("");
  const [paymentData, setPaymentData] = useState(new Date().toISOString().slice(0, 10));
  const [paymentObs, setPaymentObs] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Editable fields
  const [status, setStatus] = useState('lead');
  const [origem, setOrigem] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [proximaAcao, setProximaAcao] = useState('');
  const [proximaAcaoData, setProximaAcaoData] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (!clientData) {
        toast.error("Cliente não encontrado");
        navigate('/crm');
        return;
      }

      setClient(clientData as ClientDetails);
      setStatus((clientData as any).status || 'lead');
      setOrigem((clientData as any).origem || '');
      setEmpresa((clientData as any).empresa || '');
      setObservacoes((clientData as any).observacoes || '');
      setTags((clientData as any).tags || []);
      setProximaAcao((clientData as any).proxima_acao || '');
      setProximaAcaoData((clientData as any).proxima_acao_data || '');

      // Load contracts
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, numero_contrato, valor_total, status, created_at, servicos, servico_website, servico_google, servico_recorrente, data_inicio_servico, data_termino_servico' as any)
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      setContracts((contractsData as any) || []);

      const contractIds = (contractsData || []).map((c: any) => c.id);
      if (contractIds.length > 0) {
        const { data: pagamentosData } = await supabase
          .from('contract_pagamentos' as any)
          .select('id, contract_id, valor, data_pagamento, observacao')
          .in('contract_id', contractIds)
          .order('data_pagamento', { ascending: false });
        setPagamentos((pagamentosData as any) || []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const totalValue = contracts.reduce((sum, c) => sum + Number(c.valor_total), 0);
  const confirmedContracts = contracts.filter(c => c.status === 'confirmado').length;
  const ticketMedio = contracts.length > 0 ? totalValue / contracts.length : 0;

  const recebidoPorContrato = (contractId: string) =>
    pagamentos.filter(p => p.contract_id === contractId).reduce((sum, p) => sum + Number(p.valor), 0);
  const totalRecebido = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalPendente = Math.max(0, contracts.filter(c => c.status === 'confirmado').reduce((sum, c) => sum + Number(c.valor_total), 0) - totalRecebido);

  const openPaymentDialog = (contractId: string) => {
    setPaymentContractId(contractId);
    setPaymentValor("");
    setPaymentData(new Date().toISOString().slice(0, 10));
    setPaymentObs("");
  };

  const handleAddPayment = async () => {
    if (!paymentContractId || !paymentValor || Number(paymentValor) <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    setSavingPayment(true);
    const { data, error } = await supabase
      .from('contract_pagamentos' as any)
      .insert({
        contract_id: paymentContractId,
        valor: Number(paymentValor),
        data_pagamento: paymentData,
        observacao: paymentObs || null,
      } as any)
      .select()
      .single();

    if (error || !data) {
      toast.error("Erro ao registrar pagamento.");
    } else {
      setPagamentos(prev => [data as any, ...prev]);
      toast.success("Pagamento registrado!");
      setPaymentContractId(null);
    }
    setSavingPayment(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    const { error } = await supabase.from('contract_pagamentos' as any).delete().eq('id', paymentId);
    if (error) {
      toast.error("Erro ao remover pagamento.");
      return;
    }
    setPagamentos(prev => prev.filter(p => p.id !== paymentId));
    toast.success("Pagamento removido.");
  };

  // Serviços ativos: contratos confirmados de serviço contínuo (Google e/ou recorrente)
  const activeServices = contracts
    .filter(c => c.status === 'confirmado' && (c.servico_google || c.servico_recorrente))
    .map(c => ({ ...c, renewal: getRenewalStatus(c.data_termino_servico) }));
  // Website confirmado é entrega pontual (não recorrente), listado à parte
  const deliveredWebsites = contracts.filter(c => c.status === 'confirmado' && c.servico_website && !c.servico_recorrente);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase
      .from('clients')
      .update({ status, origem, empresa, observacoes, tags, proxima_acao: proximaAcao || null, proxima_acao_data: proximaAcaoData || null } as any)
      .eq('id', id);

    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Cliente atualizado!");
    }
    setSaving(false);
  };

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/crm">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="font-bold text-lg text-primary">Perfil do Cliente</h1>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-5xl space-y-6">
        {/* Header card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="text-2xl font-bold">{client.nome}</h2>
                <p className="text-muted-foreground">{client.cpf_cnpj}</p>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
                  <span>{client.celular || '—'}</span>
                  <span>·</span>
                  <span>{client.email || '—'}</span>
                  <span>·</span>
                  <span>{client.municipio}/{client.estado}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cliente desde {new Date(client.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link to={`/novo-contrato?client_id=${client.id}`}>
                  <Button className="gap-2">
                    <FilePlus className="w-4 h-4" /> Gerar novo contrato
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços Ativos */}
        {(activeServices.length > 0 || deliveredWebsites.length > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Serviços Ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeServices.map(c => {
                const label = [c.servico_google, c.servico_recorrente && !c.servico_google ? 'Serviço recorrente' : null].filter(Boolean).join(' · ') || 'Serviço contínuo';
                return (
                  <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.data_inicio_servico ? `Início em ${formatDateBR(c.data_inicio_servico)}` : 'Início não definido'}
                        {c.data_termino_servico ? ` · Término em ${formatDateBR(c.data_termino_servico)}` : ' · Sem data de término definida'}
                      </p>
                    </div>
                    {c.renewal.status === 'vencido' && (
                      <Badge variant="destructive" className="text-xs gap-1"><AlertCircle className="w-3 h-3" /> Vencido há {Math.abs(c.renewal.diasRestantes!)}d</Badge>
                    )}
                    {c.renewal.status === 'vencendo' && (
                      <Badge className="text-xs gap-1 bg-amber-500 hover:bg-amber-500/90 text-white border-transparent"><AlertCircle className="w-3 h-3" /> Vence em {c.renewal.diasRestantes}d</Badge>
                    )}
                    {c.renewal.status === 'ok' && (
                      <Badge variant="secondary" className="text-xs">Ativo ({c.renewal.diasRestantes}d)</Badge>
                    )}
                    {c.renewal.status === 'sem_data' && (
                      <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" /> Sem data</Badge>
                    )}
                  </div>
                );
              })}
              {deliveredWebsites.map(c => (
                <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{c.servico_website}</p>
                    <p className="text-xs text-muted-foreground">Entregue — projeto pontual, sem renovação</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Entregue</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Contratado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {formatBRL(totalValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Fechados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedContracts} / {contracts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {formatBRL(ticketMedio)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Financeiro */}
        {contracts.some(c => c.status === 'confirmado') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Recebido</p>
                  <p className="text-xl font-bold text-emerald-600">R$ {formatBRL(totalRecebido)}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Pendente</p>
                  <p className="text-xl font-bold text-amber-600">R$ {formatBRL(totalPendente)}</p>
                </div>
              </div>

              <div className="space-y-2">
                {contracts.filter(c => c.status === 'confirmado').map(c => {
                  const recebido = recebidoPorContrato(c.id);
                  const pendente = Math.max(0, Number(c.valor_total) - recebido);
                  const contratoPagamentos = pagamentos.filter(p => p.contract_id === c.id);
                  return (
                    <div key={c.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{c.numero_contrato || 'Contrato'} — R$ {formatBRL(Number(c.valor_total))}</p>
                          <p className="text-xs text-muted-foreground">
                            Recebido R$ {formatBRL(recebido)} · Pendente R$ {formatBRL(pendente)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openPaymentDialog(c.id)}>
                          <Plus className="w-3 h-3" /> Registrar pagamento
                        </Button>
                      </div>
                      {contratoPagamentos.length > 0 && (
                        <div className="space-y-1 pt-1 border-t">
                          {contratoPagamentos.map(p => (
                            <div key={p.id} className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDateBR(p.data_pagamento)} — R$ {formatBRL(Number(p.valor))}{p.observacao ? ` (${p.observacao})` : ''}</span>
                              <button onClick={() => handleDeletePayment(p.id)} className="hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Status, Origem, Empresa, Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Classificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Como conheceu?</label>
                <Select value={origem} onValueChange={setOrigem}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {ORIGEM_OPTIONS.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Empresa</label>
                <Input
                  placeholder="Nome da empresa (opcional)"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => addTag(newTag)} disabled={!newTag.trim()}>
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {TAG_SUGGESTIONS.filter(t => !tags.includes(t)).slice(0, 5).map(t => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-primary/10"
                      onClick={() => addTag(t)}
                    >
                      + {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Observações + Próxima Ação */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Observações Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Próxima ação</label>
                  <Input
                    placeholder="Ex: Ligar pra renovar GMB, enviar relatório mensal..."
                    value={proximaAcao}
                    onChange={(e) => setProximaAcao(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Data</label>
                  <Input type="date" className="w-[150px]" value={proximaAcaoData} onChange={(e) => setProximaAcaoData(e.target.value)} />
                </div>
              </div>
              <Textarea
                placeholder="Ex: Cliente prefere contato por WhatsApp. Gosta de pagar via Pix. Indicado por João."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={8}
              />
            </CardContent>
          </Card>
        </div>

        {/* Contracts history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Histórico de Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum contrato encontrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(c => {
                    const st = statusLabels[c.status] || statusLabels.rascunho;
                    const isOngoing = c.status === 'confirmado' && (c.servico_google || c.servico_recorrente);
                    const renewal = isOngoing ? getRenewalStatus(c.data_termino_servico) : null;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs font-mono">{c.numero_contrato || '—'}</TableCell>
                        <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{c.servicos.join(', ')}</TableCell>
                        <TableCell className="text-sm font-medium">R$ {formatBRL(Number(c.valor_total))}</TableCell>
                        <TableCell><Badge variant={st.variant} className="text-xs">{st.label}</Badge></TableCell>
                        <TableCell>
                          {renewal ? (
                            renewal.status === 'vencido' ? <Badge variant="destructive" className="text-xs">Vencido</Badge>
                            : renewal.status === 'vencendo' ? <Badge className="text-xs bg-amber-500 hover:bg-amber-500/90 text-white border-transparent">{renewal.diasRestantes}d</Badge>
                            : renewal.status === 'ok' ? <Badge variant="secondary" className="text-xs">{renewal.diasRestantes}d</Badge>
                            : <span className="text-xs text-muted-foreground">—</span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
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

      {/* Registrar Pagamento Dialog */}
      <Dialog open={!!paymentContractId} onOpenChange={(open) => { if (!open) setPaymentContractId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
              <Input type="number" step="0.01" min="0" placeholder="500.00" value={paymentValor} onChange={(e) => setPaymentValor(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Data do pagamento</label>
              <Input type="date" value={paymentData} onChange={(e) => setPaymentData(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Observação (opcional)</label>
              <Input placeholder="Ex: entrada, 2ª parcela..." value={paymentObs} onChange={(e) => setPaymentObs(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentContractId(null)} disabled={savingPayment}>Cancelar</Button>
            <Button onClick={handleAddPayment} disabled={savingPayment}>
              {savingPayment ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
