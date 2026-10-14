# QA — AEDS 9.0.8 · Rastro 2.0 rigoroso

## Objetivo

A 9.0.8 não adiciona uma nova aba. Ela endurece a tecnologia transversal AEDS Rastro para que erro, dúvida e chute sejam tratados como hipóteses testáveis, não como simples contadores de acerto/erro.

A regra central passou a ser:

> erro/dúvida → caso aberto → contraprova independente → recuperação → rechecagem após intervalo → verificação.

Um único acerto logo após a explicação não encerra mais uma dificuldade.

## Correções encontradas durante o teste

1. **Fragmentação falsa de habilidade.** `X — aplicação em contexto`, `X — diagnóstico conceitual` e `X — raciocínio N` podiam gerar rastros separados. O Rastro 2.0 agora usa uma micro-habilidade canônica para agrupar formas diferentes do mesmo conteúdo.
2. **Falha contada duas vezes.** Uma contraprova errada podia incrementar a falha no fluxo geral e no fluxo de contraprova. Agora cada resposta produz no máximo um evento de falha.
3. **Acerto único permissivo demais.** A versão anterior podia enfraquecer rapidamente uma hipótese após poucos acertos. Agora a recuperação exige uma contraprova de família/padrão diferente e uma rechecagem posterior.
4. **Questão alternativa vista recentemente.** O motor não pode repetir imediatamente uma questão antiga apenas para cumprir sua rota. Ele adia a contraprova.
5. **Cobertura insuficiente escondida.** Se não existe contraprova independente, a habilidade fica bloqueada para domínio verificado em vez de receber falso domínio.
6. **Escalada insuficiente.** Falhar repetidamente não pode gerar a mesma intervenção. A rota passa por apoio mínimo, pré-requisito, contraste de erro e, depois de quatro falhas de contraprova, exige revisão humana/editorial.
7. **Treino remoto antes do banco local.** Matérias não Matemática/Português buscavam o Supabase antes de tentar os pacotes locais. A 9.0.8 é **local-first** e usa o banco remoto apenas como fallback.
8. **Rajada de sincronização.** O estado agora usa debounce com jitter, apenas um upload por conta por vez, retry com backoff e payload isolado ao usuário atual.
9. **Risco de contaminação entre usuários.** Foi criado teste específico com 10.000 rastros independentes; nenhum vazamento de caso/score foi detectado.
10. **Confusão entre teste pedagógico e escala real.** Os relatórios separam simulação cognitiva, teste HTTP local e capacidade real do Vercel/Supabase. Nenhum dos testes locais é apresentado como garantia contratual do provedor.

## Stress pedagógico

Arquivo: `rastro-stress-908.js`

- Usuários sintéticos: **10.000**
- Questões ativas percorridas por usuário: **5.026**
- Respostas-base simuladas: **50.260.000**
- Respostas-base corretas: **45.544.264**
- Respostas-base erradas: **4.715.736**
- Acertos inseguros (dúvida/chute): **2.008.816**
- Casos que exigiram recuperação: **6.724.552**
- Itens eventualmente corretos no modelo sintético: **50.260.000 / 50.260.000**
- Contratos questão × dificuldade cognitiva: **34.053**
- Erros de contrato: **0**
- Questões com teste adicional de quatro contraprovas erradas: **4.491**
- Erros de escalada: **0**
- Erros na simulação populacional: **0**

O teste percorre sinais de representação, conceito, procedimento, retenção, transferência, atenção e incerteza. Os casos sintéticos persistentes erram contraprovas até atingir a escalada máxima e depois verificam se o motor consegue registrar recuperação sem apagar o histórico da dificuldade.

### Interpretação correta

O resultado `50.260.000 / 50.260.000` significa que **o modelo sintético programado para testar as transições do motor não entrou em deadlock e todos os itens inicialmente errados chegaram a uma resposta correta após a sequência de intervenção simulada**.

Isso **não significa** que 100% dos estudantes humanos necessariamente acertarão qualquer questão. Um estudante real pode continuar errando; nesse caso o Rastro mantém o caso aberto, escala a intervenção e, após o limite, exige revisão humana/editorial em vez de falsificar sucesso.

## Dívida de cobertura independente

O teste encontrou:

- **114 micro-habilidades canônicas** sem contraprova independente suficiente;
- **535 questões** afetadas;
- **699.470 ocorrências** dessas situações no stress de 10.000 usuários.

Essas habilidades não recebem domínio verificado. O arquivo `RASTRO-COVERAGE-DEBT-9.0.8.md` lista todas elas para orientar criação editorial futura.

Variações com o mesmo `rootFamily` não contam como prova independente, mesmo que tenham textos superficialmente diferentes.

## Teste de 10.000 acessos simultâneos à camada estática

Arquivo: `load-static-908.js`

Resultado final:

- Requisições concorrentes: **10.000**
- HTTP 200: **10.000**
- Falhas: **0**
- Tempo total no harness local: **3.719 ms**
- Latência média observada: **1.736,7 ms**
- Latência máxima observada: **3.459 ms**

Este teste usa um servidor HTTP local com os assets em memória. Ele valida que a camada estática/processo não possui um bloqueio lógico para 10.000 acessos concorrentes no harness usado.

**Não é teste real de capacidade do Vercel ou Supabase.** Limites reais dependem do plano, CDN, Postgres, Auth, RPCs, região, conexões e políticas do provedor. Um teste de carga real deve ser executado em ambiente de staging e de acordo com as regras dos provedores.

## Sincronização sob rajada

Arquivo: `sync-stress-908.js`

Modelo: 10.000 usuários realizando 5 salvamentos locais rápidos cada.

- Eventos locais: **50.000**
- Pushes de nuvem após coalescência: **10.000**
- Redução: **5:1**
- Pico modelado por 100 ms: **272 pushes**
- Pico modelado por segundo: **2.457 pushes**

Proteções novas:

- salvamento local imediato;
- debounce + jitter de sincronização;
- uma conta nunca mantém dois `cloudPush` simultâneos;
- alterações que ocorrem durante um push são enfileiradas para outro ciclo;
- até 3 tentativas com backoff e jitter;
- `user_state` envia somente os mapas pertencentes ao usuário atual;
- banco local auditado é usado antes do RPC de questões remotas.

O modelo de agendamento não prova a capacidade contratada do Supabase; ele reduz rajadas e tráfego desnecessário do cliente.

## Isolamento de 10.000 usuários

Arquivo: `rastro-isolation-908.js`

- Rastros independentes: **10.000**
- Sinais pedagógicos exercitados: **7**
- Vazamentos de estado compartilhado: **0**

Alterar o rastro do usuário 0 não alterou o estado do usuário 1, e os 10.000 casos permaneceram separados.

## Regras permanentes

O arquivo `RASTRO-RULES-9.0.8.md` contém **17 regras de regressão**. Entre elas:

- um acerto isolado não encerra caso;
- contraprova precisa ser independente;
- retenção posterior é obrigatória para verificação;
- falha repetida escala a intervenção;
- falta de questão independente bloqueia domínio;
- Rastro não pode afrouxar a qualidade do banco;
- estado cognitivo é isolado por usuário;
- treino é local-first;
- teste de 10.000 acessos deve ser repetido quando shell/sync mudarem;
- Rastro não pode virar página/aba própria.

## Regressão completa do projeto

Após as mudanças:

- Questões armazenadas: **36.669**
- Questões ativas: **5.026**
- Objetivas ativas: **4.988**
- Pacotes: **135**
- Pacotes capazes de montar sessão rígida: **135/135**
- Aulas aprofundadas: **140**
- Temas de Redação: **100**
- Módulos de Redação: **12**
- Módulos de Computação: **8**

`quality-check.js` terminou com:

- **0 erros críticos**
- **0 avisos**

## Limite que continua valendo

Nenhum teste sintético consegue provar que todo estudante humano aprenderá, nem que 10.000 usuários reais caberão no plano atual do Vercel/Supabase. A 9.0.8 foi projetada para **não esconder justamente essas incertezas**: quando a evidência não existe, o sistema mantém o caso aberto ou marca dívida de cobertura.
