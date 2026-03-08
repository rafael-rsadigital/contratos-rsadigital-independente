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

export type PaymentMethod = 'pix_boleto' | 'cartao' | 'dinheiro';
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

export type ContractStatus = 'rascunho' | 'enviado' | 'confirmado' | 'cancelado';

export interface ContractFormData {
  client: ClientData;
  servicos: string[]; // selected services
  servico_website: string;
  servico_google: string;
  valor_total: number;
  forma_pagamento: PaymentMethod;
  numero_parcelas: number;
  data_primeiro_vencimento: string; // yyyy-mm-dd
  desconto_regressivo: boolean;
  valor_entrada: number;
  forma_pagamento_entrada: EntradaPaymentMethod;
  numero_paginas: number;
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
  valor_entrada: number;
  forma_pagamento_entrada: string | null;
  numero_paginas: number | null;
  servico_principal: string | null;
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
