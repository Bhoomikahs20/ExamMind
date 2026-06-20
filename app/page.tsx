"use client";
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sparkles, BarChart2, MessageCircle, Heart, Share2, Database } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import CheckIn from "@/components/CheckIn";
import Dashboard from "@/components/Dashboard";
import ChatCompanion from "@/components/ChatCompanion";
import MindfulnessLibrary from "@/components/MindfulnessLibrary";
import { StreakCard, ReframeCard } from "@/components/MotivationalLayer";
import WellnessSummaryExport from "@/components/WellnessSummaryExport";
import FontSizeControl from "@/components/FontSizeControl";
import {
  getEntries, getAnalyses, getTodayEntry, getAnalysisForEntry,
  calculateStreak, getMoodTrend, getTagFrequency, seedDemoData, clearAllData, getDeviceId
} from "@/lib/storage";
import { buildWellnessSummary } from "@/lib/mood-utils";
import type { CheckInEntry, AIAnalysis, WellnessSummary } from "@/types";

export default function Home() {
  const [entries, setEntries] = useState<CheckInEntry[]>([]);
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [todayEntry, setTodayEntry] = useState<CheckInEntry | undefined>();
  const [latestAnalysis, setLatestAnalysis] = useState<AIAnalysis | undefined>();
  const [weeklyInsight, setWeeklyInsight] = useState("");
  const [wellnessSummary, setWellnessSummary] = useState<WellnessSummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [tab, setTab] = useState("checkin");

  const refreshData = useCallback(() => {
    const e = getEntries();
    const a = getAnalyses();
    const today = getTodayEntry();
    const la = today?.analysisId ? getAnalysisForEntry(today.id) : a.sort((x, y) => y.analyzed_at - x.analyzed_at)[0];
    setEntries(e);
    setAnalyses(a);
    setTodayEntry(today);
    setLatestAnalysis(la);
  }, []);

  useEffect(() => {
    getDeviceId(); // Initialise anonymous device ID
    refreshData();
  }, [refreshData]);

  const fetchWeeklyInsight = useCallback(async (e: CheckInEntry[], a: AIAnalysis[]) => {
    if (e.length < 2) return;
    try {
      const moodTrend = e.slice(-7).map(x => ({ date: x.date, mood: x.mood }));
      const tagFreq = getTagFrequency(7);
      const avg = moodTrend.reduce((s, x) => s + x.mood, 0) / moodTrend.length;
      const res = await fetch("/api/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodTrend, topTriggers: tagFreq, averageMood: avg }),
      });
      const data = await res.json();
      if (data.insight) setWeeklyInsight(data.insight);
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    if (entries.length >= 2) fetchWeeklyInsight(entries, analyses);
  }, [entries.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckInComplete = useCallback((entry: CheckInEntry, analysis?: AIAnalysis) => {
    refreshData();
    setTab("dashboard");
    toast.success("Check-in saved!", { description: analysis?.reflective_insight });
  }, [refreshData]);

  const handleGenerateSummary = useCallback(() => {
    const summary = buildWellnessSummary(entries, analyses, weeklyInsight);
    setWellnessSummary(summary);
    setShowSummary(true);
  }, [entries, analyses, weeklyInsight]);

  const handleSeedDemo = useCallback(() => {
    seedDemoData();
    refreshData();
    toast.success("Demo data loaded!", { description: "7 days of sample entries are ready." });
    setTab("dashboard");
  }, [refreshData]);

  const latestIntensity = latestAnalysis?.intensity_score ?? 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-background">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" aria-hidden="true" />
            <h1 className="text-lg font-bold text-violet-800">ExamMind</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">AI Wellness Companion</span>
          </div>
          <div className="flex items-center gap-2">
            <FontSizeControl />
            {entries.length === 0 && (
              <Button size="sm" variant="outline" onClick={handleSeedDemo} className="text-xs">
                <Database className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Load Demo
              </Button>
            )}
            {entries.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleGenerateSummary} className="text-xs">
                <Share2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Share Report
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Wellness Summary Modal */}
        {showSummary && wellnessSummary && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="summary-modal-title"
          >
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 id="summary-modal-title" className="font-semibold">Shareable Wellness Report</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSummary(false)}
                  aria-label="Close wellness report"
                >
                  Close
                </Button>
              </div>
              <WellnessSummaryExport summary={wellnessSummary} />
            </div>
          </div>
        )}

        {/* Motivational row — only show when there are entries */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <StreakCard />
            <ReframeCard />
          </div>
        )}

        {/* Main tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full" aria-label="App sections">
            <TabsTrigger value="checkin" className="text-xs sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 mr-1 sm:mr-1.5" aria-hidden="true" />
              <span>Today</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
              <BarChart2 className="h-3.5 w-3.5 mr-1 sm:mr-1.5" aria-hidden="true" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5 mr-1 sm:mr-1.5" aria-hidden="true" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="mindfulness" className="text-xs sm:text-sm">
              <Heart className="h-3.5 w-3.5 mr-1 sm:mr-1.5" aria-hidden="true" />
              <span>Calm</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="mt-4">
            {todayEntry ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-800 font-medium">✓ You have checked in today</p>
                  {latestAnalysis && <p className="text-green-600 text-sm mt-1">{latestAnalysis.reflective_insight}</p>}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setTodayEntry(undefined)}>
                  Update today&apos;s entry
                </Button>
              </div>
            ) : (
              <CheckIn onComplete={handleCheckInComplete} />
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4">
            <Dashboard entries={entries} analyses={analyses} weeklyInsight={weeklyInsight} />
            {entries.length === 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={handleSeedDemo}>
                  <Database className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Load 7-day demo data
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <div className="border rounded-xl overflow-hidden min-h-[500px]">
              <ChatCompanion recentEntry={todayEntry} recentAnalysis={latestAnalysis} />
            </div>
          </TabsContent>

          <TabsContent value="mindfulness" className="mt-4">
            <MindfulnessLibrary intensityScore={latestIntensity} />
          </TabsContent>
        </Tabs>

        <Separator />
        <p className="text-xs text-center text-muted-foreground pb-4">
          ExamMind stores all data on your device only. Nothing is shared without your action.
          Not a substitute for professional mental health support.
        </p>
      </main>
    </div>
  );
}