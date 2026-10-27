# ThinkBoard AI

ThinkBoard AI is an AI-assisted note-taking and study workspace built with Next.js. It helps users manage notes, improve content with AI, and find notes using keyword and semantic search.

> **Project status:** Portfolio MVP. Update the feature list and screenshots to match the exact version you deploy.

## Features

- Create, edit, and delete notes
- AI note summarization
- Improve, expand, and continue writing
- Generate note titles
- Extract key points
- Generate questions from notes
- Generate flashcards
- Chat with notes using AI
- Keyword-based note search
- AI semantic search to find notes by meaning

## Tech stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Google Gemini API via `@google/genai`
- Browser `localStorage` for note persistence

## Getting started

### Prerequisites

- Node.js version supported by the project's Next.js version
- npm
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Keep the real key private. Never commit `.env.local` or expose the key in client-side code.

### 4. Start the development server

```bash
npm run dev
```

Open http://localhost:3000.

### 5. Build for production

```bash
npm run build
npm run start
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes for AI features | Authenticates server-side requests to the Gemini API |

Set the same variable in your hosting provider's environment settings. Do not use a `NEXT_PUBLIC_` prefix for this secret.

## Screenshots

Capture screenshots from the real running application and save them in a `screenshots/` folder. Suggested images:

1. `screenshots/dashboard.png` — main notes or whiteboards view
2. `screenshots/note-editor.png` — editor and AI actions
3. `screenshots/ai-chat.png` — AI chat with notes
4. `screenshots/smart-search.png` — keyword and semantic search

After adding an image, show it in this README using Markdown, for example:

```md
![Note editor](screenshots/note-editor.png)
```

Do not include API keys, private notes, browser tokens, or personal information in screenshots.

## Project structure

Your exact structure may differ; update this example if needed.

```text
src/
  app/
    api/
      assistant/
      semantic-search/
    notes/
    search/
    whiteboards/
  lib/
    notes.ts
    whiteboards.ts
```

## Important implementation note

In the current MVP, notes are stored in browser `localStorage`. They are generally available only in the same browser and device; they do not automatically sync across devices. Clearing browser site data may remove them. Cloud persistence and cross-device sync would require a backend database and, typically, authentication.

AI features send relevant prompts and, where applicable, note content to Gemini for processing. Avoid submitting confidential information unless you are comfortable sending it to the configured AI provider.

## Deployment checklist

- [ ] Add `GEMINI_API_KEY` to the hosting provider's server-side environment variables.
- [ ] Confirm `.env.local` is ignored by Git.
- [ ] Run `npm run build` successfully.
- [ ] Deploy the application.
- [ ] Test note creation, editing, deletion, and refresh behavior on the deployed site.
- [ ] Test all AI actions and both search modes.
- [ ] Check mobile, tablet, and desktop layouts.
- [ ] Add real screenshots to the repository.
- [ ] Replace the repository, live-demo, and author placeholders below.

## Links

- **Live demo:** `<ADD_DEPLOYED_URL>`
- **Repository:** `<ADD_REPOSITORY_URL>`

## Author

**<YOUR_NAME>**

Built as an AI-focused portfolio project exploring AI-assisted note-taking and study workflows.
