# Records docs/demo.gif. Run from the repository root, after `bun run build`:
#   docker build -t add-agent-skills-demo scripts/demo
#   docker run --rm -e GITHUB_TOKEN="$(gh auth token)" -v "$PWD:/app" -w /app add-agent-skills-demo scripts/demo/demo.tape

Output docs/demo.gif

Set Shell "bash"
Set FontSize 15
Set Width 1440
Set Height 760
Set Padding 20
Set Theme "Catppuccin Mocha"
Set TypingSpeed 45ms

Hide
Type "mkdir -p /tmp/my-app/.claude && cd /tmp/my-app && clear"
Enter
Show

Type "bunx @galhardoalex/add-agent-skills"
Sleep 400ms
Enter
Sleep 1.5s

# Agents: Claude Code is pre-selected because .claude/ exists.
Sleep 1s
Enter
Sleep 1.2s

# Most Used: karpathy-guidelines, grilling.
Down
Space
Sleep 300ms
Down
Space
Sleep 600ms
Down@250ms 12
Sleep 500ms
# Software Development: a few skills.
Space
Down
Sleep 300ms
Down@250ms 16
Space
Sleep 400ms
Down@200ms 20
Space
Sleep 1s
Enter
Sleep 6s

Type "ls .claude/skills"
Enter
Sleep 3s
