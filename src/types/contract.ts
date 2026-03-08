export interface ClientData {
  nome: string;
  cpf_cnpj: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  municipio: string;
  estado: string;
  email: string;
}

export type ContractType = 'website' | 'google';
export type PaymentMethod = 'pix' | 'boleto' | 'cartao';

export const WEBSITE_SERVICES = [
  'Site Onepage',
  'Site Institucional',
  'Site Portfólio',
] as const;

export const GOOGLE_SERVICES = [
  'Criação de Perfil no Google',
  'Otimização do Perfil',
  'Gestão do Perfil',
] as const;

export interface ContractFormData {
  client: ClientData;
  tipo: ContractType;
  servicos: string[];
  valor_total: number;
  forma_pagamento: PaymentMethod;
  numero_parcelas: number;
  dia_vencimento: number;
  desconto_regressivo: boolean;
}

export interface ContractRecord {
  id: string;
  client_id: string;
  tipo: ContractType;
  servicos: string[];
  valor_total: number;
  forma_pagamento: PaymentMethod;
  numero_parcelas: number;
  dia_vencimento: number;
  desconto_regressivo: boolean;
  status: 'rascunho' | 'confirmado';
  data_confirmacao: string | null;
  email_confirmacao: string | null;
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
