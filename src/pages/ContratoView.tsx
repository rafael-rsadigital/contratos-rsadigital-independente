import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ContractDocument } from "@/components/ContractDocument";
import { ContractFormData, ContractType, PaymentMethod, CONTRATADO } from "@/types/contract";
import { ArrowLeft, Download, MessageCircle } from "lucide-react";

export default function ContratoView() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState<ContractFormData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmDate, setConfirmDate] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase
        .from('contracts')
        .select('*, clients(*)')
        .eq('id', id)
        .single();

      if (data) {
        setContractData({
          client: {
            nome: data.clients?.nome || '',
            cpf_cnpj: data.clients?.cpf_cnpj || '',
            logradouro: data.clients?.logradouro || '',
            numero: data.clients?.numero || '',
            bairro: data.clients?.bairro || '',
            cep: data.clients?.cep || '',
            municipio: data.clients?.municipio || '',
            estado: data.clients?.estado || '',
            email: data.clients?.email || '',
          },
          tipo: data.tipo as ContractType,
          servicos: data.servicos || [],
          valor_total: Number(data.valor_total),
          forma_pagamento: data.forma_pagamento as PaymentMethod,
          numero_parcelas: data.numero_parcelas,
          dia_vencimento: data.dia_vencimento,
          desconto_regressivo: data.desconto_regressivo,
        });
        setConfirmed(data.status === 'confirmado');
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

  const handleWhatsApp = () => {
    if (!contractData) return;
    const message = encodeURIComponent(
      `Olá Rafael, confirmo a contratação conforme contrato gerado.\n\nNome: ${contractData.client.nome}`
    );
    window.open(`https://wa.me/${CONTRATADO.whatsapp}?text=${message}`, '_blank');
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
        <Link to="/"><Button variant="outline">Voltar ao início</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card no-print">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <span className="font-bold text-primary">RSA Digital</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> PDF
            </Button>
            <Button onClick={handleWhatsApp} size="sm" className="gap-2 bg-accent hover:bg-accent/90">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-8 max-w-3xl">
        <div id="contract-document" className="bg-card rounded-lg shadow-lg p-6 md:p-10">
          <ContractDocument data={contractData} confirmed={confirmed} confirmDate={confirmDate} />
        </div>
      </main>
    </div>
  );
}
