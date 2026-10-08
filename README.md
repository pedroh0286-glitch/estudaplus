# Estuda+

Versão preparada para Supabase + Vercel.

Leia primeiro `PROXIMO_PASSO.txt`.

O site mantém o banco local atual como fallback e pode carregar questões do Supabase em lotes de até 10 no treinamento. O progresso e o estado do usuário podem ser sincronizados entre dispositivos após executar `cloud/SUPABASE_ATUALIZACAO_VERCEL.sql`.


## Correção 8.1
- Corrige Aprendizado quando o administrador não tem aluno cadastrado.
- Corrige abertura do Treinamento para administrador.
- Permite deixar zero matérias/séries liberadas sem reativar tudo automaticamente.
- Confirma no Supabase cada alteração de permissões do aluno.
