import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Stepper } from "@/components/Stepper";
import { Step1ClientData } from "@/components/steps/Step1ClientData";
import { Step2ContractType } from "@/components/steps/Step2ContractType";
import { Step3Commercial } from "@/components/steps/Step3Commercial";
import { Step4Contract } from "@/components/steps/Step4Contract";
import { ClientData, ContractFormData } from "@/types/contract";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STEPS = ["Cliente", "Serviços", "Pagamento", "Geração"];

const emptyClient: ClientData = {
  nome: "", cpf_cnpj: "", celular: "", logradouro: "", numero: "",
  bairro: "", cep: "", municipio: "", estado: "", email: "",
};

export default function NovoContrato() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [existingClientId, setExistingClientId] = useState<string | undefined>();
  const [formData, setFormData] = useState<ContractFormData>({
    client: emptyClient,
    servicos: [],
    servico_website: "",
    servico_google: "",
    prazo_google: "30 dias",
    valor_total: 0,
    forma_pagamento: "pix_boleto",
    numero_parcelas: 1,
    data_primeiro_vencimento: "",
    desconto_regressivo: false,
    valor_entrada: 0,
    forma_pagamento_entrada: "pix",
    numero_paginas: 5,
    tem_permuta: false,
    permuta_valor: 0,
    permuta_descricao: "",
    permuta_condicoes: "",
    valor_a_vista: null,
    mencionar_desconto_avista: false,
    link_pagamento: "",
    escopo_personalizado: "",
    servico_recorrente: false,
    cronograma_personalizado: false,
    vencimentos_personalizados: [],
    anexos: [],
    aditivos: [],
  });

  // Pre-load client if client_id is in URL
  useEffect(() => {
    const clientId = searchParams.get('client_id');
    if (!clientId) return;
    const load = async () => {
      const { data } = await supabase.from('clients').select('*').eq('id', clientId).single();
      if (data) {
        setExistingClientId(data.id);
        setFormData(d => ({
          ...d,
          client: {
            nome: data.nome,
            cpf_cnpj: data.cpf_cnpj,
            celular: data.celular,
            email: data.email || '',
            logradouro: data.logradouro,
            numero: data.numero,
            bairro: data.bairro,
            cep: data.cep,
            municipio: data.municipio,
            estado: data.estado,
          },
        }));
        setStep(1); // Skip to step 2
      }
    };
    load();
  }, [searchParams]);

  const isInstitucional = formData.servico_website.includes('Institucional');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="font-bold text-lg text-primary hover:opacity-80 transition">
            RSA Digital
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Novo Contrato</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <Stepper steps={STEPS} currentStep={step} />

        {step === 0 && (
          <Step1ClientData
            data={formData.client}
            onNext={(client, clientId) => {
              setFormData(d => ({ ...d, client }));
              if (clientId) setExistingClientId(clientId);
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <Step2ContractType
            servicoWebsite={formData.servico_website}
            servicoGoogle={formData.servico_google}
            prazoGoogle={formData.prazo_google}
            onNext={(servicoWebsite, servicoGoogle, prazoGoogle) => {
              const servicos = [servicoWebsite, servicoGoogle].filter(Boolean);
              setFormData(d => ({
                ...d,
                servico_website: servicoWebsite,
                servico_google: servicoGoogle,
                prazo_google: prazoGoogle,
                servicos,
              }));
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <Step3Commercial
            data={{
              valor_total: formData.valor_total,
              forma_pagamento: formData.forma_pagamento,
              numero_parcelas: formData.numero_parcelas,
              data_primeiro_vencimento: formData.data_primeiro_vencimento,
              valor_entrada: formData.valor_entrada,
              forma_pagamento_entrada: formData.forma_pagamento_entrada,
              numero_paginas: formData.numero_paginas,
              tem_permuta: formData.tem_permuta,
              permuta_valor: formData.permuta_valor,
              permuta_descricao: formData.permuta_descricao,
              permuta_condicoes: formData.permuta_condicoes,
              valor_a_vista: formData.valor_a_vista,
              mencionar_desconto_avista: formData.mencionar_desconto_avista,
              link_pagamento: formData.link_pagamento,
              escopo_personalizado: formData.escopo_personalizado,
              servico_recorrente: formData.servico_recorrente,
              cronograma_personalizado: formData.cronograma_personalizado,
              vencimentos_personalizados: formData.vencimentos_personalizados,
            }}
            hasWebsite={!!formData.servico_website}
            isInstitucional={isInstitucional}
            onNext={(vals) => { setFormData(d => ({ ...d, ...vals })); setStep(3); }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step4Contract
            data={formData}
            existingClientId={existingClientId}
            onBack={() => setStep(2)}
            onConfirmed={(id) => {/* stay on page, share buttons shown */}}
          />
        )}
      </main>
    </div>
  );
}
