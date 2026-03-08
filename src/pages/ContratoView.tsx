import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { ContractDocument } from "@/components/ContractDocument";
import { ContractFormData, PaymentMethod, EntradaPaymentMethod, CONTRATADO, AnexoData, AditivoData } from "@/types/contract";
import { Download, Check } from "lucide-react";
import { toast } from "sonner";
import { PaymentScreen } from "@/components/PaymentScreen";

export default function ContratoView() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState<ContractFormData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmDate, setConfirmDate] = useState("");
  const [nomeConfirmacao, setNomeConfirmacao] = useState("");
  const [emailConfirmacao, setEmailConfirmacao] = useState("");
  const [codigoVerificacao, setCodigoVerificacao] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");
  const [contractStatus, setContractStatus] = useState("");

  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmStep, setConfirmStep] = useState(1); // 1=identify, 2=terms, 3=payment
  const [confirmNome, setConfirmNome] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  // Track view on load
  useEffect(() => {
    const trackView = async () => {
      if (!id) return;
      let ip = 'desconhecido';
      try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const ipData = await resp.json();
        ip = ipData.ip;
      } catch {}
      await (supabase.from('contract_views') as any).insert({
        contract_id: id,
        ip,
        navegador: navigator.userAgent,
      });
    };
    trackView();
  }, [id]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase
        .from('contracts')
        .select('*, clients(*)')
        .eq('id', id)
        .single();

      if (data) {
        const [{ data: anexos }, { data: aditivos }] = await Promise.all([
          supabase.from('contract_anexos').select('*').eq('contract_id', id).order('created_at'),
          supabase.from('contract_aditivos').select('*').eq('contract_id', id).order('created_at'),
        ]);

        const websiteServices = ['Site Onepage Otimizado', 'Site Institucional Completo Otimizado', 'Site Portfólio Onepage (não otimizado)', 'Site Institucional Completo (não otimizado)'];
        const servicos = data.servicos || [];

        setContractData({
          client: {
            nome: data.clients?.nome || '',
            cpf_cnpj: data.clients?.cpf_cnpj || '',
            celular: (data.clients as any)?.celular || '',
            logradouro: data.clients?.logradouro || '',
            numero: data.clients?.numero || '',
            bairro: data.clients?.bairro || '',
            cep: data.clients?.cep || '',
            municipio: data.clients?.municipio || '',
            estado: data.clients?.estado || '',
            email: data.clients?.email || '',
          },
          servicos,
          servico_website: servicos.find((s: string) => websiteServices.includes(s)) || '',
          servico_google: servicos.find((s: string) => s.includes('Google')) || '',
          prazo_google: (data as any).prazo_google || '30 dias',
          valor_total: Number(data.valor_total),
          forma_pagamento: data.forma_pagamento as PaymentMethod,
          numero_parcelas: data.numero_parcelas,
          data_primeiro_vencimento: (data as any).data_primeiro_vencimento || '',
          desconto_regressivo: data.desconto_regressivo,
          valor_entrada: Number((data as any).valor_entrada) || 0,
          forma_pagamento_entrada: ((data as any).forma_pagamento_entrada || 'pix') as EntradaPaymentMethod,
          numero_paginas: (data as any).numero_paginas || 0,
          anexos: (anexos || []).map((a: any): AnexoData => ({ id: a.id, titulo: a.titulo, descricao: a.descricao, data: a.data })),
          aditivos: (aditivos || []).map((a: any): AditivoData => ({ id: a.id, titulo: a.titulo, descricao: a.descricao, data: a.data })),
        });

        setContractStatus(data.status);
        setConfirmed(data.status === 'confirmado');
        setCodigoVerificacao((data as any).codigo_verificacao || '');
        setNumeroContrato((data as any).numero_contrato || '');
        setNomeConfirmacao((data as any).nome_confirmacao || '');
        setEmailConfirmacao(data.email_confirmacao || '');
        if (data.data_confirmacao) {
          setConfirmDate(new Date(data.data_confirmacao).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }));
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleStartConfirmation = () => {
    setConfirmStep(1);
    setShowConfirmDialog(true);
  };

  const handleConfirmContract = async () => {
    if (!id) return;
    setSaving(true);
    try {
      let ip = 'desconhecido';
      try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const ipData = await resp.json();
        ip = ipData.ip;
      } catch {}

      const navegador = navigator.userAgent;
      const now = new Date().toISOString();

      await supabase.from('contracts').update({
        status: 'confirmado',
        data_confirmacao: now,
        nome_confirmacao: confirmNome,
        email_confirmacao: confirmEmail,
        ip_confirmacao: ip,
        navegador_confirmacao: navegador,
      }).eq('id', id);

      setConfirmed(true);
      setNomeConfirmacao(confirmNome);
      setEmailConfirmacao(confirmEmail);
      setConfirmDate(new Date(now).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }));
      setShowConfirmDialog(false);
      toast.success("Contrato confirmado com sucesso!");

      // Open WhatsApp to admin
      const link = window.location.href;
      const servicos = [contractData?.servico_website, contractData?.servico_google].filter(Boolean).join(' + ');
      const message = encodeURIComponent(
        `Olá Rafael, confirmei o contrato da RSA Digital.\n\nCliente: ${confirmNome}\nServiço: ${servicos}\nValor: R$ ${Number(contractData?.valor_total || 0).toFixed(2)}\n\nLink do contrato:\n${link}`
      );
      window.open(`https://wa.me/${CONTRATADO.whatsapp}?text=${message}`, '_blank');
    } catch (err) {
      console.error(err);
      toast.error("Erro ao confirmar contrato.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('contract-document');
    if (!element) return;
    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `contrato-${contractData?.client.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando contrato...</p>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Contrato não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card no-print">
        <div className="container py-4 flex items-center justify-between">
          <span className="font-bold text-primary">RSA Digital</span>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> PDF
            </Button>
            {!confirmed && contractStatus !== 'cancelado' && (
              <Button onClick={handleStartConfirmation} size="sm" className="gap-2">
                <Check className="w-4 h-4" /> Confirmar Contratação
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div id="contract-document" className="bg-card rounded-lg shadow-lg p-6 md:p-10">
          <ContractDocument
            data={contractData}
            confirmed={confirmed}
            confirmDate={confirmDate}
            nomeConfirmacao={nomeConfirmacao}
            emailConfirmacao={emailConfirmacao}
            codigoVerificacao={codigoVerificacao}
            numeroContrato={numeroContrato}
          />
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmStep === 1 ? "Identificação" : "Declaração de Aceite"}
            </DialogTitle>
            <DialogDescription>
              {confirmStep === 1
                ? "Informe seus dados para confirmar o contrato."
                : "Leia e confirme a declaração abaixo."}
            </DialogDescription>
          </DialogHeader>

          {confirmStep === 1 && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="confirm-nome">Nome completo</Label>
                <Input id="confirm-nome" value={confirmNome} onChange={e => setConfirmNome(e.target.value)} placeholder="Seu nome completo" />
              </div>
              <div>
                <Label htmlFor="confirm-email">Email</Label>
                <Input id="confirm-email" type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
            </div>
          )}

          {confirmStep === 2 && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg bg-muted/50 border text-sm">
                <p className="font-medium mb-2">Declaração:</p>
                <p className="text-muted-foreground">
                  "Declaro que li integralmente este contrato e concordo com todos os termos apresentados."
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-terms"
                  checked={acceptTerms}
                  onCheckedChange={(v) => setAcceptTerms(!!v)}
                />
                <Label htmlFor="accept-terms" className="text-sm cursor-pointer leading-relaxed">
                  Li e concordo com todos os termos do contrato
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            {confirmStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancelar</Button>
                <Button
                  onClick={() => setConfirmStep(2)}
                  disabled={!confirmNome.trim() || !confirmEmail.trim()}
                >
                  Próximo
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setConfirmStep(1)}>Voltar</Button>
                <Button onClick={handleConfirmContract} disabled={!acceptTerms || saving}>
                  {saving ? "Confirmando..." : "Confirmar Contratação"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
