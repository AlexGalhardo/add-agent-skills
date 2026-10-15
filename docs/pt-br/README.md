# add-agent-skills

Pare de copiar `.claude/skills/` entre projetos. Rode um comando, marque as skills que quer num checklist e elas são
baixadas **direto do repositório oficial no GitHub, sempre na versão mais recente**.

![demo do add-agent-skills](../demo.gif)

[Read in English](../../README.md)

## Uso

Na raiz do seu projeto:

```bash
bunx @galhardoalex/add-agent-skills
```

```bash
npx @galhardoalex/add-agent-skills
```

```bash
deno run -A jsr:@galhardoalex/add-agent-skills/cli
```

O cabeçalho mostra sua versão comparada à última release e quando o catálogo de skills foi atualizado.

1. Escolha os agentes. Os que já têm pasta no projeto vêm pré-marcados.
2. Marque as skills, agrupadas por categoria, cada uma com repositório e descrição.
3. Se a skill já existe, escolha sobrescrever com a versão mais nova ou pular.

Requer Node.js 20.12+ (ou Bun / Deno). Reinicie o agente depois para ele carregar as skills.

## Agentes

| Id        | Pasta            | Quem lê                                                                         |
| --------- | ---------------- | ------------------------------------------------------------------------------- |
| `claude`  | `.claude/skills` | Claude Code (também Copilot, OpenCode, Amp, Cline)                              |
| `agents`  | `.agents/skills` | Padrão aberto [Agent Skills](https://agentskills.io): Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode, Amp, Goose, Roo Code |
| `cursor`  | `.cursor/skills` | Cursor                                                                          |
| `copilot` | `.github/skills` | GitHub Copilot                                                                  |

Dica: alguns agentes leem mais de uma dessas pastas (o Cursor lê `.cursor/skills` e `.agents/skills`). Instalar a mesma skill nas duas faz ela aparecer duplicada.

## Modo não interativo

```bash
bunx @galhardoalex/add-agent-skills --skills karpathy-guidelines,grilling --agent claude,agents --yes
```

| Opção                  | Descrição                                                      |
| ---------------------- | -------------------------------------------------------------- |
| `-s, --skills <nomes>` | Skills separadas por vírgula (veja `--list`)                   |
| `-a, --agent <ids>`    | Agentes: `claude`, `agents`, `cursor`, `copilot`               |
| `-g, --global`         | Instala no seu home (`~/.claude/skills`...)                    |
| `-d, --dir <path>`     | Pasta do projeto (padrão: a atual)                             |
| `-y, --yes`            | Não pergunta; skills existentes são puladas, salvo `--force`   |
| `-f, --force`          | Sobrescreve skills existentes                                  |
| `-l, --list`           | Lista as skills disponíveis                                    |

Os downloads usam a API do GitHub (uma requisição por repositório). Sem token o limite é 60 por hora; defina
`GITHUB_TOKEN` ou `GH_TOKEN` para aumentar.

## Como funciona

O `src/catalog.json` guarda, para cada skill, o repositório oficial e o caminho dela lá dentro. Na instalação, a CLI lista
a árvore do repositório em `HEAD` (branch padrão) e baixa os arquivos pelo `raw.githubusercontent.com`. Você sempre recebe
a versão mais recente, sem esperar uma release nova deste pacote. Um workflow semanal atualiza as descrições e avisa
quando alguma skill muda de lugar no upstream.

`art-of-game-design` e `pixel-logic` são resumos originais de livros, hospedados neste repositório em [`skills/`](../../skills).
