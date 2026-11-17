import React from 'react';
import {
  Activity,
  Baby,
  Bell,
  CalendarCheck2,
  Compass,
  FileDown,
  FolderHeart,
  HeartPulse,
  Lock,
  Menu,
  MessageSquareHeart,
  Moon,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useBabyMemory } from '../context/BabyMemoryContext';
import { LANGUAGE_LABELS } from '../lib/i18n';
import { exportMedicalSummaryPdf } from '../lib/pdfExport';
import type { LanguageCode, NavTabId } from '../types/babyMemory';

interface SidebarNavProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onOpenSettings: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  mobileOpen,
  setMobileOpen,
}) => {
  const {
    t,
    profile,
    firebaseUser,
    isCloudSynced,
    signInWithGoogle,
    signOutUser,
    toggleDarkMode,
    setLanguage,
    activeAlerts,
    growthEntries,
    milestones,
    medicalRecords,
    healthLogs,
  } = useBabyMemory();

  const [logoError, setLogoError] = React.useState(false);

  const dailyNav: { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: t.navOverview, icon: Baby },
    { id: 'daily', label: t.navDaily, icon: Activity },
    { id: 'milestones', label: t.navMilestones, icon: CalendarCheck2 },
    { id: 'wellness', label: t.navWellness, icon: HeartPulse },
  ];

  const supportNav: { id: NavTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'locator', label: t.navLocator, icon: Compass },
    { id: 'memories', label: t.navMemories, icon: FolderHeart },
    { id: 'connect', label: t.navConnect, icon: MessageSquareHeart },
  ];

  const handleExportPdf = () => {
    exportMedicalSummaryPdf({
      profile,
      growthEntries,
      milestones,
      medicalRecords,
      healthLogs,
    });
  };

  const renderNavButton = (item: {
    id: NavTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onSelectTab(item.id);
          setMobileOpen(false);
        }}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
          isActive
            ? 'bg-sage-700 text-white dark:bg-sage-600 dark:text-white'
            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80'
        }`}
      >
        <span className="flex items-center gap-3 min-w-0">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </span>
        {item.id === 'milestones' && activeAlerts.length > 0 && (
          <span
            className={`font-mono-tabular text-xs shrink-0 ${
              isActive ? 'text-sage-100' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {activeAlerts.length}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800">
      <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {!logoError ? (
            <img
              src="/src/assets/images/nurtura_app_logo_1794937921604.jpg"
              alt="Nurtura logo"
              onError={() => setLogoError(true)}
              className="w-9 h-9 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shrink-0 shadow-xs"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-sage-700 text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
              N
            </div>
          )}
          <div className="min-w-0">
            <span className="block font-display text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap leading-tight">
              {t.brand}
            </span>
            <span className="block text-[11px] text-stone-500 dark:text-stone-400 truncate">
              Maternal &amp; Baby Care
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-sage-50/50 dark:bg-sage-950/20">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
          {profile.babyName ? `${profile.babyName} · ${t.weekLabel} ${profile.currentWeek}` : `${t.weekLabel} ${profile.currentWeek}`}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
          {profile.parentStage === 'expecting' ? t.expectingStage : t.newParentStage} · {isCloudSynced ? t.cloudSynced : t.previewMode}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Primary">
        <div>
          <p className="px-3.5 mb-1.5 text-xs font-medium text-stone-400 dark:text-stone-500">
            Daily Care &amp; Checkups
          </p>
          <div className="space-y-1">{dailyNav.map(renderNavButton)}</div>
        </div>
        <div>
          <p className="px-3.5 mb-1.5 text-xs font-medium text-stone-400 dark:text-stone-500">
            Clinics, Records &amp; Support
          </p>
          <div className="space-y-1">{supportNav.map(renderNavButton)}</div>
        </div>
      </nav>

      <div className="p-4 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
          >
            {profile.darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{profile.darkMode ? t.lightMode : t.darkMode}</span>
          </button>
          <select
            aria-label="Language"
            value={profile.language}
            onChange={(e) => void setLanguage(e.target.value as LanguageCode)}
            className="px-2.5 py-2 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200"
          >
            {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5 shrink-0" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span>{t.settings}</span>
          </button>
        </div>

        {firebaseUser ? (
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="w-full px-3 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-center transition-colors whitespace-nowrap"
          >
            Sign out ({firebaseUser.displayName?.split(' ')[0] || 'Account'})
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t.signInCloud}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-950/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Mobile Compact Top Bar (<=15% viewport height combined with bottom nav) */}
      <header className="lg:hidden sticky top-0 z-40 h-12 px-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            {!logoError ? (
              <img
                src="/src/assets/images/nurtura_app_logo_1794937921604.jpg"
                alt="Nurtura logo"
                onError={() => setLogoError(true)}
                className="w-7 h-7 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-sage-700 text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
                N
              </div>
            )}
            <span className="font-display font-bold text-base text-stone-900 dark:text-stone-100 whitespace-nowrap truncate">
              {t.brand}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('locator')}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg whitespace-nowrap shrink-0"
          >
            SOS
          </button>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200"
            aria-label="Toggle theme"
          >
            {profile.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {activeAlerts.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectTab('milestones')}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-amber-600 dark:text-amber-400"
              aria-label="View alerts"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>
    </>
  );
};
