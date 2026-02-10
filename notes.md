# TODO — Typing Game

## Table of Contents

- [TODO — Typing Game](#todo--typing-game)
  - [Table of Contents](#table-of-contents)
  - [Typebox logic](#typebox-logic)
  - [Game modes](#game-modes)
  - [Backend: fetch words](#backend-fetch-words)

---

## Typebox logic

- [x] Implement display
  - [x] render target text with per-char state (pending/correct/wrong)
  - [x] show caret and progress highlight
  - [x] handle line wrapping and scrolling
- [x] Implement input handling
  - [x] capture keystrokes reliably (keydown/keypress), support IME
  - [x] apply edits, handle backspace, selection, paste
  - [x] debounce/queue input to avoid UI jank
- [x] Implement WPM feature
  - [x] compute WPM (correct chars → words) and update periodically
  - [x] support session start/pause/reset
  - [x] edge cases: zero-time, corrections, negative values

---

## Game modes

- [ ] Length-based game
  - [ ] generate text of target length (chars or sentences)
  - [ ] end when length reached, record stats
- [ ] Time-based game
  - [ ] countdown timer, auto-stop on zero
  - [ ] intermediate snapshots for live stats
- [ ] Word-based game
  - [ ] stop after N words typed correctly
  - [ ] handle partial-last-word behavior
- [ ] Punctuation-based game
  - [ ] include punctuation-focused passages
  - [ ] scoring/penalties for punctuation mistakes

---

## Backend: fetch words

- [ ] Define API
  - [ ] GET /api/words?mode={length|time|words|punct}&count=&difficulty=
  - [ ] support batch and single fetch
- [ ] Word sources
  - [ ] curated lists, dictionary files, sentence corpora
  - [ ] optional external APIs (with caching)
- [ ] Server logic
  - [ ] generate/assemble passages per mode rules
  - [ ] sanitize and validate output
  - [ ] rate limiting and caching (Redis or in-memory)
- [ ] Devops & QA
  - [ ] unit tests for generation logic
  - [ ] integration tests for API
  - [ ] deployable config (env, secrets, CORS)

---
