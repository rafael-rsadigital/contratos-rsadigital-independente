import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ContractType, WEBSITE_SERVICES, GOOGLE_SERVICES } from "@/types/contract";
import { FileText, Globe, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  tipo: ContractType;
  servicos: string[];
  onNext: (tipo: ContractType, servicos: string[]) => void;
  onBack: () => void;
}

export function Step2ContractType({ tipo: initialTipo, servicos: initialServicos, onNext, onBack }: Props) {
  const [tipo, setTipo] = useState<ContractType>(initialTipo);
  const [servicos, setServicos] = useState<string[]>(initialServicos);

  const availableServices = tipo === 'website' ? WEBSITE_SERVICES : GOOGLE_SERVICES;

  const handleTipoChange = (newTipo: ContractType) => {
    setTipo(newTipo);
    setServicos([]);
  };

  const toggleService = (service: string) => {
    setServicos(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const canProceed = servicos.length > 0;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="w-5 h-5 text-primary" />
          Tipo de Contrato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleTipoChange('website')}
            className={cn(
              "p-6 rounded-lg border-2 text-left transition-all hover:shadow-md",
              tipo === 'website'
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/40"
            )}
          >
            <Monitor className={cn("w-8 h-8 mb-3", tipo === 'website' ? "text-primary" : "text-muted-foreground")} />
            <h3 className="font-semibold text-lg">Desenvolvimento de Website</h3>
            <p className="text-sm text-muted-foreground mt-1">Criação de site profissional responsivo</p>
          </button>
          <button
            type="button"
            onClick={() => handleTipoChange('google')}
            className={cn(
              "p-6 rounded-lg border-2 text-left transition-all hover:shadow-md",
              tipo === 'google'
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/40"
            )}
          >
            <Globe className={cn("w-8 h-8 mb-3", tipo === 'google' ? "text-primary" : "text-muted-foreground")} />
            <h3 className="font-semibold text-lg">Presença Digital no Google</h3>
            <p className="text-sm text-muted-foreground mt-1">Otimização do Perfil da Empresa no Google</p>
          </button>
        </div>

        <div>
          <h4 className="font-medium mb-3">Serviços inclusos:</h4>
          <div className="space-y-3">
            {availableServices.map(service => (
              <label key={service} className="flex items-center gap-3 cursor-pointer p-3 rounded-md hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={servicos.includes(service)}
                  onCheckedChange={() => toggleService(service)}
                />
                <span className="text-sm font-medium">{service}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Voltar</Button>
          <Button onClick={() => onNext(tipo, servicos)} disabled={!canProceed} size="lg">
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
