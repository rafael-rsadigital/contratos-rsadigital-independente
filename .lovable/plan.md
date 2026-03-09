

## Problemas Identificados

Encontrei **3 problemas** no código atual que precisam ser corrigidos:

### 1. **Campo de Entrada com Zero à Esquerda**
**Arquivo:** `src/components/PaymentScreen.tsx` (linha 98)

**Problema:** O input usa `type="number"`, que tem um comportamento padrão do navegador onde ao apagar tudo fica "0" e ao digitar números eles aparecem após o zero (ex: "0500").

**Solução:** 
- Mudar o input para `type="text"` com `inputMode="decimal"` 
- Converter o estado `valorEntrada` de `number` para `string` (`valorEntradaStr`)
- Formatar o valor somente ao sair do campo (onBlur)
- Isso permite edição livre e formatação correta

### 2. **Tela de Pagamento não Fixa no Mobile**
**Arquivo:** `src/components/PaymentScreen.tsx` (linha 71)

**Problema:** O container não tem restrição de largura, causando scroll horizontal em telas pequenas.

**Solução:**
- Adicionar classes `max-w-full overflow-x-hidden` ao container principal
- Adicionar padding horizontal responsivo (`px-1 sm:px-0`)

### 3. **Mensagem WhatsApp sem Detalhes das Parcelas**
**Arquivo:** `src/pages/ContratoView.tsx` (linhas 198-200)

**Problema:** A mensagem enviada ao admin só mostra o valor da entrada, mas não quantas parcelas o cliente escolheu nem o valor de cada parcela.

**Mensagem atual:**
```
Valor: R$ 5000.00
Entrada paga: R$ 1000.00
```

**Solução:** Adicionar linha com informação das parcelas:
```
Valor total: R$ 5000.00
Entrada paga: R$ 1000.00
Parcelas: 10x de R$ 400.00
```

Cálculo: `(valorTotal - entradaFinal) / parcFinal`

---

## Arquivos a Modificar

1. **src/components/PaymentScreen.tsx**
   - Alterar estado de `number` para `string`
   - Mudar input type de "number" para "text" 
   - Adicionar classes de responsividade no container
   - Ajustar handlers de mudança e blur

2. **src/pages/ContratoView.tsx**  
   - Calcular valor da parcela: `(contractData.valor_total - entradaFinal) / parcFinal`
   - Adicionar linha na mensagem do WhatsApp com as parcelas

---

## Implementação Técnica

### PaymentScreen.tsx - Estado e Input
```typescript
// Estado atual (problema):
const [valorEntrada, setValorEntrada] = useState(valorEntradaMinimo);

// Estado corrigido:
const [valorEntradaStr, setValorEntradaStr] = useState(valorEntradaMinimo.toFixed(2));
const valorEntrada = parseFloat(valorEntradaStr) || 0;

// Input atual (problema):
<Input type="number" value={valorEntrada} ... />

// Input corrigido:
<Input 
  type="text"
  inputMode="decimal"
  pattern="[0-9]*[.,]?[0-9]*"
  value={valorEntradaStr}
  onChange={(e) => setValorEntradaStr(e.target.value)}
  onBlur={handleValorEntradaBlur}
/>
```

### PaymentScreen.tsx - Container Mobile
```typescript
// Container atual (problema):
<div className="space-y-6">

// Container corrigido:
<div className="max-w-full overflow-x-hidden px-1 sm:px-0 space-y-6">
```

### ContratoView.tsx - Mensagem WhatsApp
```typescript
// Adicionar cálculo das parcelas:
const valorParcela = parcFinal > 0 
  ? (contractData.valor_total - entradaFinal) / parcFinal 
  : 0;

const parcelasInfo = parcFinal > 0 
  ? `\nParcelas: ${parcFinal}x de R$ ${valorParcela.toFixed(2)}` 
  : '';

// Mensagem atualizada:
const message = encodeURIComponent(
  `Olá Rafael, informei o pagamento da entrada do contrato.

Cliente: ${confirmNome}
Serviço: ${servicos}
Valor total: R$ ${contractData.valor_total.toFixed(2)}
Entrada paga: R$ ${entradaFinal.toFixed(2)}${parcelasInfo}

Link do contrato:
${link}`
);
```

---

## Resultado Esperado

✅ Campo de entrada funciona naturalmente sem zero à esquerda  
✅ Tela de pagamento fica fixa no mobile sem scroll horizontal  
✅ Admin recebe mensagem completa com informações das parcelas escolhidas pelo cliente

