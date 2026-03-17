import { useState } from "react";
import { formatBRL } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PaymentMethod, EntradaPaymentMethod } from "@/types/contract";
import { DollarSign, Info, Repeat } from "lucide-react";

const schema = z.object({
  valor_total: z.coerce.number().min(1, "Valor deve ser maior que zero"),
  forma_pagamento: z.enum(["pix_boleto", "cartao", "dinheiro", "recorrencia"]),
  numero_parcelas: z.coerce.number().int().min(1).max(48),
  data_primeiro_vencimento: z.string().optional(),
  tem_entrada: z.boolean(),
  valor_entrada: z.coerce.number().min(0).optional(),
  forma_pagamento_entrada: z.enum(["pix", "cartao", "dinheiro"]).optional(),
  numero_paginas: z.coerce.number().int().min(0).optional(),
  tem_permuta: z.boolean(),
  permuta_valor: z.coerce.number().min(0).optional(),
  permuta_descricao: z.string().optional(),
  permuta_condicoes: z.string().optional(),
  oferecer_desconto_avista: z.boolean(),
  valor_a_vista: z.coerce.number().min(0).optional(),
  link_pagamento: z.string().optional(),
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
    tem_permuta: boolean;
    permuta_valor: number;
    permuta_descricao: string;
    permuta_condicoes: string;
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
    tem_permuta: boolean;
    permuta_valor: number;
    permuta_descricao: string;
    permuta_condicoes: string;
    valor_a_vista: number | null;
    link_pagamento: string;
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
      tem_permuta: data.tem_permuta || false,
      permuta_valor: data.permuta_valor || 0,
      permuta_descricao: data.permuta_descricao || '',
      permuta_condicoes: data.permuta_condicoes || '',
      oferecer_desconto_avista: (data as any).valor_a_vista != null && (data as any).valor_a_vista > 0,
      valor_a_vista: (data as any).valor_a_vista || 0,
      link_pagamento: (data as any).link_pagamento || '',
    },
  });

  const formaPagamento = form.watch("forma_pagamento");
  const numeroParcelas = form.watch("numero_parcelas");
  const valorTotal = form.watch("valor_total");
  const temEntrada = form.watch("tem_entrada");
  const temPermuta = form.watch("tem_permuta");
  const oferecerDescontoAVista = form.watch("oferecer_desconto_avista");
  const valorEntrada = form.watch("valor_entrada") || 0;
  const permutaValor = form.watch("permuta_valor") || 0;

  const isCartao = formaPagamento === "cartao";
  const isRecorrencia = formaPagamento === "recorrencia";
  const showParcelas = formaPagamento === "pix_boleto" || isRecorrencia;
  const showVencimento = formaPagamento === "pix_boleto" || isRecorrencia;

  // Valor restante após entrada e permuta
  const valorBase = valorTotal || 0;
  const valorAposDesconto = Math.max(0, valorBase - (temEntrada ? valorEntrada : 0) - (temPermuta ? permutaValor : 0));
  const valorParcela = showParcelas && numeroParcelas > 0 ? formatBRL(valorAposDesconto / numeroParcelas) : '0,00';

  const [descontoRegressivo, setDescontoRegressivo] = useState(false);
  const hasDesconto = formaPagamento === "pix_boleto" && numeroParcelas >= 10;

  const paymentLabels: Record<PaymentMethod, string> = {
    pix_boleto: "PIX / Boleto",
    cartao: "Cartão",
    dinheiro: "Dinheiro",
    recorrencia: "Recorrência",
  };

  const entradaLabels: Record<string, string> = {
    pix: "PIX",
    cartao: "Cartão",
    dinheiro: "Dinheiro",
  };

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
      tem_permuta: values.tem_permuta,
      permuta_valor: values.tem_permuta ? (values.permuta_valor || 0) : 0,
      permuta_descricao: values.tem_permuta ? (values.permuta_descricao || '') : '',
      permuta_condicoes: values.tem_permuta ? (values.permuta_condicoes || '') : '',
      valor_a_vista: values.oferecer_desconto_avista && values.valor_a_vista && values.valor_a_vista > 0 ? values.valor_a_vista : null,
      link_pagamento: values.link_pagamento || '',
    });
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

            {/* Permuta */}
            <div className="border rounded-lg p-4 space-y-4 bg-accent/5 border-accent/20">
              <FormField control={form.control} name="tem_permuta" render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-accent" />
                    <FormLabel className="font-semibold">Incluir Permuta?</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              {temPermuta && (
                <div className="space-y-4">
                  <FormField control={form.control} name="permuta_valor" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor em Crédito de Permuta (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="500.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="permuta_descricao" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição dos produtos/serviços a receber</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: Serviços de fotografia, produtos alimentícios, etc." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="permuta_condicoes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condições de utilização (opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: Validade de 24 meses, agendamento com 48h de antecedência, etc." rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
            </div>

            {/* Número de páginas para Site Institucional */}
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

            {/* Link de pagamento para cartão */}
            {isCartao && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/5">
                <FormField control={form.control} name="link_pagamento" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link de pagamento (cartão de crédito)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Cole o link de pagamento que será exibido ao cliente na etapa de confirmação.
                    </p>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            {/* Desconto à Vista */}
            {((showParcelas && numeroParcelas > 1) || isCartao) && (
              <div className="border rounded-lg p-4 space-y-4 bg-primary/5 border-primary/20">
                <FormField control={form.control} name="oferecer_desconto_avista" render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <FormLabel className="font-semibold">Oferecer desconto à vista?</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />

                {oferecerDescontoAVista && (
                  <FormField control={form.control} name="valor_a_vista" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor à vista com desconto (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="1500.00" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        O cliente poderá optar por pagar à vista com este valor ao invés do parcelamento.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
            )}

            {/* Resumo */}
            {valorBase > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border space-y-1">
                <p className="text-sm text-muted-foreground">
                  Valor total: <strong>R$ {formatBRL(Number(valorBase))}</strong>
                </p>
                {temEntrada && valorEntrada > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Entrada ({entradaLabels[form.watch("forma_pagamento_entrada") || 'pix']}): <strong>R$ {formatBRL(Number(valorEntrada))}</strong>
                  </p>
                )}
                {temPermuta && permutaValor > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Permuta: <strong>R$ {formatBRL(Number(permutaValor))}</strong>
                  </p>
                )}
                {showParcelas && numeroParcelas > 0 ? (
                  <p className="text-sm font-medium">
                    Restante: {numeroParcelas}x de <strong>R$ {valorParcela}</strong> via {paymentLabels[formaPagamento]}
                  </p>
                ) : (
                  <p className="text-sm font-medium">
                    Restante: <strong>R$ {formatBRL(Number(valorAposDesconto))}</strong> via {paymentLabels[formaPagamento]}
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
