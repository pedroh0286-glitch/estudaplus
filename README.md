# AEDS 8.29 — Autonomia, retenção e qualidade

AEDS — A Evolução do Saber.

Esta versão continua diretamente a AEDS 8.28. O objetivo desta atualização não foi aumentar artificialmente o número de questões, e sim melhorar a qualidade do aprendizado, a autonomia do aluno, os simulados e a segurança de evolução do projeto.

## Filosofia pedagógica

A AEDS deve funcionar como ponte, não como dependência. O aluno deve compreender, praticar, transferir a ideia para uma situação nova, lembrar dela depois de algum tempo e conseguir continuar pela escola, livro, professor ou outra fonte.

Cada micro-habilidade passa a ter quatro estágios:

1. 🌱 Conhecendo
2. 🧠 Entendendo
3. 🔄 Aplicando
4. 🏆 Independente

O estágio Independente não é liberado apenas por uma sequência de acertos. Ele exige desempenho consistente, aplicação em questão não fácil, retenção depois de um intervalo e uma confirmação de que o aluno conseguiu usar/explicar o conteúdo fora da AEDS.

## Estudar agora

A tela inicial ganhou `🎯 Estudar agora · sessão curta`.

O motor monta uma sessão de aproximadamente 7 itens combinando, quando houver material disponível:

- revisão vencida por repetição espaçada;
- micro-habilidade fraca;
- conteúdo ainda não praticado;
- aplicação;
- desafio;
- habilidade ligada a erro anterior.

A sessão respeita as regras centrais da AEDS:

- não repetir questão já respondida;
- não repetir família semântica já usada;
- não repetir padrão estrutural já usado;
- evitar enunciados muito semelhantes;
- variar resposta correta;
- preferir ficar sem item adequado a enganar o aluno com repetição disfarçada.

Ao final da sessão, a AEDS recomenda que o aluno pare e teste o conhecimento fora da plataforma.

## Repetição espaçada

O motor pedagógico (`engine.js`) agora agenda revisões por micro-habilidade. O intervalo muda conforme acerto, dificuldade e CDF. Acertos confiantes podem ampliar o intervalo; erros e dúvidas antecipam nova revisão.

A retenção é registrada separadamente do acerto imediato.

## Aulas aprofundadas

Os 140 artigos aprofundados passam a trabalhar, de forma consistente:

- conceito;
- por que funciona / causa e mecanismo;
- método seguro;
- caminhos alternativos e atalhos válidos;
- quando o atalho não funciona;
- como reconhecer o tipo de problema;
- conexão com conhecimentos anteriores;
- transferência para outro contexto;
- prática curta;
- explicação com as próprias palavras;
- prova de independência fora da AEDS.

A profundidade é adaptada ao tipo de disciplina. Matemática enfatiza relações e representações; Física, sistema/referencial/grandezas/princípio; Química, níveis macroscópico, corpuscular e simbólico; História, contexto/fontes/agentes/causalidade; Linguagens, intenção/contexto/efeito; e assim por diante.

## Feedback de qualidade

O aluno pode marcar uma aula ou questão como confusa. O administrador recebe esses registros na área administrativa para localizar conteúdo que precisa de reescrita, revisão de alternativa ou melhoria de explicação.

## Simulado ENEM

O simulado foi reorganizado para seguir a composição atual do exame:

- Dia 1: Linguagens + Ciências Humanas, até 90 questões (45 por grande área quando o banco inédito permite), 5h30.
- Dia 2: Ciências da Natureza + Matemática, até 90 questões (45 por grande área quando o banco inédito permite), 5h.

A montagem continua obedecendo às regras de não repetição da AEDS.

Ao finalizar, o aluno recebe:

- quantidade de acertos e erros/em branco;
- TRI-AEDS estimada;
- todas as questões erradas/em branco;
- resposta marcada e correta;
- explicação e habilidade;
- opção de revisar com QUESTÕES NOVAS da mesma habilidade.

## TRI-AEDS

A TRI-AEDS continua sendo uma estimativa pedagógica baseada em modelo 3PL. Ela considera dificuldade, discriminação estimada, chance de acerto casual e coerência do padrão de respostas.

Ela NÃO é apresentada como nota oficial do ENEM porque os itens da AEDS ainda não possuem calibração populacional oficial/pré-teste equivalente ao Inep.

O administrador agora pode exportar histórico de respostas em CSV para futura calibração estatística dos itens quando houver volume suficiente de alunos e respostas.

## Arquitetura

O cálculo de domínio, retenção, revisão espaçada e TRI foi isolado em `engine.js`. Isso reduz o acoplamento da interface com as regras pedagógicas e prepara o projeto para modularização maior em versões futuras.

Arquivos principais:

- `index.html` — estrutura da aplicação;
- `styles.css` — interface responsiva;
- `app.js` — navegação, estado e integração;
- `engine.js` — motor pedagógico e TRI;
- `bank-data.js` — conteúdo e questões;
- `cloud-config.js` — configuração Supabase;
- `sw.js` — cache/offline;
- `vercel.json` — publicação;
- `quality-check.js` — verificação de integridade;
- `logic-test.js` — testes do motor/simulado.

## Nuvem e compatibilidade

A chave local de estado continua `estudaplus_final_v8_2`, preservando migração do progresso anterior.

A estrutura já existente de `user_state` no Supabase passa a sincronizar também os dados de independência e feedback, sem exigir nova tabela.

O arquivo `cloud-config.js` foi preservado.

## Qualidade automática

Execute:

```bash
node quality-check.js
```

O teste verifica, entre outros pontos:

- IDs duplicados;
- alternativas/gabaritos inválidos;
- presença das seções essenciais dos artigos aprofundados;
- versão/cache;
- regras básicas do motor de domínio;
- lógica TRI;
- sessão inteligente sem famílias/padrões/respostas repetidas;
- composição dos dois dias do simulado.

Na geração desta versão, o verificador encontrou 0 erros críticos e 0 avisos.

## Conteúdo preservado

A AEDS 8.29 mantém as 34.254 questões armazenadas da 8.28, sendo 29.697 ativas. Nenhuma questão foi alterada nesta atualização. O foco foi melhorar o motor, as aulas, a revisão, a autonomia e o simulado.
