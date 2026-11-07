import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreTopic, clampSignal, SIGNALS, weakestSignal } from "../src/lib/scoring.ts";

test("weights sum to 1", () => {
  const total = SIGNALS.reduce((n, s) => n + s.weight, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
});

test("perfect topic scores 100 and competition is inverted", () => {
  const { score, verdict } = scoreTopic({ demand: 10, intent: 10, pain: 10, competition: 0, fit: 10 });
  assert.equal(score, 100);
  assert.equal(verdict.label, "Build it");
});

test("crowded market loses exactly the competition weight", () => {
  const { score } = scoreTopic({ demand: 10, intent: 10, pain: 10, competition: 10, fit: 10 });
  assert.equal(score, 85);
});

test("low buyer intent caps the score at 45 and says skip", () => {
  const { score, verdict } = scoreTopic({ demand: 10, intent: 2, pain: 10, competition: 0, fit: 10 });
  assert.equal(score, 45);
  assert.equal(verdict.label, "Skip");
});

test("breakdown points add up to the score", () => {
  const { score, breakdown } = scoreTopic({ demand: 7, intent: 6, pain: 8, competition: 4, fit: 5 });
  const sum = Math.round(breakdown.reduce((n, b) => n + b.points, 0) * 10) / 10;
  assert.equal(sum, score);
  assert.equal(score, 65); // 17.5 + 15 + 16 + 9 + 7.5
});

test("clampSignal bounds and rounds input", () => {
  assert.equal(clampSignal(14), 10);
  assert.equal(clampSignal(-3), 0);
  assert.equal(clampSignal("7.26"), 7.3);
  assert.equal(clampSignal("nope"), 0);
});

test("weakestSignal finds the lowest effective signal", () => {
  const { breakdown } = scoreTopic({ demand: 8, intent: 8, pain: 8, competition: 9, fit: 8 });
  assert.equal(weakestSignal(breakdown).key, "competition");
});
