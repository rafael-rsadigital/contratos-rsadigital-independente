
# Gerador de Contratos RSA Digital

## Visão Geral
Aplicação web completa para gerar contratos profissionais para a RSA Digital, com 4 etapas (wizard), persistência no banco de dados, geração de PDF, confirmação digital e envio via WhatsApp.

## Banco de Dados (Lovable Cloud / Supabase)
- **Tabela `clients`**: nome, cpf_cnpj, logradouro, numero, bairro, cep, municipio, estado, email
- **Tabela `contracts`**: referência ao cliente, tipo (website/google), serviços selecionados, valor, forma de pagamento, parcelas, dia vencimento, desconto regressivo aplicável, status (rascunho/confirmado), data confirmação, link único (UUID)

## Etapa 1 — Dados do Cliente
- Formulário com todos os campos solicitados (nome, CPF/CNPJ, endereço completo, email)
- Validação com Zod
- Possibilidade de reutilizar clientes já cadastrados

## Etapa 2 — Seleção do Contrato
- Escolha entre: **Website** ou **Google**
- Checkboxes dos serviços:
  - Website: Site Onepage, Institucional, Portfólio
  - Google: Criação de Perfil, Otimização, Gestão
- Serviços selecionados inseridos automaticamente no objeto do contrato

## Etapa 3 — Condições Comerciais
- Campos: valor total, forma de pagamento (PIX/Boleto/Cartão), nº de parcelas, dia de vencimento
- Cálculo automático do desconto regressivo (15% → 5%) quando PIX/Boleto + ≥10 parcelas

## Etapa 4 — Geração e Confirmação
- Visualização do contrato completo com layout jurídico profissional
- Botão "Confirmar Contratação" que:
  1. Insere "Lido e confirmado em [data]" no documento
  2. Abre popup pedindo email de confirmação
  3. Gera PDF (usando html2pdf ou jsPDF)
  4. Permite download do PDF
  5. Abre WhatsApp (12988052097) com mensagem pré-formatada
  6. Salva contrato no banco de dados

## Histórico de Contratos
- Página listando todos os contratos: data, cliente, tipo, valor, status
- Link único para cada contrato (ex: /contrato/UUID)

## Página Pública do Contrato
- Rota `/contrato/:id` exibindo o contrato completo (somente leitura)
- Cliente pode confirmar por essa URL se ainda não confirmou

## Interface
- Design moderno e profissional com Tailwind/shadcn
- Wizard com stepper visual (4 etapas)
- Responsivo para desktop e mobile
- Tipografia formal para o documento do contrato

## Páginas
- `/` — Dashboard com acesso rápido a "Novo Contrato" e histórico
- `/novo-contrato` — Wizard de 4 etapas
- `/historico` — Lista de contratos
- `/contrato/:id` — Visualização pública do contrato
