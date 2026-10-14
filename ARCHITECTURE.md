# Arquitetura AEDS 9.0

## Camadas

1. `index.html` + `styles.css`: shell e apresentação.
2. `content-core.js`: metadados, currículo, aulas e manifestos.
3. `data/questions/`: pacotes comprimidos por matéria/série.
4. `content-loader.js`: carregamento e cache seletivo.
5. `engine.js`: domínio, retenção, repetição espaçada e TRI-AEDS.
6. `analytics.js`: cobertura, estratégia de aprendizagem, revisão por causas e qualidade empírica dos itens.
7. `app.js`: interface, estado, Supabase e orquestração.
8. `sw.js`: cache do shell e pacotes offline.

## Regra de evolução

Novas funções não devem voltar a juntar conteúdo, motor e interface no mesmo bloco. Conteúdo novo entra em dados; regra pedagógica entra no motor/analytics; interface apenas apresenta e coordena.

## Dados reais

A TRI-AEDS não deve receber rótulo de nota oficial. Parâmetros empíricos só devem substituir defaults quando houver amostra e validação adequadas. Questões sinalizadas por métricas devem ir para revisão editorial, não ser removidas automaticamente.


## Regras de qualidade 9.0.4

O banco ativo é deliberadamente menor que o banco armazenado. `active=false` preserva IDs e histórico sem permitir que uma questão reprovada volte ao treino. Uma versão não deve aumentar o banco ativo reativando itens em quarentena apenas para aumentar contadores.

Antes de publicar, rode:

```bash
node quality-check.js
node logic-test.js
node quality-regression-904.js
node quality-coverage-902.js
```

A regressão 9.0.4 verifica contrato do manifesto, IDs DOM, duplicatas de enunciado/padrão/estrutura matemática, qualidade mínima das explicações, referências visuais, gabaritos, renderização das questões e capacidade de cada pacote montar sessão rígida.

## Regra de Redação 9.0.5

A área de Redação possui validação própria em `quality-redacao-905.js`. O teste exige 100 temas únicos, 12 módulos, 10 microtreinos e presença explícita das cinco competências e da estrutura da proposta de intervenção. O curso ensina modelos como estruturas de raciocínio, não como frases prontas para decorar.

## Camada de Ciência da Computação 9.0.6

9. `cs-foundations.js`: conteúdo estruturado da trilha autoral de Ciência da Computação, estudos de caso, laboratório, projetos, glossário, referências e uma cópia textual integral da fonte.
10. `source/ciencia-computacao-do-zero-aos-fundamentos.txt`: fonte autoral preservada para auditoria de integridade e futuras reedições.
11. `quality-computacao-906.js`: regressão de integridade do conteúdo e da interface de Computação.

### Regra de fonte autoral

Conteúdo autoral enviado pelo criador pode ser reorganizado para a experiência AEDS, mas o arquivo-base deve continuar preservado. Resumos/guias não podem substituir silenciosamente o original. O QA compara o texto completo integrado com a fonte e falha se houver perda de conteúdo.

### Regra de domínio em Computação

A conclusão não é baseada em leitura ou clique. O ciclo de domínio é:

1. compreender o problema;
2. prever o comportamento;
3. implementar ou experimentar;
4. registrar evidência;
5. explicar o mecanismo;
6. testar caso de borda;
7. transferir para contexto novo.

O estado de evidência é armazenado em `state.notes`, reaproveitando o mecanismo de sincronização existente e evitando nova tabela ou migração obrigatória.

## Motor AEDS Rastro 9.0.7

12. `rastro.js`: camada pura de inferência pedagógica por evidências.
13. `quality-rastro-907.js`: contrato automático da tecnologia Rastro.

### Rastro não é navegação

Rastro não pode ser implementado como página, menu ou módulo isolado. É uma camada de decisão usada pelos fluxos existentes. O QA falha se surgir `data-page="rastro"` ou `ui.page='rastro'`.

### Modelo de evidência

Cada micro-habilidade possui um rastro com escores decaídos para representação, conceito, procedimento, retenção, transferência, atenção e incerteza. Novas tentativas multiplicam escores antigos por um fator de decaimento antes de adicionar a nova evidência. Acertos estáveis e contraprovas de transferência reduzem fragilidades antigas.

O objetivo não é estimar uma característica psicológica do estudante. O estado representa apenas **qual intervenção pedagógica vale testar a seguir**.

### Experimento de uma variável

`route()` deve retornar `changeOneThing=true`. A seleção da questão continua sujeita ao antirrepetição semântico da AEDS. Uma rota Rastro não pode furar bloqueio de ID, família, padrão, resposta correta recente ou similaridade excessiva.

### Ordem de atualização

1. resposta é corrigida;
2. Rastro produz hipótese provisória;
3. feedback CID opcional pode reconstruir a hipótese daquele skill;
4. somente ao solicitar a próxima questão a contraprova é escolhida;
5. o resultado da contraprova volta ao mesmo rastro e pode reforçar ou enfraquecer a hipótese.

Essa ordem impede que uma intervenção seja escolhida antes de o aluno informar uma evidência adicional disponível.

### Provas

Durante um simulado, Rastro é observador: não altera dificuldade, ordem nem itens. Após a finalização, as respostas entram no rastro e a fila de revisão pode ser priorizada pelas fragilidades acumuladas. Isso evita contaminar a comparabilidade interna da prova.

### Persistência

`state.rastro[userId]` e `state.rastroPending[userId]` são persistidos no JSON de `user_state`. Não há tabela nova nem SQL adicional na 9.0.7.

## Rastro 2.0 / AEDS 9.0.8

O Rastro continua sem rota própria de navegação. `rastro.js` é uma camada transversal sobre Aprender, Treinar, Revisar e pós-simulado.

### Estado de caso

Cada micro-habilidade canônica pode manter casos com estados `open`, `confirming`, `recovered`, `verified`, `escalating` ou `blocked`. `recovered` significa que houve contraprova independente; `verified` exige também retenção posterior. `blocked` significa que o banco não possui evidência independente suficiente e, portanto, o motor não pode certificar domínio.

### Micro-habilidade canônica

`AEDS_RASTRO.canonicalSkill()` remove apenas sufixos editoriais conhecidos (`aplicação em contexto`, `diagnóstico conceitual`, `raciocínio N`). A chave continua incluindo matéria, série e área. Isso permite comparar formas diferentes de uma mesma habilidade sem misturar conteúdos distintos.

### Prova independente

Uma contraprova precisa usar a mesma habilidade canônica, mas deve mudar família e padrão e respeitar o limite de similaridade. Questões do mesmo `rootFamily` nunca contam como prova nova.

### Escalada

A primeira contraprova usa mudança mínima. Falhas seguintes aumentam apoio e reduzem dificuldade de forma controlada. Após quatro falhas, `needsHumanOrAuthoring` é ativado; não existe loop infinito automático.

### Escala do cliente

O treino é local-first. Pacotes locais auditados evitam RPC de leitura/correção na maior parte dos treinos. `cloudPush` é isolado por conta, coalescido, jitterizado, serializado por usuário e possui retry com backoff. Isso reduz carga, mas não substitui capacity planning de Vercel/Supabase.

## Camadas novas de escala e rigor — 9.0.9

12. `rastro.js` (2.1): casos cognitivos, evidência independente, retenção, transferência e bloqueio persistente de revisão humana.
13. `sync-engine.js`: outbox persistente do cliente, debounce/jitter, versões dirty/synced, timeout, Retry-After, backoff e pausa por autenticação.
14. `load-static-max-909.js`: rampa local de concorrência até saturação do ambiente; não substitui benchmark de produção.
15. `FAILURE-TO-RULE-9.0.9.md`: rastreabilidade obrigatória entre falha, patch, regra e regressão.

### Critério de escala

Conteúdo auditado é local-first. Supabase não fica no caminho crítico para buscar a próxima questão quando existe pacote local válido. A nuvem sincroniza estado de forma assíncrona e suavizada. O aluno carrega inicialmente apenas os pacotes necessários para sua série atual e histórico recente; outros pacotes são lazy-loaded.

Capacidade do harness local, limites do provedor e aprendizagem são métricas diferentes. Nenhuma delas pode ser usada como prova automática das outras.

A medição máxima do harness precisa usar processos limpos por nível e confirmar o maior nível verde repetidamente. Na 9.0.9, 16.350 simultâneos passaram 3/3 vezes; 16.370 foi a primeira falha (`EMFILE`) com `ulimit -n = 16.384`. Essa saturação é classificada como teto do ambiente, não como falha do aplicativo.


## Conquistas por evidência — 9.0.10

`achievements.js` é uma camada pura de avaliação. Ela recebe estatísticas, estado do Rastro e contagem de habilidades independentes e devolve métricas e conquistas. `app.js` persiste somente o registro de desbloqueio por usuário e apresenta o resultado dentro de Progresso.

O mecanismo de descoberta de estratégia compara `attempt_first` e `explain_first` usando respostas de sessões inteligentes. Um acerto confiante vale mais que um acerto com dúvida/chute. Não há inferência com amostra pequena: são necessárias pelo menos 30 observações de cada estratégia e diferença ponderada de 10 p.p. para declarar uma preferência.

## AEDS 9.0.12 — fronteira para novas evoluções

A partir da 9.0.12, recursos novos não devem ser acrescentados como novas camadas de sobrescrita no fim de `app.js` quando puderem viver em um módulo próprio.

- `aeds-config.js`: identidade e configuração da release.
- `quality-engine.js`: inspeção e quarentena pedagógica em runtime.
- `rastro4.js`: camada de hipótese/contraprova sobre o núcleo Rastro 3.0.
- `experience-9012.js`: Home orientada ao próximo passo, Mapa do Saber e integração visual do Quality 2.0.

O código histórico dentro de `app.js` continua por compatibilidade nesta release. A consolidação futura deve ser incremental: extrair um domínio por vez, manter os testes de regressão e só então remover a implementação antiga correspondente.


## AEDS 9.0.13 — Controle, observabilidade e inteligência

A 9.0.13 adiciona `control-intelligence-9013.js` como módulo transversal, sem mover novamente a lógica para o fim de `app.js`. Ele controla classificação humana, denúncias/moderação, telemetria cognitiva, memória por habilidade, escolha de aula, Árvore do Saber e integração do Tutor.

`question-pack-index.js` é o manifesto canônico dos 135 pacotes. `admin-question-index-9013.js` é um índice administrativo somente de metadados, carregado sob demanda. O Admin não deve descompactar todos os pacotes no login; `ensureAll()` fica restrito à aba de Conteúdo avançado.

A classificação `questão.matéria.série` é identidade humana de pesquisa, enquanto `q.id` continua sendo a identidade técnica. Questões editoriais novas começam depois da faixa reservada no pacote-base da combinação matéria+série, evitando colisão mesmo quando o pacote ainda não está carregado.

A moderação é overlay de estado. Quarentena e desativação não alteram nem apagam o banco-fonte; `candidateBank()` filtra esses IDs. No modo nuvem, `question_reports` e `question_moderation` são protegidas por RLS.

Rastro 4.1 continua usando o núcleo 3.0, mas a classificação real recebe telemetria de processo e evidências auxiliares do Tutor. Linguagem do aluno nunca é tratada sozinha como diagnóstico. O Admin deve conseguir observar hipóteses, evidências, gates e revisões humanas.

Memória é medida por habilidade em ciclos semanais e permanece distinta do domínio: lembrar por 28 dias não substitui exigências de transferência, variedade e independência.

O Tutor externo é server-side. Para hospedagem estática, a rota principal é Supabase Edge Function; `/api/tutor.js` permanece como alternativa em Vercel. Sem servidor de IA, o fallback local mantém a interface funcional.
