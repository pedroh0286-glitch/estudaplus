# QA — AEDS 9.0.12

## Resultado

`node quality-check.js` terminou com:

**0 erros críticos e 0 avisos estruturais.**

Validações executadas:

- 36.783 questões armazenadas e 5.140 ativas carregáveis;
- 135 pacotes modulares;
- 140 aulas;
- regressão sem duplicatas ativas de enunciado/padrão;
- Redação e Computação preservadas;
- Quality 2.0: 0 bloqueios objetivos e 0 placeholders ativos;
- Rastro 4: autorrelato não vence evidência observada;
- contrato de renderização da nova Home, Mapa do Saber e feedback do Rastro 4;
- motor de métodos de estudo preservado;
- 27 conquistas preservadas;
- stress test do núcleo Rastro 3.0 preservado em 10.000 usuários simulados e 1.411 protocolos de domínio.

## Observação sobre teste visual

O ambiente usado para esta revisão bloqueia navegação do Chromium para `localhost` e `file://` por política administrativa. Por isso não foi possível executar aqui um teste E2E real clicando no DOM com Chromium. Para compensar, a versão inclui `quality-ui-runtime-9012.js`, que carrega a nova camada de experiência em um ambiente de contrato e verifica a renderização lógica da Home, do Mapa do Saber e do feedback do Rastro 4.

Antes de publicar em produção, ainda é recomendado abrir a versão em Chrome/Edge e fazer um smoke test humano de 5 minutos: login de aluno, “Começar”, Progresso → Mapa do Saber, login Admin e painel Quality 2.0.
