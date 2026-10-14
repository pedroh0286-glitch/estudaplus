# AEDS 9.0.13 — Guia de Administração e Implantação

## 1. Classificação das questões

Formato: `questão.matéria.série`.

Exemplo: `01.01.01` = questão 01 · Matemática · 5º ano.

Séries: `01=5º`, `02=6º`, `03=7º`, `04=8º`, `05=9º`, `06=1º EM`, `07=2º EM`, `08=3º EM`. O número da questão cresce dentro da combinação matéria+série e pode ter mais de dois dígitos (`100.01.01`). O ID técnico continua separado e permanente.

## 2. Fluxo de denúncia

1. O aluno toca em **Reportar questão**.
2. Seleciona o motivo e pode explicar o problema.
3. A questão continua ativa. Nenhuma denúncia faz quarentena automática.
4. A denúncia entra na **Central de Questões** do Admin.
5. O Admin abre a questão completa e escolhe uma decisão: **Manter ativa**, **Marcar verificada**, **Quarentena** ou **Desativar**.
6. A justificativa entra no histórico.
7. Quarentena/desativação retiram a questão das próximas sessões, sem apagar o banco-fonte.

O painel mostra o histórico de denúncias do autor como contexto. Isso ajuda a identificar padrões, mas não deve ser usado como prova automática de trolling.

## 3. Busca administrativa

A busca aceita classificação, ID interno, matéria, área, habilidade ou texto do enunciado. O login do Admin não descompacta os 135 pacotes. Um índice leve contém os metadados das 36.783 questões; o pacote completo é carregado apenas quando necessário.

## 4. Rastro & Memória

A aba **Rastro & Memória** mostra por aluno:

- hipótese pedagógica dominante;
- força da hipótese;
- quantidade de evidências;
- provas de retenção;
- provas de transferência;
- estabilidade;
- razão pela qual o domínio ainda não foi comprovado;
- casos que exigem revisão humana;
- níveis de memória já medidos e checkpoints vencidos;
- modo de aula escolhido/forçado.

O objetivo é permitir que o administrador audite o próprio motor, não apenas aceite uma nota opaca.

## 5. Memória por habilidade

AEDS mede retenção por habilidade em intervalos semanais. Os níveis finais são:

- **Curta:** menos de 1 semana;
- **Média:** cerca de 2 semanas;
- **Boa:** cerca de 3 semanas;
- **Incrível:** 1 mês ou mais.

`Em medição` é apenas um estado provisório. Não há afirmação de que toda pessoa esqueça uma porcentagem fixa em determinado número de dias; o nível é inferido do histórico observado daquele aluno naquela habilidade.

## 6. Aula normal e adaptativa

- **Normal:** sequência previsível de explicação, exemplo e exercício.
- **Adaptativa:** muda apoio, quantidade e caminho com base nas evidências, mas não introduz um pré-requisito avançado que o aluno ainda não demonstrou conhecer.

O aluno pode escolher. O Admin também pode forçar um modo por usuário. Mesmo quando a Árvore do Saber recomenda fortalecer um pré-requisito, existe override para situações como prova próxima.

## 7. Tutor AEDS

O navegador nunca deve conter `OPENAI_API_KEY`. Existem duas opções:

### Supabase (recomendado para GitHub Pages / hospedagem estática)

1. Execute primeiro a migração antiga `supabase-aeds-9.sql`, se ainda não foi aplicada.
2. Execute `supabase-aeds-9013.sql` no SQL Editor.
3. Publique `supabase/functions/aeds-tutor/index.ts` como Edge Function com o nome `aeds-tutor`.
4. Configure o secret `OPENAI_API_KEY` no ambiente da função.
5. Opcionalmente configure `OPENAI_TUTOR_MODEL`.
6. Mantenha a validação de usuário/JWT ativa. O frontend já envia o token da sessão quando usa a Edge Function.

### Vercel

`api/tutor.js` pode ser usado como rota serverless. Configure `OPENAI_API_KEY` e, se desejar, `OPENAI_TUTOR_MODEL` nas variáveis de ambiente do projeto.

### Sem IA externa

AEDS continua funcional. O Tutor usa um fallback socrático local e a explicação escrita pelo aluno ainda pode ser registrada como contexto, sem fingir que houve uma análise de IA externa.

## 8. Supabase — denúncias e moderação

`supabase-aeds-9013.sql` cria `question_reports` e `question_moderation` com RLS. Alunos autenticados podem criar/ler suas próprias denúncias; Admin pode revisar. A moderação é legível por usuários autenticados para impedir que questões em quarentena sejam selecionadas em outro dispositivo.

## 9. Regra operacional

Uma denúncia é **evidência para revisão**, não uma sentença. Uma hipótese do Tutor é **evidência para o Rastro**, não um diagnóstico. Um acerto assistido é **evidência de progresso**, não prova automática de independência.
