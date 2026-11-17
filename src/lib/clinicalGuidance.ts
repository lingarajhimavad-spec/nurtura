import type {
  CommunityPost,
  ConsultationMessage,
  ConsultationThread,
  GrowthEntry,
  HealthConditionId,
  HealthLog,
  MedicalRecord,
  MemoryPhoto,
  Milestone,
  MilestoneCategory,
  ParentStage,
  ServiceBooking,
  UserProfile,
} from '../types/babyMemory';
import { FIELD_LIMITS, todayIsoDate } from './validation';

export type WhoCheckupProgram = 'anc' | 'pnc_epi';

export interface WhoCheckupItem {
  id: string;
  program: WhoCheckupProgram;
  contactLabel: string;
  weekLabel: string;
  weekTarget: number;
  dayOffsetFromBirth?: number;
  category: MilestoneCategory;
  title: string;
  clinicalChecks: string[];
  vaccinesOrTests: string[];
  summaryNote: string;
}

export const WHO_ANTENATAL_CHECKUPS: WhoCheckupItem[] = [
  {
    id: 'who_anc_c1',
    program: 'anc',
    contactLabel: 'ANC Contact 1',
    weekLabel: 'Week 12',
    weekTarget: 12,
    category: 'appointment',
    title: 'WHO ANC Contact 1: Early Booking & First-Trimester Baseline',
    clinicalChecks: [
      'Blood pressure & baseline BMI/weight',
      'Hemoglobin / anemia & blood group Rh typing',
      'Urine asymptomatic bacteriuria screen',
    ],
    vaccinesOrTests: [
      'Early dating ultrasound (gestational age)',
      'HIV, syphilis & HepB screening',
      'Daily iron (30–60 mg) + folic acid (400 mcg)',
    ],
    summaryNote:
      'Establish accurate gestational age, screen early risk factors, and begin daily iron-folic acid supplementation.',
  },
  {
    id: 'who_anc_c2',
    program: 'anc',
    contactLabel: 'ANC Contact 2',
    weekLabel: 'Week 20',
    weekTarget: 20,
    category: 'checkup_20w',
    title: 'WHO ANC Contact 2: 20-Week Anomaly Scan & Mid-Pregnancy Check',
    clinicalChecks: [
      'Detailed fetal anatomy ultrasound (18–22 wks)',
      'Symphysis-fundal height & fetal heart auscultation',
      'Blood pressure & urine protein check',
    ],
    vaccinesOrTests: [
      'Tetanus-diphtheria (Td / Tdap) immunization review',
      'Calcium supplementation review if dietary intake is low',
    ],
    summaryNote:
      'Mid-trimester structural ultrasound, fetal heartbeat verification, and hypertensive baseline monitoring.',
  },
  {
    id: 'who_anc_c3',
    program: 'anc',
    contactLabel: 'ANC Contact 3',
    weekLabel: 'Week 26',
    weekTarget: 26,
    category: 'appointment',
    title: 'WHO ANC Contact 3: Gestational Diabetes & Hemoglobin Screen',
    clinicalChecks: [
      'Blood pressure & edema assessment',
      'Fetal movement & fundal growth tracking',
      'Maternal weight trajectory review',
    ],
    vaccinesOrTests: [
      '75g Oral Glucose Tolerance Test (OGTT)',
      'Repeat hemoglobin / serum ferritin check',
    ],
    summaryNote:
      'Third-trimester transition screen for gestational diabetes mellitus and mid-pregnancy iron depletion.',
  },
  {
    id: 'who_anc_c4',
    program: 'anc',
    contactLabel: 'ANC Contact 4',
    weekLabel: 'Week 30',
    weekTarget: 30,
    category: 'appointment',
    title: 'WHO ANC Contact 4: Third-Trimester Growth & Preeclampsia Check',
    clinicalChecks: [
      'Blood pressure & preeclampsia symptom review',
      'Fundal height growth velocity',
      'Fetal heart rate & activity assessment',
    ],
    vaccinesOrTests: [
      'Urine dipstick proteinuria screen',
      'Anti-D immunoglobulin check (if Rh-negative)',
    ],
    summaryNote:
      'Initiates bi-weekly third-trimester surveillance for hypertensive disorders and fetal growth.',
  },
  {
    id: 'who_anc_c5',
    program: 'anc',
    contactLabel: 'ANC Contact 5',
    weekLabel: 'Week 34',
    weekTarget: 34,
    category: 'appointment',
    title: 'WHO ANC Contact 5: Presentation & Birth Preparedness Review',
    clinicalChecks: [
      'Leopold maneuvers for fetal lie & presentation',
      'Blood pressure & maternal wellness review',
      'Daily fetal movement monitoring',
    ],
    vaccinesOrTests: [
      'Repeat syphilis / anemia check if indicated',
      'Birth & emergency transport readiness plan',
    ],
    summaryNote:
      'Confirm fetal position trend, review labor danger signs, and finalize delivery readiness plan.',
  },
  {
    id: 'who_anc_c6',
    program: 'anc',
    contactLabel: 'ANC Contact 6',
    weekLabel: 'Week 36',
    weekTarget: 36,
    category: 'appointment',
    title: 'WHO ANC Contact 6: Late-Pregnancy Presentation & Lab Review',
    clinicalChecks: [
      'Confirm cephalic (head-down) presentation',
      'Blood pressure & urine protein check',
      'Early breastfeeding & postpartum plan counseling',
    ],
    vaccinesOrTests: [
      'Late-pregnancy hemoglobin re-check',
      'Group B Strep / infection screen per protocol',
    ],
    summaryNote:
      'Confirm fetal engagement/presentation and verify maternal hemoglobin reserves ahead of labor.',
  },
  {
    id: 'who_anc_c7',
    program: 'anc',
    contactLabel: 'ANC Contact 7',
    weekLabel: 'Week 38',
    weekTarget: 38,
    category: 'appointment',
    title: 'WHO ANC Contact 7: Pre-Labor Maternal & Fetal Surveillance',
    clinicalChecks: [
      'Blood pressure & headache/vision screen',
      'Early labor signs & membrane guidance',
      'Fetal kick-count confirmation',
    ],
    vaccinesOrTests: [
      'Urine protein dipstick',
      'Hospital bag & newborn pediatric provider confirm',
    ],
    summaryNote:
      'Close pre-term-to-term monitoring for hypertension, reduced fetal movements, or early labor onset.',
  },
  {
    id: 'who_anc_c8',
    program: 'anc',
    contactLabel: 'ANC Contact 8',
    weekLabel: 'Week 40',
    weekTarget: 40,
    category: 'appointment',
    title: 'WHO ANC Contact 8: Full-Term Assessment & Post-Dates Plan',
    clinicalChecks: [
      'Term blood pressure & amniotic fluid check',
      'Fetal heart rate & engagement check',
      'Post-dates induction counseling (>41 weeks)',
    ],
    vaccinesOrTests: [
      'Non-stress test / biophysical profile if past due',
      'Delivery admission checklist review',
    ],
    summaryNote:
      'Term evaluation to confirm fetal well-being and plan safe monitoring if pregnancy passes 40–41 weeks.',
  },
];

export const WHO_POSTNATAL_INFANT_CHECKUPS: WhoCheckupItem[] = [
  {
    id: 'who_pnc_d1',
    program: 'pnc_epi',
    contactLabel: 'PNC Contact 1',
    weekLabel: 'Day 1 (24h)',
    weekTarget: 0,
    dayOffsetFromBirth: 1,
    category: 'developmental',
    title: 'WHO PNC 1 (24h): Newborn Exam, Birth Vaccines & Latch Check',
    clinicalChecks: [
      'Newborn breathing, warmth & umbilical cord exam',
      'Maternal bleeding, BP & uterine involution',
      'Skin-to-skin & early breastfeeding latch',
    ],
    vaccinesOrTests: [
      'BCG vaccine',
      'HepB birth dose (HepB-0) within 24h',
      'OPV-0 & Vitamin K prophylaxis',
    ],
    summaryNote:
      'First 24-hour postnatal check for mother and newborn paired with WHO birth immunizations.',
  },
  {
    id: 'who_pnc_d3',
    program: 'pnc_epi',
    contactLabel: 'PNC Contact 2',
    weekLabel: 'Day 3 (48–72h)',
    weekTarget: 1,
    dayOffsetFromBirth: 3,
    category: 'developmental',
    title: 'WHO PNC 2 (Day 3): Jaundice Screen, Weight & Cord Care',
    clinicalChecks: [
      'Neonatal jaundice & hydration assessment',
      'Umbilical stump cleanliness & infection screen',
      'Maternal BP, lochia & incision/perineal healing',
    ],
    vaccinesOrTests: [
      'Newborn metabolic / bilirubin screen',
      'Feeding adequacy (wet & stool output check)',
    ],
    summaryNote:
      'Detects peak Day 3 neonatal jaundice, feeding challenges, and early maternal postnatal warning signs.',
  },
  {
    id: 'who_pnc_w2',
    program: 'pnc_epi',
    contactLabel: 'PNC Contact 3',
    weekLabel: 'Week 2 (Days 7–14)',
    weekTarget: 2,
    dayOffsetFromBirth: 14,
    category: 'developmental',
    title: 'WHO PNC 3 (Week 2): Birth-Weight Regain & Postpartum Mood',
    clinicalChecks: [
      'Confirm infant return to birth weight',
      'Visual fixation & newborn reflex check',
      'Maternal emotional & postpartum mood screen',
    ],
    vaccinesOrTests: [
      'Repeat newborn thyroid / metabolic screen if advised',
      'Infant Vitamin D3 400 IU drop check',
    ],
    summaryNote:
      'Verifies neonatal weight regain by day 10–14 and supports maternal physical and mental recovery.',
  },
  {
    id: 'who_pnc_w6',
    program: 'pnc_epi',
    contactLabel: 'PNC 4 + EPI 1',
    weekLabel: 'Week 5–6',
    weekTarget: 5,
    dayOffsetFromBirth: 42,
    category: 'checkup_5w',
    title: 'WHO PNC 4 & EPI Week 5–6: Postnatal Clearance & Dose 1 Vaccines',
    clinicalChecks: [
      'Maternal 6-week pelvic / C-section clearance',
      'Infant weight, length & head circumference',
      'Early social smile & hip exam',
    ],
    vaccinesOrTests: [
      'DTP-HepB-Hib (Pentavalent) Dose 1',
      'OPV 1 / IPV 1 + PCV 1 + Rotavirus 1',
    ],
    summaryNote:
      'Completes the 4 WHO postnatal contacts and starts primary WHO EPI infant vaccinations.',
  },
  {
    id: 'who_epi_w10',
    program: 'pnc_epi',
    contactLabel: 'EPI Visit 2',
    weekLabel: 'Week 10',
    weekTarget: 10,
    dayOffsetFromBirth: 70,
    category: 'checkup_10w',
    title: 'WHO EPI Week 10: Primary Vaccine Dose 2 & Head Control Check',
    clinicalChecks: [
      'Head control during tummy time',
      'Vocal cooing & responsive eye tracking',
      'WHO weight-for-age & head plotting',
    ],
    vaccinesOrTests: [
      'DTP-HepB-Hib (Pentavalent) Dose 2',
      'OPV 2 + PCV 2 + Rotavirus 2',
    ],
    summaryNote:
      'Second primary WHO EPI immunization visit paired with 10-week neuromotor and growth review.',
  },
  {
    id: 'who_epi_w14',
    program: 'pnc_epi',
    contactLabel: 'EPI Visit 3',
    weekLabel: 'Week 14',
    weekTarget: 14,
    dayOffsetFromBirth: 98,
    category: 'vaccine',
    title: 'WHO EPI Week 14: Primary Vaccine Dose 3 & IPV Booster',
    clinicalChecks: [
      'Reaching for toys & midline hand play',
      'Weight, length & head growth percentile',
      'Post-vaccine comfort care review',
    ],
    vaccinesOrTests: [
      'DTP-HepB-Hib (Pentavalent) Dose 3',
      'OPV 3 + IPV + PCV 3',
    ],
    summaryNote:
      'Completes the primary 3-dose infant pentavalent, polio, and pneumococcal immunization series.',
  },
  {
    id: 'who_epi_w20',
    program: 'pnc_epi',
    contactLabel: 'Week 20 Check',
    weekLabel: 'Week 20',
    weekTarget: 20,
    dayOffsetFromBirth: 140,
    category: 'checkup_20w',
    title: 'WHO Week 20 Checkup: Rolling, Growth & Solids Readiness',
    clinicalChecks: [
      'Rolling front-to-back & neck stability',
      'Doubled birth weight & head growth review',
      'Exclusive breastfeeding check before 6 months',
    ],
    vaccinesOrTests: [
      'Developmental & anemia risk screen',
      'Iron-rich complementary feeding prep',
    ],
    summaryNote:
      'Five-month growth and developmental check bridging 14-week vaccines and 6-month complementary feeding.',
  },
  {
    id: 'who_epi_w26',
    program: 'pnc_epi',
    contactLabel: '6-Month Check',
    weekLabel: 'Week 26 (6 mo)',
    weekTarget: 26,
    dayOffsetFromBirth: 182,
    category: 'developmental',
    title: 'WHO 6-Month (Week 26): Complementary Feeding & Growth Review',
    clinicalChecks: [
      'Supported sitting & readiness for mashed foods',
      'Weight, length & head percentile plotting',
      'Continued breastfeeding + iron-rich foods plan',
    ],
    vaccinesOrTests: [
      'Vitamin A supplementation (where endemic)',
      'Seasonal influenza assessment (6m+)',
    ],
    summaryNote:
      'Marks the WHO 6-month transition to safe, nutrient-dense complementary feeding alongside milk feeds.',
  },
  {
    id: 'who_epi_w39',
    program: 'pnc_epi',
    contactLabel: '9-Month EPI',
    weekLabel: 'Week 39 (9 mo)',
    weekTarget: 39,
    dayOffsetFromBirth: 273,
    category: 'vaccine',
    title: 'WHO EPI 9-Month (Week 39): Measles-Rubella (MR-1) & Mobility',
    clinicalChecks: [
      'Crawling, pulling to stand & pincer grasp',
      'Babbling & social responsiveness check',
      'Dietary diversity & iron intake review',
    ],
    vaccinesOrTests: [
      'Measles-Rubella (MR-1) vaccine',
      'Yellow Fever / Vitamin A (per regional EPI)',
    ],
    summaryNote:
      'Core 9-month WHO EPI measles protection and gross/fine motor developmental assessment.',
  },
];

export function computeWhoCheckupDate(dueOrBirthDate: string, item: WhoCheckupItem): string {
  const baseStr = FIELD_LIMITS.DATE_PATTERN.test(dueOrBirthDate) ? dueOrBirthDate : todayIsoDate();
  const [y, m, d] = baseStr.split('-').map(Number);
  const baseUtc = Date.UTC(y, m - 1, d);
  const offsetDays =
    item.program === 'anc'
      ? (item.weekTarget - 40) * 7
      : item.dayOffsetFromBirth ?? item.weekTarget * 7;
  const target = new Date(baseUtc + offsetDays * 86400000);
  const ty = target.getUTCFullYear();
  const tm = String(target.getUTCMonth() + 1).padStart(2, '0');
  const td = String(target.getUTCDate()).padStart(2, '0');
  return `${ty}-${tm}-${td}`;
}

export const HEALTH_CONDITION_OPTIONS: { id: HealthConditionId; label: string }[] = [
  { id: 'gestational_diabetes', label: 'Gestational Diabetes' },
  { id: 'anemia', label: 'Iron-Deficiency Anemia' },
  { id: 'hypertension', label: 'Pregnancy Hypertension' },
  { id: 'thyroid', label: 'Hypothyroidism / Thyroid Care' },
  { id: 'nausea', label: 'Morning Sickness / Hyperemesis' },
  { id: 'c_section_recovery', label: 'Post-C-Section Recovery' },
  { id: 'lactation_support', label: 'Breastfeeding / Lactation Focus' },
];

export interface AvoidanceItem {
  item: string;
  reason: string;
  severity: 'strict' | 'caution';
  appliesTo: string;
}

export function getTailoredAvoidanceList(
  stage: ParentStage,
  conditions: HealthConditionId[]
): AvoidanceItem[] {
  const base: AvoidanceItem[] =
    stage === 'expecting'
      ? [
          {
            item: 'Unpasteurized dairy & soft cheeses',
            reason: 'Risk of Listeria monocytogenes infection during pregnancy.',
            severity: 'strict',
            appliesTo: 'Pregnancy baseline',
          },
          {
            item: 'High-mercury fish (swordfish, king mackerel, bigeye tuna)',
            reason: 'Mercury can affect fetal nervous system development.',
            severity: 'strict',
            appliesTo: 'Pregnancy baseline',
          },
          {
            item: 'Raw or undercooked eggs, poultry, and sushi',
            reason: 'Elevated bacterial contamination risk while immune-modulated.',
            severity: 'strict',
            appliesTo: 'Pregnancy baseline',
          },
          {
            item: 'Caffeine above 200 mg/day & all alcohol',
            reason: 'Crosses placenta and affects fetal heart rate and growth.',
            severity: 'strict',
            appliesTo: 'Pregnancy baseline',
          },
        ]
      : [
          {
            item: 'Honey for infants under 12 months',
            reason: 'Risk of infant botulism spores before gut flora matures.',
            severity: 'strict',
            appliesTo: 'Infant safety (0–12m)',
          },
          {
            item: 'Whole cow’s milk as primary drink before 12 months',
            reason: 'Low iron bioavailability and heavy renal solute load for newborns.',
            severity: 'strict',
            appliesTo: 'Infant safety (0–12m)',
          },
          {
            item: 'Loose blankets, pillows, or soft toys in crib',
            reason: 'Unsafe sleep hazard; keep sleep surface firm and clear.',
            severity: 'strict',
            appliesTo: 'Safe sleep guideline',
          },
        ];

  if (conditions.includes('gestational_diabetes')) {
    base.unshift({
      item: 'Fruit juices, sweetened yogurts, and refined white-flour pastries',
      reason: 'Triggers rapid post-prandial blood glucose spikes.',
      severity: 'strict',
      appliesTo: 'Gestational Diabetes',
    });
  }
  if (conditions.includes('anemia')) {
    base.unshift({
      item: 'Tea or coffee within 60 minutes of iron tablets or meals',
      reason: 'Tannins and polyphenols block non-heme iron absorption by up to 60%.',
      severity: 'caution',
      appliesTo: 'Iron-Deficiency Anemia',
    });
  }
  if (conditions.includes('hypertension')) {
    base.unshift({
      item: 'Canned soups, pickled snacks, and high-sodium cured meats',
      reason: 'Excess sodium worsens fluid retention and blood pressure elevation.',
      severity: 'strict',
      appliesTo: 'Hypertension',
    });
  }
  if (conditions.includes('thyroid')) {
    base.unshift({
      item: 'Calcium or iron supplements within 4 hours of levothyroxine',
      reason: 'Minerals bind thyroid hormone in the gut and reduce absorption.',
      severity: 'strict',
      appliesTo: 'Thyroid Care',
    });
  }
  if (conditions.includes('c_section_recovery')) {
    base.unshift({
      item: 'Lifting heavier than baby’s weight & deep abdominal crunches',
      reason: 'Strains healing abdominal fascia during first 6–8 weeks postpartum.',
      severity: 'strict',
      appliesTo: 'C-Section Recovery',
    });
  }

  return base;
}

export interface YogaSession {
  id: string;
  title: string;
  durationMin: number;
  breathPattern: string;
  poses: string[];
  benefit: string;
  safetyNote: string;
}

export function getTailoredYogaSessions(
  stage: ParentStage,
  conditions: HealthConditionId[]
): YogaSession[] {
  const sessions: YogaSession[] = [];

  if (stage === 'expecting') {
    sessions.push(
      {
        id: 'yoga_pelvic_flow',
        title: 'Gentle Cat-Cow & Pelvic Mobility Flow',
        durationMin: 12,
        breathPattern: '4s nasal inhale · 6s slow exhale',
        poses: ['Supported Table Cat-Cow', 'Wide-Knee Child’s Pose (Bolster)', 'Seated Butterfly', 'Left-Side Savasana'],
        benefit: 'Relieves lower-back pressure and prepares pelvic floor alignment.',
        safetyNote: 'Avoid deep belly twists or lying flat on your back after week 20.',
      },
      {
        id: 'yoga_calm_breath',
        title: 'Diaphragmatic Box & Belly Breathing',
        durationMin: 8,
        breathPattern: '4s inhale · 2s pause · 6s exhale',
        poses: ['Bolster-Elevated Easy Seat', 'Shoulder Rolls', 'Guided Hand-to-Belly Visualization'],
        benefit: 'Lowers maternal cortisol and supports restful evening sleep.',
        safetyNote: 'Never hold breath to strain; keep breathing fluid.',
      }
    );
  } else {
    sessions.push(
      {
        id: 'yoga_postpartum_reset',
        title: 'Postpartum Neck, Shoulder & Pelvic Reset',
        durationMin: 10,
        breathPattern: '4s inhale · 6s pelvic-lift exhale',
        poses: ['Seated Eagle Arms', 'Doorway Chest Opener', 'Supported Bridge (Gentle)', 'Legs-Up-the-Wall'],
        benefit: 'Counteracts feeding posture tension and supports pelvic recovery.',
        safetyNote: conditions.includes('c_section_recovery')
          ? 'Skip Bridge until incision is cleared at your 6-week checkup.'
          : 'Move slowly and stop if any incision or pelvic discomfort occurs.',
      },
      {
        id: 'yoga_night_meditation',
        title: 'Midnight Nursing Calm Meditation',
        durationMin: 6,
        breathPattern: '4s inhale · 7s slow sigh exhale',
        poses: ['Supported Reclined Cushion', 'Jaw & Brow Release', 'Body Scan'],
        benefit: 'Helps parents return to sleep swiftly between night feeds.',
        safetyNote: 'Safe immediately postpartum and during lactation.',
      }
    );
  }

  if (conditions.includes('hypertension')) {
    sessions.push({
      id: 'yoga_bp_cooldown',
      title: 'Parasympathetic Blood-Pressure Soother',
      durationMin: 10,
      breathPattern: '4s inhale · 8s humming exhale (Bhramari)',
      poses: ['Left-Side Supported Rest', 'Ankle Circles', 'Seated Chin Tuck'],
      benefit: 'Activates vagal tone and gently eases vascular tension.',
      safetyNote: 'Keep head elevated above heart level; avoid inversions.',
    });
  }

  if (conditions.includes('gestational_diabetes')) {
    sessions.push({
      id: 'yoga_postmeal_walk',
      title: '15-Min Post-Meal Mobility & Gentle Stroll',
      durationMin: 15,
      breathPattern: 'Steady conversational nasal breath',
      poses: ['Gentle Indoor Walk', 'Standing Calf Raises', 'Wall Push-Aways'],
      benefit: 'Improves post-meal glucose uptake by 15–25% naturally.',
      safetyNote: 'Stay hydrated with 250 ml water before and after.',
    });
  }

  return sessions;
}

export interface DietaryAnalysis {
  waterLoggedMl: number;
  waterGoalMl: number;
  mealsLoggedCount: number;
  targetCaloriesNote: string;
  gaps: string[];
  mealSlots: {
    slot: string;
    meal: string;
    nutrients: string;
    reason: string;
  }[];
}

export function buildRealtimeDietaryPlan(
  profile: UserProfile,
  todayLogs: HealthLog[]
): DietaryAnalysis {
  const waterLoggedMl = todayLogs
    .filter((l) => l.logType === 'water')
    .reduce((acc, l) => acc + (l.valueNum || 0), 0);
  const mealsLogged = todayLogs.filter(
    (l) => l.logType === 'food' || l.logType === 'feeding'
  );
  const tabletsCompleted = todayLogs.filter(
    (l) => l.logType === 'tablet' && l.completed
  );

  const gaps: string[] = [];
  if (waterLoggedMl < profile.dailyWaterGoalMl * 0.5) {
    gaps.push(
      `Hydration deficit: ${profile.dailyWaterGoalMl - waterLoggedMl} ml remaining to hit today's ${profile.dailyWaterGoalMl} ml target.`
    );
  }
  if (mealsLogged.length < 2) {
    gaps.push('Fewer than 2 balanced meals logged today — prioritize steady protein & complex carbs.');
  }
  if (tabletsCompleted.length === 0) {
    gaps.push('Daily prenatal / supplement tablets not marked completed yet.');
  }

  const hasGD = profile.healthConditions.includes('gestational_diabetes');
  const hasAnemia = profile.healthConditions.includes('anemia');
  const hasBP = profile.healthConditions.includes('hypertension');

  const mealSlots = [
    {
      slot: 'Morning (08:00)',
      meal: hasGD
        ? 'Steel-cut oats with chia seeds, boiled egg & walnuts'
        : 'Warm spinach omelet with whole-grain toast & citrus slices',
      nutrients: hasAnemia ? 'Protein · Vitamin C (boosts iron uptake)' : 'Folate · Choline · Fiber',
      reason: hasGD
        ? 'Low-glycemic breakfast prevents morning insulin resistance spikes.'
        : 'Supports steady morning energy and fetal/infant brain nutrients.',
    },
    {
      slot: 'Midday (13:00)',
      meal: hasAnemia
        ? 'Lentil & red-pepper quinoa bowl with grilled salmon or tofu'
        : 'Grilled herb chicken or chickpea bowl with steamed greens & avocado',
      nutrients: 'Iron · Omega-3 DHA · Calcium',
      reason: hasAnemia
        ? 'Combines iron-rich legumes with Vitamin C without dairy/tannin blockers.'
        : 'Balanced protein + DHA intake for sustained afternoon stamina.',
    },
    {
      slot: 'Afternoon Snack (16:30)',
      meal: hasBP
        ? 'Unsalted roasted pumpkin seeds, potassium-rich banana & Greek yogurt'
        : 'Greek yogurt with berries, flaxseed & roasted almonds',
      nutrients: hasBP ? 'Potassium · Magnesium · Low Sodium' : 'Probiotics · Calcium · Healthy Fats',
      reason: hasBP
        ? 'Potassium and magnesium naturally support healthy vascular tone.'
        : 'Curbs late-afternoon fatigue and supports bone mineral density.',
    },
    {
      slot: 'Evening (19:30)',
      meal:
        profile.parentStage === 'new_parent'
          ? 'Warm mung bean & vegetable khichdi / broth with sautéed greens'
          : 'Baked sweet potato, steamed broccoli & herb-crusted cod or paneer',
      nutrients: 'B-Vitamins · Magnesium · Hydration',
      reason:
        profile.parentStage === 'new_parent'
          ? 'Easy-to-digest warm meal supporting postpartum recovery and milk supply.'
          : 'Gentle digestion before sleep while topping up magnesium.',
    },
  ];

  return {
    waterLoggedMl,
    waterGoalMl: profile.dailyWaterGoalMl,
    mealsLoggedCount: mealsLogged.length,
    targetCaloriesNote:
      profile.parentStage === 'expecting'
        ? profile.currentWeek > 13
          ? '+340 to +450 kcal/day above baseline (2nd/3rd trimester)'
          : 'Maintenance calories + 400 mcg folate focus (1st trimester)'
        : 'Postpartum recovery & lactation focus (+450–500 kcal if nursing)',
    gaps,
    mealSlots,
  };
}

export function createStarterData(uid: string, displayName: string, email: string): {
  profile: UserProfile;
  healthLogs: HealthLog[];
  growthEntries: GrowthEntry[];
  milestones: Milestone[];
  memories: MemoryPhoto[];
  medicalRecords: MedicalRecord[];
  serviceBookings: ServiceBooking[];
  threads: ConsultationThread[];
  messagesByThread: Record<string, ConsultationMessage[]>;
  communityPosts: CommunityPost[];
} {
  const today = todayIsoDate();

  const profile: UserProfile = {
    uid,
    displayName: displayName || 'Maya & Family',
    email: email || 'parent@nurtura.app',
    parentStage: 'new_parent',
    babyName: 'Aarav',
    dueOrBirthDate: '2026-09-08',
    currentWeek: 10,
    healthConditions: ['anemia', 'lactation_support'],
    language: 'en',
    darkMode: false,
    biometricEnabled: false,
    dailyWaterGoalMl: 2500,
    targetWeightKg: 5.8,
    dailySleepGoalHours: 14,
  };

  const healthLogs: HealthLog[] = [
    {
      id: 'log_tab_1',
      ownerId: uid,
      logType: 'tablet',
      title: 'Postnatal Iron + Folic Acid (65mg)',
      valueNum: 1,
      unit: 'tablet',
      notes: 'Take with orange slice, avoid tea for 60m',
      loggedDate: today,
      loggedTime: '08:30',
      completed: true,
    },
    {
      id: 'log_tab_2',
      ownerId: uid,
      logType: 'tablet',
      title: 'Baby Vitamin D3 Drops (400 IU)',
      valueNum: 1,
      unit: 'drop',
      notes: 'Administer before morning feed',
      loggedDate: today,
      loggedTime: '09:00',
      completed: false,
    },
    {
      id: 'log_water_1',
      ownerId: uid,
      logType: 'water',
      title: 'Morning Hydration',
      valueNum: 500,
      unit: 'ml',
      notes: 'Warm water + electrolyte glass',
      loggedDate: today,
      loggedTime: '08:45',
      completed: true,
    },
    {
      id: 'log_water_2',
      ownerId: uid,
      logType: 'water',
      title: 'Mid-Morning Hydration',
      valueNum: 500,
      unit: 'ml',
      notes: 'Water bottle refill',
      loggedDate: today,
      loggedTime: '11:15',
      completed: true,
    },
    {
      id: 'log_feed_1',
      ownerId: uid,
      logType: 'feeding',
      title: 'Morning Nursing / Feeding Session',
      valueNum: 120,
      unit: 'ml',
      notes: 'Left + Right, calm latch',
      loggedDate: today,
      loggedTime: '07:15',
      completed: true,
    },
    {
      id: 'log_food_1',
      ownerId: uid,
      logType: 'food',
      title: 'Spinach Omelet & Whole Grain Toast',
      valueNum: 420,
      unit: 'kcal',
      notes: 'High iron + protein breakfast',
      loggedDate: today,
      loggedTime: '08:15',
      completed: true,
    },
    {
      id: 'log_sleep_1',
      ownerId: uid,
      logType: 'sleep',
      title: 'Overnight Sleep Block',
      valueNum: 7.5,
      unit: 'hrs',
      notes: 'Two brief wakes for feeding',
      loggedDate: today,
      loggedTime: '06:30',
      completed: true,
    },
    {
      id: 'log_act_1',
      ownerId: uid,
      logType: 'activity',
      title: 'Morning Tummy Time & Stroller Walk',
      valueNum: 20,
      unit: 'min',
      notes: 'Strong head lift during tummy time',
      loggedDate: today,
      loggedTime: '10:00',
      completed: true,
    },
  ];

  const growthEntries: GrowthEntry[] = [
    {
      id: 'gr_w1',
      ownerId: uid,
      weekNumber: 1,
      date: '2026-09-15',
      weightKg: 3.3,
      heightCm: 50.2,
      headCm: 34.4,
      notes: 'Back to birth weight by day 10',
    },
    {
      id: 'gr_w5',
      ownerId: uid,
      weekNumber: 5,
      date: '2026-10-13',
      weightKg: 4.4,
      heightCm: 54.6,
      headCm: 36.8,
      notes: '5-week checkup nominal',
    },
    {
      id: 'gr_w8',
      ownerId: uid,
      weekNumber: 8,
      date: '2026-11-03',
      weightKg: 5.1,
      heightCm: 57.1,
      headCm: 38.2,
      notes: 'Steady 50th percentile growth',
    },
    {
      id: 'gr_w10',
      ownerId: uid,
      weekNumber: 10,
      date: '2026-11-17',
      weightKg: 5.5,
      heightCm: 58.6,
      headCm: 39.0,
      notes: '10-week pre-visit measurement',
    },
  ];

  const milestones: Milestone[] = [
    {
      id: 'ms_5w',
      ownerId: uid,
      category: 'checkup_5w',
      title: '5-Week Postpartum & Baby Wellness Checkup',
      weekTarget: 5,
      scheduledDate: '2026-10-13',
      status: 'completed',
      doctorName: 'Dr. Sarah Jenkins',
      notes: 'Weight gain verified, umbilical cord healed, first social smile.',
      reminderEnabled: true,
    },
    {
      id: 'ms_10w',
      ownerId: uid,
      category: 'checkup_10w',
      title: '10-Week Developmental Checkup & DTaP/Rotavirus Dose 2',
      weekTarget: 10,
      scheduledDate: '2026-11-19',
      status: 'upcoming',
      doctorName: 'Dr. Sarah Jenkins',
      notes: 'Bring immunization card & Vitamin D questions.',
      reminderEnabled: true,
    },
    {
      id: 'ms_20w',
      ownerId: uid,
      category: 'checkup_20w',
      title: '20-Week Milestone Assessment & Rolling / Readiness Screen',
      weekTarget: 20,
      scheduledDate: '2027-01-26',
      status: 'upcoming',
      doctorName: 'Dr. Sarah Jenkins',
      notes: 'Evaluate head control, rolling, and solids readiness cues.',
      reminderEnabled: true,
    },
    {
      id: 'ms_vac_1',
      ownerId: uid,
      category: 'vaccine',
      title: '6-Week Pentavalent & PCV Vaccine',
      weekTarget: 6,
      scheduledDate: '2026-10-20',
      status: 'completed',
      doctorName: 'Bayview Pediatric Clinic',
      notes: 'Completed with zero fever.',
      reminderEnabled: true,
    },
    {
      id: 'ms_appt_1',
      ownerId: uid,
      category: 'appointment',
      title: 'Maternal Ferritin & Hemoglobin Follow-Up Lab',
      weekTarget: 10,
      scheduledDate: '2026-11-21',
      status: 'upcoming',
      doctorName: 'Dr. Priya Nair (OB/GYN)',
      notes: 'Fasting morning blood draw recommended.',
      reminderEnabled: true,
    },
  ];

  const memories: MemoryPhoto[] = [
    {
      id: 'mem_1',
      ownerId: uid,
      title: 'First Morning Home',
      caption: 'Quiet sunlit morning in the nursery after hospital discharge.',
      milestoneWeek: 1,
      category: 'firsts',
      dateTaken: '2026-09-12',
      imageData: '/src/assets/images/memory_baby_feet_1794935392015.jpg',
    },
    {
      id: 'mem_2',
      ownerId: uid,
      title: 'Two Weeks & One Month Keepsake',
      caption: 'Sage knit cardigan and beechwood milestone blocks on linen.',
      milestoneWeek: 4,
      category: 'milestone',
      dateTaken: '2026-10-06',
      imageData: '/src/assets/images/memory_milestone_blocks_1794935392258.jpg',
    },
    {
      id: 'mem_3',
      ownerId: uid,
      title: 'Calm Prenatal Breathing Ritual',
      caption: 'Second trimester morning meditation session before Aarav arrived.',
      milestoneWeek: 24,
      category: 'wellness',
      dateTaken: '2026-06-15',
      imageData: '/src/assets/images/memory_prenatal_calm_1794935391839.jpg',
    },
  ];

  const medicalRecords: MedicalRecord[] = [
    {
      id: 'rec_ins_1',
      ownerId: uid,
      recordType: 'insurance',
      title: 'Family Maternity & Pediatric Health Policy',
      providerOrInsurer: 'BlueShield Family Care PPO',
      dateIssued: '2026-01-15',
      summary: 'Covers prenatal visits, hospital delivery, newborn screening, and 24/7 pediatric telehealth.',
      policyOrRefNumber: 'POL-BS-904821-A',
      attachmentPreview: '',
    },
    {
      id: 'rec_lab_1',
      ownerId: uid,
      recordType: 'lab_report',
      title: 'Postpartum CBC & Serum Ferritin Panel',
      providerOrInsurer: 'CityCare Diagnostics',
      dateIssued: '2026-10-14',
      summary: 'Hemoglobin: 10.9 g/dL (Mild Anemia), Ferritin: 18 ng/mL. Oral iron supplementation advised.',
      policyOrRefNumber: 'LAB-2026-4419',
      attachmentPreview: '',
    },
    {
      id: 'rec_med_1',
      ownerId: uid,
      recordType: 'medication',
      title: 'Active Maternal & Infant Supplement Regimen',
      providerOrInsurer: 'Dr. Sarah Jenkins / Dr. Priya Nair',
      dateIssued: '2026-10-15',
      summary: 'Mother: Ferrous Sulfate 65mg + Folic Acid 400mcg daily. Infant: Cholecalciferol 400 IU drops daily.',
      policyOrRefNumber: 'RX-88201',
      attachmentPreview: '',
    },
  ];

  const serviceBookings: ServiceBooking[] = [
    {
      id: 'bk_1',
      ownerId: uid,
      serviceType: 'blood_collection',
      providerName: 'Home Phlebotomy — Maternal Ferritin Panel',
      address: 'Home Visit (Scheduled Morning Slot)',
      scheduledFor: '2026-11-21 08:00',
      status: 'confirmed',
      notes: 'Fasting sample for maternal hemoglobin & ferritin re-check.',
    },
  ];

  const threads: ConsultationThread[] = [
    {
      id: 'thr_peds',
      ownerId: uid,
      doctorName: 'Dr. Sarah Jenkins',
      specialty: 'Pediatrics & Newborn Care',
      clinicName: 'Harborview Family Pediatrics',
      lastMessage: 'Keep logging weight before Thursday’s 10-week checkup—5.5 kg looks right on track!',
      status: 'active',
    },
    {
      id: 'thr_obgyn',
      ownerId: uid,
      doctorName: 'Dr. Priya Nair',
      specialty: 'OB/GYN & Maternal Wellness',
      clinicName: 'Cedar Grove Women’s Health',
      lastMessage: 'Remember to pair your iron tablet with citrus and wait 1 hour before tea.',
      status: 'active',
    },
  ];

  const messagesByThread: Record<string, ConsultationMessage[]> = {
    thr_peds: [
      {
        id: 'msg_1',
        ownerId: uid,
        senderRole: 'parent',
        senderName: displayName || 'Maya',
        body: 'Hi Dr. Jenkins, Aarav weighed 5.5 kg this morning ahead of his 10-week visit. Should we continue the 400 IU Vitamin D drops?',
        urgent: false,
      },
      {
        id: 'msg_2',
        ownerId: uid,
        senderRole: 'doctor',
        senderName: 'Dr. Sarah Jenkins',
        body: 'Keep logging weight before Thursday’s 10-week checkup—5.5 kg looks right on track! Yes, continue 400 IU Vitamin D drops daily.',
        urgent: false,
      },
    ],
    thr_obgyn: [
      {
        id: 'msg_3',
        ownerId: uid,
        senderRole: 'doctor',
        senderName: 'Dr. Priya Nair',
        body: 'Remember to pair your iron tablet with citrus and wait 1 hour before tea.',
        urgent: false,
      },
    ],
  };

  const communityPosts: CommunityPost[] = [
    {
      id: 'post_sample_1',
      authorUid: 'community_guide',
      authorHandle: 'Elena R. (Week 12)',
      topic: 'milestones',
      title: 'Tips for preparing for the 10-week vaccination visit?',
      body: 'Our 10-week checkup is coming up this week. Bringing an extra swaddle and comfort feed right after helped so much at week 6. Any other practical tips?',
      isPublic: true,
    },
    {
      id: 'post_sample_2',
      authorUid: 'community_guide_2',
      authorHandle: 'Ananya M. (Week 20 Expecting)',
      topic: 'nutrition',
      title: 'Boosting iron naturally alongside prenatal tablets',
      body: 'Pairing lentil soup with fresh lemon juice and keeping morning chai 90 minutes later brought my energy right back up!',
      isPublic: true,
    },
  ];

  return {
    profile,
    healthLogs,
    growthEntries,
    milestones,
    memories,
    medicalRecords,
    serviceBookings,
    threads,
    messagesByThread,
    communityPosts,
  };
}
