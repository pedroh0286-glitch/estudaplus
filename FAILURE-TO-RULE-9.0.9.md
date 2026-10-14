# Falha → correção → regra → teste — AEDS 9.0.9

Este arquivo é parte do critério de release. Uma falha reproduzível de sistema não pode terminar apenas como observação: ela precisa apontar para correção e teste permanente. Erros individuais de alunos viram evidência pedagógica; **classes de falha do sistema** viram regras de engenharia.

| Falha reproduzida | Correção implementada | Regra permanente | Teste que impede regressão |
|---|---|---|---|
| 114 micro-habilidades sem contraprova independente | 114 novas famílias autorais publicadas; dívida caiu a zero | R9 | `rastro-stress-909.js` exige `coverageSkills=0` e `coverageQuestions=0` |
| 7 das primeiras contraprovas ainda eram semelhantes demais | sete itens foram reescritos com outra representação/estrutura | R3, R25 | similaridade + família + padrão em `rastro-stress-909.js` e estrutura em `quality-regression-904.js` |
| três contraprovas de Estatística tinham o mesmo enunciado entre séries | itens de 11º e 12º foram reescritos com tarefas estatísticas diferentes | R25 | duplicata global em `quality-regression-904.js` |
| três explicações novas eram curtas demais | explicações ampliadas com fórmula/raciocínio e contraste de erro | R25 | mínimo pedagógico em `quality-regression-904.js` |
| uma fatoração era somente o mesmo molde com outro número | virou problema de área que exige fatoração do trinômio em nova estrutura | R3, R25 | `structural()` por pacote em `quality-regression-904.js` |
| após quatro falhas, acertos posteriores podiam apagar a exigência de revisão humana | `manualReviewRequired` tornou-se persistente; só revisão explícita libera | R6, R7 | cenário adversarial em `quality-rastro-909.js` e 5.140 cenários de escalada em `rastro-stress-909.js` |
| revisão humana podia ser liberada sem justificativa substantiva | liberação exige revisor identificado e nota de pelo menos 10 caracteres | R7 | `quality-rastro-909.js` rejeita nota curta |
| o mesmo evento podia ser reaplicado por integrações diferentes | fingerprint/idempotência em `seenEvents` | R4 | `quality-rastro-909.js` reaplica o mesmo `eventId` e exige contagem invariável |
| repetição da mesma lacuna podia inflar `coverageGaps` | `setCoverage` só incrementa quando a lacuna muda/é nova | R9 | `quality-rastro-909.js` chama a mesma lacuna duas vezes |
| retry do Supabase terminava após três tentativas e podia ficar sem tentativa futura | criado `sync-engine.js` com outbox persistente, `nextRetryAt` e estado pendente | R16, R17 | `sync-stress-909.js` valida rede/503/429/401 |
| um estado podia mudar durante upload e o snapshot antigo marcar tudo como sincronizado | dirty/synced versions: sucesso só confirma a versão enviada | R18 | `sync-stress-909.js` altera estado durante upload e exige `pending=true` |
| 429 podia ser tratado como erro comum | `Retry-After` é lido e respeitado | R17 | teste de 429 em `sync-stress-909.js` |
| 401/403 poderia gerar loop de retry | sincronização pausa até autenticação válida | R17 | teste de auth pause em `sync-stress-909.js` |
| timeout de rede não existia no wrapper REST | `AbortController` com 15 s e erro estruturado | R16, R17 | presença/contrato checados no QA e Sync Engine |
| jitter de sync criou uma rajada de 4.166 contas exatamente em 60 s por aplicar min-gap antes do primeiro upload | min-gap agora só vale quando `lastAttemptAt>0`; primeiro push usa debounce+jitter | R24 | 10.000 usuários em `sync-stress-909.js`; pico caiu para 20/100 ms |
| login inicial do aluno podia carregar todas as séries liberadas | bootstrap carrega série atual + histórico; outras séries entram sob demanda | R19 | `quality-rastro-909.js` inspeciona loader; `nextTrainingQuestion` garante o pack selecionado |
| shell usava network-first para todo asset e fazia nova ida à rede em visitas repetidas | shell cache-first; navegação continua network-first com fallback | R20 | contrato do SW em `quality-rastro-909.js` |
| teste de carga parava arbitrariamente em 10.000 | rampa 10k→... até primeira saturação do ambiente | R21 | `load-static-max-909.js` |
| uma rodada sequencial reportou `EMFILE` cedo demais porque sockets da rodada anterior ainda estavam fechando | cada nível e cada confirmação agora roda com processos limpos; máximo só vale após repetição | R29 | `load-static-max-909.js` + duas confirmações independentes do maior nível verde |
| a rampa limpa saturou em 16.370 com `EMFILE` após 16.350 passar 3/3 vezes | classificado como teto de descritores do laboratório, não bug do site | R22, R28 | JSON registra `fdSoftLimit=16384`, máximo estável 16.350 e primeira falha 16.370 |
| código novo assumiu `window.addEventListener` no VM de regressão e derrubou `logic-test` | feature detection antes de registrar listener online | R26 | `logic-test.js` voltou a passar dentro de `quality-check.js` |
| regressão histórica 9.0.4 rejeitava qualquer manifest novo só pelo número | teste histórico valida que a versão não é anterior a 9.0.4; QA atual exige exatamente 9.0.9 | R27 | `quality-regression-904.js` + `quality-check.js` |

## Resultado de release

A 9.0.9 só pode ser empacotada quando `quality-check.js` termina em **0 erros críticos e 0 avisos**, a dívida independente é **zero**, a população sintética está verde e a rampa de carga possui pelo menos 10.000 simultâneos sem falha.
