/**
 * Tests the parsing/validation logic used in the /api/analyze route.
 * The AI call itself is mocked — we test that malformed responses are handled gracefully.
 */

const VALID_TAGS = ["sleep","syllabus_pressure","comparison_anxiety","family_expectations","exam_fear","burnout","time_management"];

function parseAnalysisResponse(raw: string) {
  const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(jsonStr);
  return {
    stress_triggers: (Array.isArray(parsed.stress_triggers) ? parsed.stress_triggers : [])
      .filter((t: unknown) => VALID_TAGS.includes(t as string)),
    emotional_tone: typeof parsed.emotional_tone === "string" ? parsed.emotional_tone.slice(0, 50) : "neutral",
    intensity_score: Math.min(10, Math.max(1, Number(parsed.intensity_score) || 5)),
    recurring_pattern: typeof parsed.recurring_pattern === "string" ? parsed.recurring_pattern : "insufficient data",
    reflective_insight: typeof parsed.reflective_insight === "string" ? parsed.reflective_insight : "Keep going.",
    suggested_tags: (Array.isArray(parsed.suggested_tags) ? parsed.suggested_tags : [])
      .filter((t: unknown) => VALID_TAGS.includes(t as string)),
  };
}

describe("AI analysis JSON parsing", () => {
  it("parses a valid response", () => {
    const raw = JSON.stringify({
      stress_triggers: ["exam_fear", "sleep"],
      emotional_tone: "anxious",
      intensity_score: 7,
      recurring_pattern: "Stress peaks before tests",
      reflective_insight: "Your awareness of the pattern is itself progress.",
      suggested_tags: ["exam_fear"],
    });
    const result = parseAnalysisResponse(raw);
    expect(result.stress_triggers).toContain("exam_fear");
    expect(result.intensity_score).toBe(7);
    expect(result.emotional_tone).toBe("anxious");
  });

  it("strips invalid tags", () => {
    const raw = JSON.stringify({ stress_triggers: ["invalid_tag", "exam_fear"], emotional_tone: "ok", intensity_score: 5, recurring_pattern: "", reflective_insight: "", suggested_tags: [] });
    expect(parseAnalysisResponse(raw).stress_triggers).toEqual(["exam_fear"]);
  });

  it("clamps intensity_score to 1-10", () => {
    const raw = JSON.stringify({ stress_triggers: [], emotional_tone: "ok", intensity_score: 999, recurring_pattern: "", reflective_insight: "", suggested_tags: [] });
    expect(parseAnalysisResponse(raw).intensity_score).toBe(10);
  });

  it("handles markdown code fence wrapping", () => {
    const raw = "```json\n" + JSON.stringify({ stress_triggers: [], emotional_tone: "calm", intensity_score: 2, recurring_pattern: "none", reflective_insight: "Great.", suggested_tags: [] }) + "\n```";
    expect(parseAnalysisResponse(raw).emotional_tone).toBe("calm");
  });

  it("defaults gracefully on missing fields", () => {
    const raw = JSON.stringify({ intensity_score: 4 });
    const result = parseAnalysisResponse(raw);
    expect(result.emotional_tone).toBe("neutral");
    expect(result.stress_triggers).toEqual([]);
  });
});