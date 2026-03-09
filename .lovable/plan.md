
## Problema atual
A "Permuta" está implementada como uma **forma de pagamento exclusiva** no campo `forma_pagamento` (enum). Quando selecionada, some o PIX/Boleto, entrada, parcelas, etc.

## O que o usuário quer
A permuta deve ser um **complemento opcional** ao pagamento principal — não substitui. O fluxo correto é:

```
Valor Total: R$ 3.000
├── Forma de pagamento principal: PIX / Boleto (3x de R$ 800)
├── Entrada: R$ 600 (via PIX)
└── Permuta (opcional switch): R$ 600 → saldo restante em PIX: R$ 2.400
```

## Mudanças necessárias

### 1. `src/types/contract.ts`
- Remover `'permuta'` do tipo `PaymentMethod` (permuta não é mais uma forma de pagamento principal)
- Adicionar campo `tem_permuta: boolean` no `ContractFormData`

### 2. `src/components/steps/Step3Commercial.tsx`
- Remover `"permuta"` do Select de forma de pagamento principal
- Remover a lógica `isPermuta` que escondia entrada/parcelas
- Adicionar **seção de permuta sempre visível** como toggle (Switch "Incluir Permuta?"), similar ao bloco de entrada existente
- Quando permuta ativada: mostrar campos de valor, descrição e condições
- Resumo atualizado: mostrar valor total, entrada, permuta e valor restante a pagar

### 3. `src/components/steps/Step4Contract.tsx` e `src/pages/NovoContrato.tsx`
- Garantir que `permuta_valor/descricao/condicoes` são salvos independentemente da forma de pagamento

### 4. `src/components/ContractDocument.tsx`
- A cláusula de permuta e o ANEXO DE PERMUTA já existem — apenas garantir que são gerados quando `permuta_valor > 0`, independente da `forma_pagamento`

### Estrutura visual do Step3 após mudança:

```
[Valor Total]        [Forma de Pagamento: PIX/Boleto | Cartão | Dinheiro]
[Nº de Parcelas]     [Data do 1º Vencimento]

┌─ Incluir Entrada? ─────────────────────────── [Switch] ─┐
│  Valor da Entrada    Pagamento da Entrada               │
└────────────────────────────────────────────────────────┘

┌─ Incluir Permuta? ─────────────────────────── [Switch] ─┐
│  Valor da Permuta                                       │
│  Descrição dos produtos/serviços                        │
│  Condições específicas (opcional)                       │
└────────────────────────────────────────────────────────┘

[Resumo]
  Valor total: R$ 3.000
  Entrada (PIX): R$ 600
  Permuta: R$ 600
  Restante a pagar (PIX/Boleto 3x de R$ 600): R$ 1.800
```

Sem mudanças de schema no banco — `permuta_valor`, `permuta_descricao`, `permuta_condicoes` já existem na tabela `contracts`. Apenas mudança de comportamento no front-end.
