import { expect, test } from "@playwright/test";

import { type Dependency } from "./npm-project.mjs";
import {
  analyse,
  LOADED,
  logIn,
  uploadProject,
  vulnerabilityCards,
} from "./stack.mjs";

// Golden journey 6: a knowledge update adds an advisory, and the next analysis of a project
// shows it. The umbrella job runs the first test, then `stack.sh knowledge-update`, then the
// tests tagged @after-knowledge-update. The dump fixture knows only GHSA-w9mr-4mfr-499f
// (ms < 2.0.0); the update adds GHSA-3fx5-fwvr-xrjg (CVE-2015-8315, ms < 0.7.1).

const MS_070: Dependency = {
  name: "ms",
  version: "0.7.0",
  integrity:
    "sha512-YmuMMkfOZzzAftlHwiQxFepJx/5rDaYi9o9QanyBCk485BRAyM/vB9XoYlZvglxE/pmAWOiQgrdoE10watiK9w==",
};
const KNOWN = /CVE-2017-20162|GHSA-w9mr-4mfr-499f/;
const ADDED = /CVE-2015-8315|GHSA-3fx5-fwvr-xrjg/;

// Both runs of the job name the same project; E2E_RUN keeps reruns on one stack apart.
const name = `knowledge-${process.env.E2E_RUN ?? "local"}`;

test("before a knowledge update, a project shows only the known advisory", async ({
  page,
}) => {
  await logIn(page);
  await uploadProject(page, name, MS_070);
  await analyse(page, name);
  const cards = await vulnerabilityCards(page);
  await expect(cards).toHaveCount(1, LOADED);
  await expect(cards.first()).toContainText(KNOWN);
});

test(
  "after a knowledge update, the next analysis shows the new advisory",
  { tag: "@after-knowledge-update" },
  async ({ page }) => {
    await logIn(page);
    await analyse(page, name);
    const cards = await vulnerabilityCards(page);
    await expect(cards).toHaveCount(2, LOADED);
    await expect(cards.filter({ hasText: ADDED })).toHaveCount(1);
    await expect(cards.filter({ hasText: KNOWN })).toHaveCount(1);
  },
);
