import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTRATADO } from "@/types/contract";
import { formatBRL } from "@/lib/utils";
import { Copy, Check, ArrowLeft, Tag } from "lucide-react";
import logoRsa from "@/assets/logo-rsa-digital.png";
import { toast } from "sonner";

interface PaymentScreenProps {
  valorTotal: number;
  valorEntradaMinimo: number;
  numeroParcelas: number;
  descontoRegressivo: boolean;
  formaPagamento: string;
  valorAVista: number | null;
  linkPagamento?: string;
  onConfirm: (valorEntrada: number, parcelas: number, pagouAvista?: boolean) => void;
  onFinalize: () => void;
  onBack: () => void;
  saving: boolean;
}

export function PaymentScreen({
  valorTotal,
  valorEntradaMinimo,
  numeroParcelas,
  descontoRegressivo,
  formaPagamento,
  valorAVista,
  linkPagamento,
  onConfirm,
  onFinalize,
  onBack,
  saving,
}: PaymentScreenProps) {
  const [valorEntradaStr, setValorEntradaStr] = useState(formatBRL(valorEntradaMinimo));
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState(numeroParcelas);
  const [copied, setCopied] = useState(false);
  const [modoAvista, setModoAvista] = useState(false);

  const valorEntrada = parseFloat(valorEntradaStr.replace(/\./g, '').replace(',', '.')) || 0;

  const resumo = useMemo(() => {
    const restante = valorTotal - valorEntrada;
    const valorParcela = parcelasSelecionadas > 0 ? restante / parcelasSelecionadas : restante;
    return { restante, valorParcela };
  }, [valorTotal, valorEntrada, parcelasSelecionadas]);

  const handleValorEntradaBlur = () => {
    const num = parseFloat(valorEntradaStr.replace(/\./g, '').replace(',', '.')) || 0;
    if (num < valorEntradaMinimo) {
      setValorEntradaStr(formatBRL(valorEntradaMinimo));
      toast.error(`O valor mínimo da entrada é R$ ${formatBRL(valorEntradaMinimo)}`);
    } else if (num > valorTotal) {
      setValorEntradaStr(formatBRL(valorTotal));
    } else {
      setValorEntradaStr(formatBRL(num));
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

  const valorPagamento = modoAvista && valorAVista ? valorAVista : valorEntrada;
  const isCartao = formaPagamento === 'cartao';

  return (
    <div className="max-w-full overflow-x-hidden px-1 sm:px-0 space-y-6">
      {/* Logo */}
      <div className="flex justify-center">
        <img src={logoRsa} alt="RSA Digital" className="h-14 object-contain" />
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Pagamento</h2>
        <p className="text-sm text-muted-foreground">
          Realize o pagamento via Pix para confirmar sua contratação, ou finalize para pagar depois.
        </p>
      </div>

      {/* Opção à vista com desconto */}
      {valorAVista && valorAVista > 0 && numeroParcelas > 1 && (
        <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Opção de pagamento à vista com desconto</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Valor parcelado: <strong>R$ {formatBRL(valorTotal)}</strong> — Valor à vista: <strong className="text-primary">R$ {formatBRL(valorAVista)}</strong>
            {' '}(economia de R$ {formatBRL(valorTotal - valorAVista)})
          </p>
          <div className="flex gap-2">
            <Button
              variant={!modoAvista ? "default" : "outline"}
              size="sm"
              onClick={() => setModoAvista(false)}
            >
              Parcelado
            </Button>
            <Button
              variant={modoAvista ? "default" : "outline"}
              size="sm"
              onClick={() => setModoAvista(true)}
            >
              À vista R$ {formatBRL(valorAVista)}
            </Button>
          </div>
        </div>
      )}

      {/* Resumo do contrato */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Valor total do contrato</span>
          <span className="font-semibold">R$ {formatBRL(modoAvista && valorAVista ? valorAVista : valorTotal)}</span>
        </div>
      </div>

      {!modoAvista && (
        <>
          {/* Valor da entrada */}
          <div className="space-y-2">
            <Label htmlFor="valor-entrada">Valor da entrada (mínimo R$ {formatBRL(valorEntradaMinimo)})</Label>
            <Input
              id="valor-entrada"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={valorEntradaStr}
              onChange={(e) => setValorEntradaStr(e.target.value)}
              onBlur={handleValorEntradaBlur}
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
                      {n}x de R$ {formatBRL((valorTotal - valorEntrada) / n)}
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
              <span className="font-bold text-primary">R$ {formatBRL(valorEntrada)}</span>
            </div>
            {numeroParcelas > 1 && (
              <div className="flex justify-between text-sm">
                <span>Restante ({parcelasSelecionadas}x)</span>
                <span className="font-medium">
                  R$ {formatBRL(resumo.restante)} ({parcelasSelecionadas}x de R$ {formatBRL(resumo.valorParcela)})
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {modoAvista && valorAVista && (
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Resumo do pagamento à vista</h3>
          <div className="flex justify-between text-sm">
            <span>Valor à vista</span>
            <span className="font-bold text-primary">R$ {formatBRL(valorAVista)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Desconto</span>
            <span>R$ {formatBRL(valorTotal - valorAVista)}</span>
          </div>
        </div>
      )}

      {/* Info desconto regressivo */}
      {descontoRegressivo && !modoAvista && (
        <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-sm">Desconto regressivo</p>
          <p>
            Este contrato poderá ser liquidado antecipadamente a qualquer momento, com desconto regressivo 
            de <strong>15%</strong> sobre o saldo das parcelas vincendas, reduzindo <strong>1% ao mês</strong>, 
            até o mínimo de <strong>5%</strong>.
          </p>
        </div>
      )}

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
          <p className="text-xs text-muted-foreground">Banco: ASAAS IP S.A.</p>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">Valor a transferir</p>
          <p className="text-2xl font-bold text-primary">R$ {formatBRL(valorPagamento)}</p>
        </div>

        <Button onClick={handleCopyPix} variant="outline" className="w-full gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copiado!" : "Copiar Chave Pix"}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button onClick={onBack} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button
            onClick={() => onConfirm(
              modoAvista ? (valorAVista || 0) : valorEntrada,
              modoAvista ? 0 : parcelasSelecionadas,
              modoAvista
            )}
            className="flex-1"
            disabled={saving || (!modoAvista && valorEntrada < valorEntradaMinimo)}
          >
            {saving ? "Confirmando..." : "Já realizei o pagamento — Confirmar"}
          </Button>
        </div>
        <Button
          onClick={onFinalize}
          variant="outline"
          className="w-full"
          disabled={saving}
        >
          {saving ? "Finalizando..." : "Finalizar sem pagar agora"}
        </Button>
      </div>
    </div>
  );
}
