# QA — AEDS 9.0.10

## Escopo

A 9.0.10 adiciona Conquistas por Evidência sem modificar o banco de perguntas. O sistema possui 27 conquistas iniciais e fica integrado à tela Progresso.

## Regras verificadas

- marco de 10.000 acertos não libera com 9.999;
- limiar libera exatamente em 10.000;
- IDs de conquistas são únicos;
- uma conquista não é liberada duas vezes;
- aprendizagem verificada depende do portão do Rastro;
- transferência, retenção e recuperação profunda usam sinais próprios;
- descoberta do método de estudo exige 30 evidências em cada estratégia e diferença ponderada mínima de 10 p.p.;
- empate robusto pode gerar Aprendizagem flexível após 40 evidências de cada estratégia;
- conquistas permanecem dentro de Progresso, sem nova página;
- estado de conquistas entra na sincronização individual por usuário;
- `achievements.js` está no `index.html` e no shell offline do Service Worker.

## Regressão completa

`quality-check.js` executa a regressão de conteúdo, Redação, Computação, Rastro 2.1 e Conquistas. O banco permanece com 36.783 questões armazenadas, 5.140 ativas, 5.102 objetivas, 140 aulas e 135 pacotes.

## Filosofia

AEDS não concede conquistas por abrir o aplicativo ou manter streak. Marcos de quantidade são apresentados como marcos; domínio e autonomia usam evidência pedagógica separada.
