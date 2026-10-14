# QA de release — AEDS 9.0.9 / Rastro 2.1

## Resultado executivo

**Status: APROVADO — 0 erros críticos e 0 avisos na bateria geral.**

A 9.0.9 foi construída com a regra de que uma falha reproduzível não pode terminar somente como observação. Toda classe de falha encontrada durante esta rodada foi ligada a uma correção, uma regra permanente e um teste de regressão em `FAILURE-TO-RULE-9.0.9.md`.

## Conteúdo

- 36.783 questões armazenadas.
- 5.140 questões ativas.
- 5.102 questões objetivas ativas.
- 38 questões discursivas ativas.
- 135 pacotes matéria × série.
- 135/135 pacotes conseguem montar sessão rígida de 7 questões.
- 0 duplicatas ativas de enunciado/padrão na regressão.
- 114 contraprovas independentes novas criadas especificamente para zerar a dívida do Rastro.
- Dívida de contraprova independente: **0 micro-habilidades / 0 questões**.
- Nenhuma questão antiga em quarentena foi reativada.

## Stress pedagógico do Rastro

População sintética: **10.000 alunos**.

Cada aluno percorreu as **5.140 questões ativas**, totalizando:

- **51.400.000 respostas-base**.
- 46.578.148 acertos iniciais.
- 4.821.852 erros iniciais.
- 2.054.016 acertos inseguros.
- 6.875.868 eventos de recuperação.
- 51.400.000 / 51.400.000 situações eventualmente corretas no modelo sintético.
- 34.851 contratos questão × dificuldade cognitiva.
- 0 erros de contrato.
- 5.140 cenários de escalada máxima.
- 0 falhas de escalada.
- 0 erros da população sintética.

Este teste valida a lógica do motor. Ele **não significa que todo aluno humano vai necessariamente aprender ou acertar todas as questões**.

## Rigor de certificação

Rastro 2.1 diferencia recuperação imediata de domínio verificado. Um caso não é encerrado por um único acerto. Quando necessário, exige contraprova independente e nova recuperação após intervalo.

Após quatro falhas de contraprova, o caso recebe bloqueio persistente de revisão humana/editorial. Acertos posteriores não removem esse bloqueio. A liberação exige ação administrativa explícita, revisor identificado e justificativa substantiva.

Eventos são idempotentes: uma mesma resposta não pode ser contabilizada duas vezes. Estado cognitivo é isolado por usuário.

## Isolamento

- 10.000 estados de usuários simulados.
- 7 sinais cognitivos diferentes.
- 0 vazamentos de estado entre contas.

## Sincronização em nuvem

Modelo determinístico com 10.000 usuários:

- 50.000 eventos locais de salvamento.
- 10.000 pushes lógicos após debounce/coalescência.
- razão de coalescência: 5:1.
- primeiro agendamento: 10,517 s.
- último agendamento: 130,479 s.
- pico: 20 pushes agendados por 100 ms.
- pico: 115 pushes agendados por segundo.
- outbox persistente: aprovada.
- mudança durante upload preservada: aprovada.
- `Retry-After` em 429: aprovado.
- pausa em 401/403: aprovada.
- timeout de requisição: 15 s.
- 0 assertions falhas.

A sincronização usa estado `dirty/synced`, retry, backoff, jitter e fila persistente. Uma falha final de rede não apaga a pendência.

## Conteúdo local-first

O fluxo normal de treino usa primeiro os pacotes locais auditados. O aluno não precisa consultar o Supabase para carregar cada próxima pergunta quando o pacote local existe.

No bootstrap, o aluno carrega prioritariamente sua série atual e histórico recente; outras séries entram sob demanda. Isso reduz tráfego e decompression simultânea em grandes entradas de usuários.

## Stress de entrega estática

Ambiente de QA:

- 5 CPUs disponíveis.
- 6.236.880.896 bytes de memória total.
- soft limit de descritores (`ulimit -n`): 16.384.
- resposta mantida por 180 ms para forçar sobreposição real de conexões.

Rampa limpa:

| Concorrência | Resultado |
| ---: | --- |
| 10.000 | 10.000 OK / 0 falhas |
| 16.000 | 16.000 OK / 0 falhas |
| 16.300 | 16.300 OK / 0 falhas |
| 16.350 | 16.350 OK / 0 falhas |
| 16.370 | 16.362 OK / 8 falhas (`EMFILE`) |

O nível de **16.350** foi repetido mais duas vezes em processos limpos e passou novamente com **0 falhas**. Portanto, 16.350 é o máximo estável comprovado neste laboratório; 16.370 é o primeiro nível falho observado.

A primeira versão do harness podia medir um teto artificialmente menor por reutilizar processos enquanto sockets da rodada anterior ainda estavam fechando. O harness foi corrigido para usar processos limpos e essa classe de falha virou a regra R29.

**Este número não é uma garantia de capacidade do Vercel ou do Supabase.** Ele mede apenas o código estático neste ambiente de QA.

## Limites de produção que continuam externos ao código

A capacidade real do site publicado depende do plano e configuração dos provedores. A documentação atual do Supabase informa limites próprios de autenticação por IP e limites de conexões/clientes conforme o tamanho de compute. Isso significa que milhares de alunos atrás do mesmo IP de escola podem atingir Auth antes de a camada estática da AEDS saturar.

A 9.0.9 reduz esse risco arquiteturalmente com shell/CDN, pacotes local-first, restauração de sessão, salvamentos agrupados e jitter, mas um número real de “usuários simultâneos em produção” exige teste de carga controlado em staging com o plano real de Vercel/Supabase.

## Regras permanentes

O Rastro possui **29 regras de rigor** nesta versão. O mapa completo está em `RASTRO-RULES-9.0.9.md`.

A regra R23 exige rastreabilidade de toda falha reproduzível. A R29 exige que máximos de carga sejam confirmados em processos limpos e repetidos.

## Bateria final

`quality-check.js` executou com:

- runtime lógico: OK;
- regressão de questões: OK;
- Redação 9.0.5: OK;
- Computação 9.0.6: OK;
- Rastro 2.1 / 9.0.9: OK;
- **0 erros críticos**;
- **0 avisos**.

## Migração

A 9.0.9 não exige SQL novo no Supabase. O novo estado de Rastro e sincronização continua usando o mecanismo de `user_state` já existente.
