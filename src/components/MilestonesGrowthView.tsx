import React, { useMemo, useState } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  ShieldCheck,
  Stethoscope,
  Syringe,
} from 'lucide-react';
import { useBabyMemory } from '../context/BabyMemoryContext';
import {
  computeWhoCheckupDate,
  WHO_ANTENATAL_CHECKUPS,
  WHO_POSTNATAL_INFANT_CHECKUPS,
  type WhoCheckupItem,
  type WhoCheckupProgram,
} from '../lib/clinicalGuidance';
import { todayIsoDate } from '../lib/validation';
import type { Milestone, MilestoneCategory } from '../types/babyMemory';

function matchWhoCheckupToMilestone(
  milestones: Milestone[],
  item: WhoCheckupItem
): Milestone | undefined {
  const prefix = item.title.split(':')[0].toLowerCase();
  return milestones.find((m) => {
    const lowerTitle = m.title.toLowerCase();
    if (lowerTitle.includes(prefix)) return true;
    if (
      item.program === 'pnc_epi' &&
      (item.category === 'checkup_5w' ||
        item.category === 'checkup_10w' ||
        item.category === 'checkup_20w')
    ) {
      return m.category === item.category;
    }
    if (
      item.program === 'anc' &&
      item.weekTarget === 20 &&
      m.category === 'checkup_20w' &&
      lowerTitle.includes('anc')
    ) {
      return true;
    }
    return false;
  });
}

export const MilestonesGrowthView: React.FC = () => {
  const {
    t,
    profile,
    milestones,
    growthEntries,
    addMilestone,
    updateMilestoneStatus,
    addGrowthEntry,
  } = useBabyMemory();

  const [whoProgram, setWhoProgram] = useState<WhoCheckupProgram>(
    profile.parentStage === 'expecting' ? 'anc' : 'pnc_epi'
  );
  const [whoStatusFilter, setWhoStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedWhoIds, setExpandedWhoIds] = useState<Record<string, boolean>>({});
  const [syncingWho, setSyncingWho] = useState(false);

  const [msCategory, setMsCategory] = useState<MilestoneCategory>('vaccine');
  const [msTitle, setMsTitle] = useState('');
  const [msWeek, setMsWeek] = useState(String(profile.currentWeek));
  const [msDate, setMsDate] = useState(todayIsoDate());
  const [msDoctor, setMsDoctor] = useState('Dr. Sarah Jenkins');
  const [msNotes, setMsNotes] = useState('');

  const [grWeek, setGrWeek] = useState(String(profile.currentWeek + 1));
  const [grDate, setGrDate] = useState(todayIsoDate());
  const [grWeight, setGrWeight] = useState('5.8');
  const [grHeight, setGrHeight] = useState('59.4');
  const [grHead, setGrHead] = useState('39.5');
  const [grNotes, setGrNotes] = useState('');

  const [chartMetric, setChartMetric] = useState<'weightKg' | 'heightCm' | 'headCm'>('weightKg');

  const keyCheckups = useMemo(() => {
    const targets = [
      { week: 5, category: 'checkup_5w' as const, label: t.checkup5w, focus: 'Postpartum recovery, weight regain, umbilical healing & early reflexes' },
      { week: 10, category: 'checkup_10w' as const, label: t.checkup10w, focus: 'DTaP/IPV/Hib/Rotavirus Dose 2, social smile, head control & maternal ferritin' },
      { week: 20, category: 'checkup_20w' as const, label: t.checkup20w, focus: 'Rolling milestones, anatomy/ultrasound (expecting) or solids readiness screen' },
    ];
    return targets.map((item) => {
      const matched = milestones.find(
        (m) => m.category === item.category || m.weekTarget === item.week
      );
      return { ...item, matched };
    });
  }, [milestones, t]);

  const sortedGrowth = useMemo(
    () => [...growthEntries].sort((a, b) => a.weekNumber - b.weekNumber),
    [growthEntries]
  );

  // Compute SVG polyline points for growth chart
  const chartData = useMemo(() => {
    const width = 620;
    const height = 220;
    const padX = 44;
    const padY = 24;
    if (sortedGrowth.length === 0) {
      return { width, height, points: '', dots: [] as { x: number; y: number; week: number; val: number }[], minVal: 0, maxVal: 10 };
    }
    const vals = sortedGrowth.map((g) => g[chartMetric]);
    const minVal = Math.max(0, Math.floor(Math.min(...vals) * 0.9));
    const maxVal = Math.ceil(Math.max(...vals) * 1.1) || 10;
    const minW = Math.min(...sortedGrowth.map((g) => g.weekNumber));
    const maxW = Math.max(...sortedGrowth.map((g) => g.weekNumber), minW + 1);

    const dots = sortedGrowth.map((g) => {
      const x = padX + ((g.weekNumber - minW) / (maxW - minW)) * (width - padX * 2);
      const y = height - padY - ((g[chartMetric] - minVal) / (maxVal - minVal || 1)) * (height - padY * 2);
      return { x, y, week: g.weekNumber, val: g[chartMetric] };
    });

    const points = dots.map((d) => `${d.x},${d.y}`).join(' ');
    return { width, height, points, dots, minVal, maxVal };
  }, [sortedGrowth, chartMetric]);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim()) return;
    await addMilestone({
      category: msCategory,
      title: msTitle,
      weekTarget: Number(msWeek) || profile.currentWeek,
      scheduledDate: msDate,
      doctorName: msDoctor,
      notes: msNotes,
      reminderEnabled: true,
    });
    setMsTitle('');
    setMsNotes('');
  };

  const handleAddGrowth = async (e: React.FormEvent) => {
    e.preventDefault();
    await addGrowthEntry({
      weekNumber: Number(grWeek) || profile.currentWeek,
      date: grDate,
      weightKg: Number(grWeight) || 0,
      heightCm: Number(grHeight) || 0,
      headCm: Number(grHead) || 0,
      notes: grNotes,
    });
    setGrNotes('');
  };

  const whoItems = useMemo(
    () => (whoProgram === 'anc' ? WHO_ANTENATAL_CHECKUPS : WHO_POSTNATAL_INFANT_CHECKUPS),
    [whoProgram]
  );

  const visibleWhoItems = useMemo(() => {
    return whoItems.filter((item) => {
      const matched = matchWhoCheckupToMilestone(milestones, item);
      if (whoStatusFilter === 'completed') return matched?.status === 'completed';
      if (whoStatusFilter === 'pending') return matched?.status !== 'completed';
      return true;
    });
  }, [whoItems, milestones, whoStatusFilter]);

  const missingWhoItems = useMemo(
    () => whoItems.filter((item) => !matchWhoCheckupToMilestone(milestones, item)),
    [whoItems, milestones]
  );

  const handleAddWhoCheckup = async (item: WhoCheckupItem) => {
    const scheduledDate = computeWhoCheckupDate(profile.dueOrBirthDate, item);
    const notesText = `${item.summaryNote} Checks: ${item.clinicalChecks.join('; ')}. Tests/Vaccines: ${item.vaccinesOrTests.join('; ')}.`;
    await addMilestone({
      category: item.category,
      title: item.title,
      weekTarget: item.weekTarget,
      scheduledDate,
      doctorName:
        item.program === 'anc'
          ? 'OB/GYN Antenatal Clinic'
          : 'Pediatric & Immunization Clinic',
      notes: notesText.slice(0, 500),
      reminderEnabled: true,
    });
  };

  const handleSyncMissingWho = async () => {
    if (syncingWho || missingWhoItems.length === 0) return;
    setSyncingWho(true);
    try {
      for (const item of missingWhoItems) {
        await handleAddWhoCheckup(item);
      }
    } finally {
      setSyncingWho(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          WHO Clinical Checkups, 5 / 10 / 20 Week Milestones &amp; Growth Charts
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
          World Health Organization (WHO) 8-contact antenatal care &amp; postnatal/EPI infant schedules alongside 5 / 10 / 20-week checkups and longitudinal growth charts.
        </p>
      </div>

      {/* 5 / 10 / 20 Week Checkup Spotlight */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {keyCheckups.map((item) => {
          const status = item.matched?.status || 'upcoming';
          return (
            <div
              key={item.week}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-mono-tabular">Target: Week {item.week}</span>
                  <span
                    className={`font-medium ${
                      status === 'completed'
                        ? 'text-sage-700 dark:text-sage-300'
                        : status === 'overdue'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {status === 'completed' ? 'Completed' : status === 'overdue' ? 'Overdue' : item.matched ? 'Scheduled' : 'Not Scheduled'}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                  {item.label}
                </h2>
                <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {item.focus}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
                <span className="font-mono-tabular text-xs text-stone-500 dark:text-stone-400">
                  {item.matched ? item.matched.scheduledDate : `Week ${item.week}`}
                </span>
                {item.matched ? (
                  <button
                    type="button"
                    onClick={() =>
                      void updateMilestoneStatus(
                        item.matched!.id,
                        status === 'completed' ? 'upcoming' : 'completed'
                      )
                    }
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 whitespace-nowrap"
                  >
                    {status === 'completed' ? 'Reopen' : 'Mark Complete'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      void addMilestone({
                        category: item.category,
                        title: item.label,
                        weekTarget: item.week,
                        scheduledDate: todayIsoDate(),
                        doctorName: 'Primary Care Clinic',
                        notes: item.focus,
                        reminderEnabled: true,
                      })
                    }
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300 hover:bg-sage-50 dark:hover:bg-sage-950/40 whitespace-nowrap"
                  >
                    + Schedule
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* WHO Clinical Checkups by Week */}
      <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-sage-600 dark:text-sage-400 shrink-0" />
              <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                WHO Weekly Clinical Checkup Schedule
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-mono-tabular">
              {whoProgram === 'anc'
                ? 'WHO 8-Contact Antenatal Care (Weeks 12–40)'
                : 'WHO 2022 Postnatal Care & EPI Infant Schedule (Day 1–Week 39)'}{' '}
              · Base date: {profile.dueOrBirthDate} · Current: Week {profile.currentWeek}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
              <button
                type="button"
                onClick={() => setWhoProgram('anc')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  whoProgram === 'anc'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Pregnancy ANC (8)
              </button>
              <button
                type="button"
                onClick={() => setWhoProgram('pnc_epi')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  whoProgram === 'pnc_epi'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Postnatal &amp; Infant (9)
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
              {(['all', 'pending', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setWhoStatusFilter(st)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                    whoStatusFilter === st
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {st === 'pending' ? 'Next Up' : st}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={syncingWho || missingWhoItems.length === 0}
              onClick={() => void handleSyncMissingWho()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sage-700 hover:bg-sage-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {missingWhoItems.length === 0
                  ? 'All Contacts Synced'
                  : syncingWho
                  ? 'Syncing...'
                  : `Sync Missing (${missingWhoItems.length})`}
              </span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-stone-200 dark:divide-stone-800">
          {visibleWhoItems.length === 0 ? (
            <p className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
              No WHO contacts match this filter.
            </p>
          ) : (
            visibleWhoItems.map((item) => {
              const matched = matchWhoCheckupToMilestone(milestones, item);
              const estDate = computeWhoCheckupDate(profile.dueOrBirthDate, item);
              const isCurrentFocus =
                Math.abs(item.weekTarget - profile.currentWeek) <= 1 &&
                ((whoProgram === 'anc' && profile.parentStage === 'expecting') ||
                  (whoProgram === 'pnc_epi' && profile.parentStage === 'new_parent'));
              const isExpanded = expandedWhoIds[item.id] ?? isCurrentFocus;

              return (
                <div
                  key={item.id}
                  className="py-4 first:pt-2 last:pb-0 flex flex-col lg:flex-row lg:items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                      <span className="font-mono-tabular font-semibold text-sage-700 dark:text-sage-300">
                        {item.weekLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.contactLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">Est. {matched?.scheduledDate || estDate}</span>
                      {isCurrentFocus && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-blush-700 dark:text-blush-300">
                            Current Window
                          </span>
                        </>
                      )}
                      {matched && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              matched.status === 'completed'
                                ? 'font-medium text-sage-700 dark:text-sage-300'
                                : 'font-medium text-stone-700 dark:text-stone-300'
                            }
                          >
                            {matched.status === 'completed' ? 'Completed in Timeline' : 'In Timeline'}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                      {item.summaryNote}
                    </p>

                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs bg-stone-50/70 dark:bg-stone-800/40 p-3.5 rounded-lg">
                        <div>
                          <p className="font-semibold text-stone-700 dark:text-stone-200 mb-1">
                            Clinical Exams
                          </p>
                          <ul className="space-y-0.5 text-stone-600 dark:text-stone-400">
                            {item.clinicalChecks.map((check) => (
                              <li key={check}>• {check}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-stone-700 dark:text-stone-200 mb-1">
                            Labs, Vaccines &amp; Care
                          </p>
                          <ul className="space-y-0.5 text-stone-600 dark:text-stone-400">
                            {item.vaccinesOrTests.map((vt) => (
                              <li key={vt}>• {vt}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 lg:pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedWhoIds((prev) => ({ ...prev, [item.id]: !isExpanded }))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg whitespace-nowrap shrink-0"
                    >
                      <span>{isExpanded ? 'Hide Checks' : 'View Checks'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {matched ? (
                      <button
                        type="button"
                        onClick={() =>
                          void updateMilestoneStatus(
                            matched.id,
                            matched.status === 'completed' ? 'upcoming' : 'completed'
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 ${
                          matched.status === 'completed'
                            ? 'border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300 bg-sage-50 dark:bg-sage-950/40'
                            : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        {matched.status === 'completed' ? 'Completed (Reopen)' : 'Mark Completed'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleAddWhoCheckup(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300 hover:bg-sage-50 dark:hover:bg-sage-950/40 whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>Add to Timeline</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Growth Chart & Measurement Form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
              {t.growthChartTitle}
            </h2>
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
              {[
                { id: 'weightKg' as const, label: 'Weight (kg)' },
                { id: 'heightCm' as const, label: 'Height (cm)' },
                { id: 'headCm' as const, label: 'Head (cm)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setChartMetric(m.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    chartMetric === m.id
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {sortedGrowth.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-500 dark:text-stone-400">
              Log your first weight, length, and head circumference entry using the form on the right to see your growth curve.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full min-w-[480px] h-56 text-sage-600 dark:text-sage-400"
                role="img"
                aria-label="Growth measurement chart"
              >
                {[0, 0.25, 0.5, 0.75, 1].map((tStep) => {
                  const y = 24 + tStep * (chartData.height - 48);
                  const labelVal = (
                    chartData.maxVal -
                    tStep * (chartData.maxVal - chartData.minVal)
                  ).toFixed(1);
                  return (
                    <g key={tStep}>
                      <line
                        x1={44}
                        y1={y}
                        x2={chartData.width - 44}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={0.14}
                        strokeDasharray="3 3"
                      />
                      <text
                        x={36}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-stone-400 text-[10px] font-mono-tabular"
                      >
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {chartData.points && (
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartData.points}
                  />
                )}

                {chartData.dots.map((d) => (
                  <g key={d.week}>
                    <circle cx={d.x} cy={d.y} r="5" className="fill-sage-700 dark:fill-sage-300" />
                    <text
                      x={d.x}
                      y={d.y - 10}
                      textAnchor="middle"
                      className="fill-stone-700 dark:fill-stone-200 text-[10px] font-mono-tabular font-semibold"
                    >
                      {d.val}
                    </text>
                    <text
                      x={d.x}
                      y={chartData.height - 6}
                      textAnchor="middle"
                      className="fill-stone-500 dark:fill-stone-400 text-[10px] font-mono-tabular"
                    >
                      W{d.week}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}

          <div className="mt-5 overflow-x-auto border-t border-stone-200 dark:border-stone-800 pt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800">
                  <th className="py-2 font-medium">Week</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium text-right">Weight (kg)</th>
                  <th className="py-2 font-medium text-right">Height (cm)</th>
                  <th className="py-2 font-medium text-right">Head (cm)</th>
                  <th className="py-2 font-medium pl-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {sortedGrowth.map((g) => (
                  <tr key={g.id} className="text-stone-800 dark:text-stone-200">
                    <td className="py-2.5 font-mono-tabular font-medium">Wk {g.weekNumber}</td>
                    <td className="py-2.5 font-mono-tabular text-stone-500 dark:text-stone-400">{g.date}</td>
                    <td className="py-2.5 font-mono-tabular text-right">{g.weightKg}</td>
                    <td className="py-2.5 font-mono-tabular text-right">{g.heightCm}</td>
                    <td className="py-2.5 font-mono-tabular text-right">{g.headCm}</td>
                    <td className="py-2.5 pl-4 text-stone-500 dark:text-stone-400">{g.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Growth Entry Form */}
        <form
          onSubmit={handleAddGrowth}
          className="lg:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
            Log Growth Measurement
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Week
              </label>
              <input
                type="number"
                min="0"
                max="260"
                value={grWeek}
                onChange={(e) => setGrWeek(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={grDate}
                onChange={(e) => setGrDate(e.target.value)}
                className="w-full px-2.5 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="150"
                value={grWeight}
                onChange={(e) => setGrWeight(e.target.value)}
                className="w-full px-2.5 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="200"
                value={grHeight}
                onChange={(e) => setGrHeight(e.target.value)}
                className="w-full px-2.5 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Head (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="80"
                value={grHead}
                onChange={(e) => setGrHead(e.target.value)}
                className="w-full px-2.5 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Notes
            </label>
            <input
              type="text"
              maxLength={300}
              value={grNotes}
              onChange={(e) => setGrNotes(e.target.value)}
              placeholder="e.g., Pediatric scale check"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Save Measurement</span>
          </button>
        </form>
      </section>

      {/* Appointments & Vaccination Schedule */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAddMilestone}
          className="lg:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
            Schedule Checkup, Vaccine or Test
          </h2>
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Type
            </label>
            <select
              value={msCategory}
              onChange={(e) => setMsCategory(e.target.value as MilestoneCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            >
              <option value="vaccine">Vaccination Dose</option>
              <option value="appointment">Doctor Appointment / Lab Test</option>
              <option value="developmental">Developmental Milestone</option>
              <option value="checkup_5w">5-Week Checkup</option>
              <option value="checkup_10w">10-Week Checkup</option>
              <option value="checkup_20w">20-Week Checkup</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              maxLength={140}
              value={msTitle}
              onChange={(e) => setMsTitle(e.target.value)}
              placeholder="e.g., Glucose Tolerance Screening"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Week Target
              </label>
              <input
                type="number"
                min="0"
                max="260"
                value={msWeek}
                onChange={(e) => setMsWeek(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={msDate}
                onChange={(e) => setMsDate(e.target.value)}
                className="w-full px-2.5 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Clinician / Facility
            </label>
            <input
              type="text"
              maxLength={100}
              value={msDoctor}
              onChange={(e) => setMsDoctor(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Notes
            </label>
            <input
              type="text"
              maxLength={500}
              value={msNotes}
              onChange={(e) => setMsNotes(e.target.value)}
              placeholder="Preparation instructions"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Add to Care Timeline</span>
          </button>
        </form>

        <div className="lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Clinical Appointments, Vaccinations &amp; Milestones
          </h2>
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {[...milestones]
              .sort((a, b) => a.weekTarget - b.weekTarget)
              .map((ms) => (
                <div key={ms.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {ms.category === 'vaccine' ? (
                        <Syringe className="w-4 h-4 text-sage-600 dark:text-sage-400 shrink-0" />
                      ) : ms.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-sage-600 dark:text-sage-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {ms.title}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 pl-6">
                      <span className="font-mono-tabular">Week {ms.weekTarget}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{ms.scheduledDate}</span>
                      {ms.doctorName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{ms.doctorName}</span>
                        </>
                      )}
                      {ms.notes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{ms.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void updateMilestoneStatus(
                        ms.id,
                        ms.status === 'completed' ? 'upcoming' : 'completed'
                      )
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 ${
                      ms.status === 'completed'
                        ? 'border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300 bg-sage-50 dark:bg-sage-950/40'
                        : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    {ms.status === 'completed' ? 'Completed' : 'Mark Completed'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};
