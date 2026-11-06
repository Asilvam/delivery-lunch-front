import { expect, it } from "vitest";
import { normalizePhone, phoneError } from "./contact";
it.each(["9 1234 5678", "56912345678", "+56 (9) 1234-5678"])(
  "normalizes Chilean mobile %s",
  (input) => {
    expect(normalizePhone(input)).toBe("+56912345678");
    expect(phoneError(input)).toBeUndefined();
  },
);
it.each(["", "12345678", "++56912345678", "+000000000", "+1234567890123456"])(
  "rejects invalid phone %s",
  (input) => expect(phoneError(input)).toBeDefined(),
);
it("preserves international numbers with an explicit country code", () => {
  expect(normalizePhone("+1 (202) 555-0123")).toBe("+12025550123");
  expect(phoneError("+1 (202) 555-0123")).toBeUndefined();
});
