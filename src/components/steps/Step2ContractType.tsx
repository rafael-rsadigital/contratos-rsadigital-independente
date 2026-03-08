import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WEBSITE_SERVICES, GOOGLE_SERVICES, GOOGLE_PRAZO_OPTIONS } from "@/types/contract";
import { FileText, Monitor, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  servicoWebsite: string;
  servicoGoogle: string;
  prazoGoogle: string;
  onNext: (servicoWebsite: string, servicoGoogle: string, prazoGoogle: string) => void;
  onBack: () => void;
}

export function Step2ContractType({ servicoWebsite: initialWeb, servicoGoogle: initialGoogle, prazoGoogle: initialPrazo, onNext, onBack }: Props) {
  const [servicoWebsite, setServicoWebsite] = useState(initialWeb);
  const [servicoGoogle, setServicoGoogle] = useState(initialGoogle);
  const [prazoGoogle, setPrazoGoogle] = useState(initialPrazo || '30 dias');

  const canProceed = servicoWebsite !== '' || servicoGoogle !== '';

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="w-5 h-5 text-primary" />
          Serviços Contratados
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione os serviços desejados. É possível combinar um serviço de website com presença digital no Google.
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
            <label
              className={cn(
                "flex items-center gap-3 cursor-pointer p-3 rounded-md border transition-colors",
                servicoWebsite === '' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
            >
              <RadioGroupItem value="" id="web-none" />
              <Label htmlFor="web-none" className="cursor-pointer font-medium text-muted-foreground">Nenhum serviço de website</Label>
            </label>
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
            <label
              className={cn(
                "flex items-center gap-3 cursor-pointer p-3 rounded-md border transition-colors",
                servicoGoogle === '' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
            >
              <RadioGroupItem value="" id="google-none" />
              <Label htmlFor="google-none" className="cursor-pointer font-medium text-muted-foreground">Nenhum serviço Google</Label>
            </label>
          </RadioGroup>

          {/* Prazo selection when Google is selected */}
          {servicoGoogle && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30 space-y-2">
              <Label className="font-semibold">Prazo do serviço Google</Label>
              <Select value={prazoGoogle} onValueChange={setPrazoGoogle}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o prazo" />
                </SelectTrigger>
                <SelectContent>
                  {GOOGLE_PRAZO_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Voltar</Button>
          <Button onClick={() => onNext(servicoWebsite, servicoGoogle, servicoGoogle ? prazoGoogle : '')} disabled={!canProceed} size="lg">
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
