import React, { useEffect, useState } from 'react';
import {
  Camera,
  Download,
  FileDown,
  FileText,
  FolderHeart,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  Upload,
} from 'lucide-react';
import { useBabyMemory } from '../context/BabyMemoryContext';
import { verifyBiometricOrPin } from '../lib/biometric';
import { exportCloudBackupJson, exportMedicalSummaryPdf } from '../lib/pdfExport';
import { compressImageToDataUrl, todayIsoDate } from '../lib/validation';
import type { MedicalRecordType, MemoryCategory } from '../types/babyMemory';

export const GalleryVaultView: React.FC = () => {
  const {
    t,
    profile,
    memories,
    medicalRecords,
    growthEntries,
    milestones,
    healthLogs,
    vaultUnlocked,
    unlockVaultSession,
    lockVaultSession,
    addMemoryPhoto,
    deleteMemoryPhoto,
    addMedicalRecord,
    deleteMedicalRecord,
  } = useBabyMemory();

  const [subTab, setSubTab] = useState<'gallery' | 'vault'>('gallery');
  const [catFilter, setCatFilter] = useState<'all' | MemoryCategory>('all');
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [recordSearch, setRecordSearch] = useState('');

  // Photo Upload State
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoWeek, setPhotoWeek] = useState(String(profile.currentWeek));
  const [photoCategory, setPhotoCategory] = useState<MemoryCategory>('milestone');
  const [photoDate, setPhotoDate] = useState(todayIsoDate());
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');

  // Medical Record State
  const [recType, setRecType] = useState<MedicalRecordType>('lab_report');
  const [recTitle, setRecTitle] = useState('');
  const [recProvider, setRecProvider] = useState('');
  const [recDate, setRecDate] = useState(todayIsoDate());
  const [recRef, setRecRef] = useState('');
  const [recSummary, setRecSummary] = useState('');

  // Biometric Unlock State
  const [pinAttempt, setPinAttempt] = useState('');
  const [unlockError, setUnlockError] = useState('');

  useEffect(() => {
    if (!lightboxId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxId]);

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    try {
      const compressed = await compressImageToDataUrl(file);
      setPhotoPreview(compressed);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Unable to process image.');
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoTitle.trim() || !photoPreview) {
      setPhotoError('Please enter a title and choose a photo to upload.');
      return;
    }
    await addMemoryPhoto({
      title: photoTitle,
      caption: photoCaption,
      milestoneWeek: Number(photoWeek) || profile.currentWeek,
      category: photoCategory,
      dateTaken: photoDate,
      imageData: photoPreview,
    });
    setPhotoTitle('');
    setPhotoCaption('');
    setPhotoPreview('');
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) return;
    await addMedicalRecord({
      recordType: recType,
      title: recTitle,
      providerOrInsurer: recProvider,
      dateIssued: recDate,
      summary: recSummary,
      policyOrRefNumber: recRef,
    });
    setRecTitle('');
    setRecProvider('');
    setRecRef('');
    setRecSummary('');
  };

  const handleBiometricUnlock = async () => {
    setUnlockError('');
    const ok = await verifyBiometricOrPin(pinAttempt);
    if (ok) {
      unlockVaultSession();
      setPinAttempt('');
    } else {
      setUnlockError('Verification failed. Enter your Privacy PIN (default: 2026) or retry passkey.');
    }
  };

  const visibleMemories =
    catFilter === 'all' ? memories : memories.filter((m) => m.category === catFilter);

  const normalizedRecordQuery = recordSearch.trim().toLowerCase();
  const visibleRecords = normalizedRecordQuery
    ? medicalRecords.filter(
        (rec) =>
          rec.title.toLowerCase().includes(normalizedRecordQuery) ||
          rec.providerOrInsurer.toLowerCase().includes(normalizedRecordQuery) ||
          rec.summary.toLowerCase().includes(normalizedRecordQuery) ||
          rec.policyOrRefNumber.toLowerCase().includes(normalizedRecordQuery)
      )
    : medicalRecords;

  const activeLightbox = memories.find((m) => m.id === lightboxId) || null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            {subTab === 'gallery' ? t.photoGalleryTitle : t.medicalVaultTitle}
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            Cloud-synced keepsake photography, insurance policies, lab reports, and consultation-ready PDF exports.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setSubTab('gallery')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              subTab === 'gallery'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Photo Gallery ({memories.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('vault')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              subTab === 'vault'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Medical Vault ({medicalRecords.length})
          </button>
        </div>
      </div>

      {subTab === 'gallery' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upload Memory Form */}
          <form
            onSubmit={handleSavePhoto}
            className="lg:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4 h-fit"
          >
            <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blush-600 dark:text-blush-400" />
              <span>Document New Memory</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Moment Title
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={photoTitle}
                onChange={(e) => setPhotoTitle(e.target.value)}
                placeholder="e.g., First Smile at Week 6"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Category
                </label>
                <select
                  value={photoCategory}
                  onChange={(e) => setPhotoCategory(e.target.value as MemoryCategory)}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="milestone">Milestone</option>
                  <option value="firsts">Firsts</option>
                  <option value="ultrasound">Ultrasound</option>
                  <option value="wellness">Wellness</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Week
                </label>
                <input
                  type="number"
                  min="0"
                  max="260"
                  value={photoWeek}
                  onChange={(e) => setPhotoWeek(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Date Taken
              </label>
              <input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Caption
              </label>
              <textarea
                rows={2}
                maxLength={500}
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Write a brief note to remember this day"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Photo Upload (auto-compressed for cloud sync)
              </span>
              <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/40 hover:border-sage-400 dark:hover:border-sage-600 cursor-pointer transition-colors text-center">
                <Upload className="w-5 h-5 text-sage-700 dark:text-sage-400" />
                <span className="text-xs font-medium text-stone-700 dark:text-stone-200">
                  {photoPreview ? 'Replace selected photo' : 'Tap to choose a photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handlePhotoFile(e)}
                  className="sr-only"
                />
              </label>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Upload preview"
                  referrerPolicy="no-referrer"
                  className="mt-3 w-full h-36 object-cover rounded-lg border border-stone-200 dark:border-stone-700"
                />
              )}
              {photoError && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{photoError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Save to Cloud Gallery</span>
            </button>
          </form>

          {/* Gallery Grid */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-lg w-fit">
              {(['all', 'milestone', 'firsts', 'ultrasound', 'wellness'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize whitespace-nowrap ${
                    catFilter === cat
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {visibleMemories.length === 0 ? (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-10 text-center text-sm text-stone-500 dark:text-stone-400">
                No memories in this category yet. Upload your first photo on the left.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {visibleMemories.map((mem) => (
                  <article
                    key={mem.id}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxId(mem.id)}
                      className="aspect-[4/3] w-full bg-stone-100 dark:bg-stone-800 overflow-hidden text-left"
                    >
                      {!failedImages[mem.id] ? (
                        <img
                          src={mem.imageData}
                          alt={mem.title}
                          referrerPolicy="no-referrer"
                          onError={() => setFailedImages((prev) => ({ ...prev, [mem.id]: true }))}
                          className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <FolderHeart className="w-8 h-8 text-blush-600 dark:text-blush-400 mb-2" />
                          <span className="text-xs font-medium text-stone-700 dark:text-stone-200">
                            {mem.title}
                          </span>
                        </div>
                      )}
                    </button>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                          <span className="capitalize">
                            {mem.category} · Week {mem.milestoneWeek}
                          </span>
                          <span className="font-mono-tabular">{mem.dateTaken}</span>
                        </div>
                        <h3 className="mt-1.5 font-display text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {mem.title}
                        </h3>
                        <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                          {mem.caption}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-stone-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void deleteMemoryPhoto(mem.id)}
                          className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : profile.biometricEnabled && !vaultUnlocked ? (
        <div className="max-w-md mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-sage-50 dark:bg-sage-950/60 text-sage-700 dark:text-sage-300 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
            {t.unlockVault}
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            Your insurance policies, lab reports, and medication history are protected by biometric verification.
          </p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pinAttempt}
            onChange={(e) => setPinAttempt(e.target.value)}
            placeholder="Privacy PIN (or tap Verify Passkey)"
            className="w-full px-3 py-2 text-sm text-center font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          />
          {unlockError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{unlockError}</p>
          )}
          <button
            type="button"
            onClick={() => void handleBiometricUnlock()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Biometric / PIN</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-stone-600 dark:text-stone-300">
              Export your complete medical history for doctor consultations or download a full encrypted-ready cloud backup.
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {profile.biometricEnabled && (
                <button
                  type="button"
                  onClick={lockVaultSession}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 whitespace-nowrap"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Lock Vault</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  exportCloudBackupJson({
                    exportedAt: new Date().toISOString(),
                    profile,
                    growthEntries,
                    milestones,
                    medicalRecords,
                    healthLogs,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Cloud Backup (.json)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  exportMedicalSummaryPdf({
                    profile,
                    growthEntries,
                    milestones,
                    medicalRecords,
                    healthLogs,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{t.exportPdf}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveRecord}
              className="lg:col-span-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4 h-fit"
            >
              <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                Add Insurance, Lab or Rx Record
              </h2>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Document Category
                </label>
                <select
                  value={recType}
                  onChange={(e) => setRecType(e.target.value as MedicalRecordType)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                >
                  <option value="insurance">Insurance Document</option>
                  <option value="lab_report">Lab Report</option>
                  <option value="medication">Medication History</option>
                  <option value="immunization">Immunization Certificate</option>
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
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="e.g., Anatomy Ultrasound Report (20w)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Provider / Insurer
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={recProvider}
                    onChange={(e) => setRecProvider(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Date Issued
                  </label>
                  <input
                    type="date"
                    value={recDate}
                    onChange={(e) => setRecDate(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Policy / Reference Number
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={recRef}
                  onChange={(e) => setRecRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-tabular rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Summary / Findings
                </label>
                <textarea
                  rows={3}
                  maxLength={800}
                  value={recSummary}
                  onChange={(e) => setRecSummary(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sage-700 hover:bg-sage-800 rounded-lg whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Store in Vault</span>
              </button>
            </form>

            <div className="lg:col-span-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                  Stored Insurance Policies, Lab Reports &amp; Medications
                </h2>
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    placeholder="Search title, provider, ref..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              {visibleRecords.length === 0 ? (
                <p className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
                  No matching medical records found.
                </p>
              ) : (
                <div className="divide-y divide-stone-200 dark:divide-stone-800">
                  {visibleRecords.map((rec) => (
                    <div key={rec.id} className="py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-sage-700 dark:text-sage-400 shrink-0" />
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {rec.title}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 pl-6">
                          {rec.recordType.replace('_', ' ')} · {rec.providerOrInsurer} ·{' '}
                          <span className="font-mono-tabular">{rec.dateIssued}</span>
                          {rec.policyOrRefNumber && ` · Ref: ${rec.policyOrRefNumber}`}
                        </p>
                        <p className="mt-1.5 text-xs text-stone-700 dark:text-stone-300 pl-6 leading-relaxed">
                          {rec.summary}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void deleteMedicalRecord(rec.id)}
                        className="p-2 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg shrink-0"
                        aria-label="Delete medical record"
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
      )}

      {/* Photo Lightbox Modal */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setLightboxId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeLightbox.title}
        >
          <div
            className="max-w-2xl w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeLightbox.imageData}
              alt={activeLightbox.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[65vh] object-contain bg-stone-950"
            />
            <div className="p-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                  {activeLightbox.title}
                </h3>
                <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                  {activeLightbox.caption}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxId(null)}
                className="px-3 py-1.5 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
