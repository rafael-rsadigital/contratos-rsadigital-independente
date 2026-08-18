import { ContractFormData, AnexoData, AditivoData, Contratado, CONTRATADO_DEFAULT } from "@/types/contract";
import { format, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoRsa from "@/assets/logo-rsa-digital.png";
import { formatBRL } from "@/lib/utils";

interface Props {
  data: ContractFormData;
  contratado?: Contratado;
  confirmed: boolean;
  confirmDate?: string;
  nomeConfirmacao?: string;
  emailConfirmacao?: string;
  codigoVerificacao?: string;
  numeroContrato?: string;
  ipConfirmacao?: string;
  navegadorConfirmacao?: string;
  timezoneConfirmacao?: string;
  idiomaConfirmacao?: string;
  resolucaoConfirmacao?: string;
  isAdmin?: boolean;
}

const paymentLabel: Record<string, string> = {
  avista: "À Vista",
  parcelado: "Parcelado",
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

export function ContractDocument({ data, contratado, confirmed, confirmDate, nomeConfirmacao, emailConfirmacao, codigoVerificacao, numeroContrato, ipConfirmacao, navegadorConfirmacao, timezoneConfirmacao, idiomaConfirmacao, resolucaoConfirmacao, isAdmin }: Props) {
  const c = contratado || CONTRATADO_DEFAULT;
  const hasWebsite = !!data.servico_website;
  const hasGoogle = !!data.servico_google;
  const hasBoth = hasWebsite && hasGoogle;

  const valorLiquido = data.valor_total - data.valor_entrada;
  const valorParcela = data.numero_parcelas > 1
    ? formatBRL(valorLiquido / data.numero_parcelas)
    : formatBRL(valorLiquido);

  const vencimentos = (data.cronograma_personalizado && data.vencimentos_personalizados?.length > 0)
    ? data.vencimentos_personalizados.map(v => {
        try { return format(parseISO(v), "dd/MM/yyyy"); } catch { return v; }
      })
    : formatVencimentos(data.data_primeiro_vencimento, data.numero_parcelas);

  return (
    <div className="space-y-16">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <img src={c.logoUrl || logoRsa} alt={c.nomeFantasia} className="h-16 object-contain" />
      </div>

      {/* Contract number header */}
      {numeroContrato && (
        <div className="text-center text-xs text-muted-foreground">
          <p>Contrato nº <strong>{numeroContrato}</strong></p>
        </div>
      )}

      {hasWebsite && (
        <WebsiteContract
          data={data}
          contratado={c}
          confirmed={confirmed}
          confirmDate={confirmDate}
          nomeConfirmacao={nomeConfirmacao}
          emailConfirmacao={emailConfirmacao}
          ipConfirmacao={ipConfirmacao}
          navegadorConfirmacao={navegadorConfirmacao}
          timezoneConfirmacao={timezoneConfirmacao}
          idiomaConfirmacao={idiomaConfirmacao}
          resolucaoConfirmacao={resolucaoConfirmacao}
          valorParcela={valorParcela}
          vencimentos={vencimentos}
          isComplementar={false}
          isAdmin={isAdmin}
        />
      )}

      {hasGoogle && (
        <>
          {hasWebsite && <div className="border-t-4 border-primary/20 my-12" />}
          <GoogleContract
            data={data}
            contratado={c}
            confirmed={confirmed}
            confirmDate={confirmDate}
            nomeConfirmacao={nomeConfirmacao}
            emailConfirmacao={emailConfirmacao}
            ipConfirmacao={ipConfirmacao}
            navegadorConfirmacao={navegadorConfirmacao}
            timezoneConfirmacao={timezoneConfirmacao}
            idiomaConfirmacao={idiomaConfirmacao}
            resolucaoConfirmacao={resolucaoConfirmacao}
            valorParcela={valorParcela}
            vencimentos={vencimentos}
            isComplementar={hasBoth}
            isAdmin={isAdmin}
          />
        </>
      )}

      {data.permuta_valor > 0 && (
        <>
          <div className="border-t-4 border-primary/20 my-12" />
          <PermutaAnexo data={data} />
        </>
      )}

      {data.anexos.length > 0 && (
        <>
          <div className="border-t-4 border-primary/20 my-12" />
          <AnexosSection anexos={data.anexos} />
        </>
      )}

      {data.aditivos.length > 0 && (
        <>
          <div className="border-t-4 border-primary/20 my-12" />
          <AditivosSection aditivos={data.aditivos} numeroContrato={numeroContrato} isAdmin={isAdmin} />
        </>
      )}

      {/* Pending aditivo warning */}
      {data.aditivos.some(a => a.status === 'pendente') && (
        <div className="rounded-lg border-2 border-yellow-500/40 bg-yellow-500/10 p-4 text-center mt-8">
          <p className="text-sm font-medium">⚠ Existe(m) termo(s) aditivo(s) aguardando confirmação.</p>
        </div>
      )}

      {codigoVerificacao && (
        <div className="text-center text-xs text-muted-foreground border-t pt-4 mt-8">
          <p>Código de verificação: <strong>{codigoVerificacao}</strong></p>
        </div>
      )}
    </div>
  );
}

/* ─── CONTRATANTE HEADER ─── */
function ContratanteHeader({ data, contratado }: { data: ContractFormData; contratado: Contratado }) {
  return (
    <>
      <h2 className="text-sm font-bold mt-6 mb-2">CONTRATADO</h2>
      <p>
        <strong>{contratado.nome}</strong>, inscrito no CNPJ nº {contratado.cnpj}, atuando sob o nome
        fantasia <strong>{contratado.nomeFantasia}</strong>, com sede em {contratado.cidade}, doravante denominado CONTRATADO.
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
      {data.client.celular && <p className="ml-4">Celular: {data.client.celular}</p>}
      {data.client.email && <p className="ml-4">Email: {data.client.email}</p>}
      <p>doravante denominado CONTRATANTE.</p>
    </>
  );
}

/* ─── CONFIRMAÇÃO FOOTER (versão cliente) ─── */
function ConfirmacaoFooter({ contratado, confirmed, confirmDate, nomeConfirmacao, emailConfirmacao, codigoVerificacao, ipConfirmacao, navegadorConfirmacao, timezoneConfirmacao, idiomaConfirmacao, resolucaoConfirmacao, isAdmin }: {
  contratado: Contratado; confirmed: boolean; confirmDate?: string; nomeConfirmacao?: string; emailConfirmacao?: string; codigoVerificacao?: string; ipConfirmacao?: string; navegadorConfirmacao?: string; timezoneConfirmacao?: string; idiomaConfirmacao?: string; resolucaoConfirmacao?: string; isAdmin?: boolean;
}) {
  // Parse navegador for friendly display
  const parseBrowser = (ua?: string) => {
    if (!ua) return { browser: '', device: '' };
    let browser = 'Navegador desconhecido';
    let device = 'Dispositivo desconhecido';
    if (ua.includes('Chrome') && ua.includes('Mobile')) browser = 'Chrome Mobile';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    if (ua.includes('Android')) device = 'Android';
    else if (ua.includes('iPhone')) device = 'iPhone';
    else if (ua.includes('Windows')) device = 'Windows';
    else if (ua.includes('Mac')) device = 'macOS';
    else if (ua.includes('Linux')) device = 'Linux';
    return { browser, device };
  };

  const { browser, device } = parseBrowser(navegadorConfirmacao);
  const horaAceite = confirmDate || '';

  return (
    <>
      <h2 className="text-sm font-bold mt-6 mb-2">CONFIRMAÇÃO</h2>
      {confirmed ? (
        <div className="mt-3 space-y-4">
          {/* Comprovante de Aceite Digital — versão cliente */}
          <div className="border-2 border-primary/20 rounded-lg p-6 space-y-4">
            <h3 className="text-center text-sm font-bold tracking-widest uppercase">Comprovante de Aceite Digital</h3>
            <div className="border-b pb-3 space-y-1 text-sm">
              {nomeConfirmacao && <p>Contratante: <strong>{nomeConfirmacao}</strong></p>}
              {emailConfirmacao && <p>Email: <strong>{emailConfirmacao}</strong></p>}
            </div>
            <div className="space-y-1 text-sm">
              {horaAceite && <p>Data do aceite: <strong>{horaAceite}</strong></p>}
            </div>
            <div className="bg-muted/30 rounded-md p-3 text-sm italic text-muted-foreground">
              <p className="font-medium text-foreground not-italic mb-1">Declaração:</p>
              <p>O contratante declara que leu e aceitou integralmente os termos do contrato.</p>
              <p className="mt-2">Este registro eletrônico constitui prova de aceite formal e válido do contrato firmado entre as partes.</p>
            </div>
            {codigoVerificacao && (
              <p className="text-sm">Código de verificação do aceite: <strong className="font-mono">{codigoVerificacao}</strong></p>
            )}
          </div>

          {/* Log técnico interno — apenas admin */}
          {isAdmin && (
            <div className="border rounded-lg p-5 space-y-3 bg-muted/10">
              <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">🔐 Log Técnico (interno)</h3>
              <div className="text-xs space-y-1 font-mono">
                {nomeConfirmacao && <p>Cliente: {nomeConfirmacao}</p>}
                {horaAceite && <p>Data/Hora: {horaAceite}</p>}
                {ipConfirmacao && <p>IP: {ipConfirmacao}</p>}
                {navegadorConfirmacao && <p>User Agent: {navegadorConfirmacao}</p>}
                {browser && <p>Navegador: {browser}</p>}
                {device && <p>Dispositivo: {device}</p>}
                {timezoneConfirmacao && <p>Timezone: {timezoneConfirmacao}</p>}
                {idiomaConfirmacao && <p>Idioma: {idiomaConfirmacao}</p>}
                {resolucaoConfirmacao && <p>Resolução: {resolucaoConfirmacao}</p>}
                {codigoVerificacao && <p>Código: {codigoVerificacao}</p>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground italic">Aguardando confirmação do contratante.</p>
      )}
      <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
        <p>{contratado.nomeFantasia} — CNPJ {contratado.cnpj}</p>
        <p>{contratado.cidade}</p>
      </div>
    </>
  );
}

/* ─── PAYMENT SECTION ─── */
function PaymentSection({ data, valorParcela, vencimentos, clauseNum }: {
  data: ContractFormData; valorParcela: string; vencimentos: string[]; clauseNum: number;
}) {
  const isAvista = data.forma_pagamento === 'avista';
  const isParcelado = data.forma_pagamento === 'parcelado';
  const hasPermuta = data.permuta_valor > 0;
  const hasEntrada = data.valor_entrada > 0;
  const hasDescontoAVista = data.valor_a_vista != null && data.valor_a_vista > 0 && data.mencionar_desconto_avista;

  const saldoRestante = data.valor_total - (hasEntrada ? data.valor_entrada : 0) - (hasPermuta ? data.permuta_valor : 0);
  const valorParcelaReal = data.numero_parcelas > 1
    ? formatBRL(saldoRestante / data.numero_parcelas)
    : formatBRL(saldoRestante);

  const dataVencimentoFormatada = (() => {
    if (!data.data_primeiro_vencimento) return null;
    try { return format(parseISO(data.data_primeiro_vencimento), "dd/MM/yyyy"); } catch { return null; }
  })();

  return (
    <>
      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum}. VALOR E CONDIÇÕES DE PAGAMENTO</h2>
      <p>Pela execução dos serviços descritos neste contrato, o CONTRATANTE pagará ao CONTRATADO o valor total de:</p>
      <p className="ml-4 font-bold text-base">R$ {formatBRL(data.valor_total)}</p>

      {hasDescontoAVista && isParcelado && data.numero_parcelas > 1 && (
        <>
          <p className="mt-4 font-semibold">Opção de pagamento à vista com desconto:</p>
          <p className="ml-4">
            O CONTRATANTE poderá optar pelo pagamento à vista, no valor de <strong>R$ {formatBRL(data.valor_a_vista!)}</strong>, 
            obtendo desconto de <strong>R$ {formatBRL(data.valor_total - data.valor_a_vista!)}</strong> sobre o valor total.
          </p>
          <p className="ml-4 mt-1 text-sm text-muted-foreground">
            Caso o CONTRATANTE opte pelo pagamento à vista, as condições de parcelamento descritas abaixo não se aplicam.
          </p>
        </>
      )}

      <p className="mt-4 font-semibold">Forma de pagamento:</p>
      <ul className="list-disc ml-8 my-2 space-y-1">
        {hasEntrada && (
          <li>Entrada: <strong>R$ {formatBRL(data.valor_entrada)}</strong> via {entradaPaymentLabel[data.forma_pagamento_entrada]}.</li>
        )}
        {hasPermuta && (
          <li>Permuta: <strong>R$ {formatBRL(data.permuta_valor)}</strong> em produtos/serviços, conforme Anexo de Permuta deste contrato.</li>
        )}
        <li>
          Saldo restante: <strong>R$ {formatBRL(saldoRestante)}</strong>
          {isParcelado && data.numero_parcelas > 1 ? (
            <>, parcelado em <strong>{data.numero_parcelas}x de R$ {valorParcelaReal}</strong>.</>
          ) : dataVencimentoFormatada ? (
            <>, pago à vista, com vencimento em <strong>{dataVencimentoFormatada}</strong>.</>
          ) : (
            <>, pago à vista no ato da contratação.</>
          )}
        </li>
      </ul>

      {isParcelado && data.numero_parcelas > 1 && vencimentos.length > 0 && (
        <>
          <p className="mt-2">Vencimentos das parcelas:</p>
          <ul className="list-disc ml-8 my-2">
            {vencimentos.map((v, i) => (
              <li key={i}>{i + 1}ª parcela — {v} — R$ {valorParcelaReal}</li>
            ))}
          </ul>
        </>
      )}

      {!data.servico_recorrente && (
        <p className="mt-2">O parcelamento refere-se exclusivamente à forma de pagamento do serviço contratado, não caracterizando mensalidade, assinatura ou prestação de serviço recorrente.</p>
      )}
      <p className="mt-2">O valor contratado corresponde à execução dos serviços durante o prazo estabelecido neste contrato.</p>
      <p className="mt-2">Após a conclusão do período de prestação dos serviços, a continuidade do trabalho poderá ser realizada mediante novo acordo entre as partes, podendo ser formalizado por meio de novo contrato ou aditivo contratual.</p>
    </>
  );
}

/* ═══ CONTRATO WEBSITE ═══ */
function WebsiteContract({ data, contratado, confirmed, confirmDate, nomeConfirmacao, emailConfirmacao, ipConfirmacao, navegadorConfirmacao, timezoneConfirmacao, idiomaConfirmacao, resolucaoConfirmacao, valorParcela, vencimentos, isComplementar, isAdmin }: Props & {
  contratado: Contratado; valorParcela: string; vencimentos: string[]; isComplementar: boolean;
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

      <ContratanteHeader data={data} contratado={contratado} />

      <h2 className="text-sm font-bold mt-6 mb-2">1. OBJETO DO CONTRATO</h2>
      <p>O presente contrato tem por objeto a prestação de serviços de desenvolvimento de website para o CONTRATANTE, com a finalidade de estabelecer presença digital e facilitar o contato com clientes e parceiros.</p>
      <p className="mt-2">O projeto contratado corresponde ao seguinte modelo de website:</p>
      <ul className="list-disc ml-8 my-2">
        <li><strong>{data.servico_website}</strong></li>
      </ul>

      {data.escopo_personalizado?.trim() ? (
        <p className="mt-2 whitespace-pre-line">{data.escopo_personalizado.trim()}</p>
      ) : optimized ? (
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
            <p>Multa de {contratado.multaPct}% e juros de {contratado.jurosPct}% ao mês. Inadimplência superior a 15 dias permite a suspensão dos serviços, protesto do título e negativação do débito nos órgãos de proteção ao crédito.</p>

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
                  <h2 className="text-sm font-bold mt-6 mb-2">{m}. RESCISÃO ANTECIPADA</h2>
                  <p>Em caso de cancelamento do contrato por iniciativa do CONTRATANTE antes do término do prazo estabelecido, será devida multa rescisória de {contratado.multaRescisoriaPct}% (percentual definido pelo CONTRATADO) sobre o valor total das parcelas vincendas (saldo remanescente do contrato). O reembolso do saldo credor, deduzida a multa, será realizado ao CONTRATANTE em até 10 (dez) dias úteis após a formalização do distrato.</p>

                  <h2 className="text-sm font-bold mt-6 mb-2">{m + 1}. LIMITAÇÃO DE RESPONSABILIDADE</h2>
                  <p>O CONTRATADO não garante resultados comerciais específicos decorrentes do website.</p>

                  <h2 className="text-sm font-bold mt-6 mb-2">{m + 2}. PORTFÓLIO E CRÉDITOS</h2>
                  <p>O CONTRATADO poderá manter identificação técnica no rodapé e utilizar o projeto como referência em portfólio.</p>

                  <h2 className="text-sm font-bold mt-6 mb-2">{m + 3}. RESOLUÇÃO DE CONFLITOS</h2>
                  <p>Fica eleito o foro da comarca de Jacareí – SP.</p>

                   <h2 className="text-sm font-bold mt-6 mb-2">{m + 4}. ALTERAÇÕES CONTRATUAIS</h2>
                   <p>Alterações no presente contrato somente terão validade quando formalizadas por meio de termo aditivo, devidamente registrado e aceito eletronicamente pelas partes.</p>

                   <h2 className="text-sm font-bold mt-6 mb-2">{m + 5}. ACEITE DIGITAL</h2>
                   <p>Ao clicar em "Confirmar contratação", o CONTRATANTE declara que leu integralmente este contrato, compreendeu seus termos e concorda com todas as condições.</p>
                   <p className="mt-2">O registro eletrônico constitui aceite formal e válido, dispensando assinatura física.</p>
                </>
              );
            })()}
          </>
        );
      })()}

      <ConfirmacaoFooter contratado={contratado} confirmed={confirmed} confirmDate={confirmDate} nomeConfirmacao={nomeConfirmacao} emailConfirmacao={emailConfirmacao} codigoVerificacao={undefined} ipConfirmacao={ipConfirmacao} navegadorConfirmacao={navegadorConfirmacao} timezoneConfirmacao={timezoneConfirmacao} idiomaConfirmacao={idiomaConfirmacao} resolucaoConfirmacao={resolucaoConfirmacao} isAdmin={isAdmin} />
    </div>
  );
}

/* ═══ CONTRATO GOOGLE ═══ */
function GoogleContract({ data, contratado, confirmed, confirmDate, nomeConfirmacao, emailConfirmacao, ipConfirmacao, navegadorConfirmacao, timezoneConfirmacao, idiomaConfirmacao, resolucaoConfirmacao, valorParcela, vencimentos, isComplementar, isAdmin }: Props & {
  contratado: Contratado; valorParcela: string; vencimentos: string[]; isComplementar: boolean;
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

      <ContratanteHeader data={data} contratado={contratado} />

      <h2 className="text-sm font-bold mt-6 mb-2">1. OBJETO DO CONTRATO</h2>
      <p>O presente contrato tem por objeto a prestação de serviços de otimização e gestão da presença digital do CONTRATANTE no Google.</p>
      {data.escopo_personalizado?.trim() ? (
        <p className="mt-2 whitespace-pre-line">{data.escopo_personalizado.trim()}</p>
      ) : (
        <>
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
        </>
      )}

      <h2 className="text-sm font-bold mt-6 mb-2">2. PRAZO DA PRESTAÇÃO DE SERVIÇO</h2>
      <p>O presente contrato possui prazo inicial de <strong>{data.prazo_google || '30 dias'}</strong>, contados a partir da data de início da prestação dos serviços.</p>
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
      <p>Multa de {contratado.multaPct}% e juros de {contratado.jurosPct}% ao mês. Inadimplência superior a 15 dias permite a suspensão dos serviços, protesto do título e negativação do débito nos órgãos de proteção ao crédito.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">9. RESCISÃO ANTECIPADA</h2>
      <p>Em caso de cancelamento do contrato por iniciativa do CONTRATANTE antes do término do prazo estabelecido, será devida multa rescisória de {contratado.multaRescisoriaPct}% (percentual definido pelo CONTRATADO) sobre o valor total das parcelas vincendas (saldo remanescente do contrato). O reembolso do saldo credor, deduzida a multa, será realizado ao CONTRATANTE em até 10 (dez) dias úteis após a formalização do distrato.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">10. RESPONSABILIDADE SOBRE A PLATAFORMA GOOGLE</h2>
      <p>Alterações nas políticas ou algoritmos do Google podem impactar os resultados, não sendo responsabilidade do CONTRATADO.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">11. USO DE PORTFÓLIO</h2>
      <p>O CONTRATADO poderá mencionar a empresa como referência em portfólio profissional.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">12. CONFIDENCIALIDADE</h2>
      <p>Ambas as partes comprometem-se a manter sigilo sobre informações trocadas durante a execução.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">13. RESOLUÇÃO DE CONFLITOS</h2>
      <p>Fica eleito o foro da comarca de Jacareí – SP.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">14. ALTERAÇÕES CONTRATUAIS</h2>
      <p>Alterações no presente contrato somente terão validade quando formalizadas por meio de termo aditivo, devidamente registrado e aceito eletronicamente pelas partes.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">15. ACEITE DIGITAL</h2>
      <p>Ao clicar em "Confirmar contratação", o CONTRATANTE declara que leu, compreendeu e concorda com todas as condições.</p>
      <p className="mt-2">O registro eletrônico constitui aceite formal, dispensando assinatura física.</p>

      <ConfirmacaoFooter contratado={contratado} confirmed={confirmed} confirmDate={confirmDate} nomeConfirmacao={nomeConfirmacao} emailConfirmacao={emailConfirmacao} codigoVerificacao={undefined} ipConfirmacao={ipConfirmacao} navegadorConfirmacao={navegadorConfirmacao} timezoneConfirmacao={timezoneConfirmacao} idiomaConfirmacao={idiomaConfirmacao} resolucaoConfirmacao={resolucaoConfirmacao} isAdmin={isAdmin} />
    </div>
  );
}

/* ═══ ANEXO DE PERMUTA ═══ */
function PermutaAnexo({ data }: { data: ContractFormData }) {
  let clauseNum = 1;

  return (
    <div className="contract-document max-w-3xl mx-auto text-[15px] leading-relaxed">
      <h1 className="text-center text-lg mb-4 tracking-widest font-bold">ANEXO DE PERMUTA</h1>
      <p className="text-center text-sm text-muted-foreground mb-6">
        Este anexo complementa o contrato principal, possuindo o mesmo valor jurídico e devendo ser interpretado em conjunto com as demais cláusulas contratuais.
      </p>

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. VALOR DA PERMUTA</h2>
      <p>O CONTRATANTE concorda em disponibilizar ao CONTRATADO créditos em produtos e/ou serviços no valor de:</p>
      <p className="ml-4 font-bold text-base">R$ {formatBRL(Number(data.permuta_valor))}</p>

      {data.permuta_descricao && (
        <>
          <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. DESCRIÇÃO DOS PRODUTOS/SERVIÇOS</h2>
          <p>Os créditos de permuta poderão ser utilizados para aquisição de:</p>
          <div className="ml-4 mt-2 p-3 bg-muted/30 rounded border">
            <p className="whitespace-pre-wrap">{data.permuta_descricao}</p>
          </div>
        </>
      )}

      {data.permuta_condicoes && (
        <>
          <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. CONDIÇÕES ESPECÍFICAS</h2>
          <div className="ml-4 mt-2 p-3 bg-muted/30 rounded border">
            <p className="whitespace-pre-wrap">{data.permuta_condicoes}</p>
          </div>
        </>
      )}

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. REGRAS GERAIS DE UTILIZAÇÃO</h2>
      <p>O crédito de permuta deverá ser disponibilizado ao CONTRATADO nas mesmas condições comerciais praticadas pelo CONTRATANTE aos seus demais clientes.</p>
      <p className="mt-2">Não será permitida a cobrança de valores diferenciados ou tratamento distinto que reduza o valor efetivo do crédito.</p>
      <p className="mt-2">Os preços considerados para utilização da permuta deverão respeitar os valores normalmente praticados pelo CONTRATANTE no momento da utilização, incluindo promoções, descontos ou condições comerciais vigentes.</p>
      <ul className="list-disc ml-8 my-2">
        <li>O crédito de permuta é pessoal e intransferível, salvo acordo expresso entre as partes.</li>
        <li>A utilização do crédito deverá ser solicitada com antecedência mínima de 48 horas, salvo disposição específica registrada neste contrato.</li>
        <li>O crédito não poderá ser convertido em dinheiro por iniciativa do CONTRATADO, exceto nas hipóteses de descumprimento da permuta previstas neste anexo.</li>
        <li>O CONTRATADO poderá utilizar o crédito de forma parcial, em uma ou mais utilizações, até o limite do valor total disponível, não podendo o CONTRATANTE exigir consumo integral em única utilização.</li>
      </ul>

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. CONTROLE DE SALDO DA PERMUTA</h2>
      <p>O saldo da permuta será controlado pelo CONTRATADO, podendo ser registradas utilizações parciais até o limite do crédito disponível.</p>
      <p className="mt-2">A cada utilização poderão ser registrados:</p>
      <ul className="list-disc ml-8 my-2">
        <li>valor utilizado</li>
        <li>descrição da utilização</li>
        <li>data da utilização</li>
        <li>saldo restante</li>
      </ul>
      <p className="mt-2">Esses registros poderão ser compartilhados com o CONTRATANTE para fins de transparência e acompanhamento da utilização da permuta.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. PRAZO DE VALIDADE</h2>
      <p>O crédito de permuta terá validade de <strong>24 (vinte e quatro) meses</strong> a partir da data de confirmação do contrato.</p>
      <p className="mt-2">Caso o CONTRATADO não utilize o crédito dentro desse prazo, o saldo remanescente será considerado expirado, não sendo possível posterior cobrança financeira relacionada à permuta.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. SOLICITAÇÃO DE UTILIZAÇÃO</h2>
      <p>O CONTRATADO poderá solicitar a utilização da permuta por qualquer meio de comunicação entre as partes, incluindo sistema eletrônico, mensagem escrita ou outro meio que permita comprovação da solicitação.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. DESCUMPRIMENTO DA PERMUTA</h2>
      <p>Caso o CONTRATANTE impeça, recuse, dificulte ou deixe de disponibilizar os produtos ou serviços previstos na permuta, o CONTRATADO poderá registrar solicitação formal de utilização do crédito.</p>
      <p className="mt-2">Não sendo possível a utilização no prazo de até <strong>10 (dez) dias corridos</strong> após a solicitação formal, a permuta será considerada não cumprida.</p>
      <p className="mt-2">Nessa hipótese, o valor correspondente ao saldo da permuta será automaticamente convertido em obrigação financeira em moeda corrente.</p>
      <p className="mt-2">A partir do término do prazo de 10 (dez) dias mencionado nesta cláusula, o saldo da permuta passará a ser considerado dívida vencida, sujeita aos encargos previstos neste contrato.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. ENCARGOS POR INADIMPLEMENTO</h2>
      <p>Após a conversão da permuta em obrigação financeira, o valor devido ficará sujeito às seguintes condições:</p>
      <ul className="list-disc ml-8 my-2">
        <li>multa moratória de 2% sobre o valor devido</li>
        <li>juros de 1% ao mês, calculados proporcionalmente ao período de atraso</li>
        <li>correção monetária conforme índice oficial aplicável</li>
      </ul>
      <p className="mt-2">Persistindo a inadimplência, o débito poderá ser encaminhado para cobrança administrativa ou judicial.</p>
      <p className="mt-2">O valor devido também poderá ser registrado em sistemas de proteção ao crédito, conforme legislação vigente.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. ENCERRAMENTO DAS ATIVIDADES OU ALTERAÇÃO DA EMPRESA</h2>
      <p>Caso o CONTRATANTE encerre suas atividades, altere a titularidade da empresa ou deixe de oferecer os produtos ou serviços originalmente vinculados à permuta, a obrigação assumida neste contrato permanecerá válida.</p>
      <p className="mt-2">Nessa hipótese, o valor correspondente ao saldo da permuta não utilizada poderá ser convertido em obrigação financeira equivalente ou substituído por outro produto ou serviço de valor equivalente mediante acordo entre as partes.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. EQUILÍBRIO CONTRATUAL</h2>
      <p>As regras previstas neste anexo têm como objetivo garantir equilíbrio entre as partes, assegurando que tanto o CONTRATANTE quanto o CONTRATADO possam cumprir suas obrigações de forma justa, transparente e proporcional.</p>
      <p className="mt-2">Nenhuma das partes poderá utilizar as disposições da permuta para impor vantagens indevidas ou prejudicar a outra parte.</p>

      <h2 className="text-sm font-bold mt-6 mb-2">{clauseNum++}. BOA-FÉ NA UTILIZAÇÃO DA PERMUTA</h2>
      <p>O CONTRATADO compromete-se a exercer o direito de utilização da permuta de forma razoável e dentro do prazo estabelecido neste contrato.</p>
      <p className="mt-2">A ausência de solicitação de utilização do crédito durante o prazo de validade da permuta não poderá ser utilizada como fundamento para cobrança financeira posterior, salvo nas hipóteses expressamente previstas de descumprimento por parte do CONTRATANTE.</p>
    </div>
  );
}

/* ═══ ANEXOS ═══ */
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

/* ═══ ADITIVOS ═══ */
function AditivosSection({ aditivos, numeroContrato, isAdmin }: { aditivos: AditivoData[]; numeroContrato?: string; isAdmin?: boolean }) {
  return (
    <div className="contract-document max-w-3xl mx-auto text-[15px] leading-relaxed">
      <h1 className="text-center text-lg mb-4 tracking-widest font-bold">HISTÓRICO DO CONTRATO</h1>
      <p className="text-center text-sm text-muted-foreground mb-6">
        Termos aditivos vinculados ao contrato {numeroContrato ? `nº ${numeroContrato}` : 'principal'}.
      </p>

      <div className="space-y-2 mb-8">
        {aditivos.map((aditivo) => (
          <div key={aditivo.id} className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="font-bold text-sm">Aditivo {aditivo.numero} — {aditivo.titulo}</p>
              <p className="text-xs text-muted-foreground">{aditivo.data}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              aditivo.status === 'aceito' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {aditivo.status === 'aceito' ? '✓ Aceito' : '⏳ Pendente'}
            </span>
          </div>
        ))}
      </div>

      {aditivos.map((aditivo) => (
        <div key={aditivo.id} className="mb-10">
          <div className="border-t-2 border-primary/10 pt-6">
            <h2 className="text-center text-base font-bold tracking-widest mb-1">
              TERMO ADITIVO Nº {aditivo.numero}
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
              AO CONTRATO Nº {numeroContrato || '—'}
            </p>

            <h3 className="text-sm font-bold mt-4 mb-2">DESCRIÇÃO DAS ALTERAÇÕES</h3>
            <div className="ml-4 p-3 bg-muted/30 rounded border">
              <p className="whitespace-pre-wrap">{aditivo.descricao}</p>
            </div>

            {aditivo.clausulas_alteradas && (
              <>
                <h3 className="text-sm font-bold mt-4 mb-2">CLÁUSULAS ALTERADAS</h3>
                <div className="ml-4 p-3 bg-muted/30 rounded border">
                  <p className="whitespace-pre-wrap">{aditivo.clausulas_alteradas}</p>
                </div>
              </>
            )}

            {aditivo.novo_valor != null && aditivo.novo_valor > 0 && (
              <p className="mt-3">Novo valor: <strong>R$ {formatBRL(aditivo.novo_valor)}</strong></p>
            )}

            {aditivo.novo_prazo && (
              <p className="mt-2">Novo prazo: <strong>{aditivo.novo_prazo}</strong></p>
            )}

            <p className="mt-4 italic text-muted-foreground text-sm">
              Todas as demais cláusulas permanecem inalteradas.
            </p>

            {/* Acceptance proof */}
            {aditivo.status === 'aceito' && aditivo.data_aceite && (
              <div className="mt-4 border-2 border-primary/20 rounded-lg p-4 space-y-2">
                <h4 className="text-center text-xs font-bold tracking-widest uppercase">Comprovante de Aceite</h4>
                <div className="text-sm space-y-1">
                  {aditivo.nome_aceite && <p>Contratante: <strong>{aditivo.nome_aceite}</strong></p>}
                  <p>Data do aceite: <strong>{new Date(aditivo.data_aceite).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></p>
                  {aditivo.codigo_verificacao && <p>Código: <strong className="font-mono">{aditivo.codigo_verificacao}</strong></p>}
                </div>
              </div>
            )}

            {/* Admin log */}
            {isAdmin && aditivo.status === 'aceito' && aditivo.ip_aceite && (
              <div className="mt-3 border rounded-lg p-4 bg-muted/10">
                <h4 className="text-xs font-bold tracking-wide text-muted-foreground uppercase mb-2">🔐 Log Técnico</h4>
                <div className="text-xs space-y-1 font-mono">
                  {aditivo.ip_aceite && <p>IP: {aditivo.ip_aceite}</p>}
                  {aditivo.navegador_aceite && <p>User Agent: {aditivo.navegador_aceite}</p>}
                  {aditivo.timezone_aceite && <p>Timezone: {aditivo.timezone_aceite}</p>}
                  {aditivo.idioma_aceite && <p>Idioma: {aditivo.idioma_aceite}</p>}
                  {aditivo.resolucao_aceite && <p>Resolução: {aditivo.resolucao_aceite}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
