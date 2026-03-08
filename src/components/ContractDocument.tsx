import { ContractFormData, AnexoData, AditivoData, CONTRATADO } from "@/types/contract";

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
  const valorParcela = data.numero_parcelas > 1
    ? (data.valor_total / data.numero_parcelas).toFixed(2)
    : Number(data.valor_total).toFixed(2);

  return (
    <div className="space-y-16">
      {/* CONTRATO 1: WEBSITE */}
      <WebsiteContract data={data} confirmed={confirmed} confirmDate={confirmDate} valorParcela={valorParcela} />

      {/* SEPARADOR */}
      <div className="border-t-4 border-primary/20 my-12" />

      {/* CONTRATO 2: GOOGLE */}
      <GoogleContract data={data} confirmed={confirmed} confirmDate={confirmDate} valorParcela={valorParcela} />

      {/* SEPARADOR */}
      <div className="border-t-4 border-primary/20 my-12" />

      {/* ANEXOS */}
      <AnexosSection anexos={data.anexos} />

      {/* ADITIVOS */}
      <AditivosSection aditivos={data.aditivos} />
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
function ConfirmacaoFooter({ confirmed, confirmDate }: { confirmed: boolean; confirmDate?: string }) {
  return (
    <>
      <h2 className="text-sm font-bold mt-6 mb-2">CONFIRMAÇÃO</h2>
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
    </>
  );
}

/* ═══════════════════════════════════════
   CONTRATO 1: WEBSITE
   ═══════════════════════════════════════ */
function WebsiteContract({ data, confirmed, confirmDate, valorParcela }: Props & { valorParcela: string }) {
  return (
    <div className="contract-document max-w-3xl mx-auto text-[15px] leading-relaxed">
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
      <p>Podendo incluir, conforme definido no momento da contratação:</p>
      <ul className="list-disc ml-8 my-2">
        <li>estruturação das páginas do site</li>
        <li>criação da arquitetura de navegação</li>
        <li>inserção de textos, imagens e informações fornecidas pelo CONTRATANTE</li>
        <li>layout responsivo adaptado para computadores, tablets e dispositivos móveis</li>
        <li>implementação de botão ou formulário de contato</li>
        <li>otimização básica de carregamento e estrutura técnica do website</li>
      </ul>
      <p>O escopo refere-se exclusivamente ao desenvolvimento inicial do website conforme especificado neste contrato.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">2. PRAZO DE DESENVOLVIMENTO</h2>
      <p>O prazo estimado para desenvolvimento e entrega do website é de até <strong>7 (sete) dias úteis</strong>, contados a partir do envio de todas as informações necessárias pelo CONTRATANTE.</p>
      <p className="mt-2">O prazo poderá ser ajustado caso haja atraso no envio de materiais, textos, imagens, logotipos ou aprovações necessárias por parte do CONTRATANTE.</p>
      <p className="mt-2">Caso o CONTRATANTE deixe de responder solicitações ou não forneça os materiais necessários por período superior a 30 dias, o projeto poderá ser considerado temporariamente suspenso, sem prejuízo das obrigações financeiras previstas neste contrato.</p>
      <p className="mt-2">A disponibilização do website para visualização e utilização pelo CONTRATANTE caracteriza entrega do serviço contratado, sendo considerada aceitação do projeto, salvo solicitação de ajustes dentro do escopo previamente acordado.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">3. AJUSTES E ALTERAÇÕES</h2>
      <p>Após a entrega inicial do website, o CONTRATANTE terá direito a até <strong>3 (três) rodadas de ajustes</strong>, desde que não alterem a estrutura principal do projeto.</p>
      <p className="mt-2">Ajustes compreendem pequenas correções ou alterações de conteúdo, tais como:</p>
      <ul className="list-disc ml-8 my-2">
        <li>ajustes de textos</li>
        <li>substituição de imagens</li>
        <li>correções de layout</li>
      </ul>
      <p>Solicitações que impliquem em:</p>
      <ul className="list-disc ml-8 my-2">
        <li>criação de novas páginas</li>
        <li>implementação de funcionalidades adicionais</li>
        <li>alterações estruturais do projeto</li>
      </ul>
      <p>poderão ser avaliadas e orçadas separadamente.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">4. RESPONSABILIDADE PELO CONTEÚDO</h2>
      <p>O CONTRATANTE é integralmente responsável por todo o conteúdo fornecido para publicação no website, incluindo:</p>
      <ul className="list-disc ml-8 my-2">
        <li>textos</li>
        <li>imagens</li>
        <li>logotipos</li>
        <li>vídeos</li>
        <li>materiais institucionais</li>
      </ul>
      <p>O CONTRATANTE declara possuir autorização ou direitos de uso sobre todos os materiais fornecidos, isentando o CONTRATADO de qualquer responsabilidade decorrente de eventual violação de direitos autorais ou uso indevido de materiais.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">5. VALOR E CONDIÇÕES DE PAGAMENTO</h2>
      <p>O valor total do presente contrato é de:</p>
      <p className="ml-4 font-bold text-base">R$ {Number(data.valor_total).toFixed(2)}</p>
      <p className="mt-2">Forma de pagamento: <strong>{paymentLabel[data.forma_pagamento]}</strong></p>
      {data.numero_parcelas > 1 ? (
        <>
          <p className="mt-2">Parcelamento: <strong>{data.numero_parcelas} parcelas de R$ {valorParcela}</strong></p>
          <p className="mt-2">Vencimento: dia <strong>{data.dia_vencimento}</strong> de cada mês.</p>
          <p className="mt-2">A primeira parcela será paga no ato da contratação.</p>
        </>
      ) : (
        <p className="mt-2">Pagamento à vista no ato da contratação.</p>
      )}
      <p className="mt-2">O parcelamento refere-se exclusivamente à forma de pagamento do desenvolvimento do website, não caracterizando mensalidade, assinatura ou serviço recorrente.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">6. ATRASO E INADIMPLÊNCIA</h2>
      <p>Em caso de atraso no pagamento de qualquer parcela, incidirão:</p>
      <ul className="list-disc ml-8 my-2">
        <li>multa de 2% sobre o valor da parcela</li>
        <li>juros de mora de 1% ao mês, calculados proporcionalmente aos dias de atraso</li>
      </ul>
      <p>Em caso de inadimplência superior a 15 (quinze) dias após o vencimento, o CONTRATADO poderá:</p>
      <ul className="list-disc ml-8 my-2">
        <li>suspender temporariamente o website</li>
        <li>retirar o website do ar até regularização do pagamento</li>
      </ul>
      <p className="mt-2">A suspensão do website não extingue nem reduz a obrigação de pagamento das parcelas contratadas.</p>
      <p className="mt-2">Após a regularização dos valores em aberto, o CONTRATADO realizará a reativação do website em prazo razoável.</p>
      <p className="mt-2">Persistindo a inadimplência, o débito poderá ser encaminhado para cobrança administrativa, protesto ou negativação, conforme legislação vigente.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">7. HOSPEDAGEM DURANTE O PARCELAMENTO</h2>
      <p>Durante o período de parcelamento, o website poderá permanecer hospedado em infraestrutura administrada pelo CONTRATADO, garantindo o funcionamento do projeto.</p>
      <p className="mt-2">Após a quitação total do contrato, o CONTRATANTE poderá solicitar a transferência completa do website, incluindo arquivos e acesso administrativo, para hospedagem de sua preferência.</p>

      {data.desconto_regressivo && (
        <>
          <h2 className="text-sm font-bold mt-6 mb-2">8. QUITAÇÃO ANTECIPADA</h2>
          <p>O CONTRATANTE poderá realizar a quitação antecipada do contrato a qualquer momento, obtendo desconto sobre o valor das parcelas vincendas.</p>
          <p className="mt-2">O desconto será aplicado de forma regressiva, conforme o tempo decorrido da contratação:</p>
          <ul className="list-disc ml-8 my-2">
            <li>início em 15% (quinze por cento)</li>
            <li>redução de 1% (um por cento) por mês</li>
            <li>limite mínimo de 5% (cinco por cento)</li>
          </ul>
          <p>O percentual aplicável será calculado com base na data da solicitação da quitação antecipada e incidirá apenas sobre as parcelas ainda não vencidas.</p>
        </>
      )}

      {(() => {
        let n = data.desconto_regressivo ? 9 : 8;
        return (
          <>
            <h2 className="text-sm font-bold mt-6 mb-2">{n}. CANCELAMENTO E RESCISÃO</h2>
            <p>O valor contratado refere-se ao desenvolvimento completo do website, sendo o parcelamento apenas uma facilidade de pagamento concedida ao CONTRATANTE.</p>
            <p className="mt-2">Após a entrega do website, não será permitido cancelamento do contrato, permanecendo o CONTRATANTE responsável pelo pagamento integral do valor acordado.</p>
            <p className="mt-2">Em caso de desistência por parte do CONTRATANTE antes da conclusão do projeto, serão devidos os valores proporcionais aos serviços já executados.</p>

            <h2 className="text-sm font-bold mt-6 mb-2">{n + 1}. LIMITAÇÃO DE RESPONSABILIDADE</h2>
            <p>O CONTRATADO compromete-se a desenvolver o website conforme o escopo deste contrato, não garantindo resultados comerciais específicos decorrentes da utilização do website.</p>
            <p className="mt-2">O desempenho de vendas, captação de clientes ou posicionamento digital depende de diversos fatores externos, incluindo estratégias de marketing, mercado e atuação do próprio CONTRATANTE.</p>

            <h2 className="text-sm font-bold mt-6 mb-2">{n + 2}. PORTFÓLIO E CRÉDITOS</h2>
            <p>O CONTRATADO poderá manter identificação técnica discreta no rodapé do website como crédito profissional.</p>
            <p className="mt-2">O CONTRATADO também poderá utilizar o projeto desenvolvido como referência em portfólio profissional, salvo manifestação contrária do CONTRATANTE.</p>

            <h2 className="text-sm font-bold mt-6 mb-2">{n + 3}. RESOLUÇÃO DE CONFLITOS</h2>
            <p>Em caso de divergências decorrentes deste contrato, as partes comprometem-se inicialmente a buscar solução amigável.</p>
            <p className="mt-2">Não sendo possível acordo, fica eleito o foro da comarca de Jacareí – SP, com renúncia de qualquer outro, por mais privilegiado que seja.</p>

            <h2 className="text-sm font-bold mt-6 mb-2">{n + 4}. ACEITE DIGITAL</h2>
            <p>Este contrato poderá ser confirmado por meio eletrônico.</p>
            <p className="mt-2">Ao clicar no botão "Confirmar contratação", o CONTRATANTE declara que:</p>
            <ul className="list-disc ml-8 my-2">
              <li>leu integralmente o presente contrato</li>
              <li>compreendeu seus termos</li>
              <li>concorda com todas as condições aqui estabelecidas</li>
            </ul>
            <p>O registro eletrônico da confirmação constitui aceite formal e válido entre as partes, dispensando assinatura física.</p>
          </>
        );
      })()}

      <ConfirmacaoFooter confirmed={confirmed} confirmDate={confirmDate} />
    </div>
  );
}

/* ═══════════════════════════════════════
   CONTRATO 2: GOOGLE
   ═══════════════════════════════════════ */
function GoogleContract({ data, confirmed, confirmDate, valorParcela }: Props & { valorParcela: string }) {
  return (
    <div className="contract-document max-w-3xl mx-auto text-[15px] leading-relaxed">
      <h1 className="text-center text-lg mb-8 tracking-widest font-bold">
        CONTRATO DE PRESTAÇÃO DE SERVIÇOS
      </h1>
      <h2 className="text-center text-base mb-8 tracking-wide font-semibold">
        OTIMIZAÇÃO DE PRESENÇA DIGITAL NO GOOGLE
      </h2>

      <ContratanteHeader data={data} />

      <h2 className="text-sm font-bold mt-6 mb-2">1. OBJETO DO CONTRATO</h2>
      <p>O presente contrato tem por objeto a prestação de serviços de otimização e gestão da presença digital do CONTRATANTE no Google, com foco no fortalecimento da visibilidade da empresa nos resultados de busca locais.</p>
      <p className="mt-2">Os serviços poderão incluir, conforme necessidade do projeto:</p>
      <ul className="list-disc ml-8 my-2">
        <li>criação, configuração ou otimização do perfil da empresa no Google Business Profile</li>
        <li>organização e melhoria das informações do perfil da empresa</li>
        <li>atualização de dados comerciais</li>
        <li>otimização da descrição da empresa</li>
        <li>inserção e organização de imagens institucionais</li>
        <li>criação e publicação de conteúdos informativos</li>
        <li>atualização periódica de informações relevantes</li>
        <li>acompanhamento e orientação sobre avaliações de clientes</li>
        <li>otimização para buscas locais</li>
        <li>melhorias na estrutura de apresentação da empresa no Google</li>
      </ul>
      <p className="mt-2">Serviço contratado:</p>
      <ul className="list-disc ml-8 my-2">
        <li><strong>{data.servico_google}</strong></li>
      </ul>
      <p>O objetivo dos serviços é melhorar a presença digital e facilitar que potenciais clientes encontrem a empresa do CONTRATANTE nas pesquisas realizadas no Google.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">2. PRAZO DA PRESTAÇÃO DE SERVIÇO</h2>
      <p>O presente contrato possui prazo inicial de <strong>30 (trinta) dias</strong>, contados a partir da data de início da prestação dos serviços.</p>
      <p className="mt-2">Após o período inicial, o contrato poderá ser renovado mediante acordo entre as partes.</p>
      <p className="mt-2">A prestação dos serviços é considerada contínua, sendo executada de forma estratégica ao longo do período contratado.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">3. INÍCIO DOS SERVIÇOS</h2>
      <p>A execução dos serviços terá início após:</p>
      <ul className="list-disc ml-8 my-2">
        <li>confirmação da contratação</li>
        <li>envio das informações necessárias pelo CONTRATANTE</li>
        <li>disponibilização de acessos eventualmente necessários</li>
      </ul>
      <p className="mt-2">Caso o CONTRATANTE demore a fornecer os dados necessários para início ou continuidade dos serviços, o prazo contratual continuará em vigor.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">4. OBRIGAÇÕES DO CONTRATANTE</h2>
      <p>São responsabilidades do CONTRATANTE:</p>
      <ul className="list-[lower-alpha] ml-8 my-2">
        <li>fornecer informações corretas e atualizadas sobre a empresa;</li>
        <li>disponibilizar materiais institucionais quando necessário, como logotipos, imagens ou informações comerciais;</li>
        <li>conceder acesso ao perfil da empresa no Google quando necessário para execução dos serviços;</li>
        <li>responder solicitações de informação ou aprovação em prazo razoável;</li>
        <li>efetuar os pagamentos conforme as condições estabelecidas neste contrato.</li>
      </ul>
      <p className="mt-2">O CONTRATANTE declara possuir autorização ou direitos de uso sobre todos os materiais fornecidos para utilização nos serviços.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">5. OBRIGAÇÕES DO CONTRATADO</h2>
      <p>São responsabilidades do CONTRATADO:</p>
      <ul className="list-[lower-alpha] ml-8 my-2">
        <li>executar os serviços descritos neste contrato com diligência e profissionalismo;</li>
        <li>aplicar boas práticas de presença digital e otimização de perfil empresarial no Google;</li>
        <li>manter sigilo sobre informações estratégicas ou confidenciais do CONTRATANTE;</li>
        <li>orientar o CONTRATANTE quando necessário sobre boas práticas relacionadas à presença digital.</li>
      </ul>

      <h2 className="text-sm font-bold mt-6 mb-2">6. LIMITAÇÃO DE RESULTADOS</h2>
      <p>O CONTRATADO compromete-se a realizar as ações necessárias para melhorar a presença digital da empresa no Google, porém não garante posições específicas nos resultados de busca.</p>
      <p className="mt-2">O posicionamento de empresas no Google depende de diversos fatores externos, incluindo:</p>
      <ul className="list-disc ml-8 my-2">
        <li>concorrência local</li>
        <li>relevância do negócio</li>
        <li>localização do usuário</li>
        <li>comportamento dos usuários</li>
        <li>critérios definidos pelo próprio Google</li>
      </ul>
      <p className="mt-2">Dessa forma, não é possível garantir resultados específicos de posicionamento, volume de clientes ou faturamento.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">7. VALOR E CONDIÇÕES DE PAGAMENTO</h2>
      <p>Pela execução dos serviços descritos neste contrato, o CONTRATANTE pagará ao CONTRATADO o valor total de:</p>
      <p className="ml-4 font-bold text-base">R$ {Number(data.valor_total).toFixed(2)}</p>
      <p className="mt-2">Forma de pagamento: <strong>{paymentLabel[data.forma_pagamento]}</strong></p>
      {data.numero_parcelas > 1 ? (
        <>
          <p className="mt-2">Parcelamento: <strong>{data.numero_parcelas} parcelas de R$ {valorParcela}</strong></p>
          <p className="mt-2">Vencimento: dia <strong>{data.dia_vencimento}</strong> de cada mês.</p>
          <p className="mt-2">A primeira parcela será paga no ato da contratação.</p>
        </>
      ) : (
        <p className="mt-2">Pagamento à vista no ato da contratação.</p>
      )}
      <p className="mt-2">O parcelamento refere-se exclusivamente à forma de pagamento do serviço contratado, não caracterizando mensalidade, assinatura ou prestação de serviço recorrente.</p>
      <p className="mt-2">O valor contratado corresponde à execução dos serviços durante o prazo estabelecido neste contrato.</p>
      <p className="mt-2">Após a conclusão do período de prestação dos serviços, a continuidade do trabalho poderá ser realizada mediante novo acordo entre as partes, podendo ser formalizado por meio de novo contrato ou aditivo contratual.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">8. ATRASO E INADIMPLÊNCIA</h2>
      <p>Em caso de atraso no pagamento, poderão ser aplicados:</p>
      <ul className="list-disc ml-8 my-2">
        <li>multa de 2% sobre o valor devido</li>
        <li>juros de mora de 1% ao mês, calculados proporcionalmente aos dias de atraso</li>
      </ul>
      <p className="mt-2">Em caso de inadimplência superior a 15 (quinze) dias, o CONTRATADO poderá suspender temporariamente a prestação dos serviços até a regularização do pagamento.</p>
      <p className="mt-2">Persistindo a inadimplência, o débito poderá ser encaminhado para cobrança administrativa, protesto ou negativação, conforme legislação vigente.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">9. RESCISÃO</h2>
      <p>O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 dias.</p>
      <p className="mt-2">Caso a rescisão ocorra antes do término do prazo mínimo contratado, poderão ser cobrados os valores proporcionais ao período restante do contrato, conforme acordo entre as partes.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">10. RESPONSABILIDADE SOBRE A PLATAFORMA GOOGLE</h2>
      <p>Os serviços prestados utilizam ferramentas e plataformas pertencentes ao Google, sobre as quais o CONTRATADO não possui controle direto.</p>
      <p className="mt-2">Alterações nas políticas, funcionamento ou algoritmos do Google podem impactar os resultados da presença digital da empresa, não sendo responsabilidade do CONTRATADO tais mudanças.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">11. USO DE PORTFÓLIO</h2>
      <p>O CONTRATADO poderá mencionar a empresa do CONTRATANTE como case ou referência em portfólio profissional, salvo manifestação contrária do CONTRATANTE.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">12. CONFIDENCIALIDADE</h2>
      <p>Ambas as partes comprometem-se a manter sigilo sobre quaisquer informações estratégicas, comerciais ou confidenciais trocadas durante a execução deste contrato.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">13. RESOLUÇÃO DE CONFLITOS</h2>
      <p>As partes comprometem-se inicialmente a buscar solução amigável para qualquer divergência decorrente deste contrato.</p>
      <p className="mt-2">Não sendo possível acordo, fica eleito o foro da comarca de Jacareí – SP, com renúncia de qualquer outro, por mais privilegiado que seja.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">14. ACEITE DIGITAL</h2>
      <p>Este contrato poderá ser confirmado por meio eletrônico.</p>
      <p className="mt-2">Ao clicar no botão "Confirmar contratação", o CONTRATANTE declara que:</p>
      <ul className="list-disc ml-8 my-2">
        <li>leu integralmente este contrato</li>
        <li>compreendeu seus termos</li>
        <li>concorda com todas as condições aqui estabelecidas</li>
      </ul>
      <p>O registro eletrônico da confirmação constitui aceite formal e válido entre as partes, dispensando assinatura física.</p>

      <ConfirmacaoFooter confirmed={confirmed} confirmDate={confirmDate} />
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
        Os anexos a seguir fazem parte integrante dos contratos acima e destinam-se a registrar alterações, complementações ou anulações de cláusulas específicas, conforme acordado entre as partes.
      </p>

      {anexos.length === 0 ? (
        <p className="text-center text-muted-foreground italic py-6">Nenhum anexo registrado.</p>
      ) : (
        <div className="space-y-6">
          {anexos.map((anexo, index) => (
            <div key={anexo.id} className="border rounded-lg p-4">
              <h3 className="font-bold text-sm mb-1">ANEXO {index + 1} — {anexo.titulo}</h3>
              <p className="text-xs text-muted-foreground mb-2">Data: {anexo.data}</p>
              <p className="whitespace-pre-wrap">{anexo.descricao}</p>
            </div>
          ))}
        </div>
      )}
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
        Os aditivos a seguir registram renovações de prazo, inclusão de novos serviços ou alterações nas condições comerciais, formalizados mediante acordo entre as partes após o término ou durante a vigência dos contratos acima.
      </p>

      {aditivos.length === 0 ? (
        <p className="text-center text-muted-foreground italic py-6">Nenhum aditivo registrado.</p>
      ) : (
        <div className="space-y-6">
          {aditivos.map((aditivo, index) => (
            <div key={aditivo.id} className="border rounded-lg p-4">
              <h3 className="font-bold text-sm mb-1">ADITIVO {index + 1} — {aditivo.titulo}</h3>
              <p className="text-xs text-muted-foreground mb-2">Data: {aditivo.data}</p>
              <p className="whitespace-pre-wrap">{aditivo.descricao}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
