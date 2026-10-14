# Changelog — AEDS 9.0.12

## Experiência

- Home reconstruída em torno de “o que fazer agora”.
- Recomendação explica por que aquele passo foi escolhido.
- Recursos secundários deixaram de competir com a ação principal.
- Mapa do Saber adicionado a Progresso.

## Conteúdo e qualidade

- 24 questões com placeholders corrigidas.
- Quality 2.0 adicionado em tempo de execução.
- Falhas objetivas passam a ser quarentenadas sem apagar dados.
- Questões suspeitas entram em fila de revisão humana.

## Rastro

- Camada Rastro 4 adicionada sobre o núcleo 3.0 já testado.
- CID passa a ser hipótese do aluno.
- Evidência de retenção, transferência, repetição de erro e erro confiante pode refutar o autorrelato.
- A interface deixa explícita a diferença entre “sua hipótese” e “hipótese automática”.

## Arquitetura

- `aeds-config.js`: configuração central da release.
- `quality-engine.js`: qualidade pedagógica.
- `rastro4.js`: nova classificação de hipótese.
- `experience-9012.js`: experiência e Mapa do Saber.
- Novas funcionalidades não foram adicionadas como mais uma sequência de sobrescritas dentro de `app.js`.
- Estado local passa a gravar em `aeds_state_v9`, lendo automaticamente o antigo `estudaplus_final_v8_2` para migração.
- Sessão de nuvem passa a usar `aeds_cloud_session_v1`, preservando leitura da chave antiga.

## PWA

- `manifest.webmanifest` adicionado.
- Ícones 192 e 512 adicionados.
- Service Worker atualizado para cache 9.0.12.

## Compatibilidade

O núcleo legado não foi reescrito em massa nesta release. Isso foi intencional: remover todas as camadas históricas de uma vez criaria risco maior de regressão nos dados, simulados, sync e Rastro. A 9.0.12 cria a fronteira modular para que essa consolidação possa ser feita gradualmente e testada por área.
