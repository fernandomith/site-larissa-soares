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
  CreditCard,
  QrCode,
  Banknote,
  Copy,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import {
  useClinic,
  formatCurrencyBRL,
  formatDateBR,
  minutesToTime,
  timeToMinutes,
} from '@/lib/store';
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

  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notesAllergies, setNotesAllergies] = useState('');

  const [paymentTiming, setPaymentTiming] = useState<PaymentTimingType>('online_advance');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pix');
  const [installments, setInstallments] = useState<number>(1);
  const [pixCopied, setPixCopied] = useState(false);

  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  useEffect(() => {
    if (preselectedProcedureIds.length > 0) {
      setSelectedIds(preselectedProcedureIds);
      setConfirmedBooking(null);
      setStep(2);
      onClearPreselected?.();
    }
  }, [preselectedProcedureIds, onClearPreselected]);

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

  const upcomingDays = useMemo(() => {
    const days = [];
    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
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
      });
    }
    return days;
  }, []);

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
    showToast('Código Pix copiado', 'Cole no aplicativo do seu banco para finalizar.');
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handleFinalizeBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProcedures.length === 0) {
      showToast('Selecione ao menos um protocolo', undefined, 'error');
      setStep(1);
      return;
    }
    if (!selectedDate || !selectedTime) {
      showToast('Escolha a data e o horário desejado', undefined, 'error');
      setStep(2);
      return;
    }
    if (!clientName.trim() || !clientWhatsapp.trim() || !clientEmail.trim()) {
      showToast('Preencha seus dados pessoais no Passo III', undefined, 'error');
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
      'Reserva confirmada com sucesso',
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
      className="py-28 sm:py-36 bg-[#F4F1EA]/70 border-t border-[#E6DFD2] scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        {/* Editorial Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#8A9A86] font-medium mb-4">
            Concierge & Reserva Online
          </p>
          <h2 className="font-serif-editorial text-4xl sm:text-5xl lg:text-[54px] text-[#2D2D2D] font-light leading-[1.1]">
            Reserve o seu momento de <span className="italic text-[#C8A29E]">pausa</span>
          </h2>
          <div className="w-12 h-[1px] bg-[#D4AF37]/60 mx-auto my-6" />
          <p className="text-sm text-[#68645E] font-light leading-relaxed">
            Agenda sincronizada em tempo real com a disponibilidade exclusiva de Larissa Soares.
          </p>
        </div>

        {confirmedBooking ? (
          <div className="bg-[#FAF9F6] border border-[#D4AF37]/40 p-8 sm:p-14 shadow-[0_24px_60px_-15px_rgba(45,45,45,0.06)] max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full border border-[#8A9A86]/40 bg-[#EBF0E9]/60 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-[#6E7F6A] stroke-[1.5]" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#6E7F6A] font-medium">
                Reserva Confirmada • Protocolo #{confirmedBooking.id.toUpperCase()}
              </span>
              <h3 className="font-serif-editorial text-3xl sm:text-4xl text-[#2D2D2D] font-light mt-2">
                Será um prazer recebê-la, {confirmedBooking.clientName.split(' ')[0]}
              </h3>
              <p className="text-xs sm:text-sm text-[#68645E] mt-2 max-w-md font-light">
                Seu horário já está bloqueado exclusivamente para você na agenda da Larissa Soares.
              </p>
            </div>

            <div className="mt-10 border-y border-[#E5DEC9] py-6 space-y-4 text-sm">
              <div className="flex justify-between items-start gap-4">
                <span className="text-xs uppercase tracking-[0.18em] text-[#8E8880]">
                  Protocolo(s)
                </span>
                <span className="font-medium text-[#2D2D2D] text-right">
                  {confirmedBooking.procedureNames.join(' + ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-[0.18em] text-[#8E8880]">
                  Data & Horário
                </span>
                <span className="font-medium text-[#2D2D2D]">
                  {formatDateBR(confirmedBooking.date)} • {confirmedBooking.startTime} às{' '}
                  {confirmedBooking.endTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-[0.18em] text-[#8E8880]">
                  Modalidade
                </span>
                <span className="text-[#68645E]">
                  {confirmedBooking.paymentTiming === 'online_advance'
                    ? 'Pagamento Antecipado'
                    : 'Pagamento Presencial no Atendimento'}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-4 border-t border-[#EFECE4]">
                <span className="text-xs uppercase tracking-[0.2em] text-[#2D2D2D] font-medium">
                  Investimento Total
                </span>
                <span className="font-serif-editorial text-3xl text-[#6E7F6A]">
                  {formatCurrencyBRL(confirmedBooking.totalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`https://wa.me/${db.settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá Larissa! Acabei de realizar meu agendamento pelo site:\n\nProcedimento: ${confirmedBooking.procedureNames.join(
                    ' + '
                  )}\nData: ${formatDateBR(confirmedBooking.date)} às ${
                    confirmedBooking.startTime
                  }\nValor: ${formatCurrencyBRL(confirmedBooking.totalAmount)}\nCliente: ${
                    confirmedBooking.clientName
                  }`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-[#2D2D2D] hover:bg-[#8A9A86] text-[#FAF9F6] px-8 py-4 text-xs uppercase tracking-[0.2em] font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4 stroke-[1.5]" />
                Enviar Confirmação no WhatsApp
              </a>
              <button
                type="button"
                onClick={resetBookingFlow}
                className="inline-flex items-center justify-center border border-[#D5CFC4] hover:border-[#2D2D2D] text-[#2D2D2D] px-7 py-4 text-xs uppercase tracking-[0.2em] transition-colors"
              >
                Nova Reserva
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#FAF9F6] border border-[#E5DEC9] shadow-[0_24px_60px_-15px_rgba(45,45,45,0.05)]">
            {/* Editorial Step Header with Roman Numerals */}
            <div className="border-b border-[#E5DEC9] px-6 sm:px-10 py-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { num: 1, roman: 'I', label: 'Protocolos' },
                  { num: 2, roman: 'II', label: 'Data & Horário' },
                  { num: 3, roman: 'III', label: 'Identificação' },
                  { num: 4, roman: 'IV', label: 'Pagamento' },
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
                      className={`text-left pb-3 border-b-2 transition-all ${
                        isActive
                          ? 'border-[#8A9A86] text-[#2D2D2D]'
                          : isDone
                          ? 'border-[#D4AF37]/50 text-[#6E7F6A]'
                          : 'border-transparent text-[#A59F96]'
                      }`}
                    >
                      <span className="font-serif-editorial italic text-sm block">
                        Passo {item.roman}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] font-medium mt-0.5 block">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleFinalizeBooking} className="p-6 sm:p-10 lg:p-12">
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.26em] text-[#8A9A86] block mb-1">
                        Passo I • Seleção
                      </span>
                      <h3 className="font-serif-editorial text-3xl text-[#2D2D2D] font-light">
                        Escolha seu(s) protocolo(s)
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-4 border-b border-[#E5DEC9] pb-2">
                      {(
                        [
                          { id: 'all', label: 'Todos' },
                          { id: 'estetica', label: 'Estética' },
                          { id: 'massoterapia', label: 'Massoterapia' },
                          { id: 'lash', label: 'Lash Design' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setCategoryFilter(tab.id)}
                          className={`text-xs uppercase tracking-[0.18em] pb-1 transition-all ${
                            categoryFilter === tab.id
                              ? 'text-[#2D2D2D] font-semibold border-b border-[#D4AF37]'
                              : 'text-[#8E8880] hover:text-[#2D2D2D]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-[#EBE5D8] border-y border-[#EBE5D8]">
                    {filteredProcedures.map((proc) => {
                      const isSelected = selectedIds.includes(proc.id);
                      const hasPromo = isPromoValid(proc);
                      const finalPrice = getEffectivePrice(proc);

                      return (
                        <div
                          key={proc.id}
                          onClick={() => toggleProcedureSelection(proc.id)}
                          className={`cursor-pointer py-5 px-4 transition-all flex items-center justify-between gap-4 ${
                            isSelected ? 'bg-[#EBF0E9]/45' : 'hover:bg-[#F4F1EA]/60'
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <img
                              src={proc.imageUrl}
                              alt={proc.name}
                              className="w-16 h-16 object-cover rounded-full border border-[#D4AF37]/30 shrink-0 hidden sm:block"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-[10px] uppercase tracking-[0.22em] text-[#8A9A86] font-medium">
                                  {CATEGORY_LABELS[proc.category]}
                                </span>
                                {hasPromo && (
                                  <span className="text-[10px] uppercase tracking-[0.16em] bg-[#C8A29E]/20 text-[#9B6B66] px-2 py-0.5">
                                    Condição Especial
                                  </span>
                                )}
                              </div>
                              <h4 className="font-serif-editorial text-xl text-[#2D2D2D] mt-0.5">
                                {proc.name}
                              </h4>
                              <span className="text-xs text-[#8E8880] font-light">
                                Duração aproximada: {proc.durationMinutes} minutos
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 shrink-0">
                            <div className="text-right">
                              {hasPromo && (
                                <span className="text-xs text-[#A59F96] line-through block">
                                  {formatCurrencyBRL(proc.originalPrice)}
                                </span>
                              )}
                              <span className="font-serif-editorial text-2xl text-[#2D2D2D]">
                                {formatCurrencyBRL(finalPrice)}
                              </span>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-[#8A9A86] border-[#8A9A86] text-white'
                                  : 'border-[#C5BEB2]'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[2]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <div>
                      {selectedProcedures.length > 0 ? (
                        <p className="text-xs uppercase tracking-[0.16em] text-[#68645E]">
                          {selectedProcedures.length} protocolo(s) • {totalDuration} min • Total:{' '}
                          <strong className="text-[#2D2D2D] font-semibold">
                            {formatCurrencyBRL(totalAmount)}
                          </strong>
                        </p>
                      ) : (
                        <p className="text-xs text-[#8E8880] italic font-serif-editorial text-base">
                          Selecione um ou mais protocolos na lista acima para prosseguir.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={selectedProcedures.length === 0}
                      onClick={() => setStep(2)}
                      className="inline-flex items-center justify-center gap-3 bg-[#2D2D2D] hover:bg-[#8A9A86] disabled:opacity-35 disabled:pointer-events-none text-[#FAF9F6] px-8 py-4 text-xs uppercase tracking-[0.22em] transition-colors"
                    >
                      Escolher Data & Horário
                      <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.26em] text-[#8A9A86] block mb-1">
                        Passo II • Disponibilidade
                      </span>
                      <h3 className="font-serif-editorial text-3xl text-[#2D2D2D] font-light">
                        Selecione a data e o horário
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="booking-custom-date"
                        className="text-[11px] uppercase tracking-[0.18em] text-[#68645E]"
                      >
                        Calendário:
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
                        className="border-b border-[#2D2D2D] bg-transparent px-2 py-1 text-xs text-[#2D2D2D] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Editorial Date Strip */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
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
                          className={`py-4 px-2 border text-center transition-all ${
                            isSelected
                              ? 'bg-[#2D2D2D] border-[#2D2D2D] text-[#FAF9F6]'
                              : 'bg-white border-[#E5DEC9] text-[#2D2D2D] hover:border-[#8A9A86]'
                          }`}
                        >
                          <span
                            className={`block text-[10px] uppercase tracking-[0.16em] ${
                              isSelected ? 'text-[#D4AF37]' : 'text-[#8E8880]'
                            }`}
                          >
                            {day.dayName}
                          </span>
                          <span className="font-serif-editorial text-2xl block mt-1">
                            {day.dayNumber}
                          </span>
                          <span className="block text-[10px] uppercase tracking-[0.16em] opacity-70">
                            {day.monthName}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Slots Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-2">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-[#68645E]">
                        Horários em {formatDateBR(selectedDate)}
                      </span>
                      <span className="text-[11px] text-[#8E8880]">
                        Duração reservada: {totalDuration} min
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                      {timeSlots.map((slot) => {
                        const isPicked = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            title={slot.reason || 'Disponível'}
                            className={`py-3 px-3 border text-center transition-all ${
                              !slot.available
                                ? 'border-[#EFECE4] bg-[#F4F1EA]/60 text-[#C2BCB2] line-through cursor-not-allowed'
                                : isPicked
                                ? 'border-[#8A9A86] bg-[#8A9A86] text-white font-medium'
                                : 'border-[#E5DEC9] bg-white text-[#2D2D2D] hover:border-[#2D2D2D]'
                            }`}
                          >
                            <span className="text-xs tracking-[0.14em] block">{slot.time}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-[#E5DEC9]">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#68645E] hover:text-[#2D2D2D]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                    </button>
                    <button
                      type="button"
                      disabled={!selectedTime}
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-3 bg-[#2D2D2D] hover:bg-[#8A9A86] disabled:opacity-35 disabled:pointer-events-none text-[#FAF9F6] px-8 py-4 text-xs uppercase tracking-[0.22em] transition-colors"
                    >
                      Prosseguir
                      <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.26em] text-[#8A9A86] block mb-1">
                      Passo III • Ficha de Recepção
                    </span>
                    <h3 className="font-serif-editorial text-3xl text-[#2D2D2D] font-light">
                      Seus dados para atendimento individualizado
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="client-full-name"
                        className="block text-[10px] uppercase tracking-[0.22em] text-[#68645E] mb-2"
                      >
                        Nome Completo *
                      </label>
                      <input
                        id="client-full-name"
                        type="text"
                        required
                        placeholder="Como prefere ser chamada"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full border-b border-[#C5BEB2] focus:border-[#2D2D2D] bg-transparent py-3 text-sm text-[#2D2D2D] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="client-whatsapp"
                        className="block text-[10px] uppercase tracking-[0.22em] text-[#68645E] mb-2"
                      >
                        WhatsApp (com DDD) *
                      </label>
                      <input
                        id="client-whatsapp"
                        type="tel"
                        required
                        placeholder="(11) 99876-5432"
                        value={clientWhatsapp}
                        onChange={(e) => setClientWhatsapp(e.target.value)}
                        className="w-full border-b border-[#C5BEB2] focus:border-[#2D2D2D] bg-transparent py-3 text-sm text-[#2D2D2D] focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="client-email"
                        className="block text-[10px] uppercase tracking-[0.22em] text-[#68645E] mb-2"
                      >
                        E-mail *
                      </label>
                      <input
                        id="client-email"
                        type="email"
                        required
                        placeholder="seuemail@exemplo.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full border-b border-[#C5BEB2] focus:border-[#2D2D2D] bg-transparent py-3 text-sm text-[#2D2D2D] focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="client-notes"
                        className="block text-[10px] uppercase tracking-[0.22em] text-[#68645E] mb-2"
                      >
                        Observações, Gestação, Lentes ou Sensibilidades (Opcional)
                      </label>
                      <textarea
                        id="client-notes"
                        rows={2}
                        placeholder="Alguma observação importante para a Larissa preparar sua cabine?"
                        value={notesAllergies}
                        onChange={(e) => setNotesAllergies(e.target.value)}
                        className="w-full border-b border-[#C5BEB2] focus:border-[#2D2D2D] bg-transparent py-2 text-sm text-[#2D2D2D] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-[#E5DEC9]">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#68645E] hover:text-[#2D2D2D]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                    </button>
                    <button
                      type="button"
                      disabled={!clientName.trim() || !clientWhatsapp.trim() || !clientEmail.trim()}
                      onClick={() => setStep(4)}
                      className="inline-flex items-center gap-3 bg-[#2D2D2D] hover:bg-[#8A9A86] disabled:opacity-35 disabled:pointer-events-none text-[#FAF9F6] px-8 py-4 text-xs uppercase tracking-[0.22em] transition-colors"
                    >
                      Forma de Pagamento
                      <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5DEC9] pb-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.26em] text-[#8A9A86] block mb-1">
                        Passo IV • Finalização
                      </span>
                      <h3 className="font-serif-editorial text-3xl text-[#2D2D2D] font-light">
                        Modalidade de Pagamento
                      </h3>
                      <p className="text-xs text-[#68645E] mt-1">
                        {selectedProcedures.map((p) => p.name).join(' + ')} •{' '}
                        {formatDateBR(selectedDate)} às {selectedTime}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E8880] block">
                        Total da Reserva
                      </span>
                      <span className="font-serif-editorial text-3xl text-[#2D2D2D]">
                        {formatCurrencyBRL(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ps.pixEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('pix');
                          setPaymentTiming('online_advance');
                        }}
                        className={`p-5 border text-left transition-all ${
                          paymentMethod === 'pix'
                            ? 'border-[#2D2D2D] bg-[#F4F1EA]'
                            : 'border-[#E5DEC9] bg-white hover:border-[#8A9A86]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E7F6A] font-semibold">
                            Online Antecipado
                          </span>
                          <QrCode className="w-4 h-4 text-[#6E7F6A] stroke-[1.5]" />
                        </div>
                        <h4 className="font-serif-editorial text-xl text-[#2D2D2D]">
                          Pix Instantâneo
                        </h4>
                        <p className="text-xs text-[#68645E] font-light mt-1">
                          QR Code ou chave Copia e Cola para confirmação imediata.
                        </p>
                      </button>
                    )}

                    {ps.creditCardEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('credit_card');
                          setPaymentTiming('online_advance');
                        }}
                        className={`p-5 border text-left transition-all ${
                          paymentMethod === 'credit_card'
                            ? 'border-[#2D2D2D] bg-[#F4F1EA]'
                            : 'border-[#E5DEC9] bg-white hover:border-[#8A9A86]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[#A97E79] font-semibold">
                            Parcelamento Flexível
                          </span>
                          <CreditCard className="w-4 h-4 text-[#A97E79] stroke-[1.5]" />
                        </div>
                        <h4 className="font-serif-editorial text-xl text-[#2D2D2D]">
                          Cartão de Crédito (até {ps.creditCardMaxInstallments}x)
                        </h4>
                        <p className="text-xs text-[#68645E] font-light mt-1">
                          Pré-reserva online ou pagamento no espaço.
                        </p>
                      </button>
                    )}

                    {ps.debitCardEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('debit_card');
                          setPaymentTiming('in_person');
                        }}
                        className={`p-5 border text-left transition-all ${
                          paymentMethod === 'debit_card'
                            ? 'border-[#2D2D2D] bg-[#F4F1EA]'
                            : 'border-[#E5DEC9] bg-white hover:border-[#8A9A86]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[#68645E]">
                            No Atendimento
                          </span>
                          <CreditCard className="w-4 h-4 text-[#68645E] stroke-[1.5]" />
                        </div>
                        <h4 className="font-serif-editorial text-xl text-[#2D2D2D]">
                          Cartão de Débito
                        </h4>
                        <p className="text-xs text-[#68645E] font-light mt-1">
                          Pagamento presencial no dia do protocolo.
                        </p>
                      </button>
                    )}

                    {ps.cashInPersonEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('cash_in_person');
                          setPaymentTiming('in_person');
                        }}
                        className={`p-5 border text-left transition-all ${
                          paymentMethod === 'cash_in_person'
                            ? 'border-[#2D2D2D] bg-[#F4F1EA]'
                            : 'border-[#E5DEC9] bg-white hover:border-[#8A9A86]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[#B38F22]">
                            No Atendimento
                          </span>
                          <Banknote className="w-4 h-4 text-[#D4AF37] stroke-[1.5]" />
                        </div>
                        <h4 className="font-serif-editorial text-xl text-[#2D2D2D]">
                          Pagamento Presencial
                        </h4>
                        <p className="text-xs text-[#68645E] font-light mt-1">
                          Acerte diretamente com a Larissa no espaço.
                        </p>
                      </button>
                    )}
                  </div>

                  {paymentMethod === 'pix' && ps.pixEnabled && (
                    <div className="border border-[#D4AF37]/40 bg-white p-6 flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-28 h-28 border border-[#E5DEC9] bg-[#FAF9F6] p-3 flex flex-col items-center justify-center shrink-0">
                        <QrCode className="w-16 h-16 text-[#2D2D2D] stroke-[1.25]" />
                      </div>
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E7F6A] font-semibold">
                          Chave Pix Oficial • {ps.pixHolderName}
                        </span>
                        <p className="text-sm font-medium text-[#2D2D2D]">{ps.pixKey}</p>
                        <div className="pt-1 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            readOnly
                            value={pixCopyPasteCode}
                            className="flex-1 border border-[#E5DEC9] bg-[#FAF9F6] px-3 py-2 text-xs text-[#68645E] font-mono truncate"
                          />
                          <button
                            type="button"
                            onClick={handleCopyPix}
                            className="inline-flex items-center justify-center gap-2 bg-[#2D2D2D] text-white px-5 py-2 text-xs uppercase tracking-[0.16em]"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            {pixCopied ? 'Copiado' : 'Copiar Código'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'credit_card' && ps.creditCardEnabled && (
                    <div className="border border-[#E5DEC9] bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <span className="text-xs uppercase tracking-[0.18em] text-[#68645E]">
                        Parcelamento desejado:
                      </span>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="border-b border-[#2D2D2D] bg-transparent py-2 px-3 text-sm text-[#2D2D2D] focus:outline-none"
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
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#E5DEC9]">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#68645E] hover:text-[#2D2D2D]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-3 bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-10 py-4 text-xs uppercase tracking-[0.24em] font-medium transition-colors"
                    >
                      Confirmar Reserva ({formatCurrencyBRL(totalAmount)})
                      <ArrowRight className="w-4 h-4 stroke-[1.5]" />
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
