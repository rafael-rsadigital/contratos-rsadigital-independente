import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";
import { PaymentMethod, EntradaPaymentMethod } from "@/types/contract";
import { DollarSign, Info } from "lucide-react";

const schema = z.object({
  valor_total: z.coerce.number().min(1, "Valor deve ser maior que zero"),
  forma_pagamento: z.enum(["pix_boleto", "cartao", "dinheiro"]),
  numero_parcelas: z.coerce.number().int().min(1).max(48),
  data_primeiro_vencimento: z.string().optional(),
  tem_entrada: z.boolean(),
  valor_entrada: z.coerce.number().min(0).optional(),
  forma_pagamento_entrada: z.enum(["pix", "cartao", "dinheiro"]).optional(),
  numero_paginas: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  data: {
    valor_total: number;
    forma_pagamento: PaymentMethod;
    numero_parcelas: number;
    data_primeiro_vencimento: string;
    valor_entrada: number;
    forma_pagamento_entrada: EntradaPaymentMethod;
    numero_paginas: number;
  };
  hasWebsite: boolean;
  isInstitucional: boolean;
  onNext: (data: {
    valor_total: number;
    forma_pagamento: PaymentMethod;
    numero_parcelas: number;
    data_primeiro_vencimento: string;
    desconto_regressivo: boolean;
    valor_entrada: number;
    forma_pagamento_entrada: EntradaPaymentMethod;
    numero_paginas: number;
  }) => void;
  onBack: () => void;
}

export function Step3Commercial({ data, hasWebsite, isInstitucional, onNext, onBack }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      valor_total: data.valor_total || undefined,
      forma_pagamento: data.forma_pagamento,
      numero_parcelas: data.numero_parcelas || 1,
      data_primeiro_vencimento: data.data_primeiro_vencimento || '',
      tem_entrada: data.valor_entrada > 0,
      valor_entrada: data.valor_entrada || 0,
      forma_pagamento_entrada: data.forma_pagamento_entrada || 'pix',
      numero_paginas: data.numero_paginas || 5,
    },
  });

  const formaPagamento = form.watch("forma_pagamento");
  const numeroParcelas = form.watch("numero_parcelas");
  const valorTotal = form.watch("valor_total");
  const temEntrada = form.watch("tem_entrada");
  const valorEntrada = form.watch("valor_entrada") || 0;

  const showParcelas = formaPagamento === "pix_boleto";
  const showVencimento = formaPagamento === "pix_boleto";
  const valorParcelado = showParcelas ? Math.max(0, valorTotal - valorEntrada) : 0;
  const valorParcela = showParcelas && numeroParcelas > 0 ? (valorParcelado / numeroParcelas).toFixed(2) : '0.00';

  const [descontoRegressivo, setDescontoRegressivo] = useState(false);
  const hasDesconto = formaPagamento === "pix_boleto" && numeroParcelas >= 10;

  const handleSubmit = (values: FormValues) => {
    const parcelas = values.forma_pagamento === "pix_boleto" ? values.numero_parcelas : 1;
    onNext({
      valor_total: values.valor_total,
      forma_pagamento: values.forma_pagamento as PaymentMethod,
      numero_parcelas: parcelas,
      data_primeiro_vencimento: values.data_primeiro_vencimento || '',
      desconto_regressivo: hasDesconto && descontoRegressivo,
      valor_entrada: values.tem_entrada ? (values.valor_entrada || 0) : 0,
      forma_pagamento_entrada: (values.forma_pagamento_entrada || 'pix') as EntradaPaymentMethod,
      numero_paginas: values.numero_paginas || 0,
    });
  };

  const paymentLabels: Record<PaymentMethod, string> = {
    pix_boleto: "PIX / Boleto",
    cartao: "Cartão",
    dinheiro: "Dinheiro",
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <DollarSign className="w-5 h-5 text-primary" />
          Condições Comerciais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="valor_total" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="1500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="forma_pagamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pix_boleto">PIX / Boleto</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              {showParcelas && (
                <FormField control={form.control} name="numero_parcelas" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="48" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {showVencimento && (
                <FormField control={form.control} name="data_primeiro_vencimento" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Primeiro Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>

            {/* Entrada */}
            <div className="border rounded-lg p-4 space-y-4">
              <FormField control={form.control} name="tem_entrada" render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="font-semibold">Incluir Entrada?</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              {temEntrada && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="valor_entrada" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Entrada (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="500.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="forma_pagamento_entrada" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pagamento da Entrada</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
            </div>

            {/* Número de páginas for Site Institucional */}
            {hasWebsite && isInstitucional && (
              <FormField control={form.control} name="numero_paginas" render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Páginas do Site</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Summary */}
            {valorTotal > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border space-y-1">
                {temEntrada && valorEntrada > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Entrada: <strong>R$ {Number(valorEntrada).toFixed(2)}</strong>
                  </p>
                )}
                {showParcelas && numeroParcelas > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {numeroParcelas}x de <strong>R$ {valorParcela}</strong> via {paymentLabels[formaPagamento]}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Pagamento {formaPagamento === 'cartao' ? 'no cartão no ato' : 'à vista em dinheiro'}: <strong>R$ {Number(valorTotal - (temEntrada ? valorEntrada : 0)).toFixed(2)}</strong>
                  </p>
                )}
              </div>
            )}

            {hasDesconto && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 items-start">
                    <Info className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold">Desconto Regressivo</p>
                      <p className="text-muted-foreground">
                        O cliente poderá quitar antecipadamente com desconto regressivo: 15% inicial, reduzindo 1% ao mês, mínimo de 5%.
                      </p>
                    </div>
                  </div>
                  <Switch checked={descontoRegressivo} onCheckedChange={setDescontoRegressivo} />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onBack}>Voltar</Button>
              <Button type="submit" size="lg">Gerar Contrato</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
