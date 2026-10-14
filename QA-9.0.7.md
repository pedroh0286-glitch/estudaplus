# QA — AEDS 9.0.7 · Rastro

## Objetivo

Validar a introdução de uma tecnologia transversal de reconstrução cognitiva sem criar nova página, afrouxar o antirrepetição ou alterar o banco escolar confiável.

## Tecnologia implementada

**AEDS Rastro 1.0** observa tentativa, acerto/erro, CDF, CID opcional, dificuldade, histórico da micro-habilidade, intervalo desde o último acerto e sucesso anterior em padrões diferentes.

Hipóteses testadas:

- representação;
- conceito;
- procedimento;
- retenção;
- transferência;
- atenção;
- incerteza;
- estados positivos de estabilidade/transferência confirmada.

Cada fragilidade possui uma rota diferente. Todas as rotas corretivas carregam `changeOneThing=true`.

## Cenários sintéticos

`quality-rastro-907.js` verifica:

1. acerto com dúvida → incerteza;
2. erro + CID interpretação → representação;
3. erro + CID distração → atenção;
4. erro depois de intervalo → retenção;
5. acertos fáceis prévios + erro difícil → transferência;
6. erro confiante → conceito;
7. acerto confiante em estrutura diferente → transferência confirmada;
8. evidências positivas posteriores enfraquecem hipótese antiga;
9. contraprovas de transferência são contabilizadas;
10. nenhuma rota Rastro cria nova página.

## Integração

- `index.html` carrega `rastro.js` antes de `app.js`.
- `sw.js` e `content-loader.js` usam cache 9.0.7.
- `state.rastro` e `state.rastroPending` existem em modo local e nuvem.
- `cloudPush` persiste ambos no `user_state` existente.
- Admin refresh recupera o rastro de outros perfis quando disponível.
- Treino manual pode consumir uma rota pendente.
- Sessão inteligente adia a contraprova até o clique em próxima questão.
- CID reconstrói o rastro da micro-habilidade antes da contraprova.
- Aprender injeta orientação contextual quando existe evidência suficiente.
- Simulados só alimentam Rastro depois de terminados.

## Regressão do produto

Bateria executada:

```text
node logic-test.js
node quality-check.js
node quality-coverage-902.js
node quality-regression-904.js
node quality-redacao-905.js
node quality-computacao-906.js
node quality-rastro-907.js
```

Resultado final:

- 36.669 questões armazenadas;
- 5.026 ativas;
- 4.988 objetivas ativas;
- 135 pacotes;
- 135/135 pacotes ainda montam sessão rígida;
- Redação 9.0.5 preservada;
- Computação 9.0.6 preservada;
- Rastro 9.0.7 aprovado;
- 0 erros críticos;
- 0 avisos.

## Navegador

A tentativa de abrir `localhost` e `file://` em Chromium neste ambiente foi bloqueada pela política da organização do navegador (`chrome-error://chromewebdata/`). Por isso, esta rodada não reivindica um novo teste visual completo em Chromium. A regressão lógica renderiza todas as 5.026 questões, telas principais e simulados em ambiente JS, e o QA de navegador completo da 9.0.4 permanece no projeto como referência histórica.

## Regra nova permanente

> Um erro não autoriza a AEDS a repetir conteúdo indiscriminadamente. Primeiro formule uma hipótese sobre o ponto de ruptura; depois mude uma variável por vez e use o resultado seguinte para confirmar ou derrubar a hipótese.
