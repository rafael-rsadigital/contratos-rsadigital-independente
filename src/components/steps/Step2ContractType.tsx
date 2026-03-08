import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { WEBSITE_SERVICES, GOOGLE_SERVICES } from "@/types/contract";
import { FileText, Monitor, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  servicoWebsite: string;
  servicoGoogle: string;
  onNext: (servicoWebsite: string, servicoGoogle: string) => void;
  onBack: () => void;
}

export function Step2ContractType({ servicoWebsite: initialWeb, servicoGoogle: initialGoogle, onNext, onBack }: Props) {
  const [servicoWebsite, setServicoWebsite] = useState(initialWeb);
  const [servicoGoogle, setServicoGoogle] = useState(initialGoogle);

  const canProceed = servicoWebsite !== '' && servicoGoogle !== '';

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="w-5 h-5 text-primary" />
          Serviços Contratados
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione 1 serviço de website e 1 serviço de presença digital no Google.
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Website */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Desenvolvimento de Website</h3>
          </div>
          <RadioGroup value={servicoWebsite} onValueChange={setServicoWebsite} className="space-y-2">
            {WEBSITE_SERVICES.map(service => (
              <label
                key={service}
                className={cn(
                  "flex items-center gap-3 cursor-pointer p-3 rounded-md border transition-colors",
                  servicoWebsite === service
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value={service} id={`web-${service}`} />
                <Label htmlFor={`web-${service}`} className="cursor-pointer font-medium">{service}</Label>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Google */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Presença Digital no Google</h3>
          </div>
          <RadioGroup value={servicoGoogle} onValueChange={setServicoGoogle} className="space-y-2">
            {GOOGLE_SERVICES.map(service => (
              <label
                key={service}
                className={cn(
                  "flex items-center gap-3 cursor-pointer p-3 rounded-md border transition-colors",
                  servicoGoogle === service
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value={service} id={`google-${service}`} />
                <Label htmlFor={`google-${service}`} className="cursor-pointer font-medium">{service}</Label>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Voltar</Button>
          <Button onClick={() => onNext(servicoWebsite, servicoGoogle)} disabled={!canProceed} size="lg">
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
