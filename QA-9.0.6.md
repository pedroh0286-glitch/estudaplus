# QA — AEDS 9.0.6

## Objetivo

Integrar o conteúdo autoral **Ciência da Computação • Do Zero aos Fundamentos** sem transformar a AEDS em uma parede de texto e sem perder nenhum detalhe do arquivo recebido.

## Conteúdo integrado

- 460 linhas de texto autoral preservadas na camada de dados e no arquivo-fonte.
- 8 módulos guiados.
- 2 estudos de caso presentes no arquivo enviado.
- 1 laboratório completo presente no arquivo enviado.
- 7 projetos guiados.
- 56 termos de glossário.
- 10 referências recomendadas.
- 7 itens do checklist final.

## Novas funções

- modo **Fundamentos** separado de **Linguagens**;
- trilha progressiva de Ciência da Computação;
- caderno de evidências para hipótese, evidência, explicação e próximo teste;
- conclusão de módulo condicionada a explicação própria e transferência;
- projetos condicionados a registro de evidência;
- estudos de caso com análise original escondida até o aluno formular diagnóstico;
- glossário pesquisável;
- livro completo disponível em seção recolhida;
- busca global reconhece módulos e termos de Computação;
- progresso da trilha utiliza o estado já existente de `programDone` e `notes`.

## Novo erro transformado em regra

Durante a edição da cópia de trabalho, uma rotina de atualização escreveu acidentalmente conteúdo do Service Worker no `index.html`. A cópia foi restaurada antes da entrega e o erro gerou uma nova regressão permanente:

**`htmlShellIntegrity`** — `index.html` deve começar como HTML válido, possuir abertura/fechamento `<html>` e não pode conter um listener de instalação de Service Worker. Assim, uma sobrescrita desse tipo passa a quebrar o QA automaticamente.

## Testes executados

`node quality-computacao-906.js`

Resultado:

- 8/8 módulos válidos;
- 2/2 casos válidos;
- 1/1 laboratório válido;
- 7/7 projetos válidos;
- 56/56 termos preservados;
- texto integral equivalente à fonte autoral;
- shell, cache e arquivos obrigatórios presentes.

`node quality-check.js`

Resultado:

- 36.669 questões armazenadas;
- 5.026 ativas;
- 4.988 objetivas;
- 140 aulas aprofundadas;
- 135 pacotes;
- 135/135 pacotes ainda montam sessão rígida;
- Redação 9.0.5 preservada: 100 temas, 12 módulos e 10 microtreinos;
- Computação 9.0.6 aprovada;
- 0 erros críticos;
- 0 avisos.

## Limitação do teste de navegador neste ambiente

O ambiente de execução bloqueou URLs `localhost` e `file://` no Chromium por política administrativa. Por isso, nesta rodada não foi possível repetir a automação visual real usada na auditoria 9.0.4. A versão foi validada por sintaxe, contratos de dados, integridade de arquivos e regressões Node. A regra de navegador da 9.0.4 permanece no projeto e deve continuar sendo usada em ambiente que permita abrir a aplicação.
