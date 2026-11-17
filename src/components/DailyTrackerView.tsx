import React, { useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Circle,
  Droplets,
  Moon,
  Pill,
  Plus,
  Search,
  Trash2,
  Utensils,
} from 'lucide-react';
import { useBabyMemory } from '../context/BabyMemoryContext';
import { currentTimeHHMM, todayIsoDate } from '../lib/validation';
import type { HealthLogType } from '../types/babyMemory';

const LOG_TABS: { id: 'all' | HealthLogType; label: string }[] = [
  { id: 'all', label: 'All Logs' },
  { id: 'tablet', label: 'Tablets & Medicine' },
  { id: 'water', label: 'Water' },
  { id: 'food', label: 'Food' },
  { id: 'feeding', label: 'Feeding Schedule' },
  { id: 'sleep', label: 'Sleep Pattern' },
  { id: 'activity', label: 'Daily Activity' },
];

const CATEGORY_CHOICES: {
  id: HealthLogType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'tablet', label: 'Medicine', icon: Pill },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'food', label: 'Meal', icon: Utensils },
  { id: 'feeding', label: 'Baby Feed', icon: Utensils },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const QUICK_PRESETS: {
  label: string;
  logType: HealthLogType;
  title: string;
  valueNum: number;
  unit: string;
}[] = [
  { label: '+250 ml Water', logType: 'water', title: 'Water Glass', valueNum: 250, unit: 'ml' },
  { label: '+500 ml Bottle', logType: 'water', title: 'Water Bottle', valueNum: 500, unit: 'ml' },
  { label: 'Feed 120 ml', logType: 'feeding', title: 'Baby Feeding Session', valueNum: 120, unit: 'ml' },
  { label: 'Nap 1.5 hrs', logType: 'sleep', title: 'Daytime Nap', valueNum: 1.5, unit: 'hrs' },
  { label: 'Vitamin D3', logType: 'tablet', title: 'Baby Vitamin D3 Drops (400 IU)', valueNum: 1, unit: 'drop' },
  { label: 'Tummy Time 15m', logType: 'activity', title: 'Tummy Time', valueNum: 15, unit: 'min' },
];

export const DailyTrackerView: React.FC = () => {
  const {
    profile,
    healthLogs,
    addHealthLog,
    toggleHealthLogCompleted,
    deleteHealthLog,
  } = useBabyMemory();

  const [filter, setFilter] = useState<'all' | HealthLogType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);

  const [logType, setLogType] = useState<HealthLogType>('tablet');
  const [title, setTitle] = useState('');
  const [valueNum, setValueNum] = useState('1');
  const [unit, setUnit] = useState('tablet');
  const [loggedTime, setLoggedTime] = useState(currentTimeHHMM());
  const [notes, setNotes] = useState('');

  const today = todayIsoDate();
  const todayLogs = useMemo(
    () => healthLogs.filter((l) => l.loggedDate === today),
    [healthLogs, today]
  );

  const visibleLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = healthLogs.filter((l) => {
      if (todayOnly && l.loggedDate !== today) return false;
      if (filter !== 'all' && l.logType !== filter) return false;
      if (q && !l.title.toLowerCase().includes(q) && !l.notes.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
    return [...list].sort((a, b) => b.loggedTime.localeCompare(a.loggedTime));
  }, [healthLogs, filter, searchQuery, todayOnly, today]);

  const metrics = useMemo(() => {
    const water = todayLogs
      .filter((l) => l.logType === 'water')
      .reduce((s, l) => s + l.valueNum, 0);
    const sleep = todayLogs
      .filter((l) => l.logType === 'sleep')
      .reduce((s, l) => s + l.valueNum, 0);
    const activityMin = todayLogs
      .filter((l) => l.logType === 'activity')
      .reduce((s, l) => s + l.valueNum, 0);
    const tabletsAll = todayLogs.filter((l) => l.logType === 'tablet');
    const tabletsDone = tabletsAll.filter((l) => l.completed).length;
    const feedCount = todayLogs.filter((l) => l.logType === 'feeding' || l.logType === 'food').length;

    return {
      water,
      waterPct: Math.min(100, Math.round((water / Math.max(1, profile.dailyWaterGoalMl)) * 100)),
      sleep,
      sleepPct: Math.min(100, Math.round((sleep / Math.max(1, profile.dailySleepGoalHours)) * 100)),
      activityMin,
      activityPct: Math.min(100, Math.round((activityMin / 45) * 100)),
      tabletsDone,
      tabletsTotal: tabletsAll.length,
      tabletPct: tabletsAll.length > 0 ? Math.round((tabletsDone / tabletsAll.length) * 100) : 100,
      feedCount,
      feedPct: Math.min(100, Math.round((feedCount / 6) * 100)),
    };
  }, [todayLogs, profile]);

  const handleLogTypeChange = (next: HealthLogType) => {
    setLogType(next);
    if (next === 'water') {
      setUnit('ml');
      setValueNum('250');
    } else if (next === 'sleep') {
      setUnit('hrs');
      setValueNum('2');
    } else if (next === 'activity') {
      setUnit('min');
      setValueNum('20');
    } else if (next === 'feeding') {
      setUnit('ml');
      setValueNum('120');
    } else if (next === 'food') {
      setUnit('kcal');
      setValueNum('350');
    } else {
      setUnit('tablet');
      setValueNum('1');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addHealthLog({
      logType,
      title,
      valueNum: Number(valueNum) || 0,
      unit,
      notes,
      loggedTime,
      completed: logType !== 'tablet',
    });
    setTitle('');
    setNotes('');
  };

  const progressBars = [
    { label: 'Hydration', value: `${metrics.water} ml`, pct: metrics.waterPct, icon: Droplets, tone: 'sage' as const },
    { label: 'Tablets Adherence', value: `${metrics.tabletsDone}/${metrics.tabletsTotal}`, pct: metrics.tabletPct, icon: Pill, tone: 'blush' as const },
    { label: 'Sleep Pattern', value: `${metrics.sleep.toFixed(1)} hrs`, pct: metrics.sleepPct, icon: Moon, tone: 'sage' as const },
    { label: 'Nutrition & Feeds', value: `${metrics.feedCount} logs`, pct: metrics.feedPct, icon: Utensils, tone: 'blush' as const },
    { label: 'Daily Activity', value: `${metrics.activityMin} min`, pct: metrics.activityPct, icon: Activity, tone: 'sage' as const },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            Daily Care, Medicine, Nutrition &amp; Sleep Tracking
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            Tap a quick preset or log custom tablets, water, feedings, sleep blocks, and daily gentle activity.
          </p>
        </div>
        <span className="font-mono-tabular text-xs text-stone-500 dark:text-stone-400">
          Date: {today}
        </span>
      </div>

      {/* Daily Activity Progress SVG Charts */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
            Daily Activity &amp; Adherence Progress Charts
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  void addHealthLog({
                    logType: preset.logType,
                    title: preset.title,
                    valueNum: preset.valueNum,
                    unit: preset.unit,
                    completed: true,
                  })
                }
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-sage-200 dark:border-sage-800 bg-sage-50/70 dark:bg-sage-950/40 text-sage-800 dark:text-sage-200 hover:bg-sage-100 dark:hover:bg-sage-900/60 transition-colors whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pt-2">
          {progressBars.map((item) => {
            const Icon = item.icon;
            const radius = 32;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (item.pct / 100) * circumference;
            const strokeClass =
              item.tone === 'blush'
                ? 'text-blush-500 dark:text-blush-300'
                : 'text-sage-600 dark:text-sage-400';
            return (
              <div key={item.label} className="flex flex-col items-center text-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-stone-100 dark:text-stone-800"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      className={`${strokeClass} transition-all duration-300`}
                    />
                  </svg>
                  <span className="absolute font-mono-tabular text-xs font-semibold text-stone-900 dark:text-stone-100">
                    {item.pct}%
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-stone-800 dark:text-stone-200">
                  <Icon className={`w-3.5 h-3.5 ${strokeClass}`} />
                  <span>{item.label}</span>
                </div>
                <span className="font-mono-tabular text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form: Log New Daily Item */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
            Add Custom Entry
          </h2>

          <div>
            <span className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-2">
              Choose Category
            </span>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_CHOICES.map((cat) => {
                const Icon = cat.icon;
                const active = logType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleLogTypeChange(cat.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      active
                        ? 'bg-sage-700 text-white border-sage-700 dark:bg-sage-600 dark:border-sage-600'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-full">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Item or Dose Name
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                logType === 'tablet'
                  ? 'e.g., Prenatal DHA 200mg'
                  : logType === 'feeding'
                  ? 'e.g., Afternoon Formula / Nursing'
                  : 'e.g., Lentil & Spinach Soup'
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Amount
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10000"
                value={valueNum}
                onChange={(e) => setValueNum(e.target.value)}
                className="w-full px-2.5 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Unit
              </label>
              <input
                type="text"
                maxLength={24}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-2.5 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={loggedTime}
                onChange={(e) => setLoggedTime(e.target.value)}
                className="w-full px-2 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Clinical / Care Notes
            </label>
            <textarea
              rows={2}
              maxLength={400}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes on tolerance, mood, or timing"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Save Daily Entry</span>
          </button>
        </form>

        {/* Log Ledger */}
        <div className="lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine, meals, or notes..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            <button
              type="button"
              onClick={() => setTodayOnly((v) => !v)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                todayOnly
                  ? 'bg-sage-50 dark:bg-sage-950/50 border-sage-300 dark:border-sage-700 text-sage-800 dark:text-sage-200'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              {todayOnly ? 'Showing Today Only' : 'Show Today Only'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
            {LOG_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab.id
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {visibleLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-500 dark:text-stone-400">
              No matching logs found. Try clearing your filter or tap a quick preset above.
            </div>
          ) : (
            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {visibleLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => void toggleHealthLogCompleted(log.id)}
                      className="mt-0.5 text-sage-600 dark:text-sage-400 hover:text-sage-800 shrink-0"
                      aria-label={log.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {log.completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-400" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          log.completed
                            ? 'text-stone-900 dark:text-stone-100'
                            : 'text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {log.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <span className="capitalize">{log.logType}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {log.valueNum} {log.unit}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {log.loggedDate} {log.loggedTime}
                        </span>
                        {log.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-xs">{log.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void deleteHealthLog(log.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg shrink-0"
                    aria-label="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
