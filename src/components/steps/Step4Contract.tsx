import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContractFormData, AnexoData, AditivoData, CONTRATADO } from "@/types/contract";
import { Check, Download, MessageCircle, ArrowLeft, Plus, Paperclip, FilePlus } from "lucide-react";
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
  const [confirmed, setConfirmed] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState(initialData.client.email);
  const [saving, setSaving] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);

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

  const handleConfirmClick = () => {
    setShowEmailDialog(true);
  };

  const handleConfirmContract = async () => {
    setSaving(true);
    try {
      const { data: clientRow, error: clientErr } = await supabase
        .from('clients')
        .insert({
          nome: data.client.nome,
          cpf_cnpj: data.client.cpf_cnpj,
          logradouro: data.client.logradouro,
          numero: data.client.numero,
          bairro: data.client.bairro,
          cep: data.client.cep,
          municipio: data.client.municipio,
          estado: data.client.estado,
          email: data.client.email,
        })
        .select()
        .single();

      if (clientErr) throw clientErr;

      const { data: contractRow, error: contractErr } = await supabase
        .from('contracts')
        .insert({
          client_id: clientRow.id,
          tipo: 'website',
          servicos: [data.servico_website, data.servico_google],
          valor_total: data.valor_total,
          forma_pagamento: data.forma_pagamento,
          numero_parcelas: data.numero_parcelas,
          dia_vencimento: data.dia_vencimento,
          desconto_regressivo: data.desconto_regressivo,
          status: 'confirmado',
          data_confirmacao: new Date().toISOString(),
          email_confirmacao: email,
        })
        .select()
        .single();

      if (contractErr) throw contractErr;

      setContractId(contractRow.id);
      setConfirmed(true);
      setShowEmailDialog(false);
      toast.success("Contratos confirmados com sucesso!");
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

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá Rafael, confirmo a contratação conforme contrato gerado.\n\nNome: ${data.client.nome}`
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
              <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Baixar PDF
              </Button>
              <Button onClick={handleWhatsApp} className="gap-2 bg-accent hover:bg-accent/90">
                <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
              </Button>
            </>
          )}
          {!confirmed && (
            <Button onClick={handleConfirmClick} size="lg" className="gap-2">
              <Check className="w-4 h-4" /> Confirmar Contratação
            </Button>
          )}
        </div>
      </div>

      <div id="contract-document" className="bg-card rounded-lg shadow-lg p-6 md:p-10">
        <ContractDocument data={data} confirmed={confirmed} confirmDate={confirmDate} />
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Contratação</DialogTitle>
            <DialogDescription>Informe o email do cliente para confirmação dos contratos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="confirm-email">Email do cliente</Label>
            <Input id="confirm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancelar</Button>
            <Button onClick={handleConfirmContract} disabled={saving || !email}>
              {saving ? "Salvando..." : "Confirmar Contratos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anexo Dialog */}
      <Dialog open={showAnexoDialog} onOpenChange={setShowAnexoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Anexo</DialogTitle>
            <DialogDescription>
              Anexos servem para registrar alterações, complementações ou anulações de cláusulas do contrato, mediante acordo entre as partes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="anexo-titulo">Título do anexo</Label>
              <Input id="anexo-titulo" value={anexoTitulo} onChange={(e) => setAnexoTitulo(e.target.value)} placeholder="Ex: Alteração da cláusula 5" />
            </div>
            <div>
              <Label htmlFor="anexo-desc">Descrição</Label>
              <Textarea id="anexo-desc" value={anexoDescricao} onChange={(e) => setAnexoDescricao(e.target.value)} placeholder="Descreva a alteração, complementação ou anulação..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnexoDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddAnexo} disabled={!anexoTitulo.trim() || !anexoDescricao.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar Anexo
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
              Aditivos registram renovações de prazo ou inclusão de novos serviços após o término ou durante a vigência do contrato.
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
              <Plus className="w-4 h-4 mr-1" /> Adicionar Aditivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
