# AEDS 9.0 — qualidade, autonomia, acessibilidade e dados

AEDS — A Evolução do Saber.

A 9.0 é uma mudança estrutural sobre a 8.29. O objetivo é parar de crescer apenas em quantidade e transformar o que já existe em um sistema mais confiável: conteúdo que explica mecanismos, treino adaptativo, revisão por causas, acessibilidade, simulados melhores, qualidade editorial, análise de itens e arquitetura modular.

## Princípio central

A AEDS deve ajudar o aluno a ficar menos dependente dela. O fluxo pedagógico é:

**entender → tentar → diagnosticar → variar → recuperar depois → transferir → provar independência fora da AEDS**.

Não há XP, streak obrigatório ou recompensa criada apenas para aumentar tempo de tela. O indicador principal continua sendo: **“consigo fazer isso sem ajuda?”**

## 1. Conteúdo mais profundo

As 140 aulas aprofundadas continuam organizadas por série e assunto. Física, Química e Biologia receberam uma camada adicional com:

- modelo mental do fenômeno;
- mecanismo por trás da regra ou fórmula;
- caminhos alternativos de solução;
- erros que revelam modelos mentais incorretos;
- aplicação fora da AEDS.

As outras disciplinas receberam formas próprias de raciocínio. História trabalha fonte, contexto, agentes e causalidade; Geografia trabalha escala, território, fluxos e sociedade-natureza; Filosofia trabalha problema, premissas, conclusão e objeção; Linguagens trabalham gênero, contexto, intenção e efeito; Matemática trabalha relações e representações.

## 2. Novas famílias genuínas

Foram adicionadas **69 novas famílias autorais** em Física, Química e Biologia. Elas não são cópias numéricas: testam mecanismos, previsão, interpretação, transferência e erros conceituais diferentes.

Cada uma traz diagnóstico por distrator. Quando o aluno escolhe uma alternativa errada, a AEDS tenta explicar **qual raciocínio aquela escolha pode indicar**, deixando claro que isso é uma hipótese pedagógica, não um diagnóstico da pessoa.

## 3. Treino que aprende com o comportamento

O `analytics.js` compara duas estratégias:

- `explain_first`: uma microexplicação antes da primeira tentativa;
- `attempt_first`: tentar antes de receber a explicação.

Com histórico suficiente, a AEDS começa a preferir a estratégia que funcionou melhor para aquele aluno. Enquanto os dados ainda são pequenos, mantém exploração controlada para não concluir cedo demais.

O “🎯 Estudar agora” continua montando uma sessão curta, preservando:

- questão inédita;
- família inédita;
- padrão estrutural inédito;
- limite de similaridade;
- variação da resposta correta;
- revisão espaçada;
- ponto fraco;
- conteúdo novo;
- aplicação;
- desafio.

## 4. Acessibilidade

Configurações novas:

- 🧸 modo muito simples;
- ◐ alto contraste;
- ⏸ redução de movimento;
- 📖 assistência de leitura;
- 👆 alvos de toque grandes;
- navegação completa por teclado;
- foco visual reforçado;
- link “Pular para o conteúdo”;
- região `aria-live` e marcações de navegação;
- leitura por voz já existente.

O modo muito simples reduz elementos secundários e aumenta as ações essenciais. Ele foi pensado para crianças pequenas e pessoas com maior dificuldade de leitura sem remover as funções avançadas da conta.

## 5. Teste com alunos reais

A AEDS não finge que um teste automático substitui uma criança usando o site.

Em Configurações existe o **Teste sem instruções**. O aluno usa o site normalmente enquanto a AEDS registra caminho, página, tempo e eventos de confusão. O texto das respostas não é gravado por essa telemetria.

O Admin recebe as sessões e pode exportá-las em JSON. O objetivo é descobrir onde alunos reais param, voltam, se confundem ou ignoram uma função.

**Importante:** a infraestrutura está pronta, mas resultados reais só existirão depois que alunos reais fizerem esses testes.

## 6. TRI-AEDS baseada em dados reais quando houver amostra

A TRI-AEDS continua identificada como **estimativa pedagógica 3PL**, nunca como nota oficial do Inep.

A 9.0 passa a preparar a calibração empírica. O Centro de Qualidade calcula, conforme as respostas chegam:

- número de respostas por item;
- taxa de acerto;
- distribuição das alternativas;
- diferença aproximada entre grupos de maior e menor desempenho;
- distratores nunca escolhidos;
- quantidade de marcações “questão confusa”.

Itens com amostra suficiente são marcados como **pré-calibráveis** e as respostas podem ser exportadas para análise estatística posterior. A AEDS não inventa parâmetros populacionais quando ainda não existem dados suficientes.

## 7. Detecção automática de questões ruins

O Centro de Qualidade pode sinalizar, conforme a amostra cresce:

- item excessivamente fácil/difícil;
- discriminação suspeita;
- distrator fraco;
- questão frequentemente marcada como confusa;
- cobertura insuficiente de uma micro-habilidade.

Esses sinais não removem automaticamente a questão: apontam o que o administrador deve investigar.

## 8. Editor de conteúdo no Admin

O Admin ganhou editor para:

- questão;
- aula;
- matéria/série/área/habilidade;
- família semântica;
- alternativas e gabarito;
- explicação;
- explicação dos distratores;
- fonte;
- imagem com descrição acessível;
- edição posterior.

Fluxo editorial:

**rascunho → revisão → aprovado → publicado**.

Toda mudança registra histórico. O pacote editorial pode ser exportado para versionamento no GitHub.

### Publicação compartilhada pelo Supabase

A 9.0 inclui `supabase-aeds-9.sql`. Depois de executar esse arquivo **uma única vez** no SQL Editor do projeto Supabase, o editor usa a tabela `content_items` com RLS:

- alunos autenticados leem apenas conteúdo `published`;
- Admin lê todos os estados editoriais;
- somente Admin pode criar/alterar/excluir conteúdo compartilhado.

Se a migração ainda não tiver sido executada, o editor continua funcionando em modo local/nuvem pessoal e permite exportar o pacote para o GitHub. A ausência da tabela não derruba o site.

## 9. Arquitetura modular

O antigo banco monolítico deixou de ser carregado no `index.html`.

Agora existe:

- `content-core.js`: currículo, artigos, manifestos e metadados;
- `data/questions/*.js`: **135 pacotes** por matéria + série;
- `content-loader.js`: carregamento seletivo;
- `engine.js`: domínio, retenção e TRI;
- `analytics.js`: qualidade, estratégia de aprendizagem e revisão;
- `app.js`: interface/orquestração.

`bank-data.js` ficou apenas como marcador de migração e não é carregado pelo site.

O login inicial não precisa carregar as 34 mil questões. Depois da autenticação, a AEDS carrega os pacotes compatíveis com as permissões do usuário; o Admin pode carregar tudo para auditoria.

## 10. Desempenho e celular simples

O shell inicial (interface + core pedagógico, sem os pacotes de questões) fica muito menor que o antigo banco único. Os pacotes são carregados por matéria/série e descomprimidos no navegador.

Isso reduz memória e transferência desnecessárias para contas com poucas séries/matérias liberadas.

## 11. Offline seletivo

Em Configurações o aluno pode baixar apenas pacotes necessários, por exemplo:

**Matemática · 8º ano**

O Service Worker 9.0 mantém cache separado para shell e pacotes de conteúdo. Assim não é necessário baixar todas as dezenas de milhares de questões para estudar offline.

## 12. Simulado mais próximo de uma prova real

Mantidos:

- Dia 1: Linguagens + Humanas;
- Dia 2: Natureza + Matemática;
- até 90 questões por dia;
- TRI-AEDS estimada;
- todas as erradas/em branco ao final.

Adicionados:

- cartão visual das questões;
- indicador respondida/atual/marcada;
- “☆ voltar depois”;
- salto direto para qualquer questão;
- ritmo aproximado de minutos por questão restante.

## 13. Revisão pós-prova por causas

A AEDS não transforma 37 erros em 37 repetições isoladas.

Os erros são agrupados por habilidade. Antes de tentar outra questão, o aluno recebe uma síntese do mecanismo central. Depois a AEDS procura **uma questão nova** da mesma habilidade, mantendo as regras antirrepetição.

A tela de resultado continua mostrando **todas as questões erradas** individualmente.

## 14. Explicar o erro

Questões que possuem distratores diagnosticados mostram:

**🧠 O que esta escolha sugere**

A explicação compara o raciocínio da alternativa marcada com o princípio correto. Em branco também gera uma reflexão: não reconheceu o assunto, não soube começar, faltou tempo ou ficou entre alternativas?

## 15. Independência fora da AEDS

O estágio 🏆 Independente continua exigindo retenção e evidência externa.

As aulas orientam o aluno a:

- explicar sem consultar;
- resolver uma atividade da escola/livro/outra fonte;
- ensinar o raciocínio em voz alta;
- voltar apenas para a lacuna específica.

## 16. Tela inicial personalizada

A Home ganhou **“Hoje eu recomendo”**. A recomendação considera revisões vencidas, erros recentes e estado do aluno, reduzindo a necessidade de escolher entre dezenas de caminhos.

O restante do site continua disponível para exploração.

## 17. Admin orientado a decisões

O Centro de Qualidade responde perguntas como:

- quais habilidades têm poucas famílias diferentes?;
- quais questões parecem problemáticas?;
- quais itens já têm respostas suficientes para análise?;
- quais alunos parecem aprender melhor vendo explicação antes ou tentando primeiro?;
- onde testes reais registraram confusão?;
- quais conteúdos estão na fila editorial?

## 18. Controle de qualidade automatizado

Rode antes de publicar:

```bash
node quality-check.js
```

Ele valida:

- estrutura modular;
- todos os 135 pacotes;
- IDs duplicados;
- gabaritos;
- explicações;
- referências e URLs;
- aprofundamento das 140 aulas;
- diagnóstico dos novos distratores;
- sintaxe dos JS;
- Service Worker;
- carregamento de scripts;
- sessão inteligente;
- antirrepetição;
- composição dos dois simulados;
- analytics;
- revisão agrupada;
- diagnóstico de erros;
- geração das 15 telas do aluno e Admin.

O teste atual termina com **0 erros críticos e 0 avisos**.

## Números desta versão

- **34.323** questões armazenadas;
- **29.766** questões ativas;
- **29.509** objetivas ativas;
- **257** discursivas ativas;
- **4.557** questões antigas de Português preservadas em quarentena;
- **140** aulas aprofundadas;
- **69** novas famílias genuínas de Física/Química/Biologia;
- **135** pacotes modulares de questões.

## Compatibilidade

A chave local `estudaplus_final_v8_2` foi preservada propositalmente para continuar lendo progresso anterior.

A sincronização dos novos campos usa o `user_state` já existente. A única estrutura nova opcional é `content_items`, criada pelo arquivo `supabase-aeds-9.sql` para publicação editorial compartilhada. Nenhuma senha, chave privada ou Service Role foi adicionada ao projeto.

## Antes de publicar

1. Extraia todos os arquivos e pastas do ZIP.
2. Substitua o projeto no GitHub preservando `data/questions/`.
3. Para ativar publicação editorial para todas as contas, execute `supabase-aeds-9.sql` uma vez no SQL Editor do Supabase.
4. Rode `node quality-check.js` se tiver Node disponível.
5. Faça o deploy normal pelo Vercel.
6. Teste uma conta de aluno e uma de Admin.
7. Em um celular real, faça pelo menos uma sessão do modo “Teste sem instruções”.

## O que nenhum código pode concluir sozinho

A 9.0 prepara toda a infraestrutura para os itens que dependem do mundo real, mas não fabrica evidência inexistente:

- testes de usabilidade precisam de crianças/adolescentes reais;
- parâmetros TRI realmente calibrados precisam de muitas respostas reais por item;
- detecção estatística de questões ruins fica mais confiável conforme a amostra cresce.

A AEDS já coleta e organiza esses dados para que essas partes melhorem com uso real, em vez de fingir precisão antes da hora.
