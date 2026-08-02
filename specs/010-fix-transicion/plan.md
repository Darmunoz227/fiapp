# Feature 010 - Implementation plan

## Strategy

Minimal removal. Six single-line deletions in six stylesheets. No new code, no new selectors, no new color literals. Ionic native rule already carries the correct fallback for both appearances.

## Order of work

1. Confirm root cause on device with the control case (cliente-detalle) BEFORE editing anything.
2. Commit spec, plan and tasks.
3. Remove the six declarations, one commit for all six since they are a single logical change.
4. Run the suite. Expect 96 SUCCESS. The suite is a precondition, not evidence.
5. Verify by hand on Android emulator Pixel_8, both appearances.
6. Verify by hand on iOS simulator, both appearances.
7. Document Decision 030 and sync PROJECT_CONTEXT.
8. Merge to main with --no-ff after green on the branch.

## Risk analysis

- RISK 1 - Removing the declaration could expose a page that relied on it for a non-default background. Mitigation: cliente-detalle already runs without it and looks correct, which is the existing proof.
- RISK 2 - Regressing Feature 009 dark mode. Mitigation: we delete a broken override instead of adding a light palette, so the dark.system palette keeps full control. AC2 and AC3 guard this explicitly.
- RISK 3 - home.page.scss line 7 is adjacent to the target line 2. Mitigation: anchor edits by exact content, never by line number, and grep after every edit.

## Verification approach

There is no honest unit test for this defect. Karma stubs the platform to web and never evaluates prefers-color-scheme or renders CSS custom properties. Writing a passing spec here would be fake coverage. The guard is:

- a grep assertion that the six lines are gone and stay gone
- manual verification on two platforms in two appearances

## Definition of done

All five acceptance criteria met, suite green, verified on iOS and Android in both appearances, Decision 030 written, PROJECT_CONTEXT synced, merged to main.
