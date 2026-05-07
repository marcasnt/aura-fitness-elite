import { User, RoutineDay, WorkoutLog, Message } from '../types/fitness';

export const COACH_USER: User = {
  id: 'coach-1',
  email: 'marcasnt@gmail.com',
  name: 'Coach Marcus',
  role: 'coach',
  avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200',
  streak: 24,
  adherenceRate: 98,
  monthlyFee: 0,
  nextPaymentDate: '',
  paymentStatus: 'paid'
};

export const INITIAL_CLIENTS: User[] = [
  {
    id: 'client-1',
    email: 'carlos@aura.com',
    password: 'fit2026_carlos',
    name: 'Carlos Mendoza',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    goal: 'Hipertrofia & Recomposición Corporal',
    phone: '+34611223344',
    streak: 5,
    adherenceRate: 92,
    monthlyFee: 120,
    nextPaymentDate: '2026-03-28',
    paymentStatus: 'paid',
    paymentHistory: [
      { date: '2026-01-28', amount: 120, status: 'paid', method: 'Transferencia' },
      { date: '2026-02-28', amount: 120, status: 'paid', method: 'PayPal' }
    ],
    weightHistory: [
      { date: '2026-02-01', weight: 82.5 },
      { date: '2026-02-08', weight: 81.8 },
      { date: '2026-02-15', weight: 81.2 },
      { date: '2026-02-22', weight: 80.6 }
    ]
  },
  {
    id: 'client-2',
    email: 'valeria@aura.com',
    password: 'fit2026_valeria',
    name: 'Valeria Gómez',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    goal: 'Definición Muscular & Fuerza Funcional',
    phone: '+34622334455',
    streak: 12,
    adherenceRate: 96,
    monthlyFee: 150,
    nextPaymentDate: '2026-03-20',
    paymentStatus: 'pending',
    paymentHistory: [
      { date: '2026-01-20', amount: 150, status: 'paid', method: 'Tarjeta' },
      { date: '2026-02-20', amount: 150, status: 'paid', method: 'Transferencia' }
    ],
    weightHistory: [
      { date: '2026-02-01', weight: 64.0 },
      { date: '2026-02-08', weight: 63.4 },
      { date: '2026-02-15', weight: 63.1 },
      { date: '2026-02-22', weight: 62.7 }
    ]
  },
  {
    id: 'client-3',
    email: 'santiago@aura.com',
    password: 'fit2026_santi',
    name: 'Santiago Rey',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    goal: 'Fuerza Máxima (Powerlifting Elite)',
    phone: '+34633445566',
    streak: 0,
    adherenceRate: 75,
    monthlyFee: 200,
    nextPaymentDate: '2026-03-10',
    paymentStatus: 'overdue',
    paymentHistory: [
      { date: '2026-01-10', amount: 200, status: 'paid', method: 'PayPal' },
      { date: '2026-02-10', amount: 200, status: 'overdue', method: '' }
    ],
    weightHistory: [
      { date: '2026-02-01', weight: 90.2 },
      { date: '2026-02-08', weight: 90.5 },
      { date: '2026-02-15', weight: 91.0 },
      { date: '2026-02-22', weight: 91.4 }
    ]
  }
];

export const INITIAL_ROUTINES: RoutineDay[] = [
  {
    id: 'routine-carlos-1',
    clientId: 'client-1',
    name: 'Día 1: Empuje de Élite (Pecho/Hombro/Tríceps)',
    description: 'Enfocado en sobrecarga progresiva y control de la fase excéntrica (3 segundos).',
    isActive: true,
    createdAt: '2026-02-20',
    exercises: [
      {
        id: 'ex-1',
        name: 'Press de Banca Inclinado con Mancuernas',
        category: 'Chest',
        sets: 4,
        reps: '8-10',
        weight: 34,
        restTime: 90,
        notes: 'Mantén un arco escapular firme. RPE 8.5. Descanso completo.',
        imageUrl: 'https://images.unsplash.com/photo-1534368786749-d63e0a3a3d5e?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'ex-2',
        name: 'Press Militar de Pie con Barra',
        category: 'Shoulders',
        sets: 3,
        reps: '6-8',
        weight: 50,
        restTime: 120,
        notes: 'Activa glúteos y core fuertemente para evitar hiperextensión lumbar.',
        imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'ex-3',
        name: 'Fondos en Paralelas (Lastrado)',
        category: 'Chest',
        sets: 3,
        reps: '10',
        weight: 15,
        restTime: 90,
        notes: 'Inclinación ligera hacia adelante para mayor estímulo pectoral.',
        imageUrl: 'https://images.unsplash.com/photo-1598971639058-a213d7b2829f?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'ex-4',
        name: 'Extensiones de Tríceps en Polea Alta',
        category: 'Arms',
        sets: 4,
        reps: '12-15',
        weight: 25,
        restTime: 60,
        notes: 'Bloqueo completo al final de cada repetición. Conexión mente-músculo.',
        imageUrl: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  {
    id: 'routine-carlos-2',
    clientId: 'client-1',
    name: 'Día 2: Tracción Suprema (Espalda/Bíceps)',
    description: 'Enfoque en amplitud y densidad con alta intensidad de esfuerzo.',
    isActive: false,
    createdAt: '2026-02-20',
    exercises: [
      {
        id: 'ex-5',
        name: 'Remo con Barra Prono',
        category: 'Back',
        sets: 4,
        reps: '8',
        weight: 70,
        restTime: 90,
        notes: 'Lleva la barra hacia el ombligo manteniendo la espalda paralela al suelo.',
        imageUrl: 'https://images.unsplash.com/photo-1598266663439-2056e6900339?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'ex-6',
        name: 'Jalón al Pecho con Agarre Neutro',
        category: 'Back',
        sets: 4,
        reps: '10-12',
        weight: 65,
        restTime: 75,
        notes: 'Contracción de 1 segundo abajo apretando las dorsales.',
        imageUrl: 'https://images.unsplash.com/photo-1598266663439-2056e6900339?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'ex-7',
        name: 'Curl de Bíceps Alterno en Banco Inclinado',
        category: 'Arms',
        sets: 3,
        reps: '10',
        weight: 14,
        restTime: 60,
        notes: 'Estiramiento máximo abajo sin balancear los codos.',
        imageUrl: 'https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&q=80&w=400'
      }
    ]
  },
  // Valeria's Routine
  {
    id: 'routine-valeria-1',
    clientId: 'client-2',
    name: 'Fuerza Inferior & Glúteo Estructural',
    description: 'Priorizar profundidad anatómica y tensión mecánica constante.',
    isActive: true,
    createdAt: '2026-02-22',
    exercises: [
      {
        id: 'ex-8',
        name: 'Sentadilla Búlgara con Mancuernas',
        category: 'Legs',
        sets: 4,
        reps: '10 (por pierna)',
        weight: 18,
        restTime: 90,
        notes: 'Paso largo para enfocar glúteo. Baja hasta rozar el suelo.',
        imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'ex-9',
        name: 'Hip Thrust con Barra Pro',
        category: 'Legs',
        sets: 4,
        reps: '12',
        weight: 100,
        restTime: 120,
        notes: 'Bloqueo pélvico superior de 2 segundos. Banda elástica opcional.',
        imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=400'
      },
      {
        id: 'ex-10',
        name: 'Peso Muerto Rumano con Mancuernas',
        category: 'Legs',
        sets: 3,
        reps: '12',
        weight: 24,
        restTime: 90,
        notes: 'Lleva la cadera bien hacia atrás sintiendo el estiramiento en femorales.',
        imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=400'
      }
    ]
  }
];

export const INITIAL_LOGS: WorkoutLog[] = [
  {
    id: 'log-1',
    clientId: 'client-1',
    routineDayId: 'routine-carlos-1',
    routineName: 'Día 1: Empuje de Élite',
    date: '2026-02-23',
    durationMinutes: 55,
    feelingScore: 5,
    coachNotes: 'Excelente progreso en el press inclinado. Sube 2kg la próxima sesión.',
    exercises: [
      {
        exerciseId: 'ex-1',
        exerciseName: 'Press de Banca Inclinado con Mancuernas',
        sets: [
          { setNumber: 1, reps: 10, weight: 34, completed: true },
          { setNumber: 2, reps: 10, weight: 34, completed: true },
          { setNumber: 3, reps: 9, weight: 34, completed: true },
          { setNumber: 4, reps: 8, weight: 34, completed: true }
        ]
      }
    ]
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    senderId: 'coach-1',
    receiverId: 'client-1',
    content: '¡Excelente entrenamiento el de ayer, Carlos! Los pesos se ven sólidos.',
    timestamp: '2026-02-24T10:30:00Z',
    isRead: true
  },
  {
    id: 'm-2',
    senderId: 'client-1',
    receiverId: 'coach-1',
    content: '¡Gracias Coach! Sentí un estímulo increíble en el hombro. ¿Subimos peso en laterales?',
    timestamp: '2026-02-24T11:15:00Z',
    isRead: false
  }
];

export const PRESET_EXERCISES = [
  { name: 'Press de Banca Plano con Barra', category: 'Chest' },
  { name: 'Press de Banca Inclinado con Mancuernas', category: 'Chest' },
  { name: 'Aperturas en Polea Baja', category: 'Chest' },
  { name: 'Dominadas Pronas (Lastradas)', category: 'Back' },
  { name: 'Remo con Barra Prono', category: 'Back' },
  { name: 'Jalón al Pecho', category: 'Back' },
  { name: 'Remo Gironda (Polea Baja)', category: 'Back' },
  { name: 'Sentadilla Libre con Barra Back', category: 'Legs' },
  { name: 'Prensa Atlética de 45 Grados', category: 'Legs' },
  { name: 'Sentadilla Búlgara', category: 'Legs' },
  { name: 'Hip Thrust de Élite', category: 'Legs' },
  { name: 'Peso Muerto Rumano', category: 'Legs' },
  { name: 'Press Militar de Pie', category: 'Shoulders' },
  { name: 'Elevaciones Laterales con Mancuerna', category: 'Shoulders' },
  { name: 'Pájaros en Polea Posterior', category: 'Shoulders' },
  { name: 'Curl de Bíceps con Barra Z', category: 'Arms' },
  { name: 'Curl Martillo Alterno', category: 'Arms' },
  { name: 'Fondos en Paralelas', category: 'Arms' },
  { name: 'Extensiones de Tríceps sobre la Cabeza', category: 'Arms' },
  { name: 'Abdominales en Polea Alta (Crunch)', category: 'Core' },
  { name: 'Plancha Isométrica con Lastre', category: 'Core' }
] as const;
