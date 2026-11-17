import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Baby,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  Droplets,
  Moon,
  Pill,
  Plus,
  ShieldAlert,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { useBabyMemory } from '../context/BabyMemoryContext';
import { todayIsoDate } from '../lib/validation';
import type { NavTabId } from '../types/babyMemory';

interface OverviewDashboardProps {
  onNavigate: (tab: NavTabId) => void;
  onOpenSettings: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate,
  onOpenSettings,
}) => {
  const {
    t,
    profile,
    healthLogs,
    growthEntries,
    milestones,
    activeAlerts,
    notificationPermission,
    enablePushNotifications,
    triggerTestReminder,
    addHealthLog,
    toggleHealthLogCompleted,
    updateMilestoneStatus,
  } = useBabyMemory();

  const [heroImgError, setHeroImgError] = useState(false);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile.displayName.split(' ')[0] || 'Parent';

  const today = todayIsoDate();
  const todayLogs = healthLogs.filter((l) => l.loggedDate === today);

  const waterMl = todayLogs
    .filter((l) => l.logType === 'water')
    .reduce((sum, l) => sum + l.valueNum, 0);
  const tablets = todayLogs.filter((l) => l.logType === 'tablet');
  const tabletsDone = tablets.filter((l) => l.completed).length;
  const tabletPct = tablets.length > 0 ? Math.round((tabletsDone / tablets.length) * 100) : 100;
  const sleepHours = todayLogs
    .filter((l) => l.logType === 'sleep')
    .reduce((sum, l) => sum + l.valueNum, 0);
  const feedingsToday = todayLogs.filter(
    (l) => l.logType === 'feeding' || l.logType === 'food'
  ).length;

  const sortedGrowth = [...growthEntries].sort((a, b) => a.weekNumber - b.weekNumber);
  const latestGrowth = sortedGrowth[sortedGrowth.length - 1];

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const nextMilestone = [...milestones]
    .filter((m) => m.status !== 'completed')
    .sort((a, b) => a.weekTarget - b.weekTarget)[0];
  const milestonePct =
    milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 100;

  const vaccineMilestones = milestones.filter(
    (m) => m.category === 'vaccine' || m.category === 'checkup_10w'
  );
  const vaccineDone = vaccineMilestones.filter((m) => m.status === 'completed').length;

  const waterPct = Math.min(100, Math.round((waterMl / Math.max(1, profile.dailyWaterGoalMl)) * 100));
  const weightGoalPct = latestGrowth
    ? Math.min(100, Math.round((latestGrowth.weightKg / Math.max(1, profile.targetWeightKg)) * 100))
    : 0;
  const sleepGoalPct = Math.min(
    100,
    Math.round((sleepHours / Math.max(1, profile.dailySleepGoalHours)) * 100)
  );
  const vaccinePct =
    vaccineMilestones.length > 0
      ? Math.round((vaccineDone / vaccineMilestones.length) * 100)
      : 100;

  return (
    <div className="space-y-8">
      {/* Top 2-Column Editorial Hero Split (items-stretch) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-3">
              <span className="font-medium text-blush-700 dark:text-blush-300">
                {profile.parentStage === 'expecting' ? t.expectingStage : t.newParentStage}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {t.weekLabel} {profile.currentWeek}
              </span>
              <span aria-hidden="true">·</span>
              <span>{profile.babyName || 'Family Care'}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight text-balance max-w-2xl">
              {greeting}, {firstName}. Everything for {profile.babyName || 'your little one'} in one calm space.
            </h1>

            <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl dark:tracking-[0.01em]">
              {nextMilestone
                ? `Next up: ${nextMilestone.title} (Week ${nextMilestone.weekTarget} · ${nextMilestone.scheduledDate}).`
                : 'All scheduled WHO checkups are complete. Keep logging daily hydration, rest, and nutrition.'}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('daily')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>Open Daily Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('milestones')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-sage-800 dark:text-sage-200 bg-sage-50 dark:bg-sage-950/50 border border-sage-200 dark:border-sage-800 hover:bg-sage-100 dark:hover:bg-sage-900/50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>WHO Checkups</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('locator')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blush-700 dark:text-blush-300 bg-blush-50 dark:bg-blush-950/40 border border-blush-200 dark:border-blush-900 hover:bg-blush-100 dark:hover:bg-blush-900/40 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t.emergencySos}</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full bg-sage-50 dark:bg-stone-800">
          {!heroImgError ? (
            <img
              src="/src/assets/images/hero_nursery_morning_1794935391695.jpg"
              alt="Parent holding baby in sunlit nursery"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-sage-50 to-blush-50 dark:from-stone-800 dark:to-stone-900">
              <Baby className="w-10 h-10 text-sage-700 dark:text-sage-300 mb-2" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                {profile.babyName || 'Nurtura'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Full-Width 4-Column Tabular KPI Strip with calm visual progress bars */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>{t.hydrationGoal}</span>
              <Droplets className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            </div>
            <p className="mt-2 font-mono-tabular text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {waterMl} / {profile.dailyWaterGoalMl} ml
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-mono-tabular">
              {waterPct}% of daily target
            </p>
          </div>
          <div className="mt-3 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div className="h-full bg-sage-600 dark:bg-sage-400 transition-all" style={{ width: `${waterPct}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>{t.tabletsToday}</span>
              <Pill className="w-4 h-4 text-blush-600 dark:text-blush-300" />
            </div>
            <p className="mt-2 font-mono-tabular text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {tabletsDone} / {tablets.length} doses
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {tablets.length - tabletsDone === 0 ? 'All doses taken today' : `${tablets.length - tabletsDone} dose pending`}
            </p>
          </div>
          <div className="mt-3 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div className="h-full bg-blush-500 dark:bg-blush-300 transition-all" style={{ width: `${tabletPct}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>{t.sleepLogged}</span>
              <Moon className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            </div>
            <p className="mt-2 font-mono-tabular text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {sleepHours.toFixed(1)} hrs
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-mono-tabular">
              {feedingsToday} meals &amp; feedings logged
            </p>
          </div>
          <div className="mt-3 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div className="h-full bg-sage-600 dark:bg-sage-400 transition-all" style={{ width: `${sleepGoalPct}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Latest Weight &amp; Milestones</span>
              <TrendingUp className="w-4 h-4 text-sage-600 dark:text-sage-400" />
            </div>
            <p className="mt-2 font-mono-tabular text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {latestGrowth ? `${latestGrowth.weightKg} kg` : '--'}
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-mono-tabular">
              {completedMilestones}/{milestones.length} checkups complete
            </p>
          </div>
          <div className="mt-3 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div className="h-full bg-sage-600 dark:bg-sage-400 transition-all" style={{ width: `${milestonePct}%` }} />
          </div>
        </div>
      </section>

      {/* Main Content Split: Quick Actions + Parent Goals | Upcoming Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Quick Log + Parent Goals Health Analysis */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                {t.quickLogTitle}
              </h2>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                One tap saves instantly
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() =>
                  void addHealthLog({
                    logType: 'water',
                    title: 'Quick Hydration Glass',
                    valueNum: 250,
                    unit: 'ml',
                  })
                }
                className="flex flex-col items-start justify-between gap-2 min-h-[76px] p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-sage-50/40 dark:bg-stone-800/40 hover:bg-sage-50 dark:hover:bg-stone-800 transition-colors text-left"
              >
                <Droplets className="w-4 h-4 text-sage-700 dark:text-sage-300" />
                <div>
                  <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {t.addWater250}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">Hydration</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  void addHealthLog({
                    logType: 'feeding',
                    title: profile.parentStage === 'expecting' ? 'Balanced Meal' : 'Feeding Session',
                    valueNum: 120,
                    unit: profile.parentStage === 'expecting' ? 'kcal' : 'ml',
                  })
                }
                className="flex flex-col items-start justify-between gap-2 min-h-[76px] p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-blush-50/40 dark:bg-stone-800/40 hover:bg-blush-50 dark:hover:bg-stone-800 transition-colors text-left"
              >
                <Utensils className="w-4 h-4 text-blush-600 dark:text-blush-300" />
                <div>
                  <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {t.logFeeding}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    {profile.parentStage === 'expecting' ? 'Nutrition' : '120 ml feed'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  void addHealthLog({
                    logType: 'sleep',
                    title: 'Nap / Rest Block',
                    valueNum: 1.5,
                    unit: 'hrs',
                  })
                }
                className="flex flex-col items-start justify-between gap-2 min-h-[76px] p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-sage-50/40 dark:bg-stone-800/40 hover:bg-sage-50 dark:hover:bg-stone-800 transition-colors text-left"
              >
                <Moon className="w-4 h-4 text-sage-700 dark:text-sage-300" />
                <div>
                  <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {t.logSleep}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">+1.5 hrs rest</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('daily')}
                className="flex flex-col items-start justify-between gap-2 min-h-[76px] p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors text-left"
              >
                <Plus className="w-4 h-4 text-sage-700 dark:text-sage-300" />
                <div>
                  <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {t.logTablet}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">Custom log</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                {t.parentGoalsTitle}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('milestones')}
                className="text-xs font-medium text-sage-700 dark:text-sage-300 hover:underline whitespace-nowrap"
              >
                View Growth Chart
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: 'Baby Weight Target',
                  detail: `${latestGrowth?.weightKg ?? '--'} kg of ${profile.targetWeightKg} kg goal`,
                  pct: weightGoalPct,
                },
                {
                  label: 'Vaccination & Checkup Schedule',
                  detail: `${vaccineDone} of ${vaccineMilestones.length} scheduled milestones`,
                  pct: vaccinePct,
                },
                {
                  label: 'Daily Hydration Adherence',
                  detail: `${waterMl} ml of ${profile.dailyWaterGoalMl} ml target`,
                  pct: waterPct,
                },
                {
                  label: 'Sleep Pattern Goal',
                  detail: `${sleepHours.toFixed(1)} hrs of ${profile.dailySleepGoalHours} hrs target`,
                  pct: sleepGoalPct,
                },
              ].map((goal) => (
                <div key={goal.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {goal.label}
                    </span>
                    <span className="font-mono-tabular text-stone-500 dark:text-stone-400">
                      {goal.detail} ({goal.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage-600 dark:bg-sage-400 transition-all duration-200"
                      style={{ width: `${goal.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Push Notification & Upcoming Alerts Center */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                {t.upcomingAlertsTitle}
              </h2>
              {notificationPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={() => void enablePushNotifications()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap shrink-0"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>{t.enableAlerts}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerTestReminder}
                  className="px-3 py-1.5 text-xs font-medium text-sage-700 dark:text-sage-300 border border-sage-200 dark:border-sage-800 rounded-lg hover:bg-sage-50 dark:hover:bg-sage-950/40 whitespace-nowrap shrink-0"
                >
                  Send Alert Now
                </button>
              )}
            </div>

            {activeAlerts.length === 0 ? (
              <div className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
                All medications and scheduled checkups are caught up.
              </div>
            ) : (
              <div className="divide-y divide-stone-200 dark:divide-stone-800">
                {activeAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertCircle
                          className={`w-4 h-4 shrink-0 ${
                            alert.severity === 'urgent'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        />
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                          {alert.title}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 pl-6">
                        {alert.detail}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (alert.actionType === 'medication') {
                          void toggleHealthLogCompleted(alert.targetId);
                        } else {
                          void updateMilestoneStatus(alert.targetId, 'completed');
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg whitespace-nowrap shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
                      <span>Done</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>Alerts: {notificationPermission === 'granted' ? 'Enabled' : notificationPermission}</span>
            <button
              type="button"
              onClick={() => onNavigate('wellness')}
              className="font-medium text-sage-700 dark:text-sage-300 hover:underline whitespace-nowrap"
            >
              View Personalized Diet Plan
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
