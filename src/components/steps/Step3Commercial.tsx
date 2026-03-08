import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PaymentMethod } from "@/types/contract";
import { DollarSign, Info } from "lucide-react";

const schema = z.object({
  valor_total: z.coerce.number().min(1, "Valor deve ser maior que zero"),
  forma_pagamento: z.enum(["pix", "boleto", "cartao"]),
  numero_parcelas: z.coerce.number().int().min(1).max(48),
  dia_vencimento: z.coerce.number().int().min(1).max(31),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  data: {
    valor_total: number;
    forma_pagamento: PaymentMethod;
    numero_parcelas: number;
    dia_vencimento: number;
  };
  onNext: (data: FormValues & { desconto_regressivo: boolean }) => void;
  onBack: () => void;
}

export function Step3Commercial({ data, onNext, onBack }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      valor_total: data.valor_total || undefined,
      forma_pagamento: data.forma_pagamento,
      numero_parcelas: data.numero_parcelas || 1,
      dia_vencimento: data.dia_vencimento || 9,
    },
  });

  const formaPagamento = form.watch("forma_pagamento");
  const numeroParcelas = form.watch("numero_parcelas");
  const valorTotal = form.watch("valor_total");

  const hasDesconto = (formaPagamento === "pix" || formaPagamento === "boleto") && numeroParcelas >= 10;

  const handleSubmit = (values: FormValues) => {
    onNext({ ...values, desconto_regressivo: hasDesconto });
  };

  const paymentLabels: Record<PaymentMethod, string> = {
    pix: "PIX",
    boleto: "Boleto",
    cartao: "Cartão",
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
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numero_parcelas" render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Parcelas</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="48" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dia_vencimento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dia de Vencimento</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="31" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {valorTotal > 0 && numeroParcelas > 1 && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  {numeroParcelas}x de <strong>R$ {(valorTotal / numeroParcelas).toFixed(2)}</strong> — 
                  vencimento todo dia {form.watch("dia_vencimento")} — via {paymentLabels[formaPagamento]}
                </p>
              </div>
            )}

            {hasDesconto && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 flex gap-3 items-start">
                <Info className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div className="text-sm">
                  <Badge variant="outline" className="mb-2 border-accent text-accent">Desconto Regressivo Ativado</Badge>
                  <p className="text-muted-foreground">
                    O cliente poderá quitar antecipadamente com desconto regressivo: 15% inicial, reduzindo 1% ao mês, mínimo de 5%. Aplicado apenas sobre parcelas vincendas.
                  </p>
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
