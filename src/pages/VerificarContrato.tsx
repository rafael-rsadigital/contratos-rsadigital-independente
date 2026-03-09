import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, ShieldCheck } from "lucide-react";
import logoRsa from "@/assets/logo-rsa-digital.png";

interface VerificationResult {
  nome: string;
  status: string;
  data_confirmacao: string | null;
  nome_confirmacao: string | null;
  numero_contrato: string | null;
  servicos: string[];
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  rascunho: { label: "Rascunho", variant: "outline" },
  enviado: { label: "Enviado", variant: "secondary" },
  a_confirmar: { label: "Aguardando Confirmação", variant: "secondary" },
  confirmado: { label: "Confirmado", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export default function VerificarContrato() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);

    const { data } = await supabase
      .from('contracts')
      .select('status, data_confirmacao, nome_confirmacao, numero_contrato, servicos, clients(nome)')
      .eq('codigo_verificacao', code.trim())
      .single();

    if (data) {
      setResult({
        nome: (data.clients as any)?.nome || '—',
        status: data.status,
        data_confirmacao: data.data_confirmacao,
        nome_confirmacao: data.nome_confirmacao,
        numero_contrato: data.numero_contrato,
        servicos: data.servicos || [],
      });
    } else {
      setNotFound(true);
    }
    setLoading(false);
  };

  const st = result ? (statusLabels[result.status] || statusLabels.rascunho) : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <img src={logoRsa} alt="RSA Digital" className="h-10 object-contain mx-auto" />
          <CardTitle className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Verificar Contrato
          </CardTitle>
          <CardDescription>
            Insira o código de verificação para consultar o status do contrato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: RSA-2026-ABC123"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              className="font-mono"
            />
            <Button onClick={handleVerify} disabled={loading || !code.trim()} className="gap-2">
              <Search className="w-4 h-4" />
              {loading ? "..." : "Verificar"}
            </Button>
          </div>

          {notFound && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="font-medium">Contrato não encontrado.</p>
              <p className="text-sm mt-1">Verifique o código e tente novamente.</p>
            </div>
          )}

          {result && st && (
            <div className="border rounded-lg p-5 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  {result.numero_contrato || '—'}
                </span>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p>Contratante: <strong>{result.nome}</strong></p>
                <p>Serviços: <strong>{result.servicos.join(', ') || '—'}</strong></p>
                {result.data_confirmacao && (
                  <p>Data do aceite: <strong>
                    {new Date(result.data_confirmacao).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </strong></p>
                )}
                {result.nome_confirmacao && (
                  <p>Confirmado por: <strong>{result.nome_confirmacao}</strong></p>
                )}
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Este é um registro verificado emitido pela RSA Digital.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
