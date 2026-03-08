import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ContractFormData, AnexoData, AditivoData, CONTRATADO } from "@/types/contract";
import { Check, Download, MessageCircle, ArrowLeft, Plus, Paperclip, FilePlus, Link2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ContractDocument } from "@/components/ContractDocument";

interface Props {
  data: ContractFormData;
  onBack: () => void;
  onConfirmed: (contractId: string) => void;
}

function generateVerificationCode(contractId: string): string {
  const year = new Date().getFullYear();
  const hash = contractId.substring(0, 6).toUpperCase();
  return `RSA-${year}-${hash}`;
}

export function Step4Contract({ data: initialData, onBack, onConfirmed }: Props) {
  const [data, setData] = useState(initialData);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [codigoVerificacao, setCodigoVerificacao] = useState("");

  // Anexo/Aditivo dialogs
  const [showAnexoDialog, setShowAnexoDialog] = useState(false);
  const [showAditivoDialog, setShowAditivoDialog] = useState(false);
  const [anexoTitulo, setAnexoTitulo] = useState("");
  const [anexoDescricao, setAnexoDescricao] = useState("");
  const [aditivoTitulo, setAditivoTitulo] = useState("");
  const [aditivoDescricao, setAditivoDescricao] = useState("");

  const confirmDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

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

      // Determine principal service (first one has the financial value)
      const servicos = [data.servico_website, data.servico_google].filter(Boolean);

      // Save contract
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
        })
        .select()
        .single();

      if (contractErr) throw contractErr;

      // Generate verification code
      const code = generateVerificationCode(contractRow.id);
      await supabase.from('contracts').update({ codigo_verificacao: code }).eq('id', contractRow.id);

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
      setCodigoVerificacao(code);
      setConfirmed(true);
      toast.success("Contrato salvo como rascunho!");
      onConfirmed(contractRow.id);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar contrato. Tente novamente.");
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
        filename: `contrato-${data.client.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save();
  };

  const handleCopyLink = () => {
    if (!contractId) return;
    const link = `${window.location.origin}/contrato/${contractId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const handleWhatsApp = () => {
    if (!contractId) return;
    const link = `${window.location.origin}/contrato/${contractId}`;
    const servicos = [data.servico_website, data.servico_google].filter(Boolean).join(' + ');
    const message = encodeURIComponent(
      `Olá Rafael, confirmei o contrato da RSA Digital.\n\nCliente: ${data.client.nome}\nServiço: ${servicos}\nValor: R$ ${Number(data.valor_total).toFixed(2)}\n\nLink do contrato:\n${link}`
    );
    window.open(`https://wa.me/${CONTRATADO.whatsapp}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex gap-2 flex-wrap">
          {!confirmed && (
            <>
              <Button variant="outline" onClick={() => setShowAnexoDialog(true)} className="gap-2">
                <Paperclip className="w-4 h-4" /> Anexo
              </Button>
              <Button variant="outline" onClick={() => setShowAditivoDialog(true)} className="gap-2">
                <FilePlus className="w-4 h-4" /> Aditivo
              </Button>
            </>
          )}
          {confirmed && (
            <>
              <Button onClick={handleCopyLink} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" /> Copiar Link
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Baixar PDF
              </Button>
              <Button onClick={handleWhatsApp} className="gap-2 bg-accent hover:bg-accent/90">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
            </>
          )}
          {!confirmed && (
            <Button onClick={handleSaveContract} size="lg" className="gap-2" disabled={saving}>
              <Check className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Contrato"}
            </Button>
          )}
        </div>
      </div>

      <div id="contract-document" className="bg-card rounded-lg shadow-lg p-6 md:p-10">
        <ContractDocument
          data={data}
          confirmed={false}
          codigoVerificacao={codigoVerificacao}
        />
      </div>

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
