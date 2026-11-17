import type { LanguageCode } from '../types/babyMemory';

export interface TranslationDict {
  brand: string;
  navOverview: string;
  navDaily: string;
  navMilestones: string;
  navWellness: string;
  navLocator: string;
  navMemories: string;
  navConnect: string;
  signInCloud: string;
  cloudSynced: string;
  previewMode: string;
  exportPdf: string;
  settings: string;
  darkMode: string;
  lightMode: string;
  biometricLock: string;
  unlockVault: string;
  notifications: string;
  enableAlerts: string;
  emergencySos: string;
  bookBloodTest: string;
  bookRide: string;
  requestAmbulance: string;
  weekLabel: string;
  expectingStage: string;
  newParentStage: string;
  hydrationGoal: string;
  tabletsToday: string;
  sleepLogged: string;
  parentGoalsTitle: string;
  upcomingAlertsTitle: string;
  quickLogTitle: string;
  addWater250: string;
  logTablet: string;
  logFeeding: string;
  logSleep: string;
  checkup5w: string;
  checkup10w: string;
  checkup20w: string;
  growthChartTitle: string;
  dietaryPlanTitle: string;
  whatToAvoidTitle: string;
  yogaMeditationTitle: string;
  nearbyCliniciansTitle: string;
  photoGalleryTitle: string;
  medicalVaultTitle: string;
  doctorMessagesTitle: string;
  communityForumTitle: string;
  save: string;
  cancel: string;
  add: string;
}

const EN: TranslationDict = {
  brand: 'Nurtura',
  navOverview: 'Overview',
  navDaily: 'Daily Care',
  navMilestones: 'Milestones & Growth',
  navWellness: 'Diet & Wellness',
  navLocator: 'Care Locator & SOS',
  navMemories: 'Gallery & Vault',
  navConnect: 'Doctors & Community',
  signInCloud: 'Sign in with Google',
  cloudSynced: 'Cloud Synced',
  previewMode: 'Local Preview',
  exportPdf: 'Export Medical PDF',
  settings: 'Profile & Preferences',
  darkMode: 'Night Mode',
  lightMode: 'Daylight Mode',
  biometricLock: 'Biometric Lock',
  unlockVault: 'Verify Identity to Unlock',
  notifications: 'Reminders',
  enableAlerts: 'Enable Push Alerts',
  emergencySos: 'Emergency SOS',
  bookBloodTest: 'Book Blood Collection',
  bookRide: 'Book Clinic Cab',
  requestAmbulance: 'Request Ambulance',
  weekLabel: 'Week',
  expectingStage: 'Expecting Parent',
  newParentStage: 'New Parent',
  hydrationGoal: 'Hydration Today',
  tabletsToday: 'Tablets & Vitamins',
  sleepLogged: 'Sleep Pattern',
  parentGoalsTitle: 'Parent Goals & Health Analysis',
  upcomingAlertsTitle: 'Upcoming Checkups & Vaccine Alerts',
  quickLogTitle: 'Quick Daily Log',
  addWater250: 'Log 250 ml Water',
  logTablet: 'Log Tablet / Medicine',
  logFeeding: 'Log Meal / Feeding',
  logSleep: 'Log Sleep Session',
  checkup5w: '5-Week Checkup',
  checkup10w: '10-Week Checkup',
  checkup20w: '20-Week Checkup',
  growthChartTitle: 'Growth Curve & Measurements',
  dietaryPlanTitle: 'Real-Time Personalized Dietary Plan',
  whatToAvoidTitle: 'What to Avoid (Condition-Aware)',
  yogaMeditationTitle: 'Tailored Yoga & Guided Meditation',
  nearbyCliniciansTitle: 'Nearby OB/GYN, Pediatricians & Labs',
  photoGalleryTitle: 'Cloud Photo Memory Gallery',
  medicalVaultTitle: 'Medical Records, Insurance & Labs',
  doctorMessagesTitle: 'Direct Doctor Messaging',
  communityForumTitle: 'Parent Community Forum',
  save: 'Save',
  cancel: 'Cancel',
  add: 'Add Entry',
};

const ES: TranslationDict = {
  brand: 'Nurtura',
  navOverview: 'Resumen',
  navDaily: 'Cuidado Diario',
  navMilestones: 'Hitos y Crecimiento',
  navWellness: 'Dieta y Bienestar',
  navLocator: 'Clínicas y SOS',
  navMemories: 'Galería y Archivo',
  navConnect: 'Médicos y Comunidad',
  signInCloud: 'Iniciar con Google',
  cloudSynced: 'Sincronizado',
  previewMode: 'Vista Local',
  exportPdf: 'Exportar PDF Médico',
  settings: 'Perfil y Ajustes',
  darkMode: 'Modo Nocturno',
  lightMode: 'Modo Día',
  biometricLock: 'Bloqueo Biométrico',
  unlockVault: 'Verificar Identidad',
  notifications: 'Recordatorios',
  enableAlerts: 'Activar Alertas',
  emergencySos: 'Emergencia SOS',
  bookBloodTest: 'Análisis de Sangre',
  bookRide: 'Pedir Taxi Clínico',
  requestAmbulance: 'Solicitar Ambulancia',
  weekLabel: 'Semana',
  expectingStage: 'Futuros Padres',
  newParentStage: 'Padres Recientes',
  hydrationGoal: 'Hidratación Hoy',
  tabletsToday: 'Pastillas y Vitaminas',
  sleepLogged: 'Patrón de Sueño',
  parentGoalsTitle: 'Metas y Análisis de Salud',
  upcomingAlertsTitle: 'Alertas de Citas y Vacunas',
  quickLogTitle: 'Registro Rápido',
  addWater250: 'Registrar 250 ml Agua',
  logTablet: 'Registrar Pastilla',
  logFeeding: 'Registrar Comida',
  logSleep: 'Registrar Sueño',
  checkup5w: 'Control 5 Semanas',
  checkup10w: 'Control 10 Semanas',
  checkup20w: 'Control 20 Semanas',
  growthChartTitle: 'Curva de Crecimiento',
  dietaryPlanTitle: 'Plan Nutricional en Tiempo Real',
  whatToAvoidTitle: 'Qué Evitar según tu Salud',
  yogaMeditationTitle: 'Yoga Prenatal y Meditación',
  nearbyCliniciansTitle: 'Ginecólogos, Pediatras y Laboratorios',
  photoGalleryTitle: 'Galería de Recuerdos en la Nube',
  medicalVaultTitle: 'Historial Médico y Seguros',
  doctorMessagesTitle: 'Mensajería con Médicos',
  communityForumTitle: 'Foro de Padres',
  save: 'Guardar',
  cancel: 'Cancelar',
  add: 'Agregar',
};

const HI: TranslationDict = {
  brand: 'Nurtura',
  navOverview: 'मुख्य डैशबोर्ड',
  navDaily: 'दैनिक देखभाल',
  navMilestones: 'विकास और जांच',
  navWellness: 'आहार और योग',
  navLocator: 'क्लिनिक और SOS',
  navMemories: 'फ़ोटो और रिकॉर्ड',
  navConnect: 'डॉक्टर और समुदाय',
  signInCloud: 'Google से साइन इन करें',
  cloudSynced: 'क्लाउड सिंक सक्रिय',
  previewMode: 'लोकल प्रीव्यू',
  exportPdf: 'मेडिकल PDF डाउनलोड',
  settings: 'प्रोफ़ाइल और सेटिंग्स',
  darkMode: 'नाइट मोड',
  lightMode: 'डे मोड',
  biometricLock: 'बायोमेट्रिक लॉक',
  unlockVault: 'पहचान सत्यापित करें',
  notifications: 'रिमाइंडर',
  enableAlerts: 'अलर्ट चालू करें',
  emergencySos: 'आपातकालीन SOS',
  bookBloodTest: 'ब्लड टेस्ट बुक करें',
  bookRide: 'कैब बुक करें',
  requestAmbulance: 'एम्बुलेंस बुलाएं',
  weekLabel: 'सप्ताह',
  expectingStage: 'गर्भावस्था चरण',
  newParentStage: 'नवजात देखभाल',
  hydrationGoal: 'आज का पानी',
  tabletsToday: 'दवा और विटामिन',
  sleepLogged: 'नींद का पैटर्न',
  parentGoalsTitle: 'स्वास्थ्य लक्ष्य और विश्लेषण',
  upcomingAlertsTitle: 'आगामी जांच और टीकाकरण अलर्ट',
  quickLogTitle: 'त्वरित दैनिक लॉग',
  addWater250: '250 ml पानी जोड़ें',
  logTablet: 'दवा लॉग करें',
  logFeeding: 'भोजन / फीडिंग लॉग',
  logSleep: 'नींद लॉग करें',
  checkup5w: '5-सप्ताह जांच',
  checkup10w: '10-सप्ताह जांच',
  checkup20w: '20-सप्ताह जांच',
  growthChartTitle: 'विकास चार्ट और माप',
  dietaryPlanTitle: 'रीयल-टाइम व्यक्तिगत आहार योजना',
  whatToAvoidTitle: 'क्या न खाएं / सावधानियां',
  yogaMeditationTitle: 'योग और ध्यान सत्र',
  nearbyCliniciansTitle: 'नज़दीकी स्त्री रोग और बाल रोग विशेषज्ञ',
  photoGalleryTitle: 'क्लाउड फ़ोटो गैलरी',
  medicalVaultTitle: 'बीमा और लैब रिपोर्ट वॉल्ट',
  doctorMessagesTitle: 'डॉक्टर से सीधा संदेश',
  communityForumTitle: 'माता-पिता समुदाय मंच',
  save: 'सहेजें',
  cancel: 'रद्द करें',
  add: 'जोड़ें',
};

const FR: TranslationDict = {
  brand: 'Nurtura',
  navOverview: 'Aperçu',
  navDaily: 'Suivi Quotidien',
  navMilestones: 'Jalons et Croissance',
  navWellness: 'Régime et Bien-être',
  navLocator: 'Cliniques et SOS',
  navMemories: 'Galerie et Dossier',
  navConnect: 'Médecins et Forum',
  signInCloud: 'Connexion Google',
  cloudSynced: 'Synchronisé',
  previewMode: 'Aperçu Local',
  exportPdf: 'Exporter PDF Médical',
  settings: 'Profil et Préférences',
  darkMode: 'Mode Nuit',
  lightMode: 'Mode Jour',
  biometricLock: 'Verrou Biométrique',
  unlockVault: 'Vérifier l’identité',
  notifications: 'Rappels',
  enableAlerts: 'Activer les Alertes',
  emergencySos: 'Urgence SOS',
  bookBloodTest: 'Prise de Sang',
  bookRide: 'Réserver un Taxi',
  requestAmbulance: 'Appeler une Ambulance',
  weekLabel: 'Semaine',
  expectingStage: 'Futurs Parents',
  newParentStage: 'Nouveaux Parents',
  hydrationGoal: 'Hydratation du Jour',
  tabletsToday: 'Comprimés et Vitamines',
  sleepLogged: 'Sommeil Enregistré',
  parentGoalsTitle: 'Objectifs et Analyse Santé',
  upcomingAlertsTitle: 'Rappels Vaccins et Visites',
  quickLogTitle: 'Saisie Rapide',
  addWater250: 'Ajouter 250 ml Eau',
  logTablet: 'Noter Comprimé',
  logFeeding: 'Noter Repas / Tétée',
  logSleep: 'Noter Sommeil',
  checkup5w: 'Bilan 5 Semaines',
  checkup10w: 'Bilan 10 Semaines',
  checkup20w: 'Bilan 20 Semaines',
  growthChartTitle: 'Courbe de Croissance',
  dietaryPlanTitle: 'Plan Nutritionnel Personnalisé',
  whatToAvoidTitle: 'Aliments et Gestes à Éviter',
  yogaMeditationTitle: 'Yoga et Méditation Guidée',
  nearbyCliniciansTitle: 'Gynécologues, Pédiatres et Labos',
  photoGalleryTitle: 'Galerie Photo Cloud',
  medicalVaultTitle: 'Assurance et Rapports Médicaux',
  doctorMessagesTitle: 'Messagerie Médicale Directe',
  communityForumTitle: 'Communauté des Parents',
  save: 'Enregistrer',
  cancel: 'Annuler',
  add: 'Ajouter',
};

const DICTIONARIES: Record<LanguageCode, TranslationDict> = {
  en: EN,
  es: ES,
  hi: HI,
  fr: FR,
};

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  es: 'Español',
  hi: 'हिन्दी',
  fr: 'Français',
};

export function getTranslations(lang: LanguageCode): TranslationDict {
  return DICTIONARIES[lang] || EN;
}
