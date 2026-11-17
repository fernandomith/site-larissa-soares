'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Check,
  Sparkles,
  User,
  Phone,
  Mail,
  AlertCircle,
  CreditCard,
  QrCode,
  Banknote,
  Copy,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MessageCircle,
  Lock,
} from 'lucide-react';
import { useClinic, formatCurrencyBRL, formatDateBR, minutesToTime, timeToMinutes } from '@/lib/store';
import {
  Appointment,
  CATEGORY_LABELS,
  PaymentMethodType,
  PaymentTimingType,
  SpecialtyCategory,
} from '@/lib/types';
import { getOffsetDateISO } from '@/lib/seed-data';

interface BookingSectionProps {
  preselectedProcedureIds: string[];
  onClearPreselected?: () => void;
}

export default function BookingSection({
  preselectedProcedureIds,
  onClearPreselected,
}: BookingSectionProps) {
  const {
    db,
    getEffectivePrice,
    isPromoValid,
    isTimeRangeAvailable,
    createAppointment,
    showToast,
  } = useClinic();

  const activeProcedures = useMemo(
    () => db.procedures.filter((p) => p.active),
    [db.procedures]
  );

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [categoryFilter, setCategoryFilter] = useState<'all' | SpecialtyCategory>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => getOffsetDateISO(0));
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Step 3 Client Form
  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notesAllergies, setNotesAllergies] = useState('');

  // Step 4 Payment Selection
  const [paymentTiming, setPaymentTiming] = useState<PaymentTimingType>('online_advance');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pix');
  const [installments, setInstallments] = useState<number>(1);
  const [pixCopied, setPixCopied] = useState(false);

  // Completed Booking State
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  // Sync preselected procedure from catalog click
  useEffect(() => {
    if (preselectedProcedureIds.length > 0) {
      setSelectedIds(preselectedProcedureIds);
      setConfirmedBooking(null);
      setStep(2);
      onClearPreselected?.();
    }
  }, [preselectedProcedureIds, onClearPreselected]);

  // Ensure selected payment method is valid when admin toggles settings
  useEffect(() => {
    const ps = db.settings.paymentSettings;
    if (paymentMethod === 'pix' && !ps.pixEnabled) {
      if (ps.creditCardEnabled) {
        setPaymentMethod('credit_card');
        setPaymentTiming('online_advance');
      } else if (ps.debitCardEnabled) {
        setPaymentMethod('debit_card');
        setPaymentTiming('in_person');
      } else if (ps.cashInPersonEnabled) {
        setPaymentMethod('cash_in_person');
        setPaymentTiming('in_person');
      }
    }
  }, [db.settings.paymentSettings, paymentMethod]);

  const selectedProcedures = useMemo(
    () => activeProcedures.filter((p) => selectedIds.includes(p.id)),
    [activeProcedures, selectedIds]
  );

  const totalDuration = useMemo(
    () => selectedProcedures.reduce((acc, p) => acc + p.durationMinutes, 0),
    [selectedProcedures]
  );

  const totalAmount = useMemo(
    () => selectedProcedures.reduce((acc, p) => acc + getEffectivePrice(p), 0),
    [selectedProcedures, getEffectivePrice]
  );

  const filteredProcedures = useMemo(() => {
    if (categoryFilter === 'all') return activeProcedures;
    return activeProcedures.filter((p) => p.category === categoryFilter);
  }, [activeProcedures, categoryFilter]);

  // Generate next 7 days for quick picker
  const upcomingDays = useMemo(() => {
    const days = [];
    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    for (let i = 0; i < 8; i++) {
      const iso = getOffsetDateISO(i);
      const [y, m, d] = iso.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayOfWeek = dateObj.getDay();
      days.push({
        iso,
        dayName: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : weekdayNames[dayOfWeek],
        dayNumber: String(d).padStart(2, '0'),
        monthName: monthNames[m - 1],
        isSundayOrMonday: dayOfWeek === 0, // Domingo fechado por padrão
      });
    }
    return days;
  }, []);

  // Generate time slots between workStartHour and workEndHour
  const timeSlots = useMemo(() => {
    const startMin = timeToMinutes(db.settings.workStartHour || '09:00');
    const endMin = timeToMinutes(db.settings.workEndHour || '19:00');
    const interval = db.settings.slotIntervalMinutes || 30;
    const duration = totalDuration || 60;
    const slots: { time: string; available: boolean; reason?: string }[] = [];

    for (let t = startMin; t + 30 <= endMin; t += interval) {
      const timeStr = minutesToTime(t);
      const check = isTimeRangeAvailable(selectedDate, timeStr, duration);
      slots.push({
        time: timeStr,
        available: check.available,
        reason: check.reason,
      });
    }
    return slots;
  }, [
    db.settings.workStartHour,
    db.settings.workEndHour,
    db.settings.slotIntervalMinutes,
    totalDuration,
    selectedDate,
    isTimeRangeAvailable,
  ]);

  const toggleProcedureSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setSelectedTime('');
  };

  const pixCopyPasteCode = useMemo(() => {
    const key = db.settings.paymentSettings.pixKey || 'financeiro@larissasoaresestetica.com.br';
    const amountFormatted = totalAmount.toFixed(2);
    return `00020126580014BR.GOV.BCB.PIX0136${key}520400005303986540${amountFormatted}5802BR5925LARISSA SOARES ESTETICA6009SAO PAULO62070503***6304ABCD`;
  }, [db.settings.paymentSettings.pixKey, totalAmount]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopyPasteCode).catch(() => {});
    setPixCopied(true);
    showToast('Código Pix copiado!', 'Cole no aplicativo do seu banco para concluir o pagamento.');
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handleFinalizeBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProcedures.length === 0) {
      showToast('Selecione ao menos 1 procedimento', undefined, 'error');
      setStep(1);
      return;
    }
    if (!selectedDate || !selectedTime) {
      showToast('Escolha a data e o horário desejado', undefined, 'error');
      setStep(2);
      return;
    }
    if (!clientName.trim() || !clientWhatsapp.trim() || !clientEmail.trim()) {
      showToast('Preencha seus dados de contato no Passo 3', undefined, 'error');
      setStep(3);
      return;
    }

    const isPaidOnline = paymentTiming === 'online_advance';
    const created = createAppointment({
      clientName: clientName.trim(),
      clientWhatsapp: clientWhatsapp.trim(),
      clientEmail: clientEmail.trim(),
      notesAllergies: notesAllergies.trim(),
      procedureIds: selectedProcedures.map((p) => p.id),
      procedureNames: selectedProcedures.map((p) => p.name),
      primaryCategory: selectedProcedures[0].category,
      date: selectedDate,
      startTime: selectedTime,
      totalDurationMinutes: totalDuration,
      totalAmount,
      paymentMethod,
      paymentTiming,
      installments: paymentMethod === 'credit_card' ? installments : undefined,
      paymentStatus: isPaidOnline ? 'paid' : 'pending',
      status: isPaidOnline ? 'confirmed' : 'pending',
      source: 'online',
    });

    setConfirmedBooking(created);
    showToast(
      'Agendamento realizado com sucesso!',
      `Seu horário em ${formatDateBR(selectedDate)} às ${selectedTime} foi reservado.`
    );
  };

  const resetBookingFlow = () => {
    setConfirmedBooking(null);
    setSelectedIds([]);
    setSelectedTime('');
    setStep(1);
  };

  const ps = db.settings.paymentSettings;

  return (
    <section
      id="agendamento"
      className="py-20 sm:py-24 bg-[#F4F1EA] border-y border-[#E6DFD3] scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#6E7F6A] font-semibold mb-3">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            Reserva Online Exclusiva
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl text-[#2D2D2D] font-medium leading-tight">
            Agende seu momento de autocuidado
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#68645E] leading-relaxed">
            Atendimento 100% individualizado e com hora marcada por Larissa Soares. Escolha seus
            procedimentos e garanta seu horário em poucos cliques.
          </p>
        </div>

        {/* Confirmed Receipt View */}
        {confirmedBooking ? (
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#D4AF37]/40 p-6 sm:p-10 shadow-lg max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#EBF0E9] border border-[#8A9A86]/30 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-8 h-8 text-[#6E7F6A]" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#6E7F6A] font-semibold">
                Reserva Registrada • Protocolo #{confirmedBooking.id.toUpperCase()}
              </span>
              <h3 className="font-serif-editorial text-3xl text-[#2D2D2D] mt-1">
                Obrigada, {confirmedBooking.clientName.split(' ')[0]}!
              </h3>
              <p className="text-sm text-[#68645E] mt-2 max-w-md">
                Seu horário foi reservado na agenda da Larissa Soares e seus dados já foram
                cadastrados com segurança.
              </p>
            </div>

            <div className="mt-8 bg-[#F4F1EA] rounded-2xl p-5 sm:p-6 border border-[#E5DEC9] space-y-3 text-sm">
              <div className="flex justify-between items-start gap-4 pb-3 border-b border-[#E5DEC9]">
                <span className="text-[#68645E]">Procedimento(s):</span>
                <span className="font-semibold text-[#2D2D2D] text-right">
                  {confirmedBooking.procedureNames.join(' + ')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[#E5DEC9]">
                <span className="text-[#68645E]">Data e Horário:</span>
                <span className="font-semibold text-[#2D2D2D]">
                  {formatDateBR(confirmedBooking.date)} das {confirmedBooking.startTime} às{' '}
                  {confirmedBooking.endTime} ({confirmedBooking.totalDurationMinutes} min)
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[#E5DEC9]">
                <span className="text-[#68645E]">Modalidade de Pagamento:</span>
                <span className="font-medium text-[#2D2D2D]">
                  {confirmedBooking.paymentTiming === 'online_advance'
                    ? 'Pagamento Online Antecipado (Confirmado)'
                    : 'Pagamento Presencial no Atendimento'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#2D2D2D] font-semibold">Valor Total:</span>
                <span className="text-lg font-bold text-[#6E7F6A]">
                  {formatCurrencyBRL(confirmedBooking.totalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/${db.settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá Larissa! Acabei de realizar meu agendamento pelo site:\n\n✨ *Procedimento:* ${confirmedBooking.procedureNames.join(
                    ' + '
                  )}\n📅 *Data:* ${formatDateBR(confirmedBooking.date)} às ${
                    confirmedBooking.startTime
                  }\n💳 *Valor:* ${formatCurrencyBRL(confirmedBooking.totalAmount)}\n👤 *Cliente:* ${
                    confirmedBooking.clientName
                  }`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6E7F6A] hover:bg-[#5B6B57] text-white px-6 py-3.5 text-sm font-semibold transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar Comprovante no WhatsApp da Larissa
              </a>
              <button
                type="button"
                onClick={resetBookingFlow}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D5CFC4] bg-white hover:bg-[#F4F1EA] text-[#2D2D2D] px-6 py-3.5 text-sm font-medium transition-all"
              >
                Fazer Novo Agendamento
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#E5DEC9] shadow-sm overflow-hidden">
            {/* 4-Step Progress Bar */}
            <div className="bg-[#EFECE4] border-b border-[#E5DEC9] px-4 sm:px-8 py-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { num: 1, label: '1. Procedimentos' },
                  { num: 2, label: '2. Data & Horário' },
                  { num: 3, label: '3. Seus Dados' },
                  { num: 4, label: '4. Pagamento' },
                ].map((item) => {
                  const isActive = step === item.num;
                  const isDone = step > item.num;
                  return (
                    <button
                      key={item.num}
                      type="button"
                      onClick={() => {
                        if (item.num === 1) setStep(1);
                        if (item.num === 2 && selectedProcedures.length > 0) setStep(2);
                        if (item.num === 3 && selectedProcedures.length > 0 && selectedTime)
                          setStep(3);
                        if (
                          item.num === 4 &&
                          selectedProcedures.length > 0 &&
                          selectedTime &&
                          clientName &&
                          clientWhatsapp
                        )
                          setStep(4);
                      }}
                      className={`flex items-center justify-center sm:justify-start gap-2.5 py-2 px-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-[#FAF9F6] text-[#2D2D2D] shadow-xs border border-[#D4AF37]/50 font-semibold'
                          : isDone
                          ? 'text-[#6E7F6A] font-medium hover:bg-[#FAF9F6]/60'
                          : 'text-[#8E8880]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full text-xs flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-[#8A9A86] text-white'
                            : isDone
                            ? 'bg-[#EBF0E9] text-[#6E7F6A] border border-[#8A9A86]/40'
                            : 'bg-[#E5DEC9] text-[#68645E]'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : item.num}
                      </span>
                      <span className="text-xs sm:text-sm truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleFinalizeBooking} className="p-6 sm:p-8 lg:p-10">
              {/* STEP 1: SELECT PROCEDURES */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                        Passo 1: Selecione o(s) procedimento(s)
                      </h3>
                      <p className="text-xs sm:text-sm text-[#68645E]">
                        Você pode selecionar um único protocolo ou combinar mais de um atendimento.
                      </p>
                    </div>
                    {/* Specialty filter pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'all', label: 'Todos' },
                          { id: 'estetica', label: 'Estética & Cosmetologia' },
                          { id: 'massoterapia', label: 'Massoterapia' },
                          { id: 'lash', label: 'Lash Design' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setCategoryFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            categoryFilter === tab.id
                              ? 'bg-[#8A9A86] text-white'
                              : 'bg-[#F4F1EA] text-[#68645E] hover:bg-[#E5DEC9]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredProcedures.map((proc) => {
                      const isSelected = selectedIds.includes(proc.id);
                      const hasPromo = isPromoValid(proc);
                      const finalPrice = getEffectivePrice(proc);

                      return (
                        <div
                          key={proc.id}
                          onClick={() => toggleProcedureSelection(proc.id)}
                          className={`cursor-pointer rounded-2xl border p-4 transition-all flex items-start gap-3.5 ${
                            isSelected
                              ? 'border-[#8A9A86] bg-[#EBF0E9]/50 shadow-xs'
                              : 'border-[#E5DEC9] bg-white hover:border-[#C8A29E]/60'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#8A9A86] border-[#8A9A86] text-white'
                                : 'border-[#C5BEB2] bg-[#FAF9F6]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] uppercase tracking-wider text-[#6E7F6A] font-semibold">
                                {CATEGORY_LABELS[proc.category]}
                              </span>
                              {hasPromo && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A29E]/20 text-[#9B6B66] border border-[#C8A29E]/40 px-2 py-0.5 text-[10px] font-semibold">
                                  <Sparkles className="w-2.5 h-2.5" /> Promoção
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-[#2D2D2D] text-sm mt-0.5">
                              {proc.name}
                            </h4>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0ECE1]">
                              <span className="inline-flex items-center gap-1 text-xs text-[#68645E]">
                                <Clock className="w-3.5 h-3.5 text-[#8A9A86]" />
                                {proc.durationMinutes} min
                              </span>
                              <div className="text-right">
                                {hasPromo && (
                                  <span className="text-xs text-[#9E9890] line-through mr-1.5">
                                    {formatCurrencyBRL(proc.originalPrice)}
                                  </span>
                                )}
                                <span className="text-sm font-bold text-[#2D2D2D]">
                                  {formatCurrencyBRL(finalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step 1 Footer Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E5DEC9]">
                    <div>
                      {selectedProcedures.length > 0 ? (
                        <p className="text-sm text-[#2D2D2D]">
                          <span className="font-semibold">{selectedProcedures.length}</span>{' '}
                          procedimento(s) selecionado(s) • Duração total:{' '}
                          <span className="font-semibold">{totalDuration} min</span> • Total:{' '}
                          <span className="font-bold text-[#6E7F6A]">
                            {formatCurrencyBRL(totalAmount)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-[#8E8880]">
                          Clique em um ou mais procedimentos acima para continuar.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={selectedProcedures.length === 0}
                      onClick={() => setStep(2)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] disabled:opacity-45 disabled:pointer-events-none text-white px-7 py-3 text-sm font-semibold transition-all"
                    >
                      Escolher Data e Horário
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CHOOSE DATE & TIME */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                        Passo 2: Escolha a data e o horário disponível
                      </h3>
                      <p className="text-xs sm:text-sm text-[#68645E]">
                        Horários já reservados ou bloqueados pela Larissa são desabilitados
                        automaticamente.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="booking-custom-date" className="text-xs text-[#68645E]">
                        Outra data:
                      </label>
                      <input
                        id="booking-custom-date"
                        type="date"
                        min={getOffsetDateISO(0)}
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTime('');
                        }}
                        className="rounded-xl border border-[#D5CFC4] bg-white px-3 py-1.5 text-xs text-[#2D2D2D] focus:outline-none focus:border-[#8A9A86]"
                      />
                    </div>
                  </div>

                  {/* Quick 8-day horizontal calendar */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {upcomingDays.map((day) => {
                      const isSelected = selectedDate === day.iso;
                      return (
                        <button
                          key={day.iso}
                          type="button"
                          onClick={() => {
                            setSelectedDate(day.iso);
                            setSelectedTime('');
                          }}
                          className={`rounded-2xl border p-2.5 text-center transition-all ${
                            isSelected
                              ? 'bg-[#8A9A86] border-[#8A9A86] text-white shadow-xs'
                              : 'bg-white border-[#E5DEC9] text-[#2D2D2D] hover:border-[#C8A29E]'
                          }`}
                        >
                          <span
                            className={`block text-[11px] font-medium ${
                              isSelected ? 'text-white/90' : 'text-[#68645E]'
                            }`}
                          >
                            {day.dayName}
                          </span>
                          <span className="block text-lg font-bold mt-0.5">{day.dayNumber}</span>
                          <span
                            className={`block text-[10px] uppercase ${
                              isSelected ? 'text-white/80' : 'text-[#8E8880]'
                            }`}
                          >
                            {day.monthName}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Available Slots Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#68645E]">
                        Horários para {formatDateBR(selectedDate)} (Duração necessária:{' '}
                        {totalDuration} min)
                      </span>
                      <div className="flex items-center gap-3 text-xs text-[#68645E]">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8A9A86]" /> Livre
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E5DEC9]" /> Ocupado /
                          Bloqueado
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                      {timeSlots.map((slot) => {
                        const isPicked = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            title={slot.reason || 'Horário disponível'}
                            className={`rounded-xl border py-2.5 px-3 text-center transition-all ${
                              !slot.available
                                ? 'border-[#EBE6DC] bg-[#F4F1EA] text-[#B5AFA6] line-through cursor-not-allowed'
                                : isPicked
                                ? 'border-[#8A9A86] bg-[#8A9A86] text-white font-semibold shadow-xs'
                                : 'border-[#E5DEC9] bg-white text-[#2D2D2D] hover:border-[#8A9A86] hover:bg-[#EBF0E9]/40 font-medium'
                            }`}
                          >
                            <span className="text-sm block">{slot.time}</span>
                            {!slot.available && (
                              <span className="text-[10px] block no-underline truncate">
                                Indisponível
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E5DEC9]">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-2 text-sm text-[#68645E] hover:text-[#2D2D2D] font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar aos Procedimentos
                    </button>
                    <button
                      type="button"
                      disabled={!selectedTime}
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] disabled:opacity-45 disabled:pointer-events-none text-white px-7 py-3 text-sm font-semibold transition-all"
                    >
                      Preencher Meus Dados
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CLIENT PERSONAL INFO */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                      Passo 3: Seus dados para atendimento personalizado
                    </h3>
                    <p className="text-xs sm:text-sm text-[#68645E]">
                      Suas informações são confidenciais e ajudam a Larissa a preparar a cabine
                      exclusivamente para você.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="client-full-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-1.5"
                      >
                        Nome Completo *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#8A9A86] absolute left-3.5 top-3.5" />
                        <input
                          id="client-full-name"
                          type="text"
                          required
                          placeholder="Ex: Mariana Soares"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full rounded-xl border border-[#D5CFC4] bg-white pl-10 pr-4 py-3 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#8A9A86]"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="client-whatsapp"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-1.5"
                      >
                        WhatsApp (com DDD) *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#8A9A86] absolute left-3.5 top-3.5" />
                        <input
                          id="client-whatsapp"
                          type="tel"
                          required
                          placeholder="Ex: (11) 99876-5432"
                          value={clientWhatsapp}
                          onChange={(e) => setClientWhatsapp(e.target.value)}
                          className="w-full rounded-xl border border-[#D5CFC4] bg-white pl-10 pr-4 py-3 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#8A9A86]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="client-email"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-1.5"
                      >
                        E-mail (para confirmação e lembretes) *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#8A9A86] absolute left-3.5 top-3.5" />
                        <input
                          id="client-email"
                          type="email"
                          required
                          placeholder="seuemail@exemplo.com"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full rounded-xl border border-[#D5CFC4] bg-white pl-10 pr-4 py-3 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#8A9A86]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="client-notes"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-1.5"
                      >
                        Observações, Alergias ou Sensibilidades (Opcional)
                      </label>
                      <textarea
                        id="client-notes"
                        rows={3}
                        placeholder="Informe caso seja gestante, use lentes de contato, ácidos faciais ou possua alergia a algum componente cosmético..."
                        value={notesAllergies}
                        onChange={(e) => setNotesAllergies(e.target.value)}
                        className="w-full rounded-xl border border-[#D5CFC4] bg-white p-3.5 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#8A9A86]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E5DEC9]">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 text-sm text-[#68645E] hover:text-[#2D2D2D] font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar para Data e Horário
                    </button>
                    <button
                      type="button"
                      disabled={!clientName.trim() || !clientWhatsapp.trim() || !clientEmail.trim()}
                      onClick={() => setStep(4)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] disabled:opacity-45 disabled:pointer-events-none text-white px-7 py-3 text-sm font-semibold transition-all"
                    >
                      Escolher Forma de Pagamento
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: PAYMENT OPTIONS */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                      Passo 4: Forma de Pagamento e Confirmação
                    </h3>
                    <p className="text-xs sm:text-sm text-[#68645E]">
                      Escolha entre adiantar seu pagamento online (Pix ou Cartão) ou pagar
                      presencialmente no dia do atendimento.
                    </p>
                  </div>

                  {/* Summary Banner */}
                  <div className="rounded-2xl bg-[#F4F1EA] border border-[#E5DEC9] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#6E7F6A] font-semibold">
                        Resumo do Atendimento
                      </p>
                      <p className="text-sm font-semibold text-[#2D2D2D] mt-0.5">
                        {selectedProcedures.map((p) => p.name).join(' + ')}
                      </p>
                      <p className="text-xs text-[#68645E] mt-0.5">
                        📅 {formatDateBR(selectedDate)} às {selectedTime} ({totalDuration} min) • 👤{' '}
                        {clientName}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xs text-[#68645E] block">Total a pagar</span>
                      <span className="text-2xl font-bold text-[#6E7F6A]">
                        {formatCurrencyBRL(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Options Grid based on Admin Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {ps.pixEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('pix');
                          setPaymentTiming('online_advance');
                        }}
                        className={`rounded-2xl border p-4 text-left transition-all flex items-start gap-3.5 ${
                          paymentMethod === 'pix'
                            ? 'border-[#8A9A86] bg-[#EBF0E9]/60 shadow-xs'
                            : 'border-[#E5DEC9] bg-white hover:border-[#C8A29E]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#E5DEC9] flex items-center justify-center shrink-0">
                          <QrCode className="w-5 h-5 text-[#6E7F6A]" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#6E7F6A]">
                            Online Antecipado
                          </span>
                          <h4 className="font-semibold text-sm text-[#2D2D2D]">
                            Pix Instantâneo (QR Code / Copia e Cola)
                          </h4>
                          <p className="text-xs text-[#68645E] mt-0.5">
                            Confirmação imediata do seu horário na agenda.
                          </p>
                        </div>
                      </button>
                    )}

                    {ps.creditCardEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('credit_card');
                          setPaymentTiming('online_advance');
                        }}
                        className={`rounded-2xl border p-4 text-left transition-all flex items-start gap-3.5 ${
                          paymentMethod === 'credit_card'
                            ? 'border-[#8A9A86] bg-[#EBF0E9]/60 shadow-xs'
                            : 'border-[#E5DEC9] bg-white hover:border-[#C8A29E]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#E5DEC9] flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5 text-[#C8A29E]" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#A97E79]">
                            Online ou Presencial
                          </span>
                          <h4 className="font-semibold text-sm text-[#2D2D2D]">
                            Cartão de Crédito (em até {ps.creditCardMaxInstallments}x)
                          </h4>
                          <p className="text-xs text-[#68645E] mt-0.5">
                            Parcelamento flexível para seus protocolos.
                          </p>
                        </div>
                      </button>
                    )}

                    {ps.debitCardEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('debit_card');
                          setPaymentTiming('in_person');
                        }}
                        className={`rounded-2xl border p-4 text-left transition-all flex items-start gap-3.5 ${
                          paymentMethod === 'debit_card'
                            ? 'border-[#8A9A86] bg-[#EBF0E9]/60 shadow-xs'
                            : 'border-[#E5DEC9] bg-white hover:border-[#C8A29E]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#E5DEC9] flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5 text-[#68645E]" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#68645E]">
                            Presencial no Espaço
                          </span>
                          <h4 className="font-semibold text-sm text-[#2D2D2D]">
                            Cartão de Débito no Dia
                          </h4>
                          <p className="text-xs text-[#68645E] mt-0.5">
                            Realize o pagamento na maquininha após o atendimento.
                          </p>
                        </div>
                      </button>
                    )}

                    {ps.cashInPersonEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('cash_in_person');
                          setPaymentTiming('in_person');
                        }}
                        className={`rounded-2xl border p-4 text-left transition-all flex items-start gap-3.5 ${
                          paymentMethod === 'cash_in_person'
                            ? 'border-[#8A9A86] bg-[#EBF0E9]/60 shadow-xs'
                            : 'border-[#E5DEC9] bg-white hover:border-[#C8A29E]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#E5DEC9] flex items-center justify-center shrink-0">
                          <Banknote className="w-5 h-5 text-[#D4AF37]" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#68645E]">
                            Presencial no Espaço
                          </span>
                          <h4 className="font-semibold text-sm text-[#2D2D2D]">
                            Pagar Presencialmente na Hora (Dinheiro / Pix)
                          </h4>
                          <p className="text-xs text-[#68645E] mt-0.5">
                            Pague diretamente à Larissa no dia do seu procedimento.
                          </p>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Dynamic Pix Box */}
                  {paymentMethod === 'pix' && ps.pixEnabled && (
                    <div className="rounded-2xl border border-[#8A9A86]/40 bg-white p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        {/* Stylized SVG QR Code representation */}
                        <div className="w-32 h-32 rounded-xl border border-[#E5DEC9] bg-[#FAF9F6] p-3 flex flex-col items-center justify-center shrink-0">
                          <QrCode className="w-20 h-20 text-[#2D2D2D]" />
                          <span className="text-[10px] text-[#68645E] mt-1 font-medium">
                            QR Code Pix Oficial
                          </span>
                        </div>
                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#6E7F6A]">
                            Chave Pix Oficial do Espaço
                          </p>
                          <p className="text-sm font-bold text-[#2D2D2D]">
                            {ps.pixKey}
                          </p>
                          <p className="text-xs text-[#68645E]">
                            Favorecido: {ps.pixHolderName}
                          </p>
                          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={pixCopyPasteCode}
                              className="flex-1 rounded-lg border border-[#E5DEC9] bg-[#FAF9F6] px-3 py-2 text-xs text-[#68645E] font-mono truncate"
                            />
                            <button
                              type="button"
                              onClick={handleCopyPix}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2D2D2D] hover:bg-[#404040] text-white px-4 py-2 text-xs font-semibold transition-all shrink-0"
                            >
                              {pixCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#8A9A86]" /> Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" /> Copiar Pix Copia e Cola
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Credit Card Installments Box */}
                  {paymentMethod === 'credit_card' && ps.creditCardEnabled && (
                    <div className="rounded-2xl border border-[#C8A29E]/40 bg-white p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <label
                            htmlFor="card-installments"
                            className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-1"
                          >
                            Número de Parcelas no Cartão de Crédito
                          </label>
                          <p className="text-xs text-[#8E8880]">
                            Configurado pelo espaço em até {ps.creditCardMaxInstallments}x sem
                            burocracia.
                          </p>
                        </div>
                        <select
                          id="card-installments"
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          className="rounded-xl border border-[#D5CFC4] bg-[#FAF9F6] px-4 py-2.5 text-sm font-semibold text-[#2D2D2D] focus:outline-none focus:border-[#8A9A86]"
                        >
                          {Array.from(
                            { length: ps.creditCardMaxInstallments },
                            (_, idx) => idx + 1
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n}x de {formatCurrencyBRL(totalAmount / n)} sem juros
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-[#F4F1EA]">
                        <label className="inline-flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                          <input
                            type="radio"
                            name="cardTiming"
                            checked={paymentTiming === 'online_advance'}
                            onChange={() => setPaymentTiming('online_advance')}
                            className="accent-[#8A9A86]"
                          />
                          Deixar pré-autorizado online agora
                        </label>
                        <label className="inline-flex items-center gap-2 text-xs text-[#2D2D2D] cursor-pointer">
                          <input
                            type="radio"
                            name="cardTiming"
                            checked={paymentTiming === 'in_person'}
                            onChange={() => setPaymentTiming('in_person')}
                            className="accent-[#8A9A86]"
                          />
                          Passar o cartão presencialmente no dia
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#E5DEC9]">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 text-sm text-[#68645E] hover:text-[#2D2D2D] font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar para Meus Dados
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-8 py-3.5 text-sm font-semibold transition-all shadow-md"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Confirmar Agendamento ({formatCurrencyBRL(totalAmount)})
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
