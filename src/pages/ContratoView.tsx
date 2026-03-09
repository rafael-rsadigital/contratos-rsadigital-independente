import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [acceptData, setAcceptData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nomeEditado, setNomeEditado] = useState(false);
  const [emailEditado, setEmailEditado] = useState(false);
  const [nomeOriginal, setNomeOriginal] = useState("");
  const [emailOriginal, setEmailOriginal] = useState("");

  // Aditivo dialog
  const [showAditivoDialog, setShowAditivoDialog] = useState(false);
  const [aditivoTitulo, setAditivoTitulo] = useState("");
  const [aditivoDescricao, setAditivoDescricao] = useState("");
  const [aditivoClausulas, setAditivoClausulas] = useState("");
  const [aditivoNovoValor, setAditivoNovoValor] = useState("");
  const [aditivoNovoPrazo, setAditivoNovoPrazo] = useState("");
  const [savingAditivo, setSavingAditivo] = useState(false);

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
          aditivos: (aditivos || []).map((a: any): AditivoData => ({ id: a.id, numero: a.numero || 1, titulo: a.titulo, descricao: a.descricao, data: a.data, status: a.status || 'pendente', data_aceite: a.data_aceite, nome_aceite: a.nome_aceite, email_aceite: a.email_aceite, ip_aceite: a.ip_aceite, navegador_aceite: a.navegador_aceite, timezone_aceite: a.timezone_aceite, idioma_aceite: a.idioma_aceite, resolucao_aceite: a.resolucao_aceite, codigo_verificacao: a.codigo_verificacao, clausulas_alteradas: a.clausulas_alteradas, novo_valor: a.novo_valor, novo_prazo: a.novo_prazo })),
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
    const nome = contractData?.client.nome || "";
    const email = contractData?.client.email || "";
    setConfirmNome(nome);
    setConfirmEmail(email);
    setNomeOriginal(nome);
    setEmailOriginal(email);
    setNomeEditado(false);
    setEmailEditado(false);
    setAcceptData(false);
    setAcceptTerms(false);
    setConfirmStep(1);
    setShowConfirmDialog(true);
  };

  const handleNomeChange = (value: string) => {
    setConfirmNome(value);
    if (value !== nomeOriginal) {
      setNomeEditado(true);
    }
  };

  const handleEmailChange = (value: string) => {
    setConfirmEmail(value);
    if (value !== emailOriginal) {
      setEmailEditado(true);
    }
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

      // Create anexo for payment changes
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

      // Create anexo for client data changes
      if (nomeEditado || emailEditado) {
        const hoje = new Date().toLocaleDateString('pt-BR');
        let descricao = `Alteração de dados cadastrais realizada pelo cliente durante a confirmação do contrato em ${hoje}.\n\n`;
        
        if (nomeEditado) {
          descricao += `Nome original (preenchido pelo contratante): ${nomeOriginal}\n`;
          descricao += `Nome final (confirmado pelo cliente): ${confirmNome}\n\n`;
        }
        if (emailEditado) {
          descricao += `Email original (preenchido pelo contratante): ${emailOriginal}\n`;
          descricao += `Email final (confirmado pelo cliente): ${confirmEmail}\n`;
        }

        await (supabase.from('contract_anexos') as any).insert({
          contract_id: id,
          titulo: 'Alteração de Dados pelo Cliente',
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

  const handleAddAditivo = async () => {
    if (!id || !aditivoTitulo.trim() || !aditivoDescricao.trim()) return;
    setSavingAditivo(true);
    try {
      const hoje = new Date().toLocaleDateString('pt-BR');
      const novoNumero = (contractData?.aditivos?.length || 0) + 1;
      const insertData: any = {
        contract_id: id,
        titulo: aditivoTitulo.trim(),
        descricao: aditivoDescricao.trim(),
        data: hoje,
        numero: novoNumero,
        status: 'pendente',
      };
      if (aditivoClausulas.trim()) insertData.clausulas_alteradas = aditivoClausulas.trim();
      if (aditivoNovoValor) insertData.novo_valor = parseFloat(aditivoNovoValor);
      if (aditivoNovoPrazo.trim()) insertData.novo_prazo = aditivoNovoPrazo.trim();

      const { data: inserted } = await (supabase.from('contract_aditivos') as any).insert(insertData).select().single();
      
      setContractData(prev => prev ? {
        ...prev,
        aditivos: [...prev.aditivos, { 
          id: inserted?.id || crypto.randomUUID(), 
          numero: novoNumero, 
          titulo: aditivoTitulo.trim(), 
          descricao: aditivoDescricao.trim(), 
          data: hoje, 
          status: 'pendente' as const,
          clausulas_alteradas: aditivoClausulas.trim() || undefined,
          novo_valor: aditivoNovoValor ? parseFloat(aditivoNovoValor) : undefined,
          novo_prazo: aditivoNovoPrazo.trim() || undefined,
        }],
      } : prev);
      setAditivoTitulo("");
      setAditivoDescricao("");
      setAditivoClausulas("");
      setAditivoNovoValor("");
      setAditivoNovoPrazo("");
      setShowAditivoDialog(false);
      toast.success("Aditivo criado! Envie o link para o cliente aceitar.");
      
      // Copy link
      const aditivoLink = `${window.location.origin}/aditivo/${inserted?.id}`;
      navigator.clipboard.writeText(aditivoLink).then(() => {
        toast.info(`Link copiado: ${aditivoLink}`);
      }).catch(() => {});
    } catch {
      toast.error("Erro ao adicionar aditivo.");
    } finally {
      setSavingAditivo(false);
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

        {/* Admin: Add Aditivo */}
        {user && (
          <div className="mt-6 no-print">
            <Button onClick={() => setShowAditivoDialog(true)} variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Adicionar Aditivo
            </Button>
          </div>
        )}

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
              <p className="text-sm text-muted-foreground">
                Confira seus dados antes de assinar. Se necessário, clique no campo para corrigir.
              </p>
              <div>
                <Label htmlFor="confirm-nome" className="flex items-center gap-2">
                  Nome completo
                  <span className="text-xs text-muted-foreground">✏️ editável</span>
                </Label>
                <Input 
                  id="confirm-nome" 
                  value={confirmNome} 
                  onChange={e => handleNomeChange(e.target.value)} 
                  className={nomeEditado ? "border-yellow-500 focus-visible:ring-yellow-500" : ""}
                />
                {nomeEditado && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Nome alterado (original: {nomeOriginal})
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="confirm-email" className="flex items-center gap-2">
                  Email
                  <span className="text-xs text-muted-foreground">✏️ editável</span>
                </Label>
                <Input 
                  id="confirm-email" 
                  type="email" 
                  value={confirmEmail} 
                  onChange={e => handleEmailChange(e.target.value)}
                  className={emailEditado ? "border-yellow-500 focus-visible:ring-yellow-500" : ""}
                />
                {emailEditado && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Alterar o email mudará o endereço onde o contrato será enviado.
                  </p>
                )}
              </div>
              <div className="flex items-start gap-3 pt-2 border-t">
                <Checkbox
                  id="accept-data"
                  checked={acceptData}
                  onCheckedChange={(v) => setAcceptData(!!v)}
                />
                <Label htmlFor="accept-data" className="text-sm cursor-pointer leading-relaxed">
                  Confirmo que meus dados estão corretos
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Se precisar corrigir dados após a assinatura, entre em contato com o contratado.
              </p>
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
                    disabled={!confirmNome.trim() || !confirmEmail.trim() || !/^\S+@\S+\.\S+$/.test(confirmEmail) || !acceptData}
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

      {/* Aditivo Dialog */}
      <Dialog open={showAditivoDialog} onOpenChange={setShowAditivoDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Termo Aditivo</DialogTitle>
            <DialogDescription>O aditivo será enviado ao cliente para aceite eletrônico.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="aditivo-titulo">Título do aditivo</Label>
              <Input id="aditivo-titulo" value={aditivoTitulo} onChange={e => setAditivoTitulo(e.target.value)} placeholder="Ex: Alteração de prazo" />
            </div>
            <div>
              <Label htmlFor="aditivo-desc">Descrição das alterações</Label>
              <Textarea id="aditivo-desc" value={aditivoDescricao} onChange={e => setAditivoDescricao(e.target.value)} placeholder="Descreva detalhadamente as alterações..." rows={4} />
            </div>
            <div>
              <Label htmlFor="aditivo-clausulas">Cláusulas alteradas (opcional)</Label>
              <Textarea id="aditivo-clausulas" value={aditivoClausulas} onChange={e => setAditivoClausulas(e.target.value)} placeholder="Ex: Cláusula 5 - Valor e Condições de Pagamento" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aditivo-valor">Novo valor (opcional)</Label>
                <Input id="aditivo-valor" type="number" step="0.01" value={aditivoNovoValor} onChange={e => setAditivoNovoValor(e.target.value)} placeholder="0,00" />
              </div>
              <div>
                <Label htmlFor="aditivo-prazo">Novo prazo (opcional)</Label>
                <Input id="aditivo-prazo" value={aditivoNovoPrazo} onChange={e => setAditivoNovoPrazo(e.target.value)} placeholder="Ex: 90 dias" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAditivoDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddAditivo} disabled={savingAditivo || !aditivoTitulo.trim() || !aditivoDescricao.trim()}>
              {savingAditivo ? "Criando..." : "Criar e Copiar Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
