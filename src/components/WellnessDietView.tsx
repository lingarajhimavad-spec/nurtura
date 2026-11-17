import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Utensils,
} from 'lucide-react';
import { useBabyMemory } from '../context/BabyMemoryContext';
import {
  buildRealtimeDietaryPlan,
  getTailoredAvoidanceList,
  getTailoredYogaSessions,
  HEALTH_CONDITION_OPTIONS,
  type YogaSession,
} from '../lib/clinicalGuidance';
import { todayIsoDate } from '../lib/validation';
import type { HealthConditionId } from '../types/babyMemory';

export const WellnessDietView: React.FC = () => {
  const { t, profile, healthLogs, updateProfile, addHealthLog } = useBabyMemory();

  const today = todayIsoDate();
  const todayLogs = useMemo(
    () => healthLogs.filter((l) => l.loggedDate === today),
    [healthLogs, today]
  );

  const dietaryPlan = useMemo(
    () => buildRealtimeDietaryPlan(profile, todayLogs),
    [profile, todayLogs]
  );
  const avoidanceList = useMemo(
    () => getTailoredAvoidanceList(profile.parentStage, profile.healthConditions),
    [profile.parentStage, profile.healthConditions]
  );
  const yogaSessions = useMemo(
    () => getTailoredYogaSessions(profile.parentStage, profile.healthConditions),
    [profile.parentStage, profile.healthConditions]
  );

  const [activeSession, setActiveSession] = useState<YogaSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          if (activeSession) {
            void addHealthLog({
              logType: 'activity',
              title: `Yoga & Meditation: ${activeSession.title}`,
              valueNum: activeSession.durationMin,
              unit: 'min',
              notes: activeSession.breathPattern,
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, secondsLeft, activeSession, addHealthLog]);

  const toggleCondition = (condId: HealthConditionId) => {
    const exists = profile.healthConditions.includes(condId);
    const updated = exists
      ? profile.healthConditions.filter((c) => c !== condId)
      : [...profile.healthConditions, condId];
    void updateProfile({ healthConditions: updated });
  };

  const startSession = (session: YogaSession) => {
    setActiveSession(session);
    setSecondsLeft(session.durationMin * 60);
    setRunning(true);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Personalized Diet, Avoidance Guide &amp; Tailored Yoga
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
          Guidance adapts gently to your stage, health profile, and today’s real-time nutrition and hydration logs.
        </p>
      </div>

      {/* Personal Health Conditions Selector */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
            Active Health Profile &amp; Conditions
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            Tap any condition to tailor meals, avoidance rules, and safe yoga cues
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {HEALTH_CONDITION_OPTIONS.map((opt) => {
            const selected = profile.healthConditions.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleCondition(opt.id)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  selected
                    ? 'bg-sage-700 text-white border-sage-700 dark:bg-sage-600 dark:border-sage-600'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Real-Time Personalized Dietary Plan */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-sage-600 dark:text-sage-400" />
              <span>{t.dietaryPlanTitle}</span>
            </h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {dietaryPlan.targetCaloriesNote}
            </p>
          </div>
          <div className="text-xs font-mono-tabular text-stone-600 dark:text-stone-300">
            Today: {dietaryPlan.waterLoggedMl}/{dietaryPlan.waterGoalMl} ml water · {dietaryPlan.mealsLoggedCount} meals logged
          </div>
        </div>

        {dietaryPlan.gaps.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-1.5">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Real-Time Nutrition &amp; Hydration Adjustments Needed Today
            </p>
            <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc pl-4">
              {dietaryPlan.gaps.map((gap, i) => (
                <li key={i}>{gap}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dietaryPlan.mealSlots.map((slot) => (
            <div
              key={slot.slot}
              className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-mono-tabular font-semibold text-stone-800 dark:text-stone-200">
                    {slot.slot}
                  </span>
                  <span>{slot.nutrients}</span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {slot.meal}
                </p>
                <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {slot.reason}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    void addHealthLog({
                      logType: 'food',
                      title: slot.meal,
                      valueNum: 380,
                      unit: 'kcal',
                      notes: slot.nutrients,
                      completed: true,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300 bg-white dark:bg-stone-900 hover:bg-sage-50 dark:hover:bg-sage-950/50 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log This Meal</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What to Avoid & Yoga Meditation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-blush-600 dark:text-blush-300" />
            <span>{t.whatToAvoidTitle}</span>
          </h2>
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {avoidanceList.map((item, idx) => (
              <div key={idx} className="py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {item.item}
                  </p>
                  <span
                    className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                      item.severity === 'strict'
                        ? 'text-blush-700 dark:text-blush-300'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.severity === 'strict' ? 'Avoid strictly' : 'Caution'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {item.reason}
                </p>
                <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                  Applies to: {item.appliesTo}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-5">
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            <span>{t.yogaMeditationTitle}</span>
          </h2>

          {activeSession && (
            <div className="p-5 rounded-xl bg-sage-900 text-white space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-sage-200">Active Guided Session</p>
                  <p className="font-display text-base font-semibold">{activeSession.title}</p>
                </div>
                <span className="font-mono-tabular text-2xl font-bold">
                  {formatTimer(secondsLeft)}
                </span>
              </div>
              <p className="text-xs text-sage-100">
                Breathing Cadence: {activeSession.breathPattern}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sage-600 hover:bg-sage-500 rounded-lg whitespace-nowrap"
                >
                  {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{running ? 'Pause' : 'Resume'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRunning(false);
                    setSecondsLeft(activeSession.durationMin * 60);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-sage-800 hover:bg-sage-700 rounded-lg whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRunning(false);
                    void addHealthLog({
                      logType: 'activity',
                      title: `Yoga & Meditation: ${activeSession.title}`,
                      valueNum: activeSession.durationMin,
                      unit: 'min',
                      notes: activeSession.breathPattern,
                    });
                    setActiveSession(null);
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-sage-900 hover:bg-sage-50 rounded-lg whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Log Complete</span>
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {yogaSessions.map((session) => (
              <div key={session.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {session.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400 font-mono-tabular">
                      {session.durationMin} min · {session.breathPattern}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startSession(session)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start</span>
                  </button>
                </div>
                <p className="mt-2 text-xs text-stone-600 dark:text-stone-300">
                  Poses: {session.poses.join(' · ')}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Safety: {session.safetyNote}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
