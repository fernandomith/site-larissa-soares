export type SpecialtyCategory = 'estetica' | 'massoterapia' | 'lash';

export interface Procedure {
  id: string;
  name: string;
  category: SpecialtyCategory;
  description: string;
  benefits: string[];
  durationMinutes: number;
  originalPrice: number;
  onPromo: boolean;
  promoPrice?: number;
  promoValidUntil?: string; // YYYY-MM-DD
  imageUrl: string;
  active: boolean;
}

export type PaymentMethodType = 'pix' | 'credit_card' | 'debit_card' | 'cash_in_person';
export type PaymentTimingType = 'online_advance' | 'in_person';
export type PaymentStatusType = 'paid' | 'pending';
export type AppointmentStatusType = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export interface PaymentSettings {
  pixEnabled: boolean;
  pixKey: string;
  pixHolderName: string;
  creditCardEnabled: boolean;
  creditCardMaxInstallments: number;
  debitCardEnabled: boolean;
  cashInPersonEnabled: boolean;
}

export interface ClinicSettings {
  clinicName: string;
  professionalName: string;
  professionalTitle: string;
  crbmOrRegister: string;
  whatsappNumber: string;
  vipGroupUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  addressLine: string;
  googleMapsUrl: string;
  wazeUrl: string;
  openingHoursText: string;
  workStartHour: string; // e.g. "09:00"
  workEndHour: string;   // e.g. "19:00"
  slotIntervalMinutes: number; // 30
  paymentSettings: PaymentSettings;
}

export interface ClientRecord {
  id: string;
  fullName: string;
  whatsapp: string;
  email: string;
  notesAllergies: string;
  lastProcedureName: string;
  lastCategory: SpecialtyCategory;
  lastVisitAt: string; // YYYY-MM-DD
  totalAppointments: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientWhatsapp: string;
  clientEmail: string;
  notesAllergies: string;
  procedureIds: string[];
  procedureNames: string[];
  primaryCategory: SpecialtyCategory;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  totalDurationMinutes: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType;
  paymentTiming: PaymentTimingType;
  installments?: number;
  paymentStatus: PaymentStatusType;
  status: AppointmentStatusType;
  source: 'online' | 'manual';
  createdAt: string;
}

export type BlockType = 'lunch' | 'day_off' | 'vacation' | 'custom';

export interface ScheduleBlock {
  id: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  reason: string;
  blockType: BlockType;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethodType | 'transfer' | 'other';
  paymentStatus: PaymentStatusType;
  appointmentId?: string;
  clientName?: string;
  createdAt: string;
}

export type AudienceFilterType =
  | 'all'
  | 'estetica'
  | 'massoterapia'
  | 'lash'
  | 'inactive_30_days';

export interface MessageTemplate {
  id: string;
  slug: string;
  title: string;
  channel: 'whatsapp' | 'email' | 'both';
  defaultAudience: AudienceFilterType;
  subject?: string;
  content: string;
}

export interface CampaignLog {
  id: string;
  templateTitle: string;
  channel: 'whatsapp' | 'email';
  audience: AudienceFilterType;
  recipientsCount: number;
  sentAt: string;
}

export interface ClinicDatabaseState {
  settings: ClinicSettings;
  procedures: Procedure[];
  clients: ClientRecord[];
  appointments: Appointment[];
  scheduleBlocks: ScheduleBlock[];
  transactions: FinancialTransaction[];
  templates: MessageTemplate[];
  campaignLogs: CampaignLog[];
}

export const CATEGORY_LABELS: Record<SpecialtyCategory, string> = {
  estetica: 'Estética Facial & Corporal',
  massoterapia: 'Massoterapia',
  lash: 'Lash Design',
};

export const CATEGORY_SHORT_LABELS: Record<SpecialtyCategory, string> = {
  estetica: 'Estética & Cosmetologia',
  massoterapia: 'Massoterapia',
  lash: 'Lash Design',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash_in_person: 'Dinheiro / Presencial',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatusType, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};
