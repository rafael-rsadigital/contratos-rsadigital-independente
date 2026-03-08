import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContractFormData, AnexoData, AditivoData, CONTRATADO } from "@/types/contract";
import { Check, Download, MessageCircle, ArrowLeft, Plus, Paperclip, FilePlus, Copy, Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContractDocument } from "@/components/ContractDocument";

interface Props {
  data: ContractFormData;
  onBack: () => void;
  onConfirmed: (contractId: string) => void;
}

export function Step4Contract({ data: initialData, onBack, onConfirmed }: Props) {
  const [data, setData] = useState(initialData);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [codigoVerificacao, setCodigoVerificacao] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");

  // Anexo/Aditivo dialogs
  const [showAnexoDialog, setShowAnexoDialog] = useState(false);
  const [showAditivoDialog, setShowAditivoDialog] = useState(false);
  const [anexoTitulo, setAnexoTitulo] = useState("");
  const [anexoDescricao, setAnexoDescricao] = useState("");
  const [aditivoTitulo, setAditivoTitulo] = useState("");
  const [aditivoDescricao, setAditivoDescricao] = useState("");

  // Share dialog
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleAddAnexo = () => {
    if (!anexoTitulo.trim() || !anexoDescricao.trim()) return;
    const novo: AnexoData = {
      id: crypto.randomUUID(),
      titulo: anexoTitulo.trim(),
      descricao: anexoDescricao.trim(),
      data: new Date().toLocaleDateString('pt-BR'),
    };
    setData(d => ({ ...d, anexos: [...d.anexos, novo] }));
    setAnexoTitulo("");
    setAnexoDescricao("");
    setShowAnexoDialog(false);
    toast.success("Anexo adicionado.");
  };

  const handleAddAditivo = () => {
    if (!aditivoTitulo.trim() || !aditivoDescricao.trim()) return;
    const novo: AditivoData = {
      id: crypto.randomUUID(),
      titulo: aditivoTitulo.trim(),
      descricao: aditivoDescricao.trim(),
      data: new Date().toLocaleDateString('pt-BR'),
    };
    setData(d => ({ ...d, aditivos: [...d.aditivos, novo] }));
    setAditivoTitulo("");
    setAditivoDescricao("");
    setShowAditivoDialog(false);
    toast.success("Aditivo adicionado.");
  };

  const handleSaveContract = async () => {
    setSaving(true);
    try {
      // Save client
      const { data: clientRow, error: clientErr } = await supabase
        .from('clients')
        .insert({
          nome: data.client.nome,
          cpf_cnpj: data.client.cpf_cnpj,
          celular: data.client.celular,
          logradouro: data.client.logradouro,
          numero: data.client.numero,
          bairro: data.client.bairro,
          cep: data.client.cep,
          municipio: data.client.municipio,
          estado: data.client.estado,
          email: data.client.email || '',
        })
        .select()
        .single();

      if (clientErr) throw clientErr;

      const servicos = [data.servico_website, data.servico_google].filter(Boolean);

      const { data: contractRow, error: contractErr } = await supabase
        .from('contracts')
        .insert({
          client_id: clientRow.id,
          tipo: servicos[0] || 'website',
          servicos,
          valor_total: data.valor_total,
          forma_pagamento: data.forma_pagamento,
          numero_parcelas: data.numero_parcelas,
          data_primeiro_vencimento: data.data_primeiro_vencimento || null,
          desconto_regressivo: data.desconto_regressivo,
          status: 'rascunho',
          valor_entrada: data.valor_entrada,
          forma_pagamento_entrada: data.forma_pagamento_entrada,
          numero_paginas: data.numero_paginas || null,
          servico_principal: servicos[0] || null,
          prazo_google: data.prazo_google || '30 dias',
        } as any)
        .select()
        .single();

      if (contractErr) throw contractErr;

      // Generate verification code
      const code = `RSA-${new Date().getFullYear()}-${(contractRow as any).numero_contrato?.split('-').pop() || contractRow.id.substring(0, 6).toUpperCase()}`;
      const finalCode = (contractRow as any).numero_contrato
        ? `${(contractRow as any).numero_contrato}-${contractRow.id.substring(0, 4).toUpperCase()}`
        : `RSA-${new Date().getFullYear()}-${contractRow.id.substring(0, 6).toUpperCase()}`;
      
      await supabase.from('contracts').update({ codigo_verificacao: finalCode }).eq('id', contractRow.id);

      // Save anexos
      if (data.anexos.length > 0) {
        await supabase.from('contract_anexos').insert(
          data.anexos.map(a => ({ contract_id: contractRow.id, titulo: a.titulo, descricao: a.descricao, data: a.data }))
        );
      }

      // Save aditivos
      if (data.aditivos.length > 0) {
        await supabase.from('contract_aditivos').insert(
          data.aditivos.map(a => ({ contract_id: contractRow.id, titulo: a.titulo, descricao: a.descricao, data: a.data }))
        );
      }

      setContractId(contractRow.id);
      setCodigoVerificacao(finalCode);
      setNumeroContrato((contractRow as any).numero_contrato || '');
      setSaved(true);
      toast.success("Contrato salvo com sucesso!");
      onConfirmed(contractRow.id);
    } catch (err) {
      console.error('Erro ao salvar contrato:', err);
      toast.error("Erro ao salvar contrato. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const getContractLink = () => {
    if (!contractId) return '';
    return `${window.location.origin}/contrato/${contractId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getContractLink());
    toast.success("Link copiado!");
  };

  const handleWhatsApp = () => {
    const link = getContractLink();
    const message = encodeURIComponent(
      `Olá ${data.client.nome}.\n\nSegue o contrato para leitura e confirmação:\n\n${link}\n\nApós a leitura basta clicar em "Confirmar contratação".`
    );
    window.open(`https://wa.me/55${data.client.celular.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    if (!data.client.email) {
      toast.error("Cliente não possui email cadastrado.");
      return;
    }
    const link = getContractLink();
    const servicos = [data.servico_website, data.servico_google].filter(Boolean).join(' + ');
    const subject = encodeURIComponent(`Contrato RSA Digital - ${servicos}`);
    const body = encodeURIComponent(
      `Olá ${data.client.nome},\n\nSegue o contrato para leitura e confirmação:\n\n${link}\n\nApós a leitura basta clicar em "Confirmar contratação".\n\nAtenciosamente,\nRSA Digital`
    );
    window.open(`mailto:${data.client.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('contract-document');
    if (!element) return;
    const html2pdf = (await import('html2pdf.js')).default;
    html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `contrato-${data.client.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={saved}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex gap-2 flex-wrap">
          {!saved && (
            <>
              <Button variant="outline" onClick={() => setShowAnexoDialog(true)} className="gap-2">
                <Paperclip className="w-4 h-4" /> Anexo
              </Button>
              <Button variant="outline" onClick={() => setShowAditivoDialog(true)} className="gap-2">
                <FilePlus className="w-4 h-4" /> Aditivo
              </Button>
              <Button onClick={handleSaveContract} size="lg" className="gap-2" disabled={saving}>
                <Check className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Contrato"}
              </Button>
            </>
          )}
          {saved && (
            <>
              <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> PDF
              </Button>
              <Button onClick={() => setShowShareDialog(true)} size="lg" className="gap-2">
                <Send className="w-4 h-4" /> Enviar ao Cliente
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Contract number badge */}
      {saved && numeroContrato && (
        <div className="text-center">
          <span className="inline-block bg-primary/10 text-primary font-mono text-sm px-4 py-2 rounded-full">
            Contrato nº {numeroContrato}
          </span>
        </div>
      )}

      <div id="contract-document" className="bg-card rounded-lg shadow-lg p-6 md:p-10">
        <ContractDocument
          data={data}
          confirmed={false}
          codigoVerificacao={codigoVerificacao}
          numeroContrato={numeroContrato}
        />
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enviar contrato ao cliente</DialogTitle>
            <DialogDescription>Escolha como enviar o link do contrato.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button onClick={handleWhatsApp} className="w-full gap-3 justify-start h-12 bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)]">
              <MessageCircle className="w-5 h-5" /> Enviar via WhatsApp
            </Button>
            <Button onClick={handleEmail} variant="outline" className="w-full gap-3 justify-start h-12">
              <Mail className="w-5 h-5" /> Enviar via Email
            </Button>
            <Button onClick={handleCopyLink} variant="outline" className="w-full gap-3 justify-start h-12">
              <Copy className="w-5 h-5" /> Copiar Link
            </Button>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md break-all">
            {getContractLink()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Anexo Dialog */}
      <Dialog open={showAnexoDialog} onOpenChange={setShowAnexoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Anexo</DialogTitle>
            <DialogDescription>
              Anexos servem para registrar alterações, complementações ou anulações de cláusulas do contrato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="anexo-titulo">Título do anexo</Label>
              <Input id="anexo-titulo" value={anexoTitulo} onChange={(e) => setAnexoTitulo(e.target.value)} placeholder="Ex: Alteração da cláusula 5" />
            </div>
            <div>
              <Label htmlFor="anexo-desc">Descrição</Label>
              <Textarea id="anexo-desc" value={anexoDescricao} onChange={(e) => setAnexoDescricao(e.target.value)} placeholder="Descreva a alteração..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnexoDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddAnexo} disabled={!anexoTitulo.trim() || !anexoDescricao.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aditivo Dialog */}
      <Dialog open={showAditivoDialog} onOpenChange={setShowAditivoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Aditivo</DialogTitle>
            <DialogDescription>
              Aditivos registram renovações de prazo ou inclusão de novos serviços.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="aditivo-titulo">Título do aditivo</Label>
              <Input id="aditivo-titulo" value={aditivoTitulo} onChange={(e) => setAditivoTitulo(e.target.value)} placeholder="Ex: Renovação de prazo por 30 dias" />
            </div>
            <div>
              <Label htmlFor="aditivo-desc">Descrição</Label>
              <Textarea id="aditivo-desc" value={aditivoDescricao} onChange={(e) => setAditivoDescricao(e.target.value)} placeholder="Descreva a renovação ou novo serviço..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAditivoDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddAditivo} disabled={!aditivoTitulo.trim() || !aditivoDescricao.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
