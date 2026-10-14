import { describe, expect, test } from "bun:test";
import { eventDays, formatEventRange, isUpcoming, occursOn, overlapsRange } from "../src/lib/event-dates";

const camp = { date_obj: "2026-07-10T16:00:00.000Z", end_date: "2026-07-12" };
const oneDay = { date_obj: "2026-03-01T17:00:00.000Z", end_date: null };

describe("event dates", () => {
  test("a multi-day event shows on every day from start to end", () => {
    expect(eventDays(camp).length).toBe(3);
    expect(occursOn(camp, new Date(2026, 6, 11))).toBe(true);
    expect(occursOn(camp, new Date(2026, 6, 13))).toBe(false);
  });

  test("a past date still finds its event", () => {
    expect(occursOn(oneDay, new Date(2026, 2, 1, 21))).toBe(true);
  });

  test("an event stays upcoming until its last day ends", () => {
    expect(isUpcoming(camp, new Date(2026, 6, 12, 20))).toBe(true);
    expect(isUpcoming(camp, new Date(2026, 6, 13))).toBe(false);
  });

  test("week filter includes events overlapping the week", () => {
    expect(overlapsRange(camp, new Date(2026, 6, 12), new Date(2026, 6, 18))).toBe(true);
  });

  test("date range label", () => {
    expect(formatEventRange(camp)).toBe("July 10 – 12, 2026");
    expect(formatEventRange(oneDay)).toBe("March 1, 2026");
  });
});
