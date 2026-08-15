import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

const OUTRO = "__outro__";

// A custom ("Outro") service is one typed in free text, i.e. not part of the
// fixed lists. Used to pre-select the "Outro" radio + fill the text field
// when editing a contract that already has a custom service name.
function isCustom(value: string, fixedList: readonly string[]) {
  return value !== '' && !fixedList.includes(value as any);
}

export function Step2ContractType({ servicoWebsite: initialWeb, servicoGoogle: initialGoogle, prazoGoogle: initialPrazo, onNext, onBack }: Props) {
  const webIsCustom = isCustom(initialWeb, WEBSITE_SERVICES);
  const googleIsCustom = isCustom(initialGoogle, GOOGLE_SERVICES);

  const [servicoWebsite, setServicoWebsite] = useState(webIsCustom ? OUTRO : initialWeb);
  const [servicoWebsiteOutro, setServicoWebsiteOutro] = useState(webIsCustom ? initialWeb : '');
  const [servicoGoogle, setServicoGoogle] = useState(googleIsCustom ? OUTRO : initialGoogle);
  const [servicoGoogleOutro, setServicoGoogleOutro] = useState(googleIsCustom ? initialGoogle : '');
  const [prazoGoogle, setPrazoGoogle] = useState(initialPrazo || '30 dias');

  const resolvedWebsite = servicoWebsite === OUTRO ? servicoWebsiteOutro.trim() : servicoWebsite;
  const resolvedGoogle = servicoGoogle === OUTRO ? servicoGoogleOutro.trim() : servicoGoogle;

  const canProceed =
    (servicoWebsite !== '' && !(servicoWebsite === OUTRO && resolvedWebsite === '')) ||
    (servicoGoogle !== '' && !(servicoGoogle === OUTRO && resolvedGoogle === ''));

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
                servicoWebsite === OUTRO ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
            >
              <RadioGroupItem value={OUTRO} id="web-outro" />
              <Label htmlFor="web-outro" className="cursor-pointer font-medium">Outro</Label>
            </label>
            {servicoWebsite === OUTRO && (
              <Input
                autoFocus
                placeholder="Ex: Cardápio Digital"
                value={servicoWebsiteOutro}
                onChange={(e) => setServicoWebsiteOutro(e.target.value)}
                className="ml-1"
              />
            )}
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
                servicoGoogle === OUTRO ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
            >
              <RadioGroupItem value={OUTRO} id="google-outro" />
              <Label htmlFor="google-outro" className="cursor-pointer font-medium">Outro</Label>
            </label>
            {servicoGoogle === OUTRO && (
              <Input
                autoFocus
                placeholder="Ex: Gestão de Redes Sociais"
                value={servicoGoogleOutro}
                onChange={(e) => setServicoGoogleOutro(e.target.value)}
                className="ml-1"
              />
            )}
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

          {/* Prazo (editável, com sugestões rápidas) */}
          {servicoGoogle && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30 space-y-2">
              <Label className="font-semibold">Prazo do serviço</Label>
              <Input
                value={prazoGoogle}
                onChange={(e) => setPrazoGoogle(e.target.value)}
                placeholder="Ex: 30 dias, até 15/12, indeterminado..."
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {GOOGLE_PRAZO_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPrazoGoogle(opt)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors",
                      prazoGoogle === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Voltar</Button>
          <Button onClick={() => onNext(resolvedWebsite, resolvedGoogle, resolvedGoogle ? prazoGoogle : '')} disabled={!canProceed} size="lg">
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
