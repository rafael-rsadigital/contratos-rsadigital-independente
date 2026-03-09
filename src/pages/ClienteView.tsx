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
import { ArrowLeft, FilePlus, Save, User, FileText, DollarSign, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";

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
}

interface ContractItem {
  id: string;
  numero_contrato: string | null;
  valor_total: number;
  status: string;
  created_at: string;
  servicos: string[];
}

export default function ClienteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Editable fields
  const [status, setStatus] = useState('lead');
  const [origem, setOrigem] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [tags, setTags] = useState<string[]>([]);

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

      // Load contracts
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, numero_contrato, valor_total, status, created_at, servicos')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      setContracts(contractsData || []);
      setLoading(false);
    };
    load();
  }, [id]);

  const totalValue = contracts.reduce((sum, c) => sum + Number(c.valor_total), 0);
  const confirmedContracts = contracts.filter(c => c.status === 'confirmado').length;
  const ticketMedio = contracts.length > 0 ? totalValue / contracts.length : 0;

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase
      .from('clients')
      .update({ status, origem, empresa, observacoes, tags } as any)
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

          {/* Right: Observações */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Observações Internas</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex: Cliente prefere contato por WhatsApp. Gosta de pagar via Pix. Indicado por João."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={10}
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
                        <TableCell className="text-xs max-w-[200px] truncate">{c.servicos.join(', ')}</TableCell>
                        <TableCell className="text-sm font-medium">R$ {formatBRL(Number(c.valor_total))}</TableCell>
                        <TableCell><Badge variant={st.variant} className="text-xs">{st.label}</Badge></TableCell>
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
