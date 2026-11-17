'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Appointment,
  AppointmentStatusType,
  CampaignLog,
  CATEGORY_SHORT_LABELS,
  ClientRecord,
  ClinicDatabaseState,
  ClinicSettings,
  FinancialTransaction,
  MessageTemplate,
  Procedure,
  ScheduleBlock,
} from './types';
import { formatISODate, getInitialClinicState } from './seed-data';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'info' | 'error';
}

interface ClinicContextValue {
  db: ClinicDatabaseState;
  isLoaded: boolean;
  showToast: (title: string, description?: string, variant?: 'success' | 'info' | 'error') => void;
  getEffectivePrice: (proc: Procedure) => number;
  isPromoValid: (proc: Procedure) => boolean;
  isTimeRangeAvailable: (date: string, startTime: string, durationMinutes: number, ignoreAppointmentId?: string) => {
    available: boolean;
    reason?: string;
  };
  createAppointment: (
    data: Omit<Appointment, 'id' | 'clientId' | 'endTime' | 'createdAt'>
  ) => Appointment;
  updateAppointmentStatus: (id: string, status: AppointmentStatusType) => void;
  markPaymentReceived: (appointmentOrTxId: string) => void;
  upsertProcedure: (proc: Procedure) => void;
  deleteProcedure: (id: string) => void;
  toggleProcedureActive: (id: string) => void;
  toggleProcedurePromo: (
    id: string,
    onPromo: boolean,
    promoPrice?: number,
    promoValidUntil?: string
  ) => void;
  updateSettings: (settings: ClinicSettings) => void;
  addFinancialTransaction: (
    tx: Omit<FinancialTransaction, 'id' | 'createdAt'>
  ) => void;
  deleteFinancialTransaction: (id: string) => void;
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id'>) => void;
  removeScheduleBlock: (id: string) => void;
  updateTemplate: (tpl: MessageTemplate) => void;
  recordCampaign: (log: Omit<CampaignLog, 'id' | 'sentAt'>) => void;
  resetToDefault: () => void;
}

const STORAGE_KEY = 'estetica_larissa_soares_db_v1';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBR(isoDate?: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const ClinicContext = createContext<ClinicContextValue | null>(null);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<ClinicDatabaseState>(() => getInitialClinicState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      title: string,
      description?: string,
      variant: 'success' | 'info' | 'error' = 'success'
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  // Load initial state from API or localStorage
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const res = await fetch('/api/clinic', { cache: 'no-store' });
        if (res.ok) {
          const serverState = (await res.json()) as ClinicDatabaseState;
          if (mounted && serverState?.procedures) {
            setDb(serverState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverState));
            setIsLoaded(true);
            return;
          }
        }
      } catch {
        // Fallback to localStorage
      }
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && mounted) {
          setDb(JSON.parse(saved));
        }
      } catch {
        // Ignore
      }
      if (mounted) setIsLoaded(true);
    }
    init();

    // Listen to storage events across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setDb(JSON.parse(e.newValue));
        } catch {
          // Ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const persistState = useCallback((updater: (prev: ClinicDatabaseState) => ClinicDatabaseState) => {
    setDb((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      fetch('/api/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const isPromoValid = useCallback((proc: Procedure): boolean => {
    if (!proc.onPromo || !proc.promoPrice || proc.promoPrice >= proc.originalPrice) {
      return false;
    }
    if (proc.promoValidUntil) {
      const today = formatISODate(new Date());
      if (proc.promoValidUntil < today) return false;
    }
    return true;
  }, []);

  const getEffectivePrice = useCallback(
    (proc: Procedure): number => {
      return isPromoValid(proc) && proc.promoPrice ? proc.promoPrice : proc.originalPrice;
    },
    [isPromoValid]
  );

  const isTimeRangeAvailable = useCallback(
    (
      date: string,
      startTime: string,
      durationMinutes: number,
      ignoreAppointmentId?: string
    ): { available: boolean; reason?: string } => {
      const startMin = timeToMinutes(startTime);
      const endMin = startMin + durationMinutes;
      const workEndMin = timeToMinutes(db.settings.workEndHour || '19:00');

      if (endMin > workEndMin + 30) {
        return { available: false, reason: 'Excede o horário de fechamento' };
      }

      // Check schedule blocks
      for (const blk of db.scheduleBlocks) {
        if (blk.date !== date) continue;
        const blkStart = timeToMinutes(blk.startTime);
        const blkEnd = timeToMinutes(blk.endTime);
        if (startMin < blkEnd && endMin > blkStart) {
          return { available: false, reason: blk.reason || 'Horário bloqueado' };
        }
      }

      // Check existing appointments
      for (const apt of db.appointments) {
        if (apt.date !== date) continue;
        if (apt.status === 'cancelled') continue;
        if (ignoreAppointmentId && apt.id === ignoreAppointmentId) continue;
        const aptStart = timeToMinutes(apt.startTime);
        const aptEnd = timeToMinutes(apt.endTime);
        if (startMin < aptEnd && endMin > aptStart) {
          return { available: false, reason: 'Horário reservado' };
        }
      }

      return { available: true };
    },
    [db.appointments, db.scheduleBlocks, db.settings.workEndHour]
  );

  const createAppointment = useCallback(
    (data: Omit<Appointment, 'id' | 'clientId' | 'endTime' | 'createdAt'>): Appointment => {
      const startMin = timeToMinutes(data.startTime);
      const endTime = minutesToTime(startMin + data.totalDurationMinutes);
      const today = formatISODate(new Date());
      const aptId = `apt-${Date.now().toString().slice(-6)}`;
      const normalizedPhone = data.clientWhatsapp.replace(/\D/g, '');

      let createdApt!: Appointment;

      persistState((prev) => {
        const existingClient = prev.clients.find(
          (c) =>
            c.whatsapp.replace(/\D/g, '') === normalizedPhone ||
            (data.clientEmail && c.email.toLowerCase() === data.clientEmail.toLowerCase())
        );

        const clientId = existingClient ? existingClient.id : `cli-${Date.now().toString().slice(-6)}`;
        const updatedClients: ClientRecord[] = existingClient
          ? prev.clients.map((c) =>
              c.id === existingClient.id
                ? {
                    ...c,
                    fullName: data.clientName,
                    whatsapp: data.clientWhatsapp,
                    email: data.clientEmail || c.email,
                    notesAllergies: data.notesAllergies || c.notesAllergies,
                    lastProcedureName: data.procedureNames.join(' + '),
                    lastCategory: data.primaryCategory,
                    lastVisitAt: data.date,
                    totalAppointments: c.totalAppointments + 1,
                  }
                : c
            )
          : [
              {
                id: clientId,
                fullName: data.clientName,
                whatsapp: data.clientWhatsapp,
                email: data.clientEmail,
                notesAllergies: data.notesAllergies,
                lastProcedureName: data.procedureNames.join(' + '),
                lastCategory: data.primaryCategory,
                lastVisitAt: data.date,
                totalAppointments: 1,
                createdAt: today,
              },
              ...prev.clients,
            ];

        createdApt = {
          ...data,
          id: aptId,
          clientId,
          endTime,
          createdAt: today,
        };

        const newTransaction: FinancialTransaction = {
          id: `trx-${Date.now().toString().slice(-6)}`,
          description: `Agendamento: ${data.procedureNames.join(' + ')} — ${data.clientName}`,
          type: 'income',
          category: CATEGORY_SHORT_LABELS[data.primaryCategory],
          amount: data.totalAmount,
          date: data.date,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          appointmentId: aptId,
          clientName: data.clientName,
          createdAt: today,
        };

        return {
          ...prev,
          clients: updatedClients,
          appointments: [createdApt, ...prev.appointments],
          transactions: [newTransaction, ...prev.transactions],
        };
      });

      return createdApt;
    },
    [persistState]
  );

  const updateAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatusType) => {
      persistState((prev) => ({
        ...prev,
        appointments: prev.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
      }));
      showToast('Status do agendamento atualizado', `Novo status definido com sucesso.`);
    },
    [persistState, showToast]
  );

  const markPaymentReceived = useCallback(
    (appointmentOrTxId: string) => {
      persistState((prev) => {
        const targetTx = prev.transactions.find(
          (t) => t.id === appointmentOrTxId || t.appointmentId === appointmentOrTxId
        );
        const targetAptId = targetTx?.appointmentId || appointmentOrTxId;

        return {
          ...prev,
          appointments: prev.appointments.map((a) =>
            a.id === targetAptId
              ? {
                  ...a,
                  paymentStatus: 'paid',
                  status: a.status === 'pending' ? 'confirmed' : a.status,
                }
              : a
          ),
          transactions: prev.transactions.map((t) =>
            t.id === appointmentOrTxId || t.appointmentId === targetAptId
              ? { ...t, paymentStatus: 'paid' }
              : t
          ),
        };
      });
      showToast(
        'Baixa de pagamento confirmada!',
        'O valor foi contabilizado como Recebido no fluxo de caixa.'
      );
    },
    [persistState, showToast]
  );

  const upsertProcedure = useCallback(
    (proc: Procedure) => {
      persistState((prev) => {
        const exists = prev.procedures.some((p) => p.id === proc.id);
        const nextProcs = exists
          ? prev.procedures.map((p) => (p.id === proc.id ? proc : p))
          : [proc, ...prev.procedures];
        return { ...prev, procedures: nextProcs };
      });
      showToast(
        'Catálogo atualizado!',
        `O procedimento "${proc.name}" foi salvo e já reflete no site público.`
      );
    },
    [persistState, showToast]
  );

  const deleteProcedure = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        procedures: prev.procedures.filter((p) => p.id !== id),
      }));
      showToast('Procedimento removido', 'O item foi excluído do catálogo.', 'info');
    },
    [persistState, showToast]
  );

  const toggleProcedureActive = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        procedures: prev.procedures.map((p) =>
          p.id === id ? { ...p, active: !p.active } : p
        ),
      }));
      showToast('Visibilidade alterada', 'O catálogo público foi atualizado.');
    },
    [persistState, showToast]
  );

  const toggleProcedurePromo = useCallback(
    (id: string, onPromo: boolean, promoPrice?: number, promoValidUntil?: string) => {
      persistState((prev) => ({
        ...prev,
        procedures: prev.procedures.map((p) =>
          p.id === id
            ? {
                ...p,
                onPromo,
                promoPrice: promoPrice ?? p.promoPrice ?? Math.round(p.originalPrice * 0.85),
                promoValidUntil: promoValidUntil ?? p.promoValidUntil,
              }
            : p
        ),
      }));
      showToast(
        onPromo ? 'Promoção ativada no site!' : 'Promoção encerrada',
        onPromo
          ? 'O selo promocional e o valor com desconto já estão visíveis para as clientes.'
          : 'O procedimento voltou ao seu valor original.'
      );
    },
    [persistState, showToast]
  );

  const updateSettings = useCallback(
    (settings: ClinicSettings) => {
      persistState((prev) => ({ ...prev, settings }));
      showToast(
        'Configurações salvas!',
        'Meios de pagamento e dados do espaço atualizados em tempo real.'
      );
    },
    [persistState, showToast]
  );

  const addFinancialTransaction = useCallback(
    (tx: Omit<FinancialTransaction, 'id' | 'createdAt'>) => {
      const today = formatISODate(new Date());
      const newTx: FinancialTransaction = {
        ...tx,
        id: `trx-${Date.now().toString().slice(-6)}`,
        createdAt: today,
      };
      persistState((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
      showToast(
        tx.type === 'income' ? 'Receita registrada!' : 'Despesa lançada!',
        `${tx.description} (${formatCurrencyBRL(tx.amount)}) adicionado ao fluxo de caixa.`
      );
    },
    [persistState, showToast]
  );

  const deleteFinancialTransaction = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }));
      showToast('Lançamento excluído', 'Registro removido do fluxo de caixa.', 'info');
    },
    [persistState, showToast]
  );

  const addScheduleBlock = useCallback(
    (block: Omit<ScheduleBlock, 'id'>) => {
      const newBlock: ScheduleBlock = {
        ...block,
        id: `blk-${Date.now().toString().slice(-6)}`,
      };
      persistState((prev) => ({
        ...prev,
        scheduleBlocks: [...prev.scheduleBlocks, newBlock],
      }));
      showToast(
        'Horário bloqueado na agenda',
        `${formatDateBR(block.date)} das ${block.startTime} às ${block.endTime} indisponível no site.`
      );
    },
    [persistState, showToast]
  );

  const removeScheduleBlock = useCallback(
    (id: string) => {
      persistState((prev) => ({
        ...prev,
        scheduleBlocks: prev.scheduleBlocks.filter((b) => b.id !== id),
      }));
      showToast('Bloqueio removido', 'O horário voltou a ficar disponível para agendamento online.');
    },
    [persistState, showToast]
  );

  const updateTemplate = useCallback(
    (tpl: MessageTemplate) => {
      persistState((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.id === tpl.id ? tpl : t)),
      }));
      showToast('Modelo de mensagem salvo!', `Template "${tpl.title}" atualizado.`);
    },
    [persistState, showToast]
  );

  const recordCampaign = useCallback(
    (log: Omit<CampaignLog, 'id' | 'sentAt'>) => {
      const newLog: CampaignLog = {
        ...log,
        id: `cmp-${Date.now().toString().slice(-6)}`,
        sentAt: formatISODate(new Date()),
      };
      persistState((prev) => ({
        ...prev,
        campaignLogs: [newLog, ...prev.campaignLogs],
      }));
    },
    [persistState]
  );

  const resetToDefault = useCallback(() => {
    const initial = getInitialClinicState();
    persistState(() => initial);
    showToast('Dados restaurados', 'O banco de demonstração foi restaurado ao estado original.', 'info');
  }, [persistState, showToast]);

  return (
    <ClinicContext.Provider
      value={{
        db,
        isLoaded,
        showToast,
        getEffectivePrice,
        isPromoValid,
        isTimeRangeAvailable,
        createAppointment,
        updateAppointmentStatus,
        markPaymentReceived,
        upsertProcedure,
        deleteProcedure,
        toggleProcedureActive,
        toggleProcedurePromo,
        updateSettings,
        addFinancialTransaction,
        deleteFinancialTransaction,
        addScheduleBlock,
        removeScheduleBlock,
        updateTemplate,
        recordCampaign,
        resetToDefault,
      }}
    >
      {children}
      {/* Global Toast Container */}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[#E5DEC9] bg-[#FAF9F6]/95 backdrop-blur-md p-4 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
          >
            <div className="mt-0.5 shrink-0">
              {t.variant === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : t.variant === 'info' ? (
                <Info className="w-5 h-5 text-[#C8A29E]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#6E7F6A]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2D2D2D]">{t.title}</p>
              {t.description && (
                <p className="text-xs text-[#68645E] mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-[#8E8880] hover:text-[#2D2D2D] transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) {
    throw new Error('useClinic must be used within ClinicProvider');
  }
  return ctx;
}
