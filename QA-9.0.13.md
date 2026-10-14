# QA — AEDS 9.0.13

## Resultado

**0 erros críticos · 0 avisos** no conjunto principal de regressão.

Cobertura executada:

- integridade de 36.783 questões / 5.140 ativas;
- 135/135 pacotes com manifesto explícito;
- 36.783 classificações únicas e coerentes com matéria+série;
- `01.01.01` validado como primeira questão de Matemática do 5º ano;
- índice administrativo com 36.783 registros e 243 sinais do Quality 2.0;
- Rastro 4.1 e comportamento das novas evidências;
- memória por habilidade;
- escolha Normal/Adaptativa e guarda de pré-requisitos;
- Árvore do Saber;
- denúncia/moderação/quarentena;
- SQL/RLS da 9.0.13;
- Tutor server-side (Vercel + Supabase) sem chave embutida;
- sintaxe dos módulos JS;
- regressões de Redação, Computação, métodos e conquistas;
- stress do Rastro com 10.000 usuários e 1.411 protocolos de domínio.

## Smoke test em navegador

Chromium headless validou:

- login local de aluno;
- escolha de Aula adaptativa no onboarding;
- Árvore do Saber e Memória;
- questão real de Matemática/5º;
- classificação visível;
- denúncia chegando à fila;
- Tutor local;
- login Admin;
- abas Questões, Rastro & Memória e Usuários & Dados;
- Admin permanecendo lazy-load (<135 pacotes antes do Conteúdo avançado);
- busca exata por classificação;
- questão nova recebendo código após a faixa reservada do banco-base;
- quarentena removendo a questão de `candidateBank()` sem apagar o arquivo-fonte.
