import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Contratado, CONTRATADO_DEFAULT } from "@/types/contract";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/utils";
import logoRsa from "@/assets/logo-rsa-digital.png";
import { useAuth } from "@/hooks/useAuth";

interface AditivoFull {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  clausulas_alteradas: string | null;
  novo_valor: number | null;
  novo_prazo: string | null;
  data: string;
  status: string;
  data_aceite: string | null;
  nome_aceite: string | null;
  email_aceite: string | null;
  ip_aceite: string | null;
  navegador_aceite: string | null;
  timezone_aceite: string | null;
  idioma_aceite: string | null;
  resolucao_aceite: string | null;
  codigo_verificacao: string | null;
  contract_id: string;
}

interface ContractBasic {
  numero_contrato: string | null;
  created_at: string;
  clients: { nome: string; cpf_cnpj: string } | null;
}

export default function AditivoView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [aditivo, setAditivo] = useState<AditivoFull | null>(null);
  const [contract, setContract] = useState<ContractBasic | null>(null);

  // Confirm dialog
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contratado, setContratado] = useState<Contratado>(CONTRATADO_DEFAULT);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await (supabase.from('contract_aditivos') as any)
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setAditivo(data);
        const { data: contractData } = await supabase
          .from('contracts')
          .select('numero_contrato, created_at, owner_id, clients(nome, cpf_cnpj)' as any)
          .eq('id', data.contract_id)
          .single();
        setContract(contractData as any);

        const ownerId = (contractData as any)?.owner_id;
        if (ownerId) {
          const { data: profileData } = await supabase
            .from('profiles' as any)
            .select('*')
            .eq('id', ownerId)
            .maybeSingle();
          if (profileData) {
            const p = profileData as any;
            setContratado({
              nome: p.nome_contratado || CONTRATADO_DEFAULT.nome,
              cnpj: p.cnpj || CONTRATADO_DEFAULT.cnpj,
              nomeFantasia: p.nome_fantasia || CONTRATADO_DEFAULT.nomeFantasia,
              cidade: p.cidade || CONTRATADO_DEFAULT.cidade,
              whatsapp: p.whatsapp || CONTRATADO_DEFAULT.whatsapp,
              logoUrl: p.logo_url || null,
              multaPct: Number(p.multa_pct ?? CONTRATADO_DEFAULT.multaPct),
              jurosPct: Number(p.juros_pct ?? CONTRATADO_DEFAULT.jurosPct),
              multaRescisoriaPct: Number(p.multa_rescisoria_pct ?? CONTRATADO_DEFAULT.multaRescisoriaPct),
            });
          }
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleConfirm = async () => {
    if (!id || !aditivo) return;
    setSaving(true);
    try {
      let ip = 'desconhecido';
      try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const ipData = await resp.json();
        ip = ipData.ip;
      } catch {}

      const now = new Date().toISOString();
      const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

      await (supabase.from('contract_aditivos') as any).update({
        status: 'aceito',
        data_aceite: now,
        nome_aceite: nome,
        email_aceite: email,
        ip_aceite: ip,
        navegador_aceite: navigator.userAgent,
        timezone_aceite: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        idioma_aceite: navigator.language || '',
        resolucao_aceite: `${window.screen.width}x${window.screen.height}`,
        codigo_verificacao: codigo,
      }).eq('id', id);

      setAditivo(prev => prev ? {
        ...prev,
        status: 'aceito',
        data_aceite: now,
        nome_aceite: nome,
        email_aceite: email,
        codigo_verificacao: codigo,
      } : prev);

      setShowDialog(false);
      toast.success("Termo aditivo aceito com sucesso!");
    } catch {
      toast.error("Erro ao confirmar aceite.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando termo aditivo...</p>
      </div>
    );
  }

  if (!aditivo || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Termo aditivo não encontrado.</p>
      </div>
    );
  }

  const isAccepted = aditivo.status === 'aceito';
  const contractDate = contract.created_at
    ? new Date(contract.created_at).toLocaleDateString('pt-BR')
    : '';
  const acceptDate = aditivo.data_aceite
    ? new Date(aditivo.data_aceite).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card no-print">
        <div className="container py-4 flex items-center justify-between">
          <span className="font-bold text-primary">{contratado.nomeFantasia}</span>
          {!isAccepted && (
            <Button onClick={() => { setStep(1); setShowDialog(true); }} size="sm" className="gap-2">
              <Check className="w-4 h-4" /> Aceitar Termo Aditivo
            </Button>
          )}
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        {!isAccepted && (
          <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
            <p className="text-sm font-medium text-yellow-700">⚠ Este termo aditivo aguarda sua confirmação.</p>
          </div>
        )}

        <div className="bg-card rounded-lg shadow-lg p-6 md:p-10">
          <div className="contract-document max-w-3xl mx-auto text-[15px] leading-relaxed space-y-6">
            <div className="flex justify-center mb-4">
              <img src={contratado.logoUrl || logoRsa} alt={contratado.nomeFantasia} className="h-16 object-contain" />
            </div>

            <h1 className="text-center text-lg mb-2 tracking-widest font-bold">
              TERMO ADITIVO Nº {aditivo.numero}
            </h1>
            <p className="text-center text-sm text-muted-foreground mb-8">
              AO CONTRATO Nº {contract.numero_contrato || '—'}
            </p>

            <p>
              As partes acordam alterar as seguintes condições do contrato firmado em {contractDate}:
            </p>

            {aditivo.clausulas_alteradas && (
              <>
                <h2 className="text-sm font-bold mt-6 mb-2">CLÁUSULAS ALTERADAS</h2>
                <div className="ml-4 p-3 bg-muted/30 rounded border">
                  <p className="whitespace-pre-wrap">{aditivo.clausulas_alteradas}</p>
                </div>
              </>
            )}

            <h2 className="text-sm font-bold mt-6 mb-2">DESCRIÇÃO DAS ALTERAÇÕES</h2>
            <div className="ml-4 p-3 bg-muted/30 rounded border">
              <p className="whitespace-pre-wrap">{aditivo.descricao}</p>
            </div>

            {aditivo.novo_valor != null && aditivo.novo_valor > 0 && (
              <>
                <h2 className="text-sm font-bold mt-6 mb-2">NOVO VALOR</h2>
                <p className="ml-4 font-bold text-base">R$ {formatBRL(aditivo.novo_valor)}</p>
              </>
            )}

            {aditivo.novo_prazo && (
              <>
                <h2 className="text-sm font-bold mt-6 mb-2">NOVO PRAZO</h2>
                <p className="ml-4">{aditivo.novo_prazo}</p>
              </>
            )}

            <p className="mt-6 italic text-muted-foreground">
              Todas as demais cláusulas do contrato original permanecem inalteradas e em pleno vigor.
            </p>

            <h2 className="text-sm font-bold mt-6 mb-2">ACEITE DIGITAL</h2>
            <p>Ao clicar em "Aceitar Termo Aditivo", o CONTRATANTE declara que leu, compreendeu e concorda com todas as alterações descritas neste termo.</p>
            <p className="mt-2">O registro eletrônico constitui aceite formal e válido, dispensando assinatura física.</p>

            {/* Acceptance proof */}
            {isAccepted && (
              <div className="mt-8 space-y-4">
                <div className="border-2 border-primary/20 rounded-lg p-6 space-y-4">
                  <h3 className="text-center text-sm font-bold tracking-widest uppercase">Comprovante de Aceite Digital</h3>
                  <div className="border-b pb-3 space-y-1 text-sm">
                    {aditivo.nome_aceite && <p>Contratante: <strong>{aditivo.nome_aceite}</strong></p>}
                    {aditivo.email_aceite && <p>Email: <strong>{aditivo.email_aceite}</strong></p>}
                  </div>
                  <div className="space-y-1 text-sm">
                    {acceptDate && <p>Data do aceite: <strong>{acceptDate}</strong></p>}
                  </div>
                  <div className="bg-muted/30 rounded-md p-3 text-sm italic text-muted-foreground">
                    <p className="font-medium text-foreground not-italic mb-1">Declaração:</p>
                    <p>O contratante declara que leu e aceitou integralmente os termos deste aditivo contratual.</p>
                  </div>
                  {aditivo.codigo_verificacao && (
                    <p className="text-sm">Código de verificação: <strong className="font-mono">{aditivo.codigo_verificacao}</strong></p>
                  )}
                </div>

                {/* Admin log */}
                {user && (
                  <div className="border rounded-lg p-5 space-y-3 bg-muted/10">
                    <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">🔐 Log Técnico (interno)</h3>
                    <div className="text-xs space-y-1 font-mono">
                      {aditivo.nome_aceite && <p>Cliente: {aditivo.nome_aceite}</p>}
                      {acceptDate && <p>Data/Hora: {acceptDate}</p>}
                      {aditivo.ip_aceite && <p>IP: {aditivo.ip_aceite}</p>}
                      {aditivo.navegador_aceite && <p>User Agent: {aditivo.navegador_aceite}</p>}
                      {aditivo.timezone_aceite && <p>Timezone: {aditivo.timezone_aceite}</p>}
                      {aditivo.idioma_aceite && <p>Idioma: {aditivo.idioma_aceite}</p>}
                      {aditivo.resolucao_aceite && <p>Resolução: {aditivo.resolucao_aceite}</p>}
                      {aditivo.codigo_verificacao && <p>Código: {aditivo.codigo_verificacao}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
              <p>{contratado.nomeFantasia} — CNPJ {contratado.cnpj}</p>
              <p>{contratado.cidade}</p>
            </div>
          </div>
        </div>

        {!isAccepted && (
          <div className="mt-6 text-center no-print">
            <Button onClick={() => { setStep(1); setShowDialog(true); }} size="lg" className="gap-2">
              <Check className="w-4 h-4" /> Aceitar Termo Aditivo
            </Button>
          </div>
        )}
      </main>

      {/* Acceptance Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{step === 1 ? "Identificação" : "Declaração de Aceite"}</DialogTitle>
            <DialogDescription>
              {step === 1
                ? "Informe seus dados para confirmar o termo aditivo."
                : "Leia e confirme a declaração abaixo."}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg bg-muted/50 border text-sm">
                <p className="font-medium mb-2">Declaração:</p>
                <p className="text-muted-foreground">
                  "Declaro que li integralmente este termo aditivo e concordo com todas as alterações apresentadas."
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept"
                  checked={acceptTerms}
                  onCheckedChange={(v) => setAcceptTerms(!!v)}
                />
                <Label htmlFor="accept" className="text-sm cursor-pointer leading-relaxed">
                  Li e concordo com todos os termos deste aditivo
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            {step === 1 ? (
              <>
                <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                <Button onClick={() => setStep(2)} disabled={!nome.trim() || !email.trim()}>Próximo</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button onClick={handleConfirm} disabled={!acceptTerms || saving}>
                  {saving ? "Confirmando..." : "Confirmar Aceite"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
