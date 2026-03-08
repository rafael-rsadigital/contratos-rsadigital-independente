import { ContractFormData, CONTRATADO } from "@/types/contract";

interface Props {
  data: ContractFormData;
  confirmed: boolean;
  confirmDate?: string;
}

const paymentLabel: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto Bancário",
  cartao: "Cartão de Crédito",
};

export function ContractDocument({ data, confirmed, confirmDate }: Props) {
  const isWebsite = data.tipo === 'website';

  return (
    <div className="contract-document max-w-3xl mx-auto text-[15px]">
      <h1 className="text-center text-lg mb-6 tracking-widest">TERMO DE PRESTAÇÃO DE SERVIÇOS</h1>

      {/* CONTRATADO */}
      <h2 className="text-sm">CONTRATADO</h2>
      <p>
        <strong>{CONTRATADO.nome}</strong>, inscrito no CNPJ nº {CONTRATADO.cnpj}, atuando sob o nome
        fantasia <strong>{CONTRATADO.nomeFantasia}</strong>.
      </p>

      {/* CONTRATANTE */}
      <h2 className="text-sm">CONTRATANTE</h2>
      <p>
        <strong>{data.client.nome}</strong>, inscrito no CPF/CNPJ nº {data.client.cpf_cnpj}, com sede em:
      </p>
      <p className="ml-4">
        {data.client.logradouro}, {data.client.numero}<br />
        Bairro: {data.client.bairro}<br />
        CEP: {data.client.cep}<br />
        Município: {data.client.municipio}<br />
        Estado: {data.client.estado}
      </p>

      {/* OBJETO */}
      <h2 className="text-sm">OBJETO</h2>
      {isWebsite ? (
        <>
          <p>
            O presente contrato tem por objeto a prestação de serviços de desenvolvimento de website para o CONTRATANTE.
          </p>
          <p>Os serviços contratados incluem:</p>
          <ul className="list-disc ml-8 my-2">
            {data.servicos.map(s => <li key={s}>{s}</li>)}
          </ul>
          <p>Incluindo:</p>
          <ul className="list-disc ml-8 my-2">
            <li>Estruturação das páginas do site</li>
            <li>Inserção de textos e imagens fornecidas pelo cliente</li>
            <li>Layout responsivo</li>
            <li>Botão de contato</li>
            <li>Otimização básica de carregamento</li>
          </ul>
        </>
      ) : (
        <>
          <p>
            Prestação de serviços de otimização da presença digital no Google, incluindo melhorias no Perfil da Empresa no Google.
          </p>
          <p>Serviços contratados:</p>
          <ul className="list-disc ml-8 my-2">
            {data.servicos.map(s => <li key={s}>{s}</li>)}
          </ul>
          <p>Podendo incluir:</p>
          <ul className="list-disc ml-8 my-2">
            <li>Configuração ou otimização do perfil</li>
            <li>Organização de informações</li>
            <li>Cadastro de serviços</li>
            <li>Inserção de imagens</li>
            <li>Publicações no perfil</li>
            <li>Orientação estratégica</li>
          </ul>
        </>
      )}

      {/* PRAZO */}
      <h2 className="text-sm">PRAZO</h2>
      {isWebsite ? (
        <>
          <p>
            O prazo para desenvolvimento e entrega do website é de até <strong>7 dias úteis</strong>, contados a partir do envio de todas as informações necessárias pelo CONTRATANTE.
          </p>
          <p>
            Após a entrega inicial, o CONTRATANTE terá direito a até <strong>2 rodadas de ajustes</strong>, desde que não alterem a estrutura principal do projeto.
          </p>
          <p>Alterações adicionais poderão ser orçadas separadamente.</p>
        </>
      ) : (
        <>
          <p>O período de prestação de serviço será de <strong>30 dias</strong> a partir da contratação.</p>
          <p>A continuidade poderá ser renovada mediante novo acordo.</p>
        </>
      )}

      {/* PAGAMENTO */}
      <h2 className="text-sm">PAGAMENTO</h2>
      <p>Valor total: <strong>R$ {Number(data.valor_total).toFixed(2)}</strong></p>
      <p>Forma de pagamento: <strong>{paymentLabel[data.forma_pagamento]}</strong></p>
      {data.numero_parcelas > 1 && (
        <>
          <p>Parcelamento: <strong>{data.numero_parcelas}x de R$ {(data.valor_total / data.numero_parcelas).toFixed(2)}</strong></p>
          <p>Vencimento: dia <strong>{data.dia_vencimento}</strong> de cada mês</p>
        </>
      )}

      {isWebsite && (
        <>
          <p className="mt-3">
            O parcelamento refere-se exclusivamente à forma de pagamento do desenvolvimento do website, não caracterizando mensalidade ou serviço recorrente.
          </p>
          <p className="mt-2">Em caso de atraso:</p>
          <ul className="list-disc ml-8 my-2">
            <li>Multa de 2%</li>
            <li>Juros de 1% ao mês</li>
          </ul>
          <p>
            Em caso de inadimplência superior a 15 dias, o website poderá ser temporariamente suspenso até regularização do pagamento.
          </p>
          <p>
            Durante o período de parcelamento, o website poderá permanecer hospedado em infraestrutura administrada pelo CONTRATADO.
          </p>
          <p>
            A propriedade completa do website poderá ser transferida ao CONTRATANTE após a quitação total do contrato.
          </p>
        </>
      )}

      {!isWebsite && (
        <>
          <p className="mt-2">Multa de 2% em atraso. Juros de 1% ao mês.</p>
        </>
      )}

      {/* DESCONTO REGRESSIVO */}
      {data.desconto_regressivo && (
        <>
          <h2 className="text-sm">DESCONTO REGRESSIVO</h2>
          <p>O CONTRATANTE poderá realizar quitação antecipada do contrato.</p>
          <p>O desconto será regressivo:</p>
          <ul className="list-disc ml-8 my-2">
            <li>15% inicial</li>
            <li>Redução de 1% por mês</li>
            <li>Mínimo de 5%</li>
          </ul>
          <p>Aplicado apenas sobre parcelas vincendas.</p>
        </>
      )}

      {/* LIMITAÇÕES (Google) */}
      {!isWebsite && (
        <>
          <h2 className="text-sm">LIMITAÇÕES</h2>
          <p>O CONTRATADO não garante posicionamento específico no Google, pois o funcionamento da plataforma depende de algoritmos e fatores externos.</p>
          <p>O perfil pode sofrer suspensão conforme políticas do Google.</p>
          <p>O CONTRATADO não se responsabiliza por alterações feitas pelo cliente ou terceiros.</p>
        </>
      )}

      {/* CONFIRMAÇÃO */}
      <h2 className="text-sm">CONFIRMAÇÃO</h2>
      {confirmed ? (
        <p className="mt-3 p-4 border rounded-md bg-muted/30 text-center font-medium">
          ✅ Lido e confirmado em {confirmDate}
        </p>
      ) : (
        <p className="text-muted-foreground italic">Aguardando confirmação do contratante.</p>
      )}

      <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
        <p>{CONTRATADO.nomeFantasia} — CNPJ {CONTRATADO.cnpj}</p>
        <p>{CONTRATADO.cidade}</p>
      </div>
    </div>
  );
}
