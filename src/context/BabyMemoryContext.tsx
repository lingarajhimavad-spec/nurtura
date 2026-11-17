import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { createStarterData } from '../lib/clinicalGuidance';
import { getTranslations, type TranslationDict } from '../lib/i18n';
import {
  computeActiveAlerts,
  requestBrowserNotificationPermission,
  sendLocalPushNotification,
  type CareAlert,
} from '../lib/notifications';
import {
  clampNumber,
  clampString,
  currentTimeHHMM,
  FIELD_LIMITS,
  generateSafeId,
  todayIsoDate,
} from '../lib/validation';
import type {
  CommunityLike,
  CommunityPost,
  CommunityReply,
  CommunityTopic,
  ConsultationMessage,
  ConsultationThread,
  GrowthEntry,
  HealthLog,
  HealthLogType,
  LanguageCode,
  MedicalRecord,
  MedicalRecordType,
  MemoryCategory,
  MemoryPhoto,
  Milestone,
  MilestoneCategory,
  MilestoneStatus,
  ServiceBooking,
  ServiceBookingType,
  UserProfile,
} from '../types/babyMemory';

interface BabyMemoryContextValue {
  authReady: boolean;
  firebaseUser: User | null;
  isCloudSynced: boolean;
  lastSyncedAt: string;
  syncError: string | null;
  profile: UserProfile;
  t: TranslationDict;
  healthLogs: HealthLog[];
  growthEntries: GrowthEntry[];
  milestones: Milestone[];
  memories: MemoryPhoto[];
  medicalRecords: MedicalRecord[];
  serviceBookings: ServiceBooking[];
  threads: ConsultationThread[];
  messagesByThread: Record<string, ConsultationMessage[]>;
  communityPosts: CommunityPost[];
  repliesByPost: Record<string, CommunityReply[]>;
  likesByPost: Record<string, CommunityLike[]>;
  activeAlerts: CareAlert[];
  notificationPermission: NotificationPermission | 'unsupported';
  vaultUnlocked: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  unlockVaultSession: () => void;
  lockVaultSession: () => void;
  enablePushNotifications: () => Promise<NotificationPermission | 'unsupported'>;
  triggerTestReminder: () => void;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  addHealthLog: (input: {
    logType: HealthLogType;
    title: string;
    valueNum: number;
    unit: string;
    notes?: string;
    loggedTime?: string;
    completed?: boolean;
  }) => Promise<void>;
  toggleHealthLogCompleted: (logId: string) => Promise<void>;
  deleteHealthLog: (logId: string) => Promise<void>;
  addGrowthEntry: (input: {
    weekNumber: number;
    date: string;
    weightKg: number;
    heightCm: number;
    headCm: number;
    notes: string;
  }) => Promise<void>;
  addMilestone: (input: {
    category: MilestoneCategory;
    title: string;
    weekTarget: number;
    scheduledDate: string;
    doctorName: string;
    notes: string;
    reminderEnabled: boolean;
  }) => Promise<void>;
  updateMilestoneStatus: (milestoneId: string, status: MilestoneStatus) => Promise<void>;
  addMemoryPhoto: (input: {
    title: string;
    caption: string;
    milestoneWeek: number;
    category: MemoryCategory;
    dateTaken: string;
    imageData: string;
  }) => Promise<void>;
  deleteMemoryPhoto: (memoryId: string) => Promise<void>;
  addMedicalRecord: (input: {
    recordType: MedicalRecordType;
    title: string;
    providerOrInsurer: string;
    dateIssued: string;
    summary: string;
    policyOrRefNumber: string;
    attachmentPreview?: string;
  }) => Promise<void>;
  deleteMedicalRecord: (recordId: string) => Promise<void>;
  createServiceBooking: (input: {
    serviceType: ServiceBookingType;
    providerName: string;
    address: string;
    scheduledFor: string;
    notes: string;
  }) => Promise<void>;
  updateServiceBookingStatus: (
    bookingId: string,
    status: 'confirmed' | 'completed' | 'cancelled'
  ) => Promise<void>;
  sendConsultationMessage: (threadId: string, body: string, urgent: boolean) => Promise<void>;
  createConsultationThread: (doctorName: string, specialty: string, clinicName: string) => Promise<string>;
  createCommunityPost: (topic: CommunityTopic, title: string, body: string) => Promise<void>;
  addCommunityReply: (postId: string, body: string) => Promise<void>;
  toggleCommunityLike: (postId: string) => Promise<void>;
  subscribePostDetails: (postId: string) => () => void;
  toast: { id: string; message: string; tone: 'success' | 'info' } | null;
  showToast: (message: string, tone?: 'success' | 'info') => void;
  dismissToast: () => void;
}

const BabyMemoryContext = createContext<BabyMemoryContextValue | null>(null);

const INITIAL_LOCAL = createStarterData('local_preview', 'Maya & Family', 'parent@nurtura.app');

export const BabyMemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(currentTimeHHMM());

  const [profile, setProfile] = useState<UserProfile>(() => {
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('bm_theme') === 'dark' : false;
    return { ...INITIAL_LOCAL.profile, darkMode: savedTheme };
  });
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>(INITIAL_LOCAL.healthLogs);
  const [growthEntries, setGrowthEntries] = useState<GrowthEntry[]>(INITIAL_LOCAL.growthEntries);
  const [milestones, setMilestones] = useState<Milestone[]>(INITIAL_LOCAL.milestones);
  const [memories, setMemories] = useState<MemoryPhoto[]>(INITIAL_LOCAL.memories);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(INITIAL_LOCAL.medicalRecords);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>(INITIAL_LOCAL.serviceBookings);
  const [threads, setThreads] = useState<ConsultationThread[]>(INITIAL_LOCAL.threads);
  const [messagesByThread, setMessagesByThread] = useState<Record<string, ConsultationMessage[]>>(
    INITIAL_LOCAL.messagesByThread
  );
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_LOCAL.communityPosts);
  const [repliesByPost, setRepliesByPost] = useState<Record<string, CommunityReply[]>>({});
  const [likesByPost, setLikesByPost] = useState<Record<string, CommunityLike[]>>({});

  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [toast, setToast] = useState<{ id: string; message: string; tone: 'success' | 'info' } | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((message: string, tone: 'success' | 'info' = 'success') => {
    const id = String(Date.now());
    setToast({ id, message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast((curr) => (curr?.id === toast.id ? null : curr));
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Sync HTML .dark class with profile.darkMode
  useEffect(() => {
    const root = document.documentElement;
    if (profile.darkMode) {
      root.classList.add('dark');
      localStorage.setItem('bm_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('bm_theme', 'light');
    }
  }, [profile.darkMode]);

  // Seed Firestore workspace if new authenticated user has no /users/{uid} doc
  const ensureUserWorkspace = useCallback(async (user: User) => {
    const userPath = `users/${user.uid}`;
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) return;

      const starter = createStarterData(
        user.uid,
        clampString(user.displayName || 'Parent User', FIELD_LIMITS.USER_NAME_MAX),
        clampString(user.email || 'user@nurtura.app', FIELD_LIMITS.EMAIL_MAX)
      );
      const savedTheme = localStorage.getItem('bm_theme') === 'dark';

      // Create user root doc first so Master Gate exists() passes for subcollections
      await setDoc(userRef, {
        ...starter.profile,
        darkMode: savedTheme,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const batch = writeBatch(db);
      for (const l of starter.healthLogs) {
        const { id, ...rest } = l;
        batch.set(doc(db, 'users', user.uid, 'healthLogs', id), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const g of starter.growthEntries) {
        const { id, ...rest } = g;
        batch.set(doc(db, 'users', user.uid, 'growthEntries', id), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const m of starter.milestones) {
        const { id, ...rest } = m;
        batch.set(doc(db, 'users', user.uid, 'milestones', id), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const mem of starter.memories) {
        const { id, ...rest } = mem;
        batch.set(doc(db, 'users', user.uid, 'memories', id), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const rec of starter.medicalRecords) {
        const { id, ...rest } = rec;
        batch.set(doc(db, 'users', user.uid, 'medicalRecords', id), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const bk of starter.serviceBookings) {
        const { id, ...rest } = bk;
        batch.set(doc(db, 'users', user.uid, 'serviceBookings', id), {
          ...rest,
          status: 'requested',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const thr of starter.threads) {
        const { id, ...rest } = thr;
        batch.set(doc(db, 'users', user.uid, 'consultations', id), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();

      // Seed initial messages after consultation threads exist
      const msgBatch = writeBatch(db);
      for (const [threadId, msgs] of Object.entries(starter.messagesByThread)) {
        for (const msg of msgs) {
          const { id, ...rest } = msg;
          msgBatch.set(doc(db, 'users', user.uid, 'consultations', threadId, 'messages', id), {
            ...rest,
            createdAt: serverTimestamp(),
          });
        }
      }
      await msgBatch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    }
  }, []);

  // Auth listener + real-time Firestore subscriptions (only when authenticated)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user) {
        try {
          await ensureUserWorkspace(user);
          setSyncError(null);
        } catch (err) {
          setSyncError(err instanceof Error ? err.message : 'Unable to initialize cloud workspace.');
        }
      }
    });
    return () => unsubAuth();
  }, [ensureUserWorkspace]);

  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const uid = firebaseUser.uid;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
            setLastSyncedAt(currentTimeHHMM());
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
      )
    );

    const bindSubcol = <T extends { id: string }>(
      subcol: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      const path = `users/${uid}/${subcol}`;
      const q = query(collection(db, 'users', uid, subcol), where('ownerId', '==', uid));
      unsubs.push(
        onSnapshot(
          q,
          (snap) => {
            setter(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<T, 'id'>) } as T)));
            setLastSyncedAt(currentTimeHHMM());
          },
          (err) => handleFirestoreError(err, OperationType.LIST, path)
        )
      );
    };

    bindSubcol<HealthLog>('healthLogs', setHealthLogs);
    bindSubcol<GrowthEntry>('growthEntries', setGrowthEntries);
    bindSubcol<Milestone>('milestones', setMilestones);
    bindSubcol<MemoryPhoto>('memories', setMemories);
    bindSubcol<MedicalRecord>('medicalRecords', setMedicalRecords);
    bindSubcol<ServiceBooking>('serviceBookings', setServiceBookings);
    bindSubcol<ConsultationThread>('consultations', setThreads);

    // Public community posts (strict static query filter isPublic == true)
    const commQ = query(collection(db, 'communityPosts'), where('isPublic', '==', true));
    unsubs.push(
      onSnapshot(
        commQ,
        (snap) => {
          const docs = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CommunityPost, 'id'>),
          }));
          setCommunityPosts(docs.length > 0 ? docs : INITIAL_LOCAL.communityPosts);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'communityPosts')
      )
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, firebaseUser]);

  // Listen to messages for active consultation threads
  useEffect(() => {
    if (!authReady || !firebaseUser || threads.length === 0) return;
    const uid = firebaseUser.uid;
    const unsubs = threads.map((thr) => {
      const path = `users/${uid}/consultations/${thr.id}/messages`;
      const q = query(
        collection(db, 'users', uid, 'consultations', thr.id, 'messages'),
        where('ownerId', '==', uid)
      );
      return onSnapshot(
        q,
        (snap) => {
          const msgs = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ConsultationMessage, 'id'>),
          }));
          setMessagesByThread((prev) => ({ ...prev, [thr.id]: msgs }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, path)
      );
    });
    return () => unsubs.forEach((fn) => fn());
  }, [authReady, firebaseUser, threads]);

  const signInWithGoogle = useCallback(async () => {
    setSyncError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setVaultUnlocked(false);
    setHealthLogs(INITIAL_LOCAL.healthLogs);
    setGrowthEntries(INITIAL_LOCAL.growthEntries);
    setMilestones(INITIAL_LOCAL.milestones);
    setMemories(INITIAL_LOCAL.memories);
    setMedicalRecords(INITIAL_LOCAL.medicalRecords);
    setServiceBookings(INITIAL_LOCAL.serviceBookings);
    setThreads(INITIAL_LOCAL.threads);
    setMessagesByThread(INITIAL_LOCAL.messagesByThread);
    setCommunityPosts(INITIAL_LOCAL.communityPosts);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      const next: UserProfile = {
        ...profile,
        ...patch,
        displayName: clampString(patch.displayName ?? profile.displayName, FIELD_LIMITS.USER_NAME_MAX) || 'Parent',
        babyName: clampString(patch.babyName ?? profile.babyName, FIELD_LIMITS.BABY_NAME_MAX),
        currentWeek: clampNumber(patch.currentWeek ?? profile.currentWeek, 0, 260),
        healthConditions: (patch.healthConditions ?? profile.healthConditions).slice(0, FIELD_LIMITS.HEALTH_CONDITIONS_MAX),
        dailyWaterGoalMl: clampNumber(patch.dailyWaterGoalMl ?? profile.dailyWaterGoalMl, 200, 6000),
        targetWeightKg: clampNumber(patch.targetWeightKg ?? profile.targetWeightKg, 1, 150),
        dailySleepGoalHours: clampNumber(patch.dailySleepGoalHours ?? profile.dailySleepGoalHours, 4, 20),
      };
      setProfile(next);

      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        try {
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            displayName: next.displayName,
            parentStage: next.parentStage,
            babyName: next.babyName,
            dueOrBirthDate: next.dueOrBirthDate,
            currentWeek: next.currentWeek,
            healthConditions: next.healthConditions,
            language: next.language,
            darkMode: next.darkMode,
            biometricEnabled: next.biometricEnabled,
            dailyWaterGoalMl: next.dailyWaterGoalMl,
            targetWeightKg: next.targetWeightKg,
            dailySleepGoalHours: next.dailySleepGoalHours,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }

      if ('displayName' in patch || 'currentWeek' in patch || 'dailyWaterGoalMl' in patch) {
        showToast('Profile & care goals saved');
      } else if ('language' in patch) {
        showToast('Language updated', 'info');
      }
    },
    [firebaseUser, profile, showToast]
  );

  const toggleDarkMode = useCallback(async () => {
    await updateProfile({ darkMode: !profile.darkMode });
  }, [profile.darkMode, updateProfile]);

  const setLanguage = useCallback(
    async (lang: LanguageCode) => {
      await updateProfile({ language: lang });
    },
    [updateProfile]
  );

  const addHealthLog = useCallback(
    async (input: {
      logType: HealthLogType;
      title: string;
      valueNum: number;
      unit: string;
      notes?: string;
      loggedTime?: string;
      completed?: boolean;
    }) => {
      const id = generateSafeId('log');
      const uid = firebaseUser?.uid || profile.uid;
      const newLog: HealthLog = {
        id,
        ownerId: uid,
        logType: input.logType,
        title: clampString(input.title, FIELD_LIMITS.LOG_TITLE_MAX) || 'Daily Entry',
        valueNum: clampNumber(input.valueNum, 0, 10000),
        unit: clampString(input.unit, FIELD_LIMITS.LOG_UNIT_MAX),
        notes: clampString(input.notes || '', FIELD_LIMITS.LOG_NOTES_MAX),
        loggedDate: todayIsoDate(),
        loggedTime: input.loggedTime && FIELD_LIMITS.TIME_PATTERN.test(input.loggedTime)
          ? input.loggedTime
          : currentTimeHHMM(),
        completed: input.completed ?? true,
      };

      if (!firebaseUser) {
        setHealthLogs((prev) => [newLog, ...prev]);
        showToast(`Logged: ${newLog.title}`);
        return;
      }

      const path = `users/${firebaseUser.uid}/healthLogs/${id}`;
      try {
        const { id: _ignore, ...payload } = newLog;
        await setDoc(doc(db, 'users', firebaseUser.uid, 'healthLogs', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast(`Saved: ${newLog.title}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser, profile.uid, showToast]
  );

  const toggleHealthLogCompleted = useCallback(
    async (logId: string) => {
      const target = healthLogs.find((l) => l.id === logId);
      if (!target) return;
      if (!firebaseUser) {
        setHealthLogs((prev) =>
          prev.map((l) => (l.id === logId ? { ...l, completed: !l.completed } : l))
        );
        return;
      }
      const path = `users/${firebaseUser.uid}/healthLogs/${logId}`;
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid, 'healthLogs', logId), {
          completed: !target.completed,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [firebaseUser, healthLogs]
  );

  const deleteHealthLog = useCallback(
    async (logId: string) => {
      if (!firebaseUser) {
        setHealthLogs((prev) => prev.filter((l) => l.id !== logId));
        return;
      }
      const path = `users/${firebaseUser.uid}/healthLogs/${logId}`;
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'healthLogs', logId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [firebaseUser]
  );

  const addGrowthEntry = useCallback(
    async (input: {
      weekNumber: number;
      date: string;
      weightKg: number;
      heightCm: number;
      headCm: number;
      notes: string;
    }) => {
      const id = generateSafeId('gr');
      const uid = firebaseUser?.uid || profile.uid;
      const entry: GrowthEntry = {
        id,
        ownerId: uid,
        weekNumber: clampNumber(input.weekNumber, 0, 260),
        date: FIELD_LIMITS.DATE_PATTERN.test(input.date) ? input.date : todayIsoDate(),
        weightKg: clampNumber(input.weightKg, 0, 150),
        heightCm: clampNumber(input.heightCm, 0, 200),
        headCm: clampNumber(input.headCm, 0, 80),
        notes: clampString(input.notes, FIELD_LIMITS.GROWTH_NOTES_MAX),
      };

      if (!firebaseUser) {
        setGrowthEntries((prev) => [...prev, entry]);
        showToast(`Saved Week ${entry.weekNumber} growth entry`);
        return;
      }
      const path = `users/${firebaseUser.uid}/growthEntries/${id}`;
      try {
        const { id: _ignore, ...payload } = entry;
        await setDoc(doc(db, 'users', firebaseUser.uid, 'growthEntries', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast(`Saved Week ${entry.weekNumber} growth entry`);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser, profile.uid, showToast]
  );

  const addMilestone = useCallback(
    async (input: {
      category: MilestoneCategory;
      title: string;
      weekTarget: number;
      scheduledDate: string;
      doctorName: string;
      notes: string;
      reminderEnabled: boolean;
    }) => {
      const id = generateSafeId('ms');
      const uid = firebaseUser?.uid || profile.uid;
      const ms: Milestone = {
        id,
        ownerId: uid,
        category: input.category,
        title: clampString(input.title, FIELD_LIMITS.MILESTONE_TITLE_MAX) || 'Clinical Checkup',
        weekTarget: clampNumber(input.weekTarget, 0, 260),
        scheduledDate: FIELD_LIMITS.DATE_PATTERN.test(input.scheduledDate)
          ? input.scheduledDate
          : todayIsoDate(),
        status: 'upcoming',
        doctorName: clampString(input.doctorName, FIELD_LIMITS.DOCTOR_NAME_MAX),
        notes: clampString(input.notes, FIELD_LIMITS.MILESTONE_NOTES_MAX),
        reminderEnabled: input.reminderEnabled,
      };
      if (!firebaseUser) {
        setMilestones((prev) => [...prev, ms]);
        showToast(`Added to timeline: ${ms.title}`);
        return;
      }
      const path = `users/${firebaseUser.uid}/milestones/${id}`;
      try {
        const { id: _ignore, ...payload } = ms;
        await setDoc(doc(db, 'users', firebaseUser.uid, 'milestones', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast(`Added to timeline: ${ms.title}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser, profile.uid, showToast]
  );

  const updateMilestoneStatus = useCallback(
    async (milestoneId: string, status: MilestoneStatus) => {
      if (!firebaseUser) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === milestoneId ? { ...m, status } : m))
        );
        showToast(status === 'completed' ? 'Checkup marked complete' : 'Checkup reopened');
        return;
      }
      const path = `users/${firebaseUser.uid}/milestones/${milestoneId}`;
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid, 'milestones', milestoneId), {
          status,
          updatedAt: serverTimestamp(),
        });
        showToast(status === 'completed' ? 'Checkup marked complete' : 'Checkup reopened');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [firebaseUser, showToast]
  );

  const addMemoryPhoto = useCallback(
    async (input: {
      title: string;
      caption: string;
      milestoneWeek: number;
      category: MemoryCategory;
      dateTaken: string;
      imageData: string;
    }) => {
      const id = generateSafeId('mem');
      const uid = firebaseUser?.uid || profile.uid;
      const photo: MemoryPhoto = {
        id,
        ownerId: uid,
        title: clampString(input.title, FIELD_LIMITS.MEMORY_TITLE_MAX) || 'Special Moment',
        caption: clampString(input.caption, FIELD_LIMITS.MEMORY_CAPTION_MAX),
        milestoneWeek: clampNumber(input.milestoneWeek, 0, 260),
        category: input.category,
        dateTaken: FIELD_LIMITS.DATE_PATTERN.test(input.dateTaken)
          ? input.dateTaken
          : todayIsoDate(),
        imageData: input.imageData.slice(0, FIELD_LIMITS.IMAGE_DATA_MAX),
      };
      if (!firebaseUser) {
        setMemories((prev) => [photo, ...prev]);
        showToast('Photo saved to keepsake gallery');
        return;
      }
      const path = `users/${firebaseUser.uid}/memories/${id}`;
      try {
        const { id: _ignore, ...payload } = photo;
        await setDoc(doc(db, 'users', firebaseUser.uid, 'memories', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Photo saved to keepsake gallery');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser, profile.uid, showToast]
  );

  const deleteMemoryPhoto = useCallback(
    async (memoryId: string) => {
      if (!firebaseUser) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
        return;
      }
      const path = `users/${firebaseUser.uid}/memories/${memoryId}`;
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'memories', memoryId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [firebaseUser]
  );

  const addMedicalRecord = useCallback(
    async (input: {
      recordType: MedicalRecordType;
      title: string;
      providerOrInsurer: string;
      dateIssued: string;
      summary: string;
      policyOrRefNumber: string;
      attachmentPreview?: string;
    }) => {
      const id = generateSafeId('rec');
      const uid = firebaseUser?.uid || profile.uid;
      const rec: MedicalRecord = {
        id,
        ownerId: uid,
        recordType: input.recordType,
        title: clampString(input.title, FIELD_LIMITS.RECORD_TITLE_MAX) || 'Medical Record',
        providerOrInsurer: clampString(input.providerOrInsurer, FIELD_LIMITS.PROVIDER_NAME_MAX),
        dateIssued: FIELD_LIMITS.DATE_PATTERN.test(input.dateIssued)
          ? input.dateIssued
          : todayIsoDate(),
        summary: clampString(input.summary, FIELD_LIMITS.RECORD_SUMMARY_MAX),
        policyOrRefNumber: clampString(input.policyOrRefNumber, FIELD_LIMITS.POLICY_REF_MAX),
        attachmentPreview: (input.attachmentPreview || '').slice(0, FIELD_LIMITS.IMAGE_DATA_MAX),
      };
      if (!firebaseUser) {
        setMedicalRecords((prev) => [rec, ...prev]);
        showToast('Medical record stored in vault');
        return;
      }
      const path = `users/${firebaseUser.uid}/medicalRecords/${id}`;
      try {
        const { id: _ignore, ...payload } = rec;
        await setDoc(doc(db, 'users', firebaseUser.uid, 'medicalRecords', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Medical record stored in vault');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser, profile.uid, showToast]
  );

  const deleteMedicalRecord = useCallback(
    async (recordId: string) => {
      if (!firebaseUser) {
        setMedicalRecords((prev) => prev.filter((r) => r.id !== recordId));
        return;
      }
      const path = `users/${firebaseUser.uid}/medicalRecords/${recordId}`;
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'medicalRecords', recordId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [firebaseUser]
  );

  const createServiceBooking = useCallback(
    async (input: {
      serviceType: ServiceBookingType;
      providerName: string;
      address: string;
      scheduledFor: string;
      notes: string;
    }) => {
      const id = generateSafeId('bk');
      const uid = firebaseUser?.uid || profile.uid;
      const booking: ServiceBooking = {
        id,
        ownerId: uid,
        serviceType: input.serviceType,
        providerName: clampString(input.providerName, FIELD_LIMITS.BOOKING_PROVIDER_MAX) || 'Health Service',
        address: clampString(input.address, FIELD_LIMITS.BOOKING_ADDRESS_MAX),
        scheduledFor: clampString(input.scheduledFor, FIELD_LIMITS.BOOKING_SCHEDULE_MAX),
        status: 'requested',
        notes: clampString(input.notes, FIELD_LIMITS.BOOKING_NOTES_MAX),
      };
      if (!firebaseUser) {
        setServiceBookings((prev) => [booking, ...prev]);
        showToast(`Request submitted: ${booking.providerName}`);
        return;
      }
      const path = `users/${firebaseUser.uid}/serviceBookings/${id}`;
      try {
        const { id: _ignore, ...payload } = booking;
        await setDoc(doc(db, 'users', firebaseUser.uid, 'serviceBookings', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast(`Request submitted: ${booking.providerName}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser, profile.uid, showToast]
  );

  const updateServiceBookingStatus = useCallback(
    async (bookingId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
      if (!firebaseUser) {
        setServiceBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
        );
        return;
      }
      const path = `users/${firebaseUser.uid}/serviceBookings/${bookingId}`;
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid, 'serviceBookings', bookingId), {
          status,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [firebaseUser]
  );

  const sendConsultationMessage = useCallback(
    async (threadId: string, body: string, urgent: boolean) => {
      const cleanBody = clampString(body, FIELD_LIMITS.MESSAGE_BODY_MAX);
      if (!cleanBody) return;
      const id = generateSafeId('msg');
      const uid = firebaseUser?.uid || profile.uid;
      const msg: ConsultationMessage = {
        id,
        ownerId: uid,
        senderRole: 'parent',
        senderName: profile.displayName,
        body: cleanBody,
        urgent,
      };
      if (!firebaseUser) {
        setMessagesByThread((prev) => ({
          ...prev,
          [threadId]: [...(prev[threadId] || []), msg],
        }));
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId ? { ...t, lastMessage: cleanBody.slice(0, 120) } : t
          )
        );
        showToast(urgent ? 'Urgent message sent to clinician' : 'Message sent to doctor');
        return;
      }
      const msgPath = `users/${firebaseUser.uid}/consultations/${threadId}/messages/${id}`;
      const thrPath = `users/${firebaseUser.uid}/consultations/${threadId}`;
      try {
        const { id: _ignore, ...payload } = msg;
        await setDoc(
          doc(db, 'users', firebaseUser.uid, 'consultations', threadId, 'messages', id),
          { ...payload, createdAt: serverTimestamp() }
        );
        await updateDoc(doc(db, 'users', firebaseUser.uid, 'consultations', threadId), {
          lastMessage: clampString(cleanBody, FIELD_LIMITS.THREAD_LAST_MSG_MAX),
          updatedAt: serverTimestamp(),
        });
        showToast(urgent ? 'Urgent message sent to clinician' : 'Message sent to doctor');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `${msgPath} / ${thrPath}`);
      }
    },
    [firebaseUser, profile.displayName, profile.uid, showToast]
  );

  const createConsultationThread = useCallback(
    async (doctorName: string, specialty: string, clinicName: string): Promise<string> => {
      const id = generateSafeId('thr');
      const uid = firebaseUser?.uid || profile.uid;
      const thr: ConsultationThread = {
        id,
        ownerId: uid,
        doctorName: clampString(doctorName, FIELD_LIMITS.DOCTOR_NAME_MAX) || 'Clinician',
        specialty: clampString(specialty, FIELD_LIMITS.THREAD_SPECIALTY_MAX),
        clinicName: clampString(clinicName, FIELD_LIMITS.THREAD_CLINIC_MAX),
        lastMessage: 'Consultation thread opened.',
        status: 'active',
      };
      if (!firebaseUser) {
        setThreads((prev) => [thr, ...prev]);
        return id;
      }
      const path = `users/${firebaseUser.uid}/consultations/${id}`;
      try {
        const { id: _ignore, ...payload } = thr;
        await setDoc(doc(db, 'users', firebaseUser.uid, 'consultations', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return id;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser, profile.uid]
  );

  const createCommunityPost = useCallback(
    async (topic: CommunityTopic, title: string, body: string) => {
      const cleanTitle = clampString(title, FIELD_LIMITS.POST_TITLE_MAX);
      const cleanBody = clampString(body, FIELD_LIMITS.POST_BODY_MAX);
      if (cleanTitle.length < 3 || cleanBody.length < 3) return;
      const id = generateSafeId('post');
      const uid = firebaseUser?.uid || profile.uid;
      const handle = clampString(
        `${profile.displayName.split(' ')[0] || 'Parent'} (Wk ${profile.currentWeek})`,
        FIELD_LIMITS.POST_HANDLE_MAX
      );
      const post: CommunityPost = {
        id,
        authorUid: uid,
        authorHandle: handle,
        topic,
        title: cleanTitle,
        body: cleanBody,
        isPublic: true,
      };
      if (!firebaseUser) {
        setCommunityPosts((prev) => [post, ...prev]);
        showToast('Discussion published to parent community');
        return;
      }
      const path = `communityPosts/${id}`;
      try {
        const { id: _ignore, ...payload } = post;
        await setDoc(doc(db, 'communityPosts', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('Discussion published to parent community');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser, profile.currentWeek, profile.displayName, profile.uid, showToast]
  );

  const addCommunityReply = useCallback(
    async (postId: string, body: string) => {
      const cleanBody = clampString(body, FIELD_LIMITS.REPLY_BODY_MAX);
      if (!cleanBody) return;
      const id = generateSafeId('rep');
      const uid = firebaseUser?.uid || profile.uid;
      const handle = clampString(
        `${profile.displayName.split(' ')[0] || 'Parent'} (Wk ${profile.currentWeek})`,
        FIELD_LIMITS.POST_HANDLE_MAX
      );
      const reply: CommunityReply = {
        id,
        postId,
        authorUid: uid,
        authorHandle: handle,
        body: cleanBody,
      };
      if (!firebaseUser) {
        setRepliesByPost((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), reply],
        }));
        return;
      }
      const path = `communityPosts/${postId}/replies/${id}`;
      try {
        const { id: _ignore, ...payload } = reply;
        await setDoc(doc(db, 'communityPosts', postId, 'replies', id), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser, profile.currentWeek, profile.displayName, profile.uid]
  );

  const toggleCommunityLike = useCallback(
    async (postId: string) => {
      const uid = firebaseUser?.uid || profile.uid;
      const existingLikes = likesByPost[postId] || [];
      const alreadyLiked = existingLikes.some((l) => l.userId === uid);

      if (!firebaseUser) {
        setLikesByPost((prev) => ({
          ...prev,
          [postId]: alreadyLiked
            ? existingLikes.filter((l) => l.userId !== uid)
            : [...existingLikes, { id: uid, postId, userId: uid }],
        }));
        return;
      }

      const path = `communityPosts/${postId}/likes/${uid}`;
      try {
        if (alreadyLiked) {
          await deleteDoc(doc(db, 'communityPosts', postId, 'likes', uid));
        } else {
          await setDoc(doc(db, 'communityPosts', postId, 'likes', uid), {
            postId,
            userId: uid,
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [firebaseUser, likesByPost, profile.uid]
  );

  const subscribePostDetails = useCallback(
    (postId: string) => {
      if (!firebaseUser || postId.startsWith('post_sample_')) {
        return () => {};
      }
      const repPath = `communityPosts/${postId}/replies`;
      const likePath = `communityPosts/${postId}/likes`;
      const unsubRep = onSnapshot(
        query(collection(db, 'communityPosts', postId, 'replies'), where('postId', '==', postId)),
        (snap) => {
          setRepliesByPost((prev) => ({
            ...prev,
            [postId]: snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<CommunityReply, 'id'>),
            })),
          }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, repPath)
      );
      const unsubLike = onSnapshot(
        query(collection(db, 'communityPosts', postId, 'likes'), where('postId', '==', postId)),
        (snap) => {
          setLikesByPost((prev) => ({
            ...prev,
            [postId]: snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<CommunityLike, 'id'>),
            })),
          }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, likePath)
      );
      return () => {
        unsubRep();
        unsubLike();
      };
    },
    [firebaseUser]
  );

  const enablePushNotifications = useCallback(async () => {
    const res = await requestBrowserNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      sendLocalPushNotification(
        'Nurtura Alerts Active',
        'Vaccination reminders, urgent medication alerts, and checkup notifications are enabled.'
      );
    }
    return res;
  }, []);

  const activeAlerts = useMemo(
    () => computeActiveAlerts(milestones, healthLogs),
    [milestones, healthLogs]
  );

  const triggerTestReminder = useCallback(() => {
    const topAlert = activeAlerts[0];
    const title = topAlert ? topAlert.title : '10-Week Wellness Checkup Reminder';
    const body = topAlert ? topAlert.detail : 'Daily tablets & upcoming pediatric visit reminder.';
    sendLocalPushNotification(title, body);
  }, [activeAlerts]);

  const t = useMemo(() => getTranslations(profile.language), [profile.language]);

  const value: BabyMemoryContextValue = {
    authReady,
    firebaseUser,
    isCloudSynced: Boolean(firebaseUser),
    lastSyncedAt,
    syncError,
    profile,
    t,
    healthLogs,
    growthEntries,
    milestones,
    memories,
    medicalRecords,
    serviceBookings,
    threads,
    messagesByThread,
    communityPosts,
    repliesByPost,
    likesByPost,
    activeAlerts,
    notificationPermission,
    vaultUnlocked,
    signInWithGoogle,
    signOutUser,
    unlockVaultSession: () => setVaultUnlocked(true),
    lockVaultSession: () => setVaultUnlocked(false),
    enablePushNotifications,
    triggerTestReminder,
    updateProfile,
    toggleDarkMode,
    setLanguage,
    addHealthLog,
    toggleHealthLogCompleted,
    deleteHealthLog,
    addGrowthEntry,
    addMilestone,
    updateMilestoneStatus,
    addMemoryPhoto,
    deleteMemoryPhoto,
    addMedicalRecord,
    deleteMedicalRecord,
    createServiceBooking,
    updateServiceBookingStatus,
    sendConsultationMessage,
    createConsultationThread,
    createCommunityPost,
    addCommunityReply,
    toggleCommunityLike,
    subscribePostDetails,
    toast,
    showToast,
    dismissToast,
  };

  return <BabyMemoryContext.Provider value={value}>{children}</BabyMemoryContext.Provider>;
};

export function useBabyMemory(): BabyMemoryContextValue {
  const ctx = useContext(BabyMemoryContext);
  if (!ctx) {
    throw new Error('useBabyMemory must be used inside BabyMemoryProvider.');
  }
  return ctx;
}
