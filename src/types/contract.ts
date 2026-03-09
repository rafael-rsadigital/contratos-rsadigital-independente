export interface ClientData {
  nome: string;
  cpf_cnpj: string;
  celular: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  municipio: string;
  estado: string;
  email: string;
}

export type PaymentMethod = 'pix_boleto' | 'cartao' | 'dinheiro' | 'permuta';
export type EntradaPaymentMethod = 'pix' | 'cartao' | 'dinheiro';

export const WEBSITE_SERVICES = [
  'Site Onepage Otimizado',
  'Site Institucional Completo Otimizado',
  'Site Portfólio Onepage (não otimizado)',
  'Site Institucional Completo (não otimizado)',
] as const;

export const GOOGLE_SERVICES = [
  'Presença Digital no Google',
] as const;

export const GOOGLE_PRAZO_OPTIONS = [
  '30 dias',
  '60 dias',
  '90 dias',
  '6 meses',
  '12 meses',
] as const;

export type ContractStatus = 'rascunho' | 'enviado' | 'confirmado' | 'cancelado';

export interface ContractFormData {
  client: ClientData;
  servicos: string[];
  servico_website: string;
  servico_google: string;
  prazo_google: string;
  valor_total: number;
  forma_pagamento: PaymentMethod;
  numero_parcelas: number;
  data_primeiro_vencimento: string;
  desconto_regressivo: boolean;
  valor_entrada: number;
  forma_pagamento_entrada: EntradaPaymentMethod;
  numero_paginas: number;
  permuta_valor: number;
  permuta_descricao: string;
  permuta_condicoes: string;
  anexos: AnexoData[];
  aditivos: AditivoData[];
}

export interface AnexoData {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
}

export interface AditivoData {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
}

export interface ContractRecord {
  id: string;
  client_id: string;
  servicos: string[];
  valor_total: number;
  forma_pagamento: PaymentMethod;
  numero_parcelas: number;
  data_primeiro_vencimento: string | null;
  desconto_regressivo: boolean;
  status: ContractStatus;
  data_confirmacao: string | null;
  email_confirmacao: string | null;
  nome_confirmacao: string | null;
  ip_confirmacao: string | null;
  navegador_confirmacao: string | null;
  codigo_verificacao: string | null;
  numero_contrato: string | null;
  valor_entrada: number;
  forma_pagamento_entrada: string | null;
  numero_paginas: number | null;
  servico_principal: string | null;
  prazo_google: string | null;
  created_at: string;
  updated_at: string;
  clients?: ClientData & { id: string };
}

export const CONTRATADO = {
  nome: 'Rafael Kelvin Silva de Assis',
  cnpj: '60.351.596/0001-04',
  nomeFantasia: 'RSA Digital',
  cidade: 'Jacareí – SP',
  whatsapp: '5512988052097',
} as const;
