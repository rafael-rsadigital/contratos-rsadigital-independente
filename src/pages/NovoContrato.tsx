import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stepper } from "@/components/Stepper";
import { Step1ClientData } from "@/components/steps/Step1ClientData";
import { Step2ContractType } from "@/components/steps/Step2ContractType";
import { Step3Commercial } from "@/components/steps/Step3Commercial";
import { Step4Contract } from "@/components/steps/Step4Contract";
import { ClientData, ContractFormData } from "@/types/contract";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const STEPS = ["Cliente", "Serviços", "Pagamento", "Geração"];

const emptyClient: ClientData = {
  nome: "", cpf_cnpj: "", celular: "", logradouro: "", numero: "",
  bairro: "", cep: "", municipio: "", estado: "", email: "",
};

export default function NovoContrato() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [step, setStep] = useState(0);
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
    permuta_valor: 0,
    permuta_descricao: "",
    permuta_condicoes: "",
    anexos: [],
    aditivos: [],
  });

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
            onNext={(client) => { setFormData(d => ({ ...d, client })); setStep(1); }}
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
            onBack={() => setStep(2)}
            onConfirmed={(id) => {/* stay on page, share buttons shown */}}
          />
        )}
      </main>
    </div>
  );
}
