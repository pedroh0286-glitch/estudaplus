# AEDS 9.0.13 — Controle & Inteligência

## Administração

- Classificação permanente das 36.783 questões no formato `questão.matéria.série`.
- Série por ordem AEDS: `01=5º`, `02=6º`, `03=7º`, `04=8º`, `05=9º`, `06=1º EM`, `07=2º EM`, `08=3º EM`.
- Códigos de matéria centralizados; Matemática é `01`.
- ID técnico original permanece separado da classificação humana.
- Central de Questões com busca por classificação, ID, matéria, assunto, habilidade e enunciado.
- Índice administrativo leve com as 36.783 questões; o pacote completo só é carregado quando a questão é aberta.
- Denúncia do aluno gera caso pendente, nunca quarentena automática.
- Admin pode manter ativa, marcar verificada, colocar em quarentena ou desativar.
- Histórico do denunciante aparece como contexto para diferenciar recorrência legítima de possíveis abusos.
- Decisões administrativas entram no histórico de auditoria.
- Quarentena/desativação filtram a questão transversalmente sem apagá-la do banco-fonte.
- Painel dividido em Questões, Rastro & Memória, Usuários & Dados e Conteúdo avançado.

## Rastro 4.1

- O núcleo real de classificação foi atualizado; não é apenas uma camada visual.
- Autorrelato de conteúdo/interpretação/distração tem peso auxiliar.
- Evidências observadas podem prevalecer sobre o autorrelato.
- Novos sinais: latência até primeira escolha, tempo total, mudanças de alternativa, mudanças de confiança, dica, rascunho e conversa com Tutor.
- Acerto com ajuda não é tratado automaticamente como independência.
- Admin vê hipótese, força, número de evidências, provas de retenção/transferência/estabilidade e razão do gate de domínio.
- Casos escalados continuam exigindo revisão humana explícita.

## Memória

- Medição por habilidade, não uma nota de memória global do aluno.
- Checkpoints aproximadamente semanais acumulam evidência ao longo do mesmo ciclo.
- Níveis finais: Curta (<1 semana), Média (~2 semanas), Boa (~3 semanas), Incrível (>=1 mês).
- `Em medição` é estado temporário de evidência insuficiente, não um quinto nível.
- Falha registra o limite observado e reinicia o ciclo de medição daquela habilidade.

## Aulas e Árvore do Saber

- Escolha inicial entre Aula normal e Aula adaptativa.
- Aula adaptativa não injeta pré-requisito avançado não comprovado.
- Conteúdo bloqueado/recomendado explica qual pré-requisito precisa ser fortalecido.
- O aluno pode avançar mesmo assim quando houver razão prática.
- Admin pode forçar modo normal/adaptativo ou devolver a escolha ao aluno.

## Tutor AEDS

- Conversa do aluno pode produzir no máximo duas hipóteses auxiliares para o Rastro.
- O Rastro ainda precisa validar essas hipóteses por comportamento/contraprovas.
- Fallback socrático local preserva funcionamento sem serviço externo.
- Integração principal para hospedagem estática: Supabase Edge Function `aeds-tutor`.
- Alternativa para Vercel: `api/tutor.js`.
- `OPENAI_API_KEY` fica somente no servidor; nunca deve ser colocada em `cloud-config.js` ou em qualquer JS público.

## Infraestrutura

- `question-pack-index.js`: manifesto explícito dos 135 pacotes.
- `admin-question-index-9013.js`: índice leve de busca administrativa.
- `supabase-aeds-9013.sql`: denúncias/moderação com RLS.
- `supabase/functions/aeds-tutor/index.ts`: Tutor server-side para Supabase.
- Service Worker atualizado para 9.0.13.
