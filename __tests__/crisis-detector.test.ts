import { detectCrisis } from "@/lib/crisis-detector";

describe("detectCrisis", () => {
  it("returns none for normal text", () => {
    expect(detectCrisis("I studied hard today and finished chemistry").level).toBe("none");
  });
  it("returns alert for suicidal ideation", () => {
    expect(detectCrisis("I want to kill myself, everything is hopeless").level).toBe("alert");
  });
  it("returns alert for self-harm language", () => {
    expect(detectCrisis("I feel like cutting myself, cant take it anymore").level).toBe("alert");
  });
  it("returns watch for hopelessness", () => {
    expect(detectCrisis("I feel completely worthless and nobody cares about me").level).toBe("watch");
  });
  it("returns none for empty string", () => {
    expect(detectCrisis("").level).toBe("none");
  });
  it("is case insensitive", () => {
    expect(detectCrisis("WANT TO DIE right now").level).toBe("alert");
  });
  it("returns matched keywords", () => {
    const result = detectCrisis("want to die today");
    expect(result.matchedKeywords.length).toBeGreaterThan(0);
  });
});