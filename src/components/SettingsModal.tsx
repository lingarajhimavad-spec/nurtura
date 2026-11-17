import React, { useEffect, useState } from 'react';
import { Bell, Lock, ShieldCheck, X } from 'lucide-react';
import { useBabyMemory } from '../context/BabyMemoryContext';
import { registerBiometricPasskey } from '../lib/biometric';
import { LANGUAGE_LABELS } from '../lib/i18n';
import type { LanguageCode, ParentStage } from '../types/babyMemory';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const {
    t,
    profile,
    isCloudSynced,
    lastSyncedAt,
    notificationPermission,
    enablePushNotifications,
    updateProfile,
  } = useBabyMemory();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [babyName, setBabyName] = useState(profile.babyName);
  const [parentStage, setParentStage] = useState<ParentStage>(profile.parentStage);
  const [currentWeek, setCurrentWeek] = useState(String(profile.currentWeek));
  const [dueOrBirthDate, setDueOrBirthDate] = useState(profile.dueOrBirthDate);
  const [waterGoal, setWaterGoal] = useState(String(profile.dailyWaterGoalMl));
  const [weightGoal, setWeightGoal] = useState(String(profile.targetWeightKg));
  const [sleepGoal, setSleepGoal] = useState(String(profile.dailySleepGoalHours));
  const [pinCode, setPinCode] = useState('2026');
  const [bioMsg, setBioMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setDisplayName(profile.displayName);
    setBabyName(profile.babyName);
    setParentStage(profile.parentStage);
    setCurrentWeek(String(profile.currentWeek));
    setDueOrBirthDate(profile.dueOrBirthDate);
    setWaterGoal(String(profile.dailyWaterGoalMl));
    setWeightGoal(String(profile.targetWeightKg));
    setSleepGoal(String(profile.dailySleepGoalHours));
    setBioMsg('');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, profile, onClose]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName,
      babyName,
      parentStage,
      currentWeek: Number(currentWeek) || 10,
      dueOrBirthDate,
      dailyWaterGoalMl: Number(waterGoal) || 2500,
      targetWeightKg: Number(weightGoal) || 5.8,
      dailySleepGoalHours: Number(sleepGoal) || 14,
    });
    onClose();
  };

  const handleEnableBiometric = async () => {
    const res = await registerBiometricPasskey(profile.email, pinCode || '2026');
    setBioMsg(res.message);
    await updateProfile({ biometricEnabled: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.settings}
    >
      <div
        className="max-w-xl w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
            {t.settings}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Parent Name
              </label>
              <input
                type="text"
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Baby Name / Nickname
              </label>
              <input
                type="text"
                maxLength={80}
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Care Stage
              </label>
              <select
                value={parentStage}
                onChange={(e) => setParentStage(e.target.value as ParentStage)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                <option value="expecting">{t.expectingStage}</option>
                <option value="new_parent">{t.newParentStage}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Current Week
              </label>
              <input
                type="number"
                min="0"
                max="260"
                value={currentWeek}
                onChange={(e) => setCurrentWeek(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Due / Birth Date
              </label>
              <input
                type="date"
                value={dueOrBirthDate}
                onChange={(e) => setDueOrBirthDate(e.target.value)}
                className="w-full px-2.5 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                Aligns WHO checkup target dates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Water Goal (ml)
              </label>
              <input
                type="number"
                min="200"
                max="6000"
                value={waterGoal}
                onChange={(e) => setWaterGoal(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Target Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="150"
                value={weightGoal}
                onChange={(e) => setWeightGoal(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Sleep Goal (hrs)
              </label>
              <input
                type="number"
                step="0.5"
                min="4"
                max="20"
                value={sleepGoal}
                onChange={(e) => setSleepGoal(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          {/* Language & Push Reminders */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Interface Language
              </label>
              <select
                value={profile.language}
                onChange={(e) => void updateProfile({ language: e.target.value as LanguageCode })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGE_LABELS[code]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Push Reminders
              </label>
              <button
                type="button"
                onClick={() => void enablePushNotifications()}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <Bell className="w-3.5 h-3.5 text-sage-700 dark:text-sage-400" />
                <span>Status: {notificationPermission}</span>
              </button>
            </div>
          </div>

          {/* Biometric Privacy Lock Setup */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sage-700 dark:text-sage-400" />
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {t.biometricLock} (Medical Vault Privacy)
                </span>
              </div>
              {profile.biometricEnabled && (
                <button
                  type="button"
                  onClick={() => void updateProfile({ biometricEnabled: false })}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Disable Lock
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="Backup PIN (e.g., 2026)"
                className="sm:w-44 px-3 py-2 text-xs font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
              <button
                type="button"
                onClick={() => void handleEnableBiometric()}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{profile.biometricEnabled ? 'Re-register Biometric / PIN' : 'Enable Biometric Lock'}</span>
              </button>
            </div>
            {bioMsg && (
              <p className="text-xs text-sage-700 dark:text-sage-400">{bioMsg}</p>
            )}
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>
              {isCloudSynced ? `Cloud Sync Active (${lastSyncedAt})` : 'Local Preview Mode'}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg"
              >
                {t.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
