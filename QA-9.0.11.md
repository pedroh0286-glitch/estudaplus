# QA — AEDS 9.0.11 / Rastro 3.0

## Objetivo

A 9.0.11 endurece o AEDS Rastro como um protocolo de evidência, sem transformar rigor em exigências impossíveis. Esta rodada também converte os métodos de aprendizagem enviados pelo autor em regras operacionais auditáveis e tenta quebrar o motor de propósito por repetição, chute, timestamps manipulados, retenção falsa, erro com alta confiança, pouca diversidade e tentativa de “farmar” domínio.

Não há alegação de que seja, comparativamente, “o motor de aprendizagem mais rigoroso do mundo”. O que a versão comprova é que o protocolo foi projetado para um nível extremo de rigor e passou pelos testes descritos neste relatório.

## Conteúdo preservado

- Questões armazenadas: **36.783**.
- Questões ativas: **5.140**.
- Objetivas ativas: **5.102**.
- Discursivas: **38**.
- Pacotes modulares: **135**.
- Pacotes que montam sessão rígida: **135/135**.
- Aulas aprofundadas: **140**.
- Redação: **100 temas, 12 módulos e 10 microtreinos**.
- Computação: **8 módulos, 2 estudos de caso, 1 laboratório, 7 projetos e 56 termos**.

Nenhum pacote de questões foi alterado nesta versão. O endurecimento está no motor, nos métodos, na instrumentação e nos testes.

## Protocolo máximo de domínio

O selo máximo exige simultaneamente:

1. **8 recuperações confiantes válidas**. A mesma questão só volta a contar depois de pelo menos 24 horas.
2. **Questões distintas**: todas as disponíveis até o teto de 4, com mínimo de 2 quando o banco oferece essa diversidade.
3. **Famílias**: todas as disponíveis até o teto de 2.
4. **Padrões**: todos os disponíveis até o teto de 3, com mínimo de 2.
5. **Estruturas família × padrão**: todas as disponíveis até o teto de 3, com mínimo de 2.
6. **Dificuldade**: todos os níveis disponíveis até o teto de 2.
7. **2 transferências independentes**.
8. **2 recuperações após intervalo de 2 dias ou mais**.
9. **1 recuperação após intervalo de 7 dias ou mais**.
10. **Sequência final limpa de 4 recuperações confiantes válidas**, cobrindo as estruturas disponíveis até o teto de 3.
11. Se houve **erro com alta confiança**, o selo é revogado e são exigidas **3 correções espaçadas**, cobrindo todas as estruturas alternativas disponíveis até o teto de 2, além de reconstruir a sequência final limpa.
12. Nenhum caso aberto, bloqueio editorial ou revisão humana pendente.
13. O selo máximo **expira depois de 30 dias** sem nova evidência e passa a exigir atualização de retenção.

Acerto com dúvida/chute, repetição imediata e timestamp regressivo não fortalecem o selo. Nenhuma dimensão compensa outra: volume de acertos não substitui retenção; retenção não substitui transferência; e variedade não substitui correção de um erro confiante.

## Rigor adaptado à cobertura real

O Rastro não reduz critérios silenciosamente. Antes de exigir diversidade, ele mede o que a própria micro-habilidade oferece. O gate exige **toda a diversidade disponível até o teto rigoroso**.

Isso evita dois erros opostos:

- declarar domínio com evidência fraca;
- criar um requisito matematicamente impossível por deficiência do próprio banco.

A cobertura usada na decisão fica explícita e auditável.

## Métodos de aprendizagem

- Regras explícitas: **61 (M01–M61)**.
- Cada método possui categoria, condição, instrução operacional e modo de execução.
- **0/61 métodos concede crédito direto de domínio**.
- O Rastro pode experimentar estratégias diferentes e comparar os resultados observados.
- Preferência pessoal só aparece depois de amostra mínima.
- Técnicas repetidas nas listas do autor foram consolidadas semanticamente, sem duplicar lógica.
- Técnicas externas, como Cornell, grupo de estudo ou projeto em equipe, são tratadas como orientação guiada; a AEDS não afirma ter verificado uma atividade externa que não observou.
- A afirmação de que “ensinar garante 90% de retenção” **não foi codificada como fato**. Ensino/tutoria entre pares é uma estratégia testável, e o desempenho real do aluno decide se ela ajuda.

Método de estudo e prova de aprendizagem são categorias diferentes. Pomodoro, mapa mental, flashcards, áudio, Cornell, gamificação ou qualquer outro método podem ajudar na intervenção, mas nunca liberam domínio por si mesmos.

## Stress pedagógico

- Usuários sintéticos: **10.000**.
- Questões objetivas por usuário: **5.102**.
- Respostas-base: **51.020.000**.
- Erros iniciais simulados: **4.644.447**.
- Acertos inseguros: **2.041.260**.
- Contratos questão × dificuldade cognitiva: **35.714**.
- Erros de contrato: **0**.
- Protocolos máximos possíveis: **1.411/1.411 micro-habilidades**.
- Erros de protocolo: **0**.
- Situações com caminho de recuperação no modelo: **51.020.000/51.020.000**.

Esses resultados validam a lógica do modelo sintético. Eles **não significam** que todo aluno humano necessariamente aprenderá ou acertará todas as questões.

## Teste adversarial

`rastro-adversarial-9011.js` tenta fabricar domínio por:

- 1.000 repetições do mesmo item;
- acertos com dúvida ou chute;
- alto volume sem transferência;
- retenção apenas de curto prazo;
- erro com alta confiança seguido de reparo insuficiente;
- evidência expirada;
- timestamps regressivos;
- evento duplicado;
- quatro falhas seguidas com tentativa de apagar revisão humana;
- cobertura pequena.

Resultado: **0 falhas adversariais**.

## Cobertura real do banco

- Micro-habilidades objetivas: **1.411**.
- Com pelo menos 2 questões: **100%**.
- Com pelo menos 2 padrões: **100%**.
- Com pelo menos 2 estruturas: **100%**.
- Com 3 ou mais famílias: **105**.
- Com 3 ou mais padrões: **141**.
- Com 2 ou mais níveis de dificuldade: **982**.

O teste `rastro-stress-9011.js` encontrou um caminho válido para o protocolo máximo em **1.411/1.411** micro-habilidades sem reduzir silenciosamente o gate.

## Carga estática local

- 10.000 simultâneos: **0 falhas**.
- 16.000 simultâneos: **0 falhas**.
- 16.350 simultâneos: **0 falhas**, confirmados em **3/3 processos limpos**.
- 16.370 simultâneos: **7 falhas**, com primeiro erro `EMFILE`.
- Limite do ambiente (`ulimit -n`): **16.384** descritores.

Esse resultado mede o teto deste laboratório HTTP local. **Não é uma promessa de capacidade do Vercel, Supabase ou do ambiente de produção.** A regra R29 impede que uma única passagem ou um processo contaminado por sockets residuais seja anunciado como teto estável.

## Regras permanentes

- Rastro: **52 regras R01–R52** em `RASTRO-RULES-9.0.11.md`.
- Métodos: **61 regras M01–M61** em `STUDY-METHOD-RULES-9.0.11.md`.
- Mapa de falhas: `FAILURE-TO-RULE-9.0.11.md`.
- Cobertura do protocolo: `RASTRO-COVERAGE-9.0.11.md`.

Toda falha reproduzível desta rodada foi transformada em **correção + regra + teste permanente**, de acordo com R23.

## Resultado final

`quality-check.js`: **0 erros críticos / 0 avisos**.

O objetivo da 9.0.11 não é tornar o selo difícil por dificuldade artificial. O objetivo é fazer com que “domínio” signifique uma coisa muito específica: **o aluno conseguiu recuperar, transferir, reter, corrigir erros e repetir o desempenho em evidências independentes ao longo do tempo**.
