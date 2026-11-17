/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Baby,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  Cloud,
  CloudOff,
  Compass,
  Menu,
  ShieldAlert,
  X,
} from 'lucide-react';
import { CareConnectView } from './components/CareConnectView';
import { CareLocatorView } from './components/CareLocatorView';
import { DailyTrackerView } from './components/DailyTrackerView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GalleryVaultView } from './components/GalleryVaultView';
import { MilestonesGrowthView } from './components/MilestonesGrowthView';
import { OverviewDashboard } from './components/OverviewDashboard';
import { SettingsModal } from './components/SettingsModal';
import { SidebarNav } from './components/SidebarNav';
import { WellnessDietView } from './components/WellnessDietView';
import { BabyMemoryProvider, useBabyMemory } from './context/BabyMemoryContext';
import type { NavTabId } from './types/babyMemory';

const WorkspaceShell: React.FC = () => {
  const {
    t,
    profile,
    isCloudSynced,
    lastSyncedAt,
    syncError,
    activeAlerts,
    signInWithGoogle,
    toast,
    dismissToast,
  } = useBabyMemory();

  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  const tabTitles: Record<NavTabId, string> = {
    overview: t.navOverview,
    daily: t.navDaily,
    milestones: t.navMilestones,
    wellness: t.navWellness,
    locator: t.navLocator,
    memories: t.navMemories,
    connect: t.navConnect,
  };

  const mobileQuickTabs: {
    id: NavTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Home', icon: Baby },
    { id: 'daily', label: 'Track', icon: Activity },
    { id: 'milestones', label: 'WHO Visits', icon: CalendarCheck2 },
    { id: 'locator', label: 'Care Map', icon: Compass },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col lg:flex-row">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm w-full lg:hidden">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <SidebarNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setSettingsOpen(true)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {mapsQuotaExceeded && (
          <div className="hidden lg:block bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Desktop Contextual Top Bar */}
        <header className="hidden lg:flex items-center justify-between gap-8 px-8 py-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur border-b border-stone-200 dark:border-stone-800 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 min-w-0">
            <span className="font-semibold text-stone-900 dark:text-stone-100 whitespace-nowrap">
              {tabTitles[activeTab]}
            </span>
            <span aria-hidden="true">/</span>
            <span className="truncate">
              {profile.babyName || profile.displayName} · {t.weekLabel} {profile.currentWeek}
            </span>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('milestones')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap"
            >
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="font-mono-tabular">
                {activeAlerts.length} {activeAlerts.length === 1 ? 'reminder' : 'reminders'}
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
              {isCloudSynced ? (
                <>
                  <Cloud className="w-4 h-4 text-sage-600 dark:text-sage-400" />
                  <span>
                    {t.cloudSynced} · <span className="font-mono-tabular">{lastSyncedAt}</span>
                  </span>
                </>
              ) : (
                <>
                  <CloudOff className="w-4 h-4 text-stone-400" />
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="text-sage-700 dark:text-sage-300 font-medium hover:underline"
                  >
                    Enable Cloud Sync
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('locator')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.emergencySos}</span>
            </button>
          </div>
        </header>

        {syncError && (
          <div className="mx-4 lg:mx-8 mt-4 p-3 rounded-lg bg-blush-50 dark:bg-blush-950/50 border border-blush-200 dark:border-blush-900 text-xs text-blush-700 dark:text-blush-300">
            Sync notice: {syncError}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewDashboard
              onNavigate={setActiveTab}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}
          {activeTab === 'daily' && <DailyTrackerView />}
          {activeTab === 'milestones' && <MilestonesGrowthView />}
          {activeTab === 'wellness' && <WellnessDietView />}
          {activeTab === 'locator' && <CareLocatorView />}
          {activeTab === 'memories' && <GalleryVaultView />}
          {activeTab === 'connect' && <CareConnectView />}
        </main>
      </div>

      {/* Mobile Bottom Thumb-Friendly Quick Nav (compact h-14, total sticky <= 14% viewport) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-t border-stone-200 dark:border-stone-800 grid grid-cols-5"
      >
        {mobileQuickTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-sage-700 dark:text-sage-300'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-full px-1">{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-stone-500 dark:text-stone-400"
        >
          <Menu className="w-4 h-4 shrink-0" />
          <span>More</span>
        </button>
      </nav>

      {/* Non-intrusive Action Confirmation Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-18 right-4 lg:bottom-6 lg:right-6 z-50 max-w-sm bg-stone-900 dark:bg-sage-800 text-white px-4 py-3 rounded-xl shadow-lg border border-stone-800 dark:border-sage-700 flex items-center gap-3"
        >
          <CheckCircle2 className="w-4 h-4 text-sage-300 shrink-0" />
          <span className="text-xs font-medium leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="p-1 text-stone-400 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BabyMemoryProvider>
        <WorkspaceShell />
      </BabyMemoryProvider>
    </ErrorBoundary>
  );
}
