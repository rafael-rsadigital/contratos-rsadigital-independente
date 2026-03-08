import { ContractFormData, AnexoData, AditivoData, CONTRATADO } from "@/types/contract";
import { format, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  data: ContractFormData;
  confirmed: boolean;
  confirmDate?: string;
  nomeConfirmacao?: string;
  emailConfirmacao?: string;
  codigoVerificacao?: string;
}

const paymentLabel: Record<string, string> = {
  pix_boleto: "PIX / Boleto",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

const entradaPaymentLabel: Record<string, string> = {
  pix: "PIX",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
};

function formatVencimentos(dataStr: string, parcelas: number): string[] {
  if (!dataStr) return [];
  try {
    const date = parseISO(dataStr);
    return Array.from({ length: parcelas }, (_, i) =>
      format(addMonths(date, i), "dd/MM/yyyy")
    );
  } catch {
    return [];
  }
}

function isOptimized(servico: string): boolean {
  return servico.includes('Otimizado') && !servico.includes('não otimizado');
}

export function ContractDocument({ data, confirmed, confirmDate, nomeConfirmacao, emailConfirmacao, codigoVerificacao }: Props) {
  const hasWebsite = !!data.servico_website;
  const hasGoogle = !!data.servico_google;
  const hasBoth = hasWebsite && hasGoogle;

  // When 2 services: first is principal (has value), second is complementary
  const valorLiquido = data.valor_total - data.valor_entrada;
  const valorParcela = data.numero_parcelas > 1
    ? (valorLiquido / data.numero_parcelas).toFixed(2)
    : valorLiquido.toFixed(2);

  const vencimentos = formatVencimentos(data.data_primeiro_vencimento, data.numero_parcelas);

  return (
    <div className="space-y-16">
      {/* CONTRATO PRINCIPAL: WEBSITE */}
      {hasWebsite && (
        <WebsiteContract
          data={data}
          confirmed={confirmed}
          confirmDate={confirmDate}
          nomeConfirmacao={nomeConfirmacao}
          emailConfirmacao={emailConfirmacao}
          valorParcela={valorParcela}
          vencimentos={vencimentos}
          isPrincipal={!hasBoth || true}
          isComplementar={false}
        />
      )}

      {/* CONTRATO GOOGLE */}
      {hasGoogle && (
        <>
          {hasWebsite && <div className="border-t-4 border-primary/20 my-12" />}
          <GoogleContract
            data={data}
            confirmed={confirmed}
            confirmDate={confirmDate}
            nomeConfirmacao={nomeConfirmacao}
            emailConfirmacao={emailConfirmacao}
            valorParcela={valorParcela}
            vencimentos={vencimentos}
            isComplementar={hasBoth}
          />
        </>
      )}

      {/* ANEXOS - only if they exist */}
      {data.anexos.length > 0 && (
        <>
          <div className="border-t-4 border-primary/20 my-12" />
          <AnexosSection anexos={data.anexos} />
        </>
      )}

      {/* ADITIVOS - only if they exist */}
      {data.aditivos.length > 0 && (
        <>
          <div className="border-t-4 border-primary/20 my-12" />
          <AditivosSection aditivos={data.aditivos} />
        </>
      )}

      {/* VERIFICATION CODE */}
      {codigoVerificacao && (
        <div className="text-center text-xs text-muted-foreground border-t pt-4 mt-8">
          <p>Código de verificação: <strong>{codigoVerificacao}</strong></p>
        </div>
      )}
    </div>
  );
}

/* ─── CONTRATANTE HEADER (reusable) ─── */
function ContratanteHeader({ data }: { data: ContractFormData }) {
  return (
    <>
      <h2 className="text-sm font-bold mt-6 mb-2">CONTRATADO</h2>
      <p>
        <strong>{CONTRATADO.nome}</strong>, inscrito no CNPJ nº {CONTRATADO.cnpj}, atuando sob o nome
        fantasia <strong>{CONTRATADO.nomeFantasia}</strong>, com sede em {CONTRATADO.cidade}, doravante denominado CONTRATADO.
      </p>

      <h2 className="text-sm font-bold mt-6 mb-2">CONTRATANTE</h2>
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
      <p>doravante denominado CONTRATANTE.</p>
    </>
  );
}

/* ─── CONFIRMAÇÃO FOOTER (reusable) ─── */
function ConfirmacaoFooter({ confirmed, confirmDate, nomeConfirmacao, emailConfirmacao }: {
  confirmed: boolean; confirmDate?: string; nomeConfirmacao?: string; emailConfirmacao?: string;
}) {
  return (
    <>
      <h2 className="text-sm font-bold mt-6 mb-2">CONFIRMAÇÃO</h2>
      {confirmed ? (
        <div className="mt-3 p-4 border rounded-md bg-muted/30 space-y-2">
          <p className="text-center font-medium">✅ Lido e confirmado em {confirmDate}</p>
          {nomeConfirmacao && <p className="text-sm">Responsável: <strong>{nomeConfirmacao}</strong></p>}
          {emailConfirmacao && <p className="text-sm">Email: <strong>{emailConfirmacao}</strong></p>}
        </div>
      ) : (
        <p className="text-muted-foreground italic">Aguardando confirmação do contratante.</p>
      )}
      <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
        <p>{CONTRATADO.nomeFantasia} — CNPJ {CONTRATADO.cnpj}</p>
        <p>{CONTRATADO.cidade}</p>
      </div>
    </>
  );
}

/* ─── PAYMENT SECTION (reusable) ─── */
function PaymentSection({ data, valorParcela, vencimentos, clauseNum }: {
  data: ContractFormData; valorParcela: string; vencimentos: string[]; clauseNum: number;
}) {
  const isPB = data.forma_pagamento === 'pix_boleto';
  const isCash = data.forma_pagamento === 'dinheiro';
  const isCard = data.forma_pagamento === 'cartao';

  return (
    <>
      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum}. VALOR E CONDIÇÕES DE PAGAMENTO</h2>
      <p>Pela execução dos serviços descritos neste contrato, o CONTRATANTE pagará ao CONTRATADO o valor total de:</p>
      <p className="ml-4 font-bold text-base">R$ {Number(data.valor_total).toFixed(2)}</p>

      {data.valor_entrada > 0 && (
        <p className="mt-2">Entrada: <strong>R$ {Number(data.valor_entrada).toFixed(2)}</strong> via {entradaPaymentLabel[data.forma_pagamento_entrada]}.</p>
      )}

      <p className="mt-2">Forma de pagamento: <strong>{paymentLabel[data.forma_pagamento]}</strong></p>

      {isPB && data.numero_parcelas > 1 ? (
        <>
          <p className="mt-2">Parcelamento: <strong>{data.numero_parcelas} parcelas de R$ {valorParcela}</strong></p>
          {vencimentos.length > 0 && (
            <>
              <p className="mt-2">Vencimentos:</p>
              <ul className="list-disc ml-8 my-2">
                {vencimentos.map((v, i) => (
                  <li key={i}>{i + 1}ª parcela — {v}</li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : isCard ? (
        <p className="mt-2">Pagamento realizado no ato da contratação via cartão.</p>
      ) : isCash ? (
        <p className="mt-2">Pagamento à vista em dinheiro no ato da contratação.</p>
      ) : (
        <p className="mt-2">Pagamento à vista no ato da contratação.</p>
      )}

      <p className="mt-2">O parcelamento refere-se exclusivamente à forma de pagamento do serviço contratado, não caracterizando mensalidade, assinatura ou prestação de serviço recorrente.</p>
      <p className="mt-2">O valor contratado corresponde à execução dos serviços durante o prazo estabelecido neste contrato.</p>
      <p className="mt-2">Após a conclusão do período de prestação dos serviços, a continuidade do trabalho poderá ser realizada mediante novo acordo entre as partes, podendo ser formalizado por meio de novo contrato ou aditivo contratual.</p>
    </>
  );
}

/* ═══════════════════════════════════════
   CONTRATO WEBSITE
   ═══════════════════════════════════════ */
function WebsiteContract({ data, confirmed, confirmDate, nomeConfirmacao, emailConfirmacao, valorParcela, vencimentos, isComplementar }: Props & {
  valorParcela: string; vencimentos: string[]; isPrincipal?: boolean; isComplementar: boolean;
}) {
  const optimized = isOptimized(data.servico_website);
  const isInstitucional = data.servico_website.includes('Institucional');

  return (
    <div className="contract-document max-w-3xl mx-auto text-[15px] leading-relaxed">
      {isComplementar && (
        <p className="text-center text-xs text-muted-foreground mb-4 italic">CONTRATO COMPLEMENTAR — ANEXADO AO CONTRATO PRINCIPAL</p>
      )}
      <h1 className="text-center text-lg mb-8 tracking-widest font-bold">
        TERMO DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO DE WEBSITE
      </h1>

      <ContratanteHeader data={data} />

      <h2 className="text-sm font-bold mt-6 mb-2">1. OBJETO DO CONTRATO</h2>
      <p>O presente contrato tem por objeto a prestação de serviços de desenvolvimento de website para o CONTRATANTE, com a finalidade de estabelecer presença digital e facilitar o contato com clientes e parceiros.</p>
      <p className="mt-2">O projeto contratado corresponde ao seguinte modelo de website:</p>
      <ul className="list-disc ml-8 my-2">
        <li><strong>{data.servico_website}</strong></li>
      </ul>

      {optimized ? (
        <>
          <p className="mt-2">O website será desenvolvido com estrutura e código otimizados para mecanismos de busca, incluindo:</p>
          <ul className="list-disc ml-8 my-2">
            <li>otimização técnica para indexação e SEO básico</li>
            <li>melhoria de carregamento e estrutura</li>
            <li>estruturação das páginas do site</li>
            <li>criação da arquitetura de navegação</li>
            <li>layout responsivo adaptado para computadores, tablets e dispositivos móveis</li>
            <li>implementação de botão ou formulário de contato</li>
          </ul>
        </>
      ) : (
        <>
          <p className="mt-2">O site tem foco em apresentação institucional ou portfólio, não possuindo como objetivo principal o ranqueamento orgânico. Porém, poderá eventualmente aparecer em resultados de busca dependendo de fatores externos.</p>
          <p className="mt-2">O desenvolvimento poderá incluir:</p>
          <ul className="list-disc ml-8 my-2">
            <li>estruturação das páginas do site</li>
            <li>criação da arquitetura de navegação</li>
            <li>inserção de textos, imagens e informações fornecidas pelo CONTRATANTE</li>
            <li>layout responsivo adaptado para computadores, tablets e dispositivos móveis</li>
            <li>implementação de botão ou formulário de contato</li>
          </ul>
        </>
      )}

      {isInstitucional && data.numero_paginas > 0 && (
        <>
          <p className="mt-2">O site poderá possuir até <strong>{data.numero_paginas} páginas</strong>.</p>
          <p className="mt-2">Caso seja necessário desenvolver mais páginas que o limite contratado, poderá haver acréscimo mediante termo aditivo contratual.</p>
        </>
      )}

      <p className="mt-2">O escopo refere-se exclusivamente ao desenvolvimento inicial do website conforme especificado neste contrato.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">2. PRAZO DE DESENVOLVIMENTO</h2>
      <p>O prazo estimado para desenvolvimento e entrega do website é de até <strong>7 (sete) dias úteis</strong>, contados a partir do envio de todas as informações necessárias pelo CONTRATANTE.</p>
      <p className="mt-2">O prazo poderá ser ajustado caso haja atraso no envio de materiais, textos, imagens, logotipos ou aprovações necessárias por parte do CONTRATANTE.</p>
      <p className="mt-2">Caso o CONTRATANTE deixe de responder solicitações ou não forneça os materiais necessários por período superior a 30 dias, o projeto poderá ser considerado temporariamente suspenso, sem prejuízo das obrigações financeiras previstas neste contrato.</p>
      <p className="mt-2">A disponibilização do website para visualização e utilização pelo CONTRATANTE caracteriza entrega do serviço contratado.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">3. AJUSTES E ALTERAÇÕES</h2>
      <p>Após a entrega inicial do website, o CONTRATANTE terá direito a até <strong>3 (três) rodadas de ajustes</strong>, desde que não alterem a estrutura principal do projeto.</p>
      <p className="mt-2">Ajustes compreendem pequenas correções ou alterações de conteúdo, tais como:</p>
      <ul className="list-disc ml-8 my-2">
        <li>ajustes de textos</li>
        <li>substituição de imagens</li>
        <li>correções de layout</li>
      </ul>
      <p>Solicitações que impliquem em criação de novas páginas, implementação de funcionalidades adicionais ou alterações estruturais poderão ser avaliadas e orçadas separadamente.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">4. RESPONSABILIDADE PELO CONTEÚDO</h2>
      <p>O CONTRATANTE é integralmente responsável por todo o conteúdo fornecido para publicação no website, incluindo textos, imagens, logotipos, vídeos e materiais institucionais.</p>
      <p className="mt-2">O CONTRATANTE declara possuir autorização ou direitos de uso sobre todos os materiais fornecidos.</p>

      {!isComplementar && (
        <PaymentSection data={data} valorParcela={valorParcela} vencimentos={vencimentos} clauseNum={5} />
      )}

      {isComplementar && (
        <>
          <h2 className="text-sm font-bold mt-6 mb-2">5. VALOR</h2>
          <p>O presente contrato complementar não possui valor financeiro adicional. O valor total da contratação está descrito no contrato principal.</p>
        </>
      )}

      {(() => {
        let n = 6;
        return (
          <>
            <h2 className="text-sm font-bold mt-6 mb-2">{n}. ATRASO E INADIMPLÊNCIA</h2>
            <p>Em caso de atraso no pagamento de qualquer parcela, incidirão:</p>
            <ul className="list-disc ml-8 my-2">
              <li>multa de 2% sobre o valor da parcela</li>
              <li>juros de mora de 1% ao mês</li>
            </ul>
            <p>Em caso de inadimplência superior a 15 dias, o CONTRATADO poderá suspender temporariamente o website até regularização do pagamento.</p>

            <h2 className="text-sm font-bold mt-6 mb-2">{n + 1}. HOSPEDAGEM DURANTE O PARCELAMENTO</h2>
            <p>Durante o período de parcelamento, o website poderá permanecer hospedado em infraestrutura administrada pelo CONTRATADO.</p>
            <p className="mt-2">Após a quitação total, o CONTRATANTE poderá solicitar a transferência completa do website.</p>

            {data.desconto_regressivo && (
              <>
                <h2 className="text-sm font-bold mt-6 mb-2">{n + 2}. QUITAÇÃO ANTECIPADA</h2>
                <p>O CONTRATANTE poderá realizar a quitação antecipada obtendo desconto regressivo: 15% inicial, reduzindo 1% ao mês, mínimo de 5%.</p>
              </>
            )}

            {(() => {
              const m = data.desconto_regressivo ? n + 3 : n + 2;
              return (
                <>
                  <h2 className="text-sm font-bold mt-6 mb-2">{m}. CANCELAMENTO E RESCISÃO</h2>
                  <p>O valor contratado refere-se ao desenvolvimento completo do website. Após a entrega, não será permitido cancelamento, permanecendo o CONTRATANTE responsável pelo pagamento integral.</p>

                  <h2 className="text-sm font-bold mt-6 mb-2">{m + 1}. LIMITAÇÃO DE RESPONSABILIDADE</h2>
                  <p>O CONTRATADO não garante resultados comerciais específicos decorrentes do website.</p>

                  <h2 className="text-sm font-bold mt-6 mb-2">{m + 2}. PORTFÓLIO E CRÉDITOS</h2>
                  <p>O CONTRATADO poderá manter identificação técnica no rodapé e utilizar o projeto como referência em portfólio.</p>

                  <h2 className="text-sm font-bold mt-6 mb-2">{m + 3}. RESOLUÇÃO DE CONFLITOS</h2>
                  <p>Fica eleito o foro da comarca de Jacareí – SP.</p>

                  <h2 className="text-sm font-bold mt-6 mb-2">{m + 4}. ACEITE DIGITAL</h2>
                  <p>Ao clicar em "Confirmar contratação", o CONTRATANTE declara que leu integralmente este contrato, compreendeu seus termos e concorda com todas as condições.</p>
                  <p className="mt-2">O registro eletrônico constitui aceite formal e válido, dispensando assinatura física.</p>
                </>
              );
            })()}
          </>
        );
      })()}

      <ConfirmacaoFooter confirmed={confirmed} confirmDate={confirmDate} nomeConfirmacao={nomeConfirmacao} emailConfirmacao={emailConfirmacao} />
    </div>
  );
}

/* ═══════════════════════════════════════
   CONTRATO GOOGLE
   ═══════════════════════════════════════ */
function GoogleContract({ data, confirmed, confirmDate, nomeConfirmacao, emailConfirmacao, valorParcela, vencimentos, isComplementar }: Props & {
  valorParcela: string; vencimentos: string[]; isComplementar: boolean;
}) {
  return (
    <div className="contract-document max-w-3xl mx-auto text-[15px] leading-relaxed">
      {isComplementar && (
        <p className="text-center text-xs text-muted-foreground mb-4 italic">CONTRATO COMPLEMENTAR — ANEXADO AO CONTRATO PRINCIPAL</p>
      )}
      <h1 className="text-center text-lg mb-8 tracking-widest font-bold">
        CONTRATO DE PRESTAÇÃO DE SERVIÇOS
      </h1>
      <h2 className="text-center text-base mb-8 tracking-wide font-semibold">
        PRESENÇA DIGITAL NO GOOGLE
      </h2>

      <ContratanteHeader data={data} />

      <h2 className="text-sm font-bold mt-6 mb-2">1. OBJETO DO CONTRATO</h2>
      <p>O presente contrato tem por objeto a prestação de serviços de otimização e gestão da presença digital do CONTRATANTE no Google.</p>
      <p className="mt-2">Os serviços poderão incluir, conforme necessidade do projeto:</p>
      <ul className="list-disc ml-8 my-2">
        <li>criação, configuração ou otimização do perfil da empresa no Google Business Profile</li>
        <li>otimização do perfil existente</li>
        <li>gestão contínua do perfil</li>
        <li>organização e melhoria das informações do perfil</li>
        <li>atualização de dados comerciais</li>
        <li>inserção e organização de imagens institucionais</li>
        <li>criação e publicação de conteúdos informativos</li>
        <li>acompanhamento e orientação sobre avaliações de clientes</li>
        <li>otimização para buscas locais</li>
      </ul>

      <h2 className="text-sm font-bold mt-6 mb-2">2. PRAZO DA PRESTAÇÃO DE SERVIÇO</h2>
      <p>O presente contrato possui prazo inicial de <strong>30 (trinta) dias</strong>, contados a partir da data de início da prestação dos serviços.</p>
      <p className="mt-2">Após o período inicial, o contrato poderá ser renovado mediante acordo entre as partes.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">3. INÍCIO DOS SERVIÇOS</h2>
      <p>A execução terá início após confirmação da contratação, envio das informações necessárias e disponibilização de acessos.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">4. OBRIGAÇÕES DO CONTRATANTE</h2>
      <ul className="list-[lower-alpha] ml-8 my-2">
        <li>fornecer informações corretas e atualizadas;</li>
        <li>disponibilizar materiais institucionais;</li>
        <li>conceder acesso ao perfil no Google;</li>
        <li>responder solicitações em prazo razoável;</li>
        <li>efetuar os pagamentos conforme estabelecido.</li>
      </ul>

      <h2 className="text-sm font-bold mt-6 mb-2">5. OBRIGAÇÕES DO CONTRATADO</h2>
      <ul className="list-[lower-alpha] ml-8 my-2">
        <li>executar os serviços com diligência;</li>
        <li>aplicar boas práticas de presença digital;</li>
        <li>manter sigilo sobre informações confidenciais;</li>
        <li>orientar o CONTRATANTE sobre boas práticas.</li>
      </ul>

      <h2 className="text-sm font-bold mt-6 mb-2">6. LIMITAÇÃO DE RESULTADOS</h2>
      <p>O CONTRATADO não garante posições específicas nos resultados de busca. O posicionamento depende de fatores externos como concorrência local, relevância do negócio, localização do usuário e critérios do Google.</p>

      {!isComplementar ? (
        <PaymentSection data={data} valorParcela={valorParcela} vencimentos={vencimentos} clauseNum={7} />
      ) : (
        <>
          <h2 className="text-sm font-bold mt-6 mb-2">7. VALOR</h2>
          <p>O presente contrato complementar não possui valor financeiro adicional. O valor total da contratação está descrito no contrato principal.</p>
        </>
      )}

      <h2 className="text-sm font-bold mt-6 mb-2">8. ATRASO E INADIMPLÊNCIA</h2>
      <p>Multa de 2% e juros de 1% ao mês. Inadimplência superior a 15 dias permite suspensão dos serviços.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">9. RESCISÃO</h2>
      <p>Mediante aviso prévio de 30 dias. Rescisão antecipada pode resultar em cobrança proporcional.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">10. RESPONSABILIDADE SOBRE A PLATAFORMA GOOGLE</h2>
      <p>Alterações nas políticas ou algoritmos do Google podem impactar os resultados, não sendo responsabilidade do CONTRATADO.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">11. USO DE PORTFÓLIO</h2>
      <p>O CONTRATADO poderá mencionar a empresa como referência em portfólio profissional.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">12. CONFIDENCIALIDADE</h2>
      <p>Ambas as partes comprometem-se a manter sigilo sobre informações trocadas durante a execução.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">13. RESOLUÇÃO DE CONFLITOS</h2>
      <p>Fica eleito o foro da comarca de Jacareí – SP.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">14. ACEITE DIGITAL</h2>
      <p>Ao clicar em "Confirmar contratação", o CONTRATANTE declara que leu, compreendeu e concorda com todas as condições.</p>
      <p className="mt-2">O registro eletrônico constitui aceite formal, dispensando assinatura física.</p>

      <ConfirmacaoFooter confirmed={confirmed} confirmDate={confirmDate} nomeConfirmacao={nomeConfirmacao} emailConfirmacao={emailConfirmacao} />
    </div>
  );
}

/* ═══════════════════════════════════════
   ANEXOS
   ═══════════════════════════════════════ */
function AnexosSection({ anexos }: { anexos: AnexoData[] }) {
  return (
    <div className="contract-document max-w-3xl mx-auto text-[15px] leading-relaxed">
      <h1 className="text-center text-lg mb-4 tracking-widest font-bold">ANEXOS</h1>
      <p className="text-center text-sm text-muted-foreground mb-6">
        Os anexos a seguir fazem parte integrante dos contratos acima.
      </p>
      <div className="space-y-6">
        {anexos.map((anexo, index) => (
          <div key={anexo.id} className="border rounded-lg p-4">
            <h3 className="font-bold text-sm mb-1">ANEXO {index + 1} — {anexo.titulo}</h3>
            <p className="text-xs text-muted-foreground mb-2">Data: {anexo.data}</p>
            <p className="whitespace-pre-wrap">{anexo.descricao}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ADITIVOS
   ═══════════════════════════════════════ */
function AditivosSection({ aditivos }: { aditivos: AditivoData[] }) {
  return (
    <div className="contract-document max-w-3xl mx-auto text-[15px] leading-relaxed">
      <h1 className="text-center text-lg mb-4 tracking-widest font-bold">ADITIVOS CONTRATUAIS</h1>
      <p className="text-center text-sm text-muted-foreground mb-6">
        Os aditivos registram renovações de prazo ou novos serviços.
      </p>
      <div className="space-y-6">
        {aditivos.map((aditivo, index) => (
          <div key={aditivo.id} className="border rounded-lg p-4">
            <h3 className="font-bold text-sm mb-1">ADITIVO {index + 1} — {aditivo.titulo}</h3>
            <p className="text-xs text-muted-foreground mb-2">Data: {aditivo.data}</p>
            <p className="whitespace-pre-wrap">{aditivo.descricao}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
