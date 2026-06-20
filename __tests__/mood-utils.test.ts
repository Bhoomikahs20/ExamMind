import { averageMood, moodTrendDirection, sanitizeUserText, TAG_LABELS } from "@/lib/mood-utils";
import type { CheckInEntry } from "@/types";

const makeEntry = (mood: number, date: string): CheckInEntry => ({
  id: date, date, timestamp: Date.now(), mood: mood as 1|2|3|4|5, journalText: "test", tags: [],
});

describe("averageMood", () => {
  it("returns 0 for empty array", () => expect(averageMood([])).toBe(0));
  it("calculates correctly", () => {
    expect(averageMood([makeEntry(2,"2024-01-01"), makeEntry(4,"2024-01-02")])).toBe(3);
  });
});

describe("moodTrendDirection", () => {
  it("returns stable for < 2 entries", () => {
    expect(moodTrendDirection([makeEntry(3,"2024-01-01")])).toBe("stable");
  });
  it("detects improving trend", () => {
    const entries = [makeEntry(2,"2024-01-01"),makeEntry(2,"2024-01-02"),makeEntry(4,"2024-01-03"),makeEntry(5,"2024-01-04")];
    expect(moodTrendDirection(entries)).toBe("improving");
  });
  it("detects declining trend", () => {
    const entries = [makeEntry(5,"2024-01-01"),makeEntry(4,"2024-01-02"),makeEntry(2,"2024-01-03"),makeEntry(1,"2024-01-04")];
    expect(moodTrendDirection(entries)).toBe("declining");
  });
});

describe("sanitizeUserText", () => {
  it("trims whitespace", () => expect(sanitizeUserText("  hello  ")).toBe("hello"));
  it("caps at maxLength", () => expect(sanitizeUserText("a".repeat(3000), 100).length).toBe(100));
  it("removes null bytes", () => expect(sanitizeUserText("hel\0lo")).toBe("hello"));
});

describe("TAG_LABELS", () => {
  it("has label for all standard tags", () => {
    expect(TAG_LABELS["sleep"]).toBeDefined();
    expect(TAG_LABELS["exam_fear"]).toBeDefined();
    expect(TAG_LABELS["comparison_anxiety"]).toBeDefined();
  });
});