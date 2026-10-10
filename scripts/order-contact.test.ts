import { describe, expect, test } from "bun:test";
import { matchesOrderContact } from "../src/lib/order-contact";
describe("Production order verification", () => {
  test("requires the full email, not a matching fragment", () => {
    expect(matchesOrderContact(" buyer@mosiac.rw ", "Buyer@mosiac.rw", "")).toBe(true);
    expect(matchesOrderContact("@mosiac.rw", "Buyer@mosiac.rw", "")).toBe(false);
    expect(matchesOrderContact("", "Buyer@mosiac.rw", "")).toBe(false);
  });
  test("requires the full phone and never matches an empty stored phone", () => {
    expect(matchesOrderContact("+250 796 664 868", "", "+250796664868")).toBe(true);
    expect(matchesOrderContact("868", "", "+250796664868")).toBe(false);
    expect(matchesOrderContact("250796664868", "", "")).toBe(false);
  });
});