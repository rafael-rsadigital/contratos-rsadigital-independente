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
import { Download, Check, CheckCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/utils";
import { PaymentScreen } from "@/components/PaymentScreen";
import { PermutaControl } from "@/components/PermutaControl";
import { useAuth } from "@/hooks/useAuth";

export default function ContratoView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState<ContractFormData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmDate, setConfirmDate] = useState("");
  const [nomeConfirmacao, setNomeConfirmacao] = useState("");
  const [emailConfirmacao, setEmailConfirmacao] = useState("");
  const [codigoVerificacao, setCodigoVerificacao] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");
  const [contractStatus, setContractStatus] = useState("");
  const [ipConfirmacao, setIpConfirmacao] = useState("");
  const [navegadorConfirmacao, setNavegadorConfirmacao] = useState("");
  const [timezoneConfirmacao, setTimezoneConfirmacao] = useState("");
  const [idiomaConfirmacao, setIdiomaConfirmacao] = useState("");
  const [resolucaoConfirmacao, setResolucaoConfirmacao] = useState("");

  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmStep, setConfirmStep] = useState(1);
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
          permuta_valor: Number((data as any).permuta_valor) || 0,
          permuta_descricao: (data as any).permuta_descricao || '',
          permuta_condicoes: (data as any).permuta_condicoes || '',
          tem_permuta: Number((data as any).permuta_valor) > 0,
          anexos: (anexos || []).map((a: any): AnexoData => ({ id: a.id, titulo: a.titulo, descricao: a.descricao, data: a.data })),
          aditivos: (aditivos || []).map((a: any): AditivoData => ({ id: a.id, titulo: a.titulo, descricao: a.descricao, data: a.data })),
        });

        setContractStatus(data.status);
        setConfirmed(data.status === 'confirmado' || data.status === 'a_confirmar');
        setCodigoVerificacao((data as any).codigo_verificacao || '');
        setNumeroContrato((data as any).numero_contrato || '');
        setNomeConfirmacao((data as any).nome_confirmacao || '');
        setIpConfirmacao((data as any).ip_confirmacao || '');
        setNavegadorConfirmacao((data as any).navegador_confirmacao || '');
        setTimezoneConfirmacao((data as any).timezone_confirmacao || '');
        setIdiomaConfirmacao((data as any).idioma_confirmacao || '');
        setResolucaoConfirmacao((data as any).resolucao_confirmacao || '');
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

  const handleConfirmContract = async (valorEntradaFinal?: number, parcelasFinal?: number) => {
    if (!id || !contractData) return;
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
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const idioma = navigator.language || '';
      const resolucao = `${window.screen.width}x${window.screen.height}`;

      const updateData: any = {
        status: 'a_confirmar',
        data_confirmacao: now,
        nome_confirmacao: confirmNome,
        email_confirmacao: confirmEmail,
        ip_confirmacao: ip,
        navegador_confirmacao: navegador,
        timezone_confirmacao: timezone,
        idioma_confirmacao: idioma,
        resolucao_confirmacao: resolucao,
      };

      if (valorEntradaFinal !== undefined) {
        updateData.valor_entrada = valorEntradaFinal;
      }
      if (parcelasFinal !== undefined) {
        updateData.numero_parcelas = parcelasFinal;
      }

      await supabase.from('contracts').update(updateData).eq('id', id);

      // Create anexo if client changed entry value or installments
      const entradaOriginal = contractData.valor_entrada;
      const parcelasOriginal = contractData.numero_parcelas;
      const entradaFinal = valorEntradaFinal ?? entradaOriginal;
      const parcFinal = parcelasFinal ?? parcelasOriginal;

      if (entradaFinal !== entradaOriginal || parcFinal !== parcelasOriginal) {
        const hoje = new Date().toLocaleDateString('pt-BR');
        let descricao = `Alteração na forma de pagamento solicitada pelo cliente ${confirmNome} em ${hoje}.\n\n`;
        
        if (entradaFinal !== entradaOriginal) {
          descricao += `Valor da entrada alterado de R$ ${formatBRL(entradaOriginal)} para R$ ${formatBRL(entradaFinal)}.\n`;
        }
        if (parcFinal !== parcelasOriginal) {
          const valorParcela = (contractData.valor_total - entradaFinal) / parcFinal;
          descricao += `Número de parcelas alterado de ${parcelasOriginal}x para ${parcFinal}x de R$ ${formatBRL(valorParcela)}.\n`;
        }

        descricao += `\nValor total do contrato permanece: R$ ${formatBRL(contractData.valor_total)}.`;

        await (supabase.from('contract_anexos') as any).insert({
          contract_id: id,
          titulo: 'Alteração na Forma de Pagamento',
          descricao,
          data: hoje,
        });
      }

      setConfirmed(true);
      setContractStatus('a_confirmar');
      setNomeConfirmacao(confirmNome);
      setEmailConfirmacao(confirmEmail);
      setConfirmDate(new Date(now).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }));
      setShowConfirmDialog(false);
      toast.success("Pagamento informado! Aguarde a confirmação.");

      // Open WhatsApp to admin
      const link = window.location.href;
      const servicos = [contractData?.servico_website, contractData?.servico_google].filter(Boolean).join(' + ');
      
      const valorParcela = parcFinal > 0 
        ? (contractData.valor_total - entradaFinal) / parcFinal 
        : 0;
      
      const parcelasInfo = parcFinal > 0 
        ? `\nParcelas: ${parcFinal}x de R$ ${formatBRL(valorParcela)}` 
        : '';
      
      const message = encodeURIComponent(
        `Olá Rafael, informei o pagamento da entrada do contrato.\n\nCliente: ${confirmNome}\nServiço: ${servicos}\nValor total: R$ ${formatBRL(Number(contractData?.valor_total || 0))}\nEntrada paga: R$ ${formatBRL(Number(entradaFinal))}${parcelasInfo}\n\nLink do contrato:\n${link}`
      );
      window.open(`https://wa.me/${CONTRATADO.whatsapp}?text=${message}`, '_blank');
    } catch (err) {
      console.error(err);
      toast.error("Erro ao confirmar contrato.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdminConfirm = async () => {
    if (!id) return;
    await supabase.from('contracts').update({ status: 'confirmado' }).eq('id', id);
    setContractStatus('confirmado');
    toast.success("Pagamento confirmado!");
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
            {user && contractStatus === 'a_confirmar' && (
              <Button onClick={handleAdminConfirm} size="sm" variant="default" className="gap-2">
                <CheckCircle className="w-4 h-4" /> Confirmar Pagamento
              </Button>
            )}
            {!confirmed && contractStatus !== 'cancelado' && (
              <Button onClick={handleStartConfirmation} size="sm" className="gap-2">
                <Check className="w-4 h-4" /> Confirmar Contratação
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        {contractStatus === 'a_confirmar' && (
          <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
            <p className="text-sm font-medium text-yellow-700">⏳ Pagamento informado — aguardando confirmação do administrador.</p>
          </div>
        )}
        <div id="contract-document" className="bg-card rounded-lg shadow-lg p-6 md:p-10">
          <ContractDocument
            data={contractData}
            confirmed={confirmed}
            confirmDate={confirmDate}
            nomeConfirmacao={nomeConfirmacao}
            emailConfirmacao={emailConfirmacao}
            codigoVerificacao={codigoVerificacao}
            numeroContrato={numeroContrato}
            ipConfirmacao={ipConfirmacao}
            navegadorConfirmacao={navegadorConfirmacao}
            timezoneConfirmacao={timezoneConfirmacao}
            idiomaConfirmacao={idiomaConfirmacao}
            resolucaoConfirmacao={resolucaoConfirmacao}
            isAdmin={!!user}
          />
        </div>

        {/* Permuta Control - only for authenticated admin users */}
        {user && contractData.permuta_valor > 0 && id && (
          <div className="mt-6 no-print">
            <PermutaControl
              contractId={id}
              permutaValor={contractData.permuta_valor}
              clienteNome={contractData.client.nome}
            />
          </div>
        )}

        {/* Bottom confirm button */}
        {!confirmed && contractStatus !== 'cancelado' && (
          <div className="mt-6 text-center no-print">
            <Button onClick={handleStartConfirmation} size="lg" className="gap-2">
              <Check className="w-4 h-4" /> Confirmar Contratação
            </Button>
          </div>
        )}
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className={confirmStep === 3 ? "max-w-lg max-h-[90vh] overflow-y-auto" : "max-w-md"}>
          {confirmStep !== 3 && (
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
          )}

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

          {confirmStep === 3 && contractData && (
            <PaymentScreen
              valorTotal={contractData.valor_total}
              valorEntradaMinimo={contractData.valor_entrada}
              numeroParcelas={contractData.numero_parcelas}
              descontoRegressivo={contractData.desconto_regressivo}
              formaPagamento={contractData.forma_pagamento}
              onConfirm={(valorEntrada, parcelas) => handleConfirmContract(valorEntrada, parcelas)}
              onBack={() => setConfirmStep(2)}
              saving={saving}
            />
          )}

          {confirmStep !== 3 && (
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
                  <Button onClick={() => setConfirmStep(3)} disabled={!acceptTerms}>
                    Próximo — Pagamento
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
