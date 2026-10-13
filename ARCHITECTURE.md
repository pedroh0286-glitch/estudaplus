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
