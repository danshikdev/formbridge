# Claude Instructions for FormBridge

You are working on the FormBridge project.

These instructions are permanent for this repository. Follow them for every task, even if the user does not repeat them in the prompt.

Before starting any task:
1. Read PROJECT_CONTEXT.md.
2. Read the current git status.
3. Understand what was already done.
4. Do not restart the project from scratch.
5. Do not touch secrets, .env files, production keys, or ignored runtime folders.

After completing any task:
1. Update PROJECT_CONTEXT.md.
2. Add:
   - date/time if possible
   - what was changed
   - files changed
   - commands/checks run
   - current risks or known issues
   - recommended next steps
3. Keep it concise but useful.
4. Do not write secrets into PROJECT_CONTEXT.md.
5. If a task changes deployment, OAuth, env, or server scripts, document the operational steps clearly.

When the user asks for a new task after a reset or in a fresh Claude Code session, still begin from PROJECT_CONTEXT.md first. Do not require the user to paste previous plans again.

Important project rules:
- Never commit secrets.
- Never expose OPENAI_API_KEY, GOOGLE_CLIENT_SECRET, DB_PASSWORD, JWT_SECRET.
- Keep UI official, minimal, and practical.
- Main product idea: FormBridge is a scenario-based CRM/automation layer over Google Forms.
- One Google Form = one workspace.
- Workspaces can have scenarios:
  - universal
  - admissions
  - hr
  - survey
  - client_requests
  - event
- AI should work per form workspace, not per single request.
- The project is for a diploma demo, so stability and clear UX are more important than overengineering.
