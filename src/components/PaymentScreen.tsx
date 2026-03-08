import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTRATADO } from "@/types/contract";
import { Copy, Check, QrCode, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PaymentScreenProps {
  valorTotal: number;
  valorEntradaMinimo: number;
  numeroParcelas: number;
  descontoRegressivo: boolean;
  formaPagamento: string;
  onConfirm: (valorEntrada: number, parcelas: number) => void;
  onBack: () => void;
  saving: boolean;
}

function calcularDesconto(parcelasRestantes: number): number {
  // 15% inicial, reduz 1% por mês, mínimo 5%
  const desconto = Math.max(15 - (parcelasRestantes - 1), 5);
  return desconto;
}

export function PaymentScreen({
  valorTotal,
  valorEntradaMinimo,
  numeroParcelas,
  descontoRegressivo,
  formaPagamento,
  onConfirm,
  onBack,
  saving,
}: PaymentScreenProps) {
  const [valorEntrada, setValorEntrada] = useState(valorEntradaMinimo);
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState(numeroParcelas);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isPixBoleto = formaPagamento === "pix_boleto";

  const resumo = useMemo(() => {
    const restante = valorTotal - valorEntrada;
    const valorParcela = parcelasSelecionadas > 0 ? restante / parcelasSelecionadas : restante;
    
    let descontoPercent = 0;
    let valorComDesconto = valorTotal;
    if (descontoRegressivo && isPixBoleto && parcelasSelecionadas <= numeroParcelas) {
      descontoPercent = calcularDesconto(parcelasSelecionadas);
      valorComDesconto = valorTotal * (1 - descontoPercent / 100);
    }

    const restanteComDesconto = valorComDesconto - valorEntrada;
    const parcelaComDesconto = parcelasSelecionadas > 0 ? restanteComDesconto / parcelasSelecionadas : restanteComDesconto;

    return {
      restante,
      valorParcela,
      descontoPercent,
      valorComDesconto,
      restanteComDesconto,
      parcelaComDesconto,
    };
  }, [valorTotal, valorEntrada, parcelasSelecionadas, descontoRegressivo, isPixBoleto, numeroParcelas]);

  const handleValorEntradaChange = (value: string) => {
    const num = parseFloat(value) || 0;
    if (num >= valorEntradaMinimo) {
      setValorEntrada(num);
    }
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(CONTRATADO.cnpj);
      setCopied(true);
      toast.success("Chave Pix copiada!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar. Copie manualmente: " + CONTRATADO.cnpj);
    }
  };

  const opçõesParcelas = Array.from({ length: numeroParcelas }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Pagamento da Entrada</h2>
        <p className="text-sm text-muted-foreground">
          Realize o pagamento da entrada via Pix para confirmar sua contratação
        </p>
      </div>

      {/* Resumo do contrato */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Valor total do contrato</span>
          <span className="font-semibold">R$ {valorTotal.toFixed(2)}</span>
        </div>

        {descontoRegressivo && isPixBoleto && resumo.descontoPercent > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">Desconto regressivo ({resumo.descontoPercent}%)</span>
              <span className="text-green-600 font-medium">
                - R$ {(valorTotal - resumo.valorComDesconto).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Valor com desconto</span>
              <span className="font-semibold">R$ {resumo.valorComDesconto.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Valor da entrada */}
      <div className="space-y-2">
        <Label htmlFor="valor-entrada">Valor da entrada (mínimo R$ {valorEntradaMinimo.toFixed(2)})</Label>
        <Input
          id="valor-entrada"
          type="number"
          min={valorEntradaMinimo}
          max={valorTotal}
          step="0.01"
          value={valorEntrada}
          onChange={(e) => handleValorEntradaChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Você pode aumentar o valor da entrada para adiantar parcelas.
        </p>
      </div>

      {/* Parcelas */}
      {numeroParcelas > 1 && (
        <div className="space-y-2">
          <Label>Quantidade de parcelas restantes</Label>
          <Select
            value={String(parcelasSelecionadas)}
            onValueChange={(v) => setParcelasSelecionadas(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opçõesParcelas.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}x de R$ {((descontoRegressivo && isPixBoleto
                    ? (valorTotal * (1 - calcularDesconto(n) / 100)) - valorEntrada
                    : valorTotal - valorEntrada) / n).toFixed(2)}
                  {descontoRegressivo && isPixBoleto && ` (${calcularDesconto(n)}% desc.)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Resumo final */}
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
        <h3 className="font-semibold text-sm text-foreground">Resumo do pagamento</h3>
        <div className="flex justify-between text-sm">
          <span>Entrada (agora)</span>
          <span className="font-bold text-primary">R$ {valorEntrada.toFixed(2)}</span>
        </div>
        {numeroParcelas > 1 && (
          <div className="flex justify-between text-sm">
            <span>Restante ({parcelasSelecionadas}x)</span>
            <span className="font-medium">
              R$ {(descontoRegressivo && isPixBoleto
                ? resumo.restanteComDesconto
                : resumo.restante
              ).toFixed(2)}
            </span>
          </div>
        )}
        {descontoRegressivo && isPixBoleto && resumo.descontoPercent > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Economia total</span>
            <span className="font-medium">R$ {(valorTotal - resumo.valorComDesconto).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Pix payment area */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-center">Pague via Pix</h3>
        
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">Chave Pix (CNPJ)</p>
          <p className="font-mono text-lg font-bold tracking-wide">{CONTRATADO.cnpj}</p>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">Beneficiário</p>
          <p className="font-medium text-sm">{CONTRATADO.nome}</p>
          <p className="text-xs text-muted-foreground">{CONTRATADO.nomeFantasia}</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">Valor a transferir</p>
          <p className="text-2xl font-bold text-primary">R$ {valorEntrada.toFixed(2)}</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCopyPix} variant="outline" className="flex-1 gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar Chave Pix"}
          </Button>
          <Button onClick={() => setShowQR(!showQR)} variant="outline" size="icon">
            <QrCode className="w-4 h-4" />
          </Button>
        </div>

        {showQR && (
          <div className="flex flex-col items-center gap-2 p-4 bg-background rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(CONTRATADO.cnpj)}`}
              alt="QR Code Pix"
              className="w-48 h-48"
            />
            <p className="text-xs text-muted-foreground">Escaneie com o app do seu banco</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button
          onClick={() => onConfirm(valorEntrada, parcelasSelecionadas)}
          className="flex-1"
          disabled={saving}
        >
          {saving ? "Confirmando..." : "Já realizei o pagamento — Confirmar"}
        </Button>
      </div>
    </div>
  );
}
