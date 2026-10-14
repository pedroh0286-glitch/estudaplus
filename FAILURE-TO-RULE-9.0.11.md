# Falha → correção → regra → teste — AEDS 9.0.11

Toda falha reproduzível encontrada nesta rodada foi transformada em correção e proteção permanente.

## F01
- **Erro:** Sequência final exigia 3 estruturas mesmo quando a habilidade só possuía 2.
- **Correção:** A sequência final passou a exigir todas as estruturas disponíveis até o teto de 3.
- **Nova regra:** R33, R38.
- **Teste permanente:** `rastro-adversarial-9011.js`.

## F02
- **Erro:** Reparo de erro confiante exigia 2 estruturas alternativas quando só existia 1.
- **Correção:** O reparo exige todas as estruturas alternativas disponíveis até o teto de 2.
- **Nova regra:** R39.
- **Teste permanente:** `rastro-stress-9011.js`.

## F03
- **Erro:** Exigir 8 IDs de questões diferentes tornaria milhares de habilidades impossíveis.
- **Correção:** O gate exige 8 recuperações confiantes válidas; repetição só volta a contar após 24h, com diversidade estrutural separada.
- **Nova regra:** R30, R31, R32, R33.
- **Teste permanente:** `rastro-adversarial-9011.js`.

## F04
- **Erro:** Duas habilidades de Matemática tinham uma única família editorial, apesar de 17 padrões distintos.
- **Correção:** Quando só existe uma família e há >=3 padrões, independência pode ser demonstrada por padrão diferente + similaridade <70%.
- **Nova regra:** R48.
- **Teste permanente:** `quality-rastro-9011.js + app.js`.

## F05
- **Erro:** Construtor inicial do stress escolhia estruturas sem garantir cobertura de família/dificuldade.
- **Correção:** O testador passou a selecionar evidências por cobertura gulosa de questão, família, padrão, estrutura e dificuldade.
- **Nova regra:** R51.
- **Teste permanente:** `rastro-stress-9011.js`.

## F06
- **Erro:** Catálogo de métodos referenciava Autoexplicação e Repetição espaçada sem regras próprias.
- **Correção:** As duas técnicas ganharam regras explícitas M60 e M61; QA rejeita referências sem definição.
- **Nova regra:** R52, M60, M61.
- **Teste permanente:** `quality-methods-9011.js`.

## F07
- **Erro:** A afirmação de que ensinar garante 90% de retenção não é evidência segura para o motor.
- **Correção:** Tutoria/ensino entre pares entrou sem porcentagem garantida; desempenho real decide se funciona para o aluno.
- **Nova regra:** M14, R46.
- **Teste permanente:** `learning-methods.js`.

## F08
- **Erro:** A conquista “meu método” comparava apenas tentativa primeiro vs explicação primeiro.
- **Correção:** A conquista agora pode usar o perfil do catálogo adaptativo de 61 métodos, com amostra mínima.
- **Nova regra:** R46.
- **Teste permanente:** `quality-achievements-9011.js`.

## F09
- **Erro:** Métodos de estudo poderiam ser confundidos com prova de domínio.
- **Correção:** Todos os 61 métodos têm masteryCredit=false e o QA falha se algum conceder crédito direto.
- **Nova regra:** R45 + M01–M61.
- **Teste permanente:** `quality-methods-9011.js`.

## F10
- **Erro:** Verificação poderia ficar válida indefinidamente.
- **Correção:** O selo máximo expira após 30 dias sem nova recuperação.
- **Nova regra:** R41.
- **Teste permanente:** `rastro-adversarial-9011.js`.

## F11
- **Erro:** Repetição imediata poderia inflar volume se o contador fosse só número de acertos.
- **Correção:** Mesmo item só volta a contar depois de >=24h; repetição imediata vira farmAttempts.
- **Nova regra:** R30, R31.
- **Teste permanente:** `rastro-adversarial-9011.js`.

## F12
- **Erro:** Timestamp regressivo poderia tentar simular espaçamento.
- **Correção:** Evento fora da ordem não fortalece evidência e cria timeAnomaly.
- **Nova regra:** R42.
- **Teste permanente:** `rastro-adversarial-9011.js`.
