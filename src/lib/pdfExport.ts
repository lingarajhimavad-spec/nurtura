import { jsPDF } from 'jspdf';
import type {
  GrowthEntry,
  HealthLog,
  MedicalRecord,
  Milestone,
  UserProfile,
} from '../types/babyMemory';
import { todayIsoDate } from './validation';

export function exportMedicalSummaryPdf(params: {
  profile: UserProfile;
  growthEntries: GrowthEntry[];
  milestones: Milestone[];
  medicalRecords: MedicalRecord[];
  healthLogs: HealthLog[];
}): void {
  const { profile, growthEntries, milestones, medicalRecords, healthLogs } = params;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 48;

  const ensureSpace = (needed = 40) => {
    if (y + needed > 780) {
      doc.addPage();
      y = 48;
    }
  };

  // Header
  doc.setFillColor(46, 87, 73);
  doc.rect(0, 0, pageWidth, 72, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Nurtura — Clinical Consultation Summary', 40, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${todayIsoDate()}  |  Stage: ${profile.parentStage === 'expecting' ? 'Expecting Parent' : 'New Parent'}`, 40, 54);

  y = 96;
  doc.setTextColor(15, 23, 42);

  // Patient Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('1. Patient & Family Profile', 40, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Parent: ${profile.displayName} (${profile.email})`, 40, y);
  y += 15;
  doc.text(`Baby / Care Subject: ${profile.babyName || 'Baby'}  |  Week: ${profile.currentWeek}  |  Date: ${profile.dueOrBirthDate}`, 40, y);
  y += 15;
  doc.text(
    `Tracked Health Conditions: ${profile.healthConditions.length > 0 ? profile.healthConditions.join(', ') : 'None reported'}`,
    40,
    y
  );
  y += 24;

  // Growth Entries
  ensureSpace(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('2. Growth & Anthropometric Measurements', 40, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (growthEntries.length === 0) {
    doc.text('No growth measurements recorded yet.', 40, y);
    y += 16;
  } else {
    const sorted = [...growthEntries].sort((a, b) => a.weekNumber - b.weekNumber);
    for (const g of sorted) {
      ensureSpace(24);
      doc.text(
        `Week ${g.weekNumber} (${g.date}): Weight ${g.weightKg} kg | Height ${g.heightCm} cm | Head ${g.headCm} cm${g.notes ? ` — ${g.notes}` : ''}`,
        40,
        y,
        { maxWidth: pageWidth - 80 }
      );
      y += 16;
    }
  }
  y += 12;

  // Milestones & Vaccines
  ensureSpace(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('3. Checkups (5w / 10w / 20w), Vaccinations & Appointments', 40, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const m of milestones) {
    ensureSpace(30);
    doc.text(
      `[${m.status.toUpperCase()}] Wk ${m.weekTarget} (${m.scheduledDate}) — ${m.title} (${m.doctorName})`,
      40,
      y,
      { maxWidth: pageWidth - 80 }
    );
    y += 15;
  }
  y += 12;

  // Medical Records & Insurance
  ensureSpace(80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('4. Insurance, Lab Reports & Medication History', 40, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const r of medicalRecords) {
    ensureSpace(40);
    doc.setFont('helvetica', 'bold');
    doc.text(`${r.title} (${r.recordType.replace('_', ' ')}) — Ref: ${r.policyOrRefNumber || 'N/A'}`, 40, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.text(`${r.providerOrInsurer} | ${r.dateIssued}: ${r.summary}`, 40, y, { maxWidth: pageWidth - 80 });
    y += 22;
  }
  y += 10;

  // Recent Daily Logs
  ensureSpace(70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('5. Recent Medication & Daily Care Logs', 40, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const l of healthLogs.slice(0, 10)) {
    ensureSpace(20);
    doc.text(
      `${l.loggedDate} ${l.loggedTime} [${l.logType}] ${l.title}: ${l.valueNum} ${l.unit} (${l.completed ? 'Done' : 'Pending'})`,
      40,
      y,
      { maxWidth: pageWidth - 80 }
    );
    y += 15;
  }

  doc.save(`nurtura-medical-summary-${todayIsoDate()}.pdf`);
}

export function exportCloudBackupJson(payload: Record<string, unknown>): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nurtura-backup-${todayIsoDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
