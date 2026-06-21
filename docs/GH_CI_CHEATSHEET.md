# GitHub + CI + PR Cheat Sheet

A practical walkthrough of the exact workflow we used on this repo: branch →
commit → push → open a PR → let CI run → merge. Written so you can repeat it
yourself for every change.

---

## The mental model

```
main (protected)
  │
  │  you never commit directly to main
  ▼
feature branch ──commits──▶ push to GitHub ──▶ Pull Request
                                                   │
                                          GitHub Actions (CI) runs
                                          lint + typecheck + test
                                                   │
                                       green ✔  ──▶ merge into main
                                       red   �’  ──▶ fix, push again
```

Two things do the heavy lifting:

1. **GitHub Actions** = the CI robot. It's configured by a YAML file in the repo
   (`.github/workflows/ci.yml`). Every push/PR triggers it; it runs your checks
   on a clean cloud machine.
2. **Branch protection** = the rule on `main` that says "no merge unless CI is
   green." That's what makes CI *mean* something instead of being decorative.

`gh` is GitHub's command-line tool. It just saves you from clicking around the
website — everything below can also be done in the browser.

---

## One-time setup

```bash
gh auth status          # are you logged in?
gh auth login           # log in if not (pick GitHub.com → SSH/HTTPS → browser)
```

You only do this once per machine.

---

## The per-change loop (memorize this)

### 1. Start from an up-to-date main

```bash
git checkout main
git pull
```

### 2. Branch for your change

```bash
git checkout -b perf--phase2-on1-keystroke
```

Naming convention we've been using: `<type>--<short-description>`, e.g.
`chore--add-testing`, `perf--phase2-on1-keystroke`. The `type` mirrors commit
types (feat, fix, chore, perf, docs, test).

### 3. Do the work, then commit (often in logical chunks)

```bash
git add <specific files>          # stage just the files for this commit
git commit -m "perf: short summary

Longer explanation of *why*, wrapped at ~72 chars."
```

We split big changes into multiple commits (e.g. a `perf:` commit for the code,
then a `test:` commit for the tests). Each commit should be a coherent unit.

> Commit message types we use: `feat` (feature), `fix` (bug), `perf`
> (performance), `refactor`, `test`, `docs`, `chore` (tooling/deps), `ci`.

### 4. Push the branch to GitHub

```bash
git push -u origin perf--phase2-on1-keystroke
```

The `-u` (set upstream) is only needed the first push of a branch. After that,
plain `git push` works.

### 5. Open a Pull Request

```bash
gh pr create --base main --head perf--phase2-on1-keystroke \
  --title "perf: O(1) keystroke handling (Phase 2)" \
  --body "What changed and why..."
```

- `--base` = the branch you want to merge *into* (`main`).
- `--head` = your feature branch.
- Tip: for a long body, write it in a here-doc or a file so formatting (tables,
  lists) survives.

`gh pr create` prints the PR URL. Opening the PR is what kicks CI off.

### 6. Watch CI

```bash
gh run list --branch perf--phase2-on1-keystroke --limit 1   # latest run + status
gh pr checks 2                                               # checks for PR #2
gh run watch <run-id> --exit-status                          # block until it finishes
```

If it **fails**, read exactly which step broke:

```bash
gh run view <run-id> --log-failed     # only the failing step's logs
```

(That's how we found the `npm ci` lockfile error — the log said precisely which
packages were missing.)

### 7. Merge when green

```bash
gh pr view 2 --json mergeable,mergeStateStatus   # confirm CLEAN / MERGEABLE
gh pr merge 2 --squash --delete-branch
```

Merge strategies:

| Flag        | Result on main                                   |
|-------------|--------------------------------------------------|
| `--squash`  | all the PR's commits collapse into **one** commit |
| `--merge`   | a merge commit, **all** commits preserved         |
| `--rebase`  | commits replayed onto main, **linear** history    |

`--delete-branch` cleans up the feature branch locally + remotely after merge.

### 8. Sync your local main

```bash
git checkout main
git pull
```

Then back to step 1 for the next change.

---

## Reviewing a PR before merging

```bash
gh pr view 2 --web      # open the full PR in the browser (best for review)
gh pr diff 2            # full diff in the terminal
gh pr checks 2          # status of every check
```

> **Known bug on this machine:** `gh` 2.45.0's plain `gh pr view 2` can print
> only a "Projects classic is deprecated" warning and no content. Workarounds:
> use `--web`, use `gh pr diff 2`, or request specific JSON fields:
> `gh pr view 2 --json title,state,mergeable,url,body`. Upgrading `gh` past 2.45
> fixes it.

---

## How CI is wired in this repo

The workflow file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

```yaml
on:
  push:
    branches: [main]     # run when main is updated
  pull_request:          # run on every PR
```

The job installs deps and runs the same checks you run locally:

```yaml
- run: npm ci            # clean, lockfile-exact install (stricter than npm install)
- run: npm run lint
- run: npm run typecheck
- run: npm test
```

Key idea: **CI runs the exact npm scripts from `package.json`.** So "make CI
pass" = "make `npm run lint && npm run typecheck && npm test` pass locally
first." Always run them locally before pushing — it's faster than waiting on CI.

> `npm ci` vs `npm install`: `npm ci` deletes `node_modules` and installs
> *exactly* what `package-lock.json` says, failing if the lockfile is out of
> sync. That's why a clean lockfile matters (we had to regenerate ours once).

### Branch protection (the gate)

We enabled a rule on `main` requiring the "Lint, typecheck & test" check to pass
before merging. You can view/manage it in **Settings → Branches** on GitHub, or
via the API:

```bash
gh api repos/naodmulu/nanoTyping-web/branches/main/protection/required_status_checks \
  --jq '{strict, contexts}'
```

`strict: true` also means your branch must be **up to date with main** before
merging.

---

## Handy `gh` commands reference

| Goal                          | Command                                            |
|-------------------------------|----------------------------------------------------|
| Am I logged in?               | `gh auth status`                                   |
| List my PRs                   | `gh pr list`                                        |
| Open PR in browser            | `gh pr view <n> --web`                              |
| See a PR's diff               | `gh pr diff <n>`                                    |
| See a PR's checks             | `gh pr checks <n>`                                  |
| Create a PR                   | `gh pr create --base main --head <branch> ...`     |
| Merge a PR                    | `gh pr merge <n> --squash --delete-branch`         |
| List recent CI runs           | `gh run list --branch <branch> --limit 5`          |
| Watch a run live              | `gh run watch <run-id> --exit-status`              |
| Logs of a failed run          | `gh run view <run-id> --log-failed`               |
| Repo info                     | `gh repo view`                                      |
| Raw API call                  | `gh api <endpoint>`                                |

---

## If something goes wrong

- **CI red on `npm ci`** → lockfile out of sync. Fix:
  `rm -rf node_modules package-lock.json && npm install`, commit the new
  `package-lock.json`, push.
- **CI red on lint/typecheck/test** → run that same script locally, fix, push
  again. The push automatically re-runs CI on the open PR.
- **Can't merge ("not up to date")** → branch protection wants you current with
  main: `git checkout <branch> && git merge main` (or `git rebase main`), push.
  Or use `gh pr merge <n> --squash --auto` to auto-merge once green.
- **Pushed to the wrong place / want to undo a local commit** →
  `git reset --soft HEAD~1` (keeps your changes staged).
