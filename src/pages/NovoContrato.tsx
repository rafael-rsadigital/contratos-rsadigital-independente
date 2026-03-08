import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stepper } from "@/components/Stepper";
import { Step1ClientData } from "@/components/steps/Step1ClientData";
import { Step2ContractType } from "@/components/steps/Step2ContractType";
import { Step3Commercial } from "@/components/steps/Step3Commercial";
import { Step4Contract } from "@/components/steps/Step4Contract";
import { ClientData, ContractFormData, ContractType, PaymentMethod } from "@/types/contract";

const STEPS = ["Cliente", "Contrato", "Pagamento", "Geração"];

const emptyClient: ClientData = {
  nome: "", cpf_cnpj: "", logradouro: "", numero: "",
  bairro: "", cep: "", municipio: "", estado: "", email: "",
};

export default function NovoContrato() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ContractFormData>({
    client: emptyClient,
    tipo: "website",
    servicos: [],
    valor_total: 0,
    forma_pagamento: "pix",
    numero_parcelas: 1,
    dia_vencimento: 9,
    desconto_regressivo: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="font-bold text-lg text-primary hover:opacity-80 transition">
            RSA Digital
          </button>
          <span className="text-sm text-muted-foreground">Novo Contrato</span>
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
            tipo={formData.tipo}
            servicos={formData.servicos}
            onNext={(tipo, servicos) => { setFormData(d => ({ ...d, tipo, servicos })); setStep(2); }}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <Step3Commercial
            data={{
              valor_total: formData.valor_total,
              forma_pagamento: formData.forma_pagamento,
              numero_parcelas: formData.numero_parcelas,
              dia_vencimento: formData.dia_vencimento,
            }}
            onNext={(vals) => { setFormData(d => ({ ...d, ...vals })); setStep(3); }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <Step4Contract
            data={formData}
            onBack={() => setStep(2)}
            onConfirmed={(id) => navigate(`/contrato/${id}`)}
          />
        )}
      </main>
    </div>
  );
}
