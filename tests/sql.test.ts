import { test } from "node:test";
import assert from "node:assert/strict";
import { toPg } from "../src/lib/sql.ts";

test("numbers placeholders in order", () => {
  assert.equal(toPg("SELECT * FROM t WHERE a = ? AND b = ?"), "SELECT * FROM t WHERE a = $1 AND b = $2");
});

test("leaves question marks inside string literals alone", () => {
  assert.equal(toPg("UPDATE t SET note = 'why?' WHERE id = ?"), "UPDATE t SET note = 'why?' WHERE id = $1");
});

test("handles empty-string literals next to placeholders", () => {
  assert.equal(toPg("SELECT CASE WHEN x = '' THEN ? ELSE x END FROM t WHERE id = ?"), "SELECT CASE WHEN x = '' THEN $1 ELSE x END FROM t WHERE id = $2");
});
