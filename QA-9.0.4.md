# QA AEDS 9.0.4

## Escopo

Auditoria executada sobre a AEDS 9.0.3 e reaplicada depois das correções da 9.0.4.

## Falhas reais encontradas e correções

### 1. Aprendizado/Busca interpretavam o manifesto com o formato antigo

**Sintoma:** em alguns caminhos, `total` e `areas` podiam aparecer como se fossem assuntos reais.

**Causa:** o manifesto passou a armazenar `grades[serie] = { total, areas }`, mas parte da interface ainda fazia `Object.keys(grades[serie])`.

**Correção:** adaptador único `manifestAreas()` e busca global usando `gradeMeta.areas`.

**Regra permanente:** `manifestAreaContract`.

### 2. Dois controles do Admin usavam o mesmo ID DOM

**Sintoma:** um dos botões de exportação TRI podia ficar sem ação, porque `querySelector` encontra apenas o primeiro ID.

**Correção:** o segundo controle recebeu `exportTriCalibrationQuality` e handler próprio.

**Regra permanente:** `noDuplicateDomIds` em todas as telas renderizadas.

### 3. Repetições estruturais ainda estavam ativas

A auditoria encontrou e colocou em quarentena, sem apagar IDs/histórico:

- 1.198 itens repetidos pelo mesmo `patternFamily` dentro do mesmo pacote;
- 171 itens com enunciado ativo exatamente igual;
- 1 item matemático adicional com a mesma estrutura algébrica após normalização dos números.

**Regras permanentes:** `oneActivePatternPerPack`, `noDuplicateActivePrompt` e `noExactMathShapeDuplicate`.

### 4. Explicações muito curtas

158 questões tinham gabarito válido, mas explicações curtas demais para a filosofia da AEDS, como apenas uma operação e o resultado.

**Correção:** explicação passou a indicar relação/fórmula, substituição e motivo do procedimento.

**Regra permanente:** `minPedagogicalExplanation`.

### 5. Similaridade matemática dava falsos positivos

O comparador antigo removia números e ignorava quase todos os operadores. Como consequência, problemas matematicamente diferentes podiam parecer idênticos para o filtro.

**Correção:** a assinatura estrutural passou a preservar `+`, `-`, `*`, `/`, `=`, `<`, `>`, `≤`, `≥`, módulo, parênteses, expoentes e variáveis antes do cálculo de similaridade.

**Regra permanente:** `mathAwareSimilarity`.

## Testes finais

- 36.669 questões armazenadas verificadas quanto à integridade de IDs e pacotes.
- 5.026 questões ativas validadas e renderizadas.
- 4.988 questões objetivas verificadas quanto a alternativas, gabarito, texto correto e explicação mínima.
- 38 discursivas renderizadas.
- 135/135 pacotes matéria × série conseguem montar sessão rígida de 7 questões.
- 135/135 pacotes tiveram um item respondido pelo fluxo real de treino em Chromium.
- 72 aulas de programação exercitadas.
- 16 telas principais + Admin navegadas.
- Dia 1 e Dia 2 do simulado exercitados com 90 itens.
- Desktop 1366 px e mobile 390 px verificados contra overflow horizontal nas telas principais.
- 412 verificações interativas em navegador: **0 falhas**.
- `quality-check.js`: **0 erros críticos, 0 avisos**.

## Limite honesto do teste

A auditoria automatizada consegue verificar estrutura, contexto ausente conhecido, renderização, repetição, gabarito estrutural, alternativas, explicações e fluxos de interface. Ela não substitui uma revisão humana especialista que resolva manualmente cada uma das 5.026 questões e confirme cada fato de todas as disciplinas. Por isso, feedback real de alunos e revisão editorial continuam fazendo parte do sistema de qualidade.
