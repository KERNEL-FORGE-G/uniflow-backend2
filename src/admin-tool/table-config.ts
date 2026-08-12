export type FieldType =
  | 'string'
  | 'text'
  | 'int'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'enum'
  | 'foreignKey'
  | 'password'
  | 'secret';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  enumValues?: string[];
  foreignKey?: { table: string };
  defaultValue?: unknown;
}

export interface TableConfig {
  model: string; // nom du delegate Prisma (ex: "teachingUnit")
  label: string;
  group: string;
  getLabel: (record: Record<string, unknown>) => string; // texte affiché quand cette table est référencée en FK ailleurs
  fields: FieldConfig[];
  specialHandling?: 'hashPassword' | 'encryptSecret';
}

function getStr(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return '';
}

export const TABLE_CONFIG: Record<string, TableConfig> = {
  // ---------- Identité & Utilisateurs ----------
  users: {
    model: 'user',
    label: 'Utilisateurs',
    group: 'Identité & Utilisateurs',
    getLabel: (r) => getStr(r, 'email'),
    fields: [
      { name: 'email', label: 'Email', type: 'string', required: true },
      {
        name: 'password',
        label: 'Mot de passe',
        type: 'password',
        required: true,
      },
      {
        name: 'role',
        label: 'Rôle',
        type: 'enum',
        required: true,
        enumValues: [
          'SUPER_ADMIN',
          'ADMIN',
          'DIRECTION',
          'SECRETARIAT',
          'ENSEIGNANT',
          'DELEGUE',
          'ETUDIANT',
        ],
      },
      { name: 'isActive', label: 'Actif', type: 'boolean', defaultValue: true },
    ],
    specialHandling: 'hashPassword',
  },
  students: {
    model: 'student',
    label: 'Étudiants',
    group: 'Identité & Utilisateurs',
    getLabel: (r) =>
      `${getStr(r, 'firstName')} ${getStr(r, 'lastName')} (${getStr(r, 'matricule')})`,
    fields: [
      {
        name: 'userId',
        label: 'Compte utilisateur',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'users' },
      },
      { name: 'firstName', label: 'Prénom', type: 'string', required: true },
      { name: 'lastName', label: 'Nom', type: 'string', required: true },
      { name: 'matricule', label: 'Matricule', type: 'string', required: true },
      {
        name: 'status',
        label: 'Statut',
        type: 'enum',
        enumValues: [
          'ACTIVE',
          'SUSPENDED',
          'GRADUATED',
          'WITHDRAWN',
          'DEFERRED',
        ],
        defaultValue: 'ACTIVE',
      },
      {
        name: 'levelId',
        label: 'Niveau',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'levels' },
      },
      {
        name: 'specialtyId',
        label: 'Spécialité',
        type: 'foreignKey',
        foreignKey: { table: 'specialties' },
      },
    ],
  },
  teachers: {
    model: 'teacher',
    label: 'Enseignants',
    group: 'Identité & Utilisateurs',
    getLabel: (r) => `${getStr(r, 'firstName')} ${getStr(r, 'lastName')}`,
    fields: [
      {
        name: 'userId',
        label: 'Compte utilisateur',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'users' },
      },
      { name: 'firstName', label: 'Prénom', type: 'string', required: true },
      { name: 'lastName', label: 'Nom', type: 'string', required: true },
    ],
  },

  // ---------- Structure académique ----------
  faculties: {
    model: 'faculty',
    label: 'Facultés',
    group: 'Structure académique',
    getLabel: (r) => getStr(r, 'name'),
    fields: [
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'nameEn', label: 'Nom (EN)', type: 'string' },
      { name: 'description', label: 'Description', type: 'text' },
    ],
  },
  departments: {
    model: 'department',
    label: 'Départements',
    group: 'Structure académique',
    getLabel: (r) => getStr(r, 'name'),
    fields: [
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'nameEn', label: 'Nom (EN)', type: 'string' },
      {
        name: 'facultyId',
        label: 'Faculté',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'faculties' },
      },
    ],
  },
  programs: {
    model: 'program',
    label: 'Programmes',
    group: 'Structure académique',
    getLabel: (r) => getStr(r, 'name'),
    fields: [
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'nameEn', label: 'Nom (EN)', type: 'string' },
      {
        name: 'departmentId',
        label: 'Département',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'departments' },
      },
    ],
  },
  levels: {
    model: 'level',
    label: 'Niveaux',
    group: 'Structure académique',
    getLabel: (r) => getStr(r, 'name'),
    fields: [
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'nameEn', label: 'Nom (EN)', type: 'string' },
      {
        name: 'programId',
        label: 'Programme',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'programs' },
      },
    ],
  },
  specialties: {
    model: 'specialty',
    label: 'Spécialités',
    group: 'Structure académique',
    getLabel: (r) => getStr(r, 'name'),
    fields: [
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'nameEn', label: 'Nom (EN)', type: 'string' },
      {
        name: 'levelId',
        label: 'Niveau',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'levels' },
      },
    ],
  },

  // ---------- Semestres, UE, Inscriptions ----------
  semesters: {
    model: 'semester',
    label: 'Semestres',
    group: 'Semestres, UE, Inscriptions',
    getLabel: (r) => getStr(r, 'name'),
    fields: [
      { name: 'name', label: 'Nom', type: 'string', required: true },
      {
        name: 'startDate',
        label: 'Date de début',
        type: 'date',
        required: true,
      },
      { name: 'endDate', label: 'Date de fin', type: 'date', required: true },
      { name: 'isActive', label: 'Actif', type: 'boolean', defaultValue: true },
    ],
  },
  teaching_units: {
    model: 'teachingUnit',
    label: "Unités d'enseignement (UE)",
    group: 'Semestres, UE, Inscriptions',
    getLabel: (r) => `${getStr(r, 'code')} — ${getStr(r, 'name')}`,
    fields: [
      { name: 'code', label: 'Code', type: 'string', required: true },
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'nameEn', label: 'Nom (EN)', type: 'string' },
      { name: 'credits', label: 'Crédits', type: 'int', required: true },
      { name: 'hoursCM', label: 'Heures CM', type: 'int', defaultValue: 0 },
      { name: 'hoursTD', label: 'Heures TD', type: 'int', defaultValue: 0 },
      { name: 'hoursTP', label: 'Heures TP', type: 'int', defaultValue: 0 },
      {
        name: 'type',
        label: 'Type',
        type: 'enum',
        enumValues: ['OBLIGATOIRE', 'OPTIONNELLE'],
        defaultValue: 'OBLIGATOIRE',
      },
      {
        name: 'levelId',
        label: 'Niveau',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'levels' },
      },
      {
        name: 'semesterId',
        label: 'Semestre',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'semesters' },
      },
    ],
  },
  ue_specialties: {
    model: 'ueSpecialty',
    label: 'UE ↔ Spécialités (liaison)',
    group: 'Semestres, UE, Inscriptions',
    getLabel: (r) =>
      `${getStr(r, 'teachingUnitId')} / ${getStr(r, 'specialtyId')}`,
    fields: [
      {
        name: 'teachingUnitId',
        label: 'UE',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'teaching_units' },
      },
      {
        name: 'specialtyId',
        label: 'Spécialité',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'specialties' },
      },
    ],
  },
  enrollments: {
    model: 'enrollment',
    label: 'Inscriptions',
    group: 'Semestres, UE, Inscriptions',
    getLabel: (r) => getStr(r, 'id'),
    fields: [
      {
        name: 'studentId',
        label: 'Étudiant',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'students' },
      },
      {
        name: 'teachingUnitId',
        label: 'UE',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'teaching_units' },
      },
      {
        name: 'status',
        label: 'Statut',
        type: 'enum',
        enumValues: ['PENDING', 'VALIDATED', 'REJECTED'],
        defaultValue: 'PENDING',
      },
    ],
  },
  teacher_ue_assignments: {
    model: 'teacherUeAssignment',
    label: 'Affectations Enseignant ↔ UE',
    group: 'Semestres, UE, Inscriptions',
    getLabel: (r) => getStr(r, 'id'),
    fields: [
      {
        name: 'teacherId',
        label: 'Enseignant',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'teachers' },
      },
      {
        name: 'teachingUnitId',
        label: 'UE',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'teaching_units' },
      },
    ],
  },

  // ---------- Notifications ----------
  notifications: {
    model: 'notification',
    label: 'Notifications',
    group: 'Notifications',
    getLabel: (r) => getStr(r, 'title'),
    fields: [
      {
        name: 'userId',
        label: 'Destinataire',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'users' },
      },
      { name: 'title', label: 'Titre', type: 'string', required: true },
      { name: 'message', label: 'Message', type: 'text', required: true },
      {
        name: 'type',
        label: 'Type',
        type: 'enum',
        enumValues: ['INFO', 'ALERT', 'ANNOUNCEMENT'],
        defaultValue: 'INFO',
      },
      {
        name: 'channel',
        label: 'Canal',
        type: 'enum',
        enumValues: ['IN_APP', 'PUSH', 'SMS'],
        defaultValue: 'IN_APP',
      },
    ],
  },

  // ---------- Planification ----------
  classrooms: {
    model: 'classroom',
    label: 'Salles',
    group: 'Planification',
    getLabel: (r) => getStr(r, 'name'),
    fields: [
      { name: 'name', label: 'Nom', type: 'string', required: true },
      { name: 'building', label: 'Bâtiment', type: 'string' },
      { name: 'capacity', label: 'Capacité', type: 'int', required: true },
      {
        name: 'type',
        label: 'Type',
        type: 'enum',
        required: true,
        enumValues: ['AMPHITHEATRE', 'SALLE_TD', 'LABORATOIRE'],
      },
    ],
  },
  courses: {
    model: 'course',
    label: 'Cours',
    group: 'Planification',
    getLabel: (r) => getStr(r, 'id'),
    fields: [
      {
        name: 'teachingUnitId',
        label: 'UE',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'teaching_units' },
      },
      {
        name: 'teacherId',
        label: 'Enseignant',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'teachers' },
      },
      {
        name: 'classroomId',
        label: 'Salle',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'classrooms' },
      },
      {
        name: 'type',
        label: 'Type',
        type: 'enum',
        required: true,
        enumValues: ['CM', 'TD', 'TP'],
      },
      { name: 'groupLabel', label: 'Groupe (optionnel)', type: 'string' },
    ],
  },
  schedules: {
    model: 'schedule',
    label: 'Emplois du temps',
    group: 'Planification',
    getLabel: (r) => getStr(r, 'id'),
    fields: [
      {
        name: 'courseId',
        label: 'Cours',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'courses' },
      },
      {
        name: 'dayOfWeek',
        label: 'Jour',
        type: 'enum',
        required: true,
        enumValues: [
          'LUNDI',
          'MARDI',
          'MERCREDI',
          'JEUDI',
          'VENDREDI',
          'SAMEDI',
        ],
      },
      {
        name: 'startTime',
        label: 'Heure de début',
        type: 'time',
        required: true,
      },
      { name: 'endTime', label: 'Heure de fin', type: 'time', required: true },
    ],
  },

  // ---------- Présences ----------
  attendance_sessions: {
    model: 'attendanceSession',
    label: 'Sessions de présence',
    group: 'Présences',
    getLabel: (r) => getStr(r, 'id'),
    fields: [
      {
        name: 'courseId',
        label: 'Cours',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'courses' },
      },
      { name: 'date', label: 'Date', type: 'datetime', required: true },
    ],
  },
  attendance_records: {
    model: 'attendanceRecord',
    label: 'Enregistrements de présence',
    group: 'Présences',
    getLabel: (r) => getStr(r, 'id'),
    fields: [
      {
        name: 'sessionId',
        label: 'Session',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'attendance_sessions' },
      },
      {
        name: 'studentId',
        label: 'Étudiant',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'students' },
      },
      {
        name: 'status',
        label: 'Statut',
        type: 'enum',
        enumValues: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
        defaultValue: 'ABSENT',
      },
    ],
  },

  // ---------- Visioconférence ----------
  video_conferences: {
    model: 'videoConference',
    label: 'Visioconférences',
    group: 'Visioconférence',
    getLabel: (r) => getStr(r, 'id'),
    fields: [
      {
        name: 'hostId',
        label: 'Hôte',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'users' },
      },
      {
        name: 'courseId',
        label: 'Cours (optionnel)',
        type: 'foreignKey',
        foreignKey: { table: 'courses' },
      },
      {
        name: 'apiKey',
        label: 'Clé API LiveKit',
        type: 'string',
        required: true,
      },
      {
        name: 'apiSecret',
        label: 'Secret API LiveKit',
        type: 'secret',
        required: true,
      },
      {
        name: 'mode',
        label: 'Mode',
        type: 'enum',
        enumValues: ['LAN', 'INTERNET'],
        defaultValue: 'LAN',
      },
      {
        name: 'status',
        label: 'Statut',
        type: 'enum',
        enumValues: ['ACTIVE', 'ENDED'],
        defaultValue: 'ACTIVE',
      },
      { name: 'localUrl', label: 'URL locale (optionnel)', type: 'string' },
      {
        name: 'maxParticipants',
        label: 'Max participants (optionnel)',
        type: 'int',
      },
    ],
    specialHandling: 'encryptSecret',
  },
  conference_participants: {
    model: 'conferenceParticipant',
    label: 'Participants aux visioconférences',
    group: 'Visioconférence',
    getLabel: (r) => getStr(r, 'id'),
    fields: [
      {
        name: 'conferenceId',
        label: 'Visioconférence',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'video_conferences' },
      },
      {
        name: 'userId',
        label: 'Utilisateur',
        type: 'foreignKey',
        required: true,
        foreignKey: { table: 'users' },
      },
    ],
  },

  // ---------- Fichiers ----------
  attachments: {
    model: 'attachment',
    label: 'Pièces jointes',
    group: 'Fichiers',
    getLabel: (r) => getStr(r, 'filename'),
    fields: [
      { name: 'url', label: 'URL', type: 'string', required: true },
      { name: 'publicId', label: 'Public ID', type: 'string', required: true },
      {
        name: 'filename',
        label: 'Nom du fichier',
        type: 'string',
        required: true,
      },
      { name: 'mimeType', label: 'Type MIME', type: 'string', required: true },
      { name: 'size', label: 'Taille (octets)', type: 'int', required: true },
      {
        name: 'entityType',
        label: "Type d'entité liée",
        type: 'enum',
        required: true,
        enumValues: ['STUDENT', 'TEACHER', 'COURSE', 'UE', 'CONFERENCE'],
      },
      {
        name: 'entityId',
        label: "ID de l'entité liée",
        type: 'string',
        required: true,
      },
    ],
  },
};
