import { expect, it } from "vitest";
import { earliestMenuDate } from "./creationDate";
it.each([
  ["2026-11-13T10:00:00Z", "2026-11-13"],
  ["2026-11-13T18:59:59Z", "2026-11-13"],
  ["2026-11-13T19:00:00Z", "2026-11-14"],
  ["2026-11-14T01:30:00Z", "2026-11-14"],
  ["2026-07-13T19:59:59Z", "2026-07-13"],
  ["2026-07-13T20:00:00Z", "2026-07-14"],
  ["2026-12-31T19:00:00Z", "2027-01-01"],
])("suggests an available menu date at %s", (instant, expected) => {
  expect(earliestMenuDate(new Date(instant))).toBe(expected);
});
