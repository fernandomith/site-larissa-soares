'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Wallet,
  Send,
  Calendar as CalendarIcon,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  Mail,
  Phone,
  Users,
  Check,
  X,
  QrCode,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ban,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  Search,
} from 'lucide-react';
import {
  useClinic,
  formatCurrencyBRL,
  formatDateBR,
  timeToMinutes,
  minutesToTime,
} from '@/lib/store';
import {
  APPOINTMENT_STATUS_LABELS,
  AppointmentStatusType,
  AudienceFilterType,
  BlockType,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
  PAYMENT_METHOD_LABELS,
  PaymentMethodType,
  Procedure,
  SpecialtyCategory,
} from '@/lib/types';
import { formatISODate, getOffsetDateISO } from '@/lib/seed-data';

type AdminTab = 'dashboard' | 'procedures' | 'finance' | 'marketing' | 'schedule';

const AVAILABLE_IMAGES = [
  { label: 'Estética Facial Glow', url: '/images/proc-estetica-facial.jpg' },
  { label: 'Cosmetologia & Peeling Botânico', url: '/images/proc-peeling-botanico.jpg' },
  { label: 'Massoterapia & Pedras Quentes', url: '/images/proc-massoterapia.jpg' },
  { label: 'Drenagem & Corporal', url: '/images/proc-drenagem-modeladora.jpg' },
  { label: 'Extensão de Cílios (Lash Design)', url: '/images/proc-lash-design.jpg' },
  { label: 'Lash Lifting & Nutrição', url: '/images/proc-lash-lifting.jpg' },
];

export default function AdminDashboardPage() {
  const {
    db,
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
  } = useClinic();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('larissa@larissasoares.com.br');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Module A: Dashboard Filters
  const [periodFilter, setPeriodFilter] = useState<'day' | 'week' | 'month'>('day');
  const [dashboardDate, setDashboardDate] = useState<string>(() => getOffsetDateISO(0));

  // Module B: Procedures CRUD Modal State
  const [isProcModalOpen, setIsProcModalOpen] = useState(false);
  const [editingProc, setEditingProc] = useState<Procedure | null>(null);
  const [procForm, setProcForm] = useState<{
    name: string;
    category: SpecialtyCategory;
    description: string;
    benefitsText: string;
    durationMinutes: number;
    originalPrice: number;
    onPromo: boolean;
    promoPrice: number;
    promoValidUntil: string;
    imageUrl: string;
    active: boolean;
  }>({
    name: '',
    category: 'estetica',
    description: '',
    benefitsText: '',
    durationMinutes: 60,
    originalPrice: 200,
    onPromo: false,
    promoPrice: 170,
    promoValidUntil: getOffsetDateISO(14),
    imageUrl: '/images/proc-estetica-facial.jpg',
    active: true,
  });

  // Module C: Finance & Payment Settings State
  const [txPaymentStatusFilter, setTxPaymentStatusFilter] = useState<'all' | 'paid' | 'pending'>(
    'all'
  );
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txForm, setTxForm] = useState<{
    description: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    paymentMethod: PaymentMethodType;
    paymentStatus: 'paid' | 'pending';
  }>({
    description: '',
    type: 'expense',
    category: 'Insumos Lash Design & Cosmetologia',
    amount: 120,
    date: getOffsetDateISO(0),
    paymentMethod: 'pix',
    paymentStatus: 'paid',
  });

  const [settingsForm, setSettingsForm] = useState(db.settings);
  useEffect(() => {
    setSettingsForm(db.settings);
  }, [db.settings]);

  // Module D: Marketing & Message Dispatch State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-1');
  const [dispatchChannel, setDispatchChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilterType>('all');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [dispatchQueueOpen, setDispatchQueueOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Module E: Schedule & Availability State
  const [scheduleViewMode, setScheduleViewMode] = useState<'daily' | 'weekly'>('daily');
  const [scheduleDate, setScheduleDate] = useState<string>(() => getOffsetDateISO(0));
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    blockType: BlockType;
  }>({
    date: getOffsetDateISO(0),
    startTime: '12:00',
    endTime: '13:30',
    reason: 'Horário de Almoço',
    blockType: 'lunch',
  });

  const [isManualAptModalOpen, setIsManualAptModalOpen] = useState(false);
  const [manualAptForm, setManualAptForm] = useState<{
    clientName: string;
    clientWhatsapp: string;
    clientEmail: string;
    notesAllergies: string;
    procedureId: string;
    date: string;
    startTime: string;
    paymentMethod: PaymentMethodType;
    paymentStatus: 'paid' | 'pending';
  }>({
    clientName: '',
    clientWhatsapp: '',
    clientEmail: '',
    notesAllergies: '',
    procedureId: 'proc-estetica-1',
    date: getOffsetDateISO(0),
    startTime: '10:00',
    paymentMethod: 'pix',
    paymentStatus: 'pending',
  });

  // Restore session login
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('larissa_admin_auth');
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  // Sync selected template content
  useEffect(() => {
    const found = db.templates.find((t) => t.id === selectedTemplateId);
    if (found) {
      setCustomMessage(found.content);
      setCustomSubject(found.subject || `${found.title} | Estética Larissa Soares`);
      setAudienceFilter(found.defaultAudience);
    }
  }, [selectedTemplateId, db.templates]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      loginEmail.trim().toLowerCase() === 'larissa@larissasoares.com.br' &&
      (loginPassword === 'Larissa@2026' || loginPassword === 'admin123')
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('larissa_admin_auth', 'authenticated');
      setLoginError('');
      showToast('Bem-vinda de volta, Larissa!', 'Painel administrativo carregado em tempo real.');
    } else {
      setLoginError('Credenciais inválidas. Use larissa@larissasoares.com.br e senha Larissa@2026');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('larissa_admin_auth');
    showToast('Sessão encerrada com segurança', undefined, 'info');
  };

  // Financial Metrics Calculation (Day / Week / Month)
  const financialMetrics = useMemo(() => {
    const today = getOffsetDateISO(0);
    const weekStart = getOffsetDateISO(-7);
    const monthStart = getOffsetDateISO(-30);

    const inPeriod = (dateStr: string) => {
      if (periodFilter === 'day') return dateStr === today;
      if (periodFilter === 'week') return dateStr >= weekStart;
      return dateStr >= monthStart;
    };

    const periodTxs = db.transactions.filter((t) => inPeriod(t.date));
    const incomeTxs = periodTxs.filter((t) => t.type === 'income');
    const expenseTxs = periodTxs.filter((t) => t.type === 'expense');

    const grossRevenue = incomeTxs.reduce((acc, t) => acc + t.amount, 0);
    const receivedAmount = incomeTxs
      .filter((t) => t.paymentStatus === 'paid')
      .reduce((acc, t) => acc + t.amount, 0);
    const pendingAmount = incomeTxs
      .filter((t) => t.paymentStatus === 'pending')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = expenseTxs.reduce((acc, t) => acc + t.amount, 0);

    return {
      grossRevenue,
      receivedAmount,
      pendingAmount,
      totalExpenses,
      netBalance: receivedAmount - totalExpenses,
    };
  }, [db.transactions, periodFilter]);

  // Dashboard Appointments List
  const dayAppointments = useMemo(() => {
    return db.appointments
      .filter((a) => a.date === dashboardDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [db.appointments, dashboardDate]);

  // Filtered Transactions for Module C
  const filteredTransactions = useMemo(() => {
    return db.transactions.filter((t) => {
      if (txPaymentStatusFilter !== 'all' && t.paymentStatus !== txPaymentStatusFilter) {
        return false;
      }
      if (txTypeFilter !== 'all' && t.type !== txTypeFilter) {
        return false;
      }
      return true;
    });
  }, [db.transactions, txPaymentStatusFilter, txTypeFilter]);

  // Filtered Audience for Module D
  const filteredAudienceClients = useMemo(() => {
    const thirtyDaysAgo = getOffsetDateISO(-30);
    return db.clients.filter((c) => {
      const matchesSearch =
        !clientSearch.trim() ||
        c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.whatsapp.includes(clientSearch);
      if (!matchesSearch) return false;

      if (audienceFilter === 'all') return true;
      if (audienceFilter === 'estetica') return c.lastCategory === 'estetica';
      if (audienceFilter === 'massoterapia') return c.lastCategory === 'massoterapia';
      if (audienceFilter === 'lash') return c.lastCategory === 'lash';
      if (audienceFilter === 'inactive_30_days') return c.lastVisitAt <= thirtyDaysAgo;
      return true;
    });
  }, [db.clients, audienceFilter, clientSearch]);

  // Helper to personalize template message
  const renderPersonalizedMessage = (raw: string, clientName: string, lastProc: string) => {
    return raw
      .replace(/\{nome\}/g, clientName.split(' ')[0])
      .replace(/\{procedimento\}/g, lastProc || 'seu procedimento')
      .replace(/\{link_vip\}/g, db.settings.vipGroupUrl);
  };

  // Open Procedure Modal
  const openNewProcedureModal = () => {
    setEditingProc(null);
    setProcForm({
      name: '',
      category: 'estetica',
      description: '',
      benefitsText:
        'Atendimento 100% personalizado\nAtivos dermatologicamente seguros\nResultado natural e duradouro',
      durationMinutes: 60,
      originalPrice: 210,
      onPromo: false,
      promoPrice: 175,
      promoValidUntil: getOffsetDateISO(14),
      imageUrl: '/images/proc-estetica-facial.jpg',
      active: true,
    });
    setIsProcModalOpen(true);
  };

  const openEditProcedureModal = (proc: Procedure) => {
    setEditingProc(proc);
    setProcForm({
      name: proc.name,
      category: proc.category,
      description: proc.description,
      benefitsText: (proc.benefits || []).join('\n'),
      durationMinutes: proc.durationMinutes,
      originalPrice: proc.originalPrice,
      onPromo: proc.onPromo,
      promoPrice: proc.promoPrice || Math.round(proc.originalPrice * 0.85),
      promoValidUntil: proc.promoValidUntil || getOffsetDateISO(14),
      imageUrl: proc.imageUrl,
      active: proc.active,
    });
    setIsProcModalOpen(true);
  };

  const handleSaveProcedureForm = (e: React.FormEvent) => {
    e.preventDefault();
    const benefits = procForm.benefitsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Procedure = {
      id: editingProc ? editingProc.id : `proc-${Date.now().toString().slice(-6)}`,
      name: procForm.name.trim(),
      category: procForm.category,
      description: procForm.description.trim(),
      benefits,
      durationMinutes: Number(procForm.durationMinutes) || 60,
      originalPrice: Number(procForm.originalPrice) || 0,
      onPromo: procForm.onPromo,
      promoPrice: procForm.onPromo ? Number(procForm.promoPrice) : undefined,
      promoValidUntil: procForm.onPromo ? procForm.promoValidUntil : undefined,
      imageUrl: procForm.imageUrl || '/images/proc-estetica-facial.jpg',
      active: procForm.active,
    };

    upsertProcedure(payload);
    setIsProcModalOpen(false);
  };

  const handleSaveManualTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.description.trim() || txForm.amount <= 0) return;
    addFinancialTransaction({
      description: txForm.description.trim(),
      type: txForm.type,
      category: txForm.category,
      amount: Number(txForm.amount),
      date: txForm.date,
      paymentMethod: txForm.paymentMethod,
      paymentStatus: txForm.paymentStatus,
    });
    setIsTxModalOpen(false);
    setTxForm((prev) => ({ ...prev, description: '', amount: 120 }));
  };

  const handleSaveBlockForm = (e: React.FormEvent) => {
    e.preventDefault();
    addScheduleBlock({
      date: blockForm.date,
      startTime: blockForm.startTime,
      endTime: blockForm.endTime,
      reason: blockForm.reason.trim() || 'Bloqueio Administrativo',
      blockType: blockForm.blockType,
    });
    setIsBlockModalOpen(false);
  };

  const handleSaveManualAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const proc = db.procedures.find((p) => p.id === manualAptForm.procedureId) || db.procedures[0];
    if (!proc) return;

    const price = getEffectivePrice(proc);
    createAppointment({
      clientName: manualAptForm.clientName.trim(),
      clientWhatsapp: manualAptForm.clientWhatsapp.trim(),
      clientEmail: manualAptForm.clientEmail.trim() || 'cliente@whatsapp.com',
      notesAllergies: manualAptForm.notesAllergies.trim(),
      procedureIds: [proc.id],
      procedureNames: [proc.name],
      primaryCategory: proc.category,
      date: manualAptForm.date,
      startTime: manualAptForm.startTime,
      totalDurationMinutes: proc.durationMinutes,
      totalAmount: price,
      paymentMethod: manualAptForm.paymentMethod,
      paymentTiming: manualAptForm.paymentStatus === 'paid' ? 'online_advance' : 'in_person',
      paymentStatus: manualAptForm.paymentStatus,
      status: 'confirmed',
      source: 'manual',
    });

    showToast(
      'Agendamento manual inserido!',
      `${manualAptForm.clientName} agendada em ${formatDateBR(manualAptForm.date)} às ${
        manualAptForm.startTime
      }.`
    );
    setIsManualAptModalOpen(false);
  };

  // ============================================================================
  // LOGIN VIEW (/admin unauthenticated)
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-luxury-texture flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-[#FAF9F6] rounded-3xl border border-[#E2DBD0] shadow-xl p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#EBF0E9] border border-[#8A9A86]/30 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-[#6E7F6A]" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#6E7F6A] font-semibold">
              Área Restrita • Proprietária
            </span>
            <h1 className="font-serif-editorial text-3xl text-[#2D2D2D] font-medium">
              Estética Larissa Soares
            </h1>
            <p className="text-xs text-[#68645E]">
              Acesso exclusivo para gestão de agenda, procedimentos, promoções e fluxo de caixa.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-1.5"
              >
                E-mail da Proprietária
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-xl border border-[#D5CFC4] bg-white px-4 py-3 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#8A9A86]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-1.5"
              >
                Senha de Acesso
              </label>
              <input
                id="admin-password"
                type="password"
                required
                placeholder="Digite sua senha..."
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-xl border border-[#D5CFC4] bg-white px-4 py-3 text-sm text-[#2D2D2D] focus:outline-none focus:border-[#8A9A86]"
              />
            </div>

            {loginError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              id="admin-login-submit"
              className="w-full rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white py-3.5 text-sm font-semibold transition-all shadow-sm"
            >
              Acessar Painel Administrativo
            </button>
          </form>

          {/* One-click Demo Login helper */}
          <div className="rounded-2xl bg-[#F4F1EA] border border-[#E5DEC9] p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#2D2D2D]">Credenciais de Acesso Padrão:</span>
              <span className="text-[11px] text-[#6E7F6A] font-medium">Ambiente Pronto</span>
            </div>
            <p className="text-[#68645E]">
              E-mail: <code className="text-[#2D2D2D] font-mono">larissa@larissasoares.com.br</code>
              <br />
              Senha: <code className="text-[#2D2D2D] font-mono">Larissa@2026</code>
            </p>
            <button
              type="button"
              id="admin-quick-login"
              onClick={() => {
                setLoginEmail('larissa@larissasoares.com.br');
                setLoginPassword('Larissa@2026');
                setIsAuthenticated(true);
                sessionStorage.setItem('larissa_admin_auth', 'authenticated');
                showToast('Acesso autenticado!', 'Bem-vinda ao painel Estética Larissa Soares.');
              }}
              className="w-full rounded-xl border border-[#8A9A86]/50 bg-white hover:bg-[#EBF0E9] text-[#2D2D2D] py-2 font-semibold transition-all"
            >
              Preencher e Entrar Automaticamente (1 Clique)
            </button>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#68645E] hover:text-[#2D2D2D] font-medium"
            >
              ← Voltar para a Página da Cliente
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // ============================================================================
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F1EA] text-[#2D2D2D]">
      {/* SIDEBAR NAVIGATION */}
      <aside className="lg:w-72 bg-[#2D2D2D] text-[#FAF9F6] shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
        <div className="p-6 space-y-6">
          {/* Admin Header Brand */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] font-semibold block">
                Gestão Exclusiva
              </span>
              <h1 className="font-serif-editorial text-2xl text-white font-normal">
                Larissa Soares
              </h1>
            </div>
            <Link
              href="/"
              title="Ver site público"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs text-[#FAF9F6] transition-colors"
            >
              <span>Ver Site</span>
              <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            {(
              [
                {
                  id: 'dashboard',
                  label: 'Visão Geral',
                  sub: 'Resumo & Hoje',
                  icon: LayoutDashboard,
                },
                {
                  id: 'procedures',
                  label: 'Procedimentos & Promoções',
                  sub: 'Catálogo CRUD',
                  icon: Sparkles,
                },
                {
                  id: 'finance',
                  label: 'Financeiro & Pagamentos',
                  sub: 'Pix, Cartão & Caixa',
                  icon: Wallet,
                },
                {
                  id: 'marketing',
                  label: 'Central de Disparos',
                  sub: 'WhatsApp & E-mail',
                  icon: Send,
                },
                {
                  id: 'schedule',
                  label: 'Agenda & Bloqueios',
                  sub: 'Horários & Folgas',
                  icon: CalendarIcon,
                },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all shrink-0 lg:w-full ${
                    isActive
                      ? 'bg-[#8A9A86] text-white shadow-sm font-semibold'
                      : 'text-[#C8C3B9] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm block truncate">{item.label}</span>
                    <span
                      className={`hidden lg:block text-[11px] truncate ${
                        isActive ? 'text-white/80' : 'text-[#8E8880]'
                      }`}
                    >
                      {item.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="hidden lg:block p-6 border-t border-white/10 space-y-3">
          <button
            type="button"
            onClick={resetToDefault}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 py-2.5 text-xs text-[#C8C3B9] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Dados de Exemplo
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-[#FAF9F6] hover:text-red-200 py-2.5 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da Área Restrita
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 space-y-8 overflow-y-auto">
        {/* =================================================================== */}
        {/* MÓDULO A: DASHBOARD PRINCIPAL (VISÃO GERAL)                         */}
        {/* =================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-[#6E7F6A] font-semibold">
                  Painel da Proprietária
                </span>
                <h2 className="font-serif-editorial text-3xl sm:text-4xl text-[#2D2D2D]">
                  Olá, Larissa Soares
                </h2>
                <p className="text-xs sm:text-sm text-[#68645E]">
                  Acompanhe o desempenho financeiro e os atendimentos agendados do seu espaço.
                </p>
              </div>

              {/* Period Toggle (Dia / Semana / Mês) */}
              <div className="inline-flex bg-[#FAF9F6] p-1.5 rounded-2xl border border-[#E2DBD0] self-start">
                {(
                  [
                    { id: 'day', label: 'Hoje (Dia)' },
                    { id: 'week', label: 'Esta Semana' },
                    { id: 'month', label: 'Este Mês' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriodFilter(p.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      periodFilter === p.id
                        ? 'bg-[#8A9A86] text-white shadow-xs'
                        : 'text-[#68645E] hover:text-[#2D2D2D]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#68645E]">
                    Faturamento Bruto
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#F7F1DF] flex items-center justify-center text-[#B38F22]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mt-3">
                  {formatCurrencyBRL(financialMetrics.grossRevenue)}
                </p>
                <p className="text-xs text-[#8E8880] mt-1">
                  Soma de todos os agendamentos do período
                </p>
              </div>

              <div className="rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6E7F6A]">
                    Valores Recebidos
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#EBF0E9] flex items-center justify-center text-[#6E7F6A]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-[#6E7F6A] mt-3">
                  {formatCurrencyBRL(financialMetrics.receivedAmount)}
                </p>
                <p className="text-xs text-[#8E8880] mt-1">Pagamentos já quitados em caixa</p>
              </div>

              <div className="rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A97E79]">
                    Valores a Receber
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#F7EDEB] flex items-center justify-center text-[#A97E79]">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-[#A97E79] mt-3">
                  {formatCurrencyBRL(financialMetrics.pendingAmount)}
                </p>
                <p className="text-xs text-[#8E8880] mt-1">
                  Clientes que pagarão presencialmente
                </p>
              </div>

              <div className="rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#68645E]">
                    Insumos / Despesas
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#F4F1EA] flex items-center justify-center text-[#68645E]">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mt-3">
                  {formatCurrencyBRL(financialMetrics.totalExpenses)}
                </p>
                <p className="text-xs text-[#6E7F6A] font-medium mt-1">
                  Saldo Líquido: {formatCurrencyBRL(financialMetrics.netBalance)}
                </p>
              </div>
            </div>

            {/* Upcoming Appointments of the Day */}
            <div className="rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                    Agendamentos do Dia ({formatDateBR(dashboardDate)})
                  </h3>
                  <p className="text-xs text-[#68645E]">
                    Confirme horários pelo WhatsApp em 1 clique ou dê baixa nos pagamentos
                    presenciais.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="date"
                    value={dashboardDate}
                    onChange={(e) => setDashboardDate(e.target.value)}
                    className="rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs text-[#2D2D2D]"
                  />
                  <button
                    type="button"
                    onClick={() => setDashboardDate(getOffsetDateISO(0))}
                    className="rounded-xl border border-[#D5CFC4] bg-[#F4F1EA] hover:bg-[#E5DEC9] px-3 py-2 text-xs font-medium"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualAptForm((prev) => ({ ...prev, date: dashboardDate }));
                      setIsManualAptModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-4 py-2 text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo Agendamento Manual
                  </button>
                </div>
              </div>

              {dayAppointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D5CFC4] p-10 text-center space-y-2">
                  <p className="text-sm font-medium text-[#2D2D2D]">
                    Nenhum agendamento para {formatDateBR(dashboardDate)}.
                  </p>
                  <p className="text-xs text-[#68645E]">
                    Selecione outra data acima ou adicione um agendamento recebido pelo WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E5DEC9] text-[11px] uppercase tracking-wider text-[#68645E]">
                        <th className="py-3 pr-4">Horário</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Procedimento & Especialidade</th>
                        <th className="py-3 px-4">Valor & Pagamento</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 pl-4 text-right">Ações Rápidas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFECE4] text-sm">
                      {dayAppointments.map((apt) => {
                        const waConfirmUrl = `https://wa.me/${apt.clientWhatsapp.replace(
                          /\D/g,
                          ''
                        )}?text=${encodeURIComponent(
                          `Olá, ${
                            apt.clientName.split(' ')[0]
                          }! 🌿 Aqui é a Larissa Soares. Passando para confirmar seu agendamento de *${apt.procedureNames.join(
                            ' + '
                          )}* no dia *${formatDateBR(apt.date)} às ${
                            apt.startTime
                          }*. Posso confirmar sua presença?`
                        )}`;

                        return (
                          <tr key={apt.id} className="hover:bg-[#F4F1EA]/50 transition-colors">
                            <td className="py-4 pr-4 whitespace-nowrap">
                              <span className="font-bold text-[#2D2D2D] block">
                                {apt.startTime} — {apt.endTime}
                              </span>
                              <span className="text-xs text-[#8E8880]">
                                {apt.totalDurationMinutes} min
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <p className="font-semibold text-[#2D2D2D]">{apt.clientName}</p>
                              <p className="text-xs text-[#68645E]">{apt.clientWhatsapp}</p>
                              {apt.notesAllergies && (
                                <p className="text-[11px] text-[#A97E79] mt-0.5 italic">
                                  Obs: {apt.notesAllergies}
                                </p>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <span className="inline-block rounded-full bg-[#EBF0E9] text-[#6E7F6A] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-1">
                                {CATEGORY_SHORT_LABELS[apt.primaryCategory]}
                              </span>
                              <p className="text-xs sm:text-sm font-medium text-[#2D2D2D]">
                                {apt.procedureNames.join(' + ')}
                              </p>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="font-bold text-[#2D2D2D] block">
                                {formatCurrencyBRL(apt.totalAmount)}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    apt.paymentStatus === 'paid'
                                      ? 'bg-[#EBF0E9] text-[#6E7F6A]'
                                      : 'bg-[#F7EDEB] text-[#A97E79]'
                                  }`}
                                >
                                  {apt.paymentStatus === 'paid' ? 'Pago' : 'Pagar na hora'}
                                </span>
                                <span className="text-[11px] text-[#8E8880]">
                                  ({PAYMENT_METHOD_LABELS[apt.paymentMethod]})
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <select
                                value={apt.status}
                                onChange={(e) =>
                                  updateAppointmentStatus(
                                    apt.id,
                                    e.target.value as AppointmentStatusType
                                  )
                                }
                                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold focus:outline-none ${
                                  apt.status === 'confirmed'
                                    ? 'bg-[#EBF0E9] border-[#8A9A86]/40 text-[#6E7F6A]'
                                    : apt.status === 'completed'
                                    ? 'bg-[#F7F1DF] border-[#D4AF37]/40 text-[#947618]'
                                    : apt.status === 'cancelled'
                                    ? 'bg-red-50 border-red-200 text-red-600'
                                    : 'bg-[#F7EDEB] border-[#C8A29E]/40 text-[#A97E79]'
                                }`}
                              >
                                {(
                                  Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatusType[]
                                ).map((st) => (
                                  <option key={st} value={st}>
                                    {APPOINTMENT_STATUS_LABELS[st]}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-4 pl-4 text-right whitespace-nowrap space-x-2">
                              {apt.paymentStatus === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => markPaymentReceived(apt.id)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-[#FAF9F6] hover:bg-[#EBF0E9] border border-[#8A9A86]/50 text-[#6E7F6A] px-3 py-1.5 text-xs font-semibold transition-colors"
                                  title="Dar baixa em 1 clique quando a cliente pagar presencialmente"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Dar Baixa
                                </button>
                              )}
                              <a
                                href={waConfirmUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#6E7F6A] hover:bg-[#5B6B57] text-white px-3.5 py-1.5 text-xs font-semibold transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                Confirmar WhatsApp
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MÓDULO B: GESTÃO DE PROCEDIMENTOS E PROMOÇÕES (CRUD)                */}
        {/* =================================================================== */}
        {activeTab === 'procedures' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-[#A97E79] font-semibold">
                  Catálogo Dinâmico & Ofertas
                </span>
                <h2 className="font-serif-editorial text-3xl sm:text-4xl text-[#2D2D2D]">
                  Gestão de Procedimentos e Promoções
                </h2>
                <p className="text-xs sm:text-sm text-[#68645E]">
                  Qualquer alteração ou ativação da chave &ldquo;Em Promoção?&rdquo; reflete
                  instantaneamente na página pública da cliente.
                </p>
              </div>

              <button
                type="button"
                id="btn-new-procedure"
                onClick={openNewProcedureModal}
                className="inline-flex items-center gap-2 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-6 py-3 text-xs sm:text-sm font-semibold transition-all shadow-sm self-start"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Novo Procedimento
              </button>
            </div>

            {/* Procedures Admin List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {db.procedures.map((proc) => {
                const promoActive = isPromoValid(proc);
                return (
                  <div
                    key={proc.id}
                    className={`rounded-3xl border bg-[#FAF9F6] p-6 shadow-xs transition-all flex flex-col justify-between gap-5 ${
                      proc.active ? 'border-[#E5DEC9]' : 'border-dashed border-[#C5BEB2] opacity-70'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={proc.imageUrl}
                          alt={proc.name}
                          className="w-20 h-20 rounded-2xl object-cover border border-[#E5DEC9] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-full bg-[#EBF0E9] text-[#6E7F6A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              {CATEGORY_LABELS[proc.category]}
                            </span>
                            <span className="text-xs text-[#68645E] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {proc.durationMinutes} min
                            </span>
                            {!proc.active && (
                              <span className="rounded-full bg-neutral-200 text-neutral-700 px-2 py-0.5 text-[10px] font-semibold">
                                Oculto no site
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif-editorial text-xl text-[#2D2D2D] font-semibold mt-1">
                            {proc.name}
                          </h3>
                          <p className="text-xs text-[#68645E] line-clamp-2 mt-1">
                            {proc.description}
                          </p>
                        </div>
                      </div>

                      {/* Quick Promotion Toggle Box */}
                      <div className="rounded-2xl bg-[#F4F1EA] border border-[#E5DEC9] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#2D2D2D] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#C8A29E]" />
                              Em Promoção?
                            </span>
                            <span className="text-[11px] text-[#68645E]">
                              Exibe preço antigo riscado ({formatCurrencyBRL(proc.originalPrice)}) e
                              selo no site
                            </span>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={proc.onPromo}
                            onClick={() =>
                              toggleProcedurePromo(
                                proc.id,
                                !proc.onPromo,
                                proc.promoPrice || Math.round(proc.originalPrice * 0.82),
                                proc.promoValidUntil || getOffsetDateISO(14)
                              )
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                              proc.onPromo ? 'bg-[#8A9A86]' : 'bg-[#D5CFC4]'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                                proc.onPromo ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {proc.onPromo && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5DEC9]">
                            <div>
                              <label className="block text-[10px] font-semibold uppercase text-[#68645E] mb-1">
                                Valor Promocional (R$)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={proc.promoPrice || ''}
                                onChange={(e) =>
                                  toggleProcedurePromo(
                                    proc.id,
                                    true,
                                    Number(e.target.value),
                                    proc.promoValidUntil
                                  )
                                }
                                className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-1.5 text-xs font-bold text-[#6E7F6A]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold uppercase text-[#68645E] mb-1">
                                Validade da Oferta
                              </label>
                              <input
                                type="date"
                                value={proc.promoValidUntil || ''}
                                onChange={(e) =>
                                  toggleProcedurePromo(
                                    proc.id,
                                    true,
                                    proc.promoPrice,
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-1.5 text-xs text-[#2D2D2D]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#EFECE4]">
                      <div>
                        <span className="text-[11px] text-[#8E8880] block">Valor vigente:</span>
                        <div className="flex items-baseline gap-2">
                          {promoActive && (
                            <span className="text-xs text-[#9E9890] line-through">
                              {formatCurrencyBRL(proc.originalPrice)}
                            </span>
                          )}
                          <span className="text-lg font-bold text-[#2D2D2D]">
                            {formatCurrencyBRL(getEffectivePrice(proc))}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleProcedureActive(proc.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#D5CFC4] bg-white hover:bg-[#F4F1EA] px-3 py-2 text-xs font-medium text-[#68645E]"
                          title={proc.active ? 'Desativar no site' : 'Ativar no site'}
                        >
                          {proc.active ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" /> Pausar
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" /> Ativar
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditProcedureModal(proc)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#D5CFC4] bg-white hover:bg-[#F4F1EA] px-3 py-2 text-xs font-semibold text-[#2D2D2D]"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#8A9A86]" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProcedure(proc.id)}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 p-2 text-red-600"
                          title="Excluir procedimento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MÓDULO C: GESTÃO FINANCEIRA E MEIOS DE PAGAMENTO                    */}
        {/* =================================================================== */}
        {activeTab === 'finance' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#6E7F6A] font-semibold">
                Pagamentos & Fluxo de Caixa
              </span>
              <h2 className="font-serif-editorial text-3xl sm:text-4xl text-[#2D2D2D]">
                Gestão Financeira e Meios de Pagamento
              </h2>
              <p className="text-xs sm:text-sm text-[#68645E]">
                Configure quais modalidades de pagamento aparecem no agendamento online e controle
                todas as entradas e despesas.
              </p>
            </div>

            {/* 1. Payment Modalities Configuration Panel */}
            <div className="rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFECE4] pb-4">
                <div>
                  <h3 className="font-serif-editorial text-2xl text-[#2D2D2D] flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#D4AF37]" />
                    Configuração de Modalidades de Pagamento
                  </h3>
                  <p className="text-xs text-[#68645E]">
                    Ative ou desative as opções que a cliente pode escolher no Passo 4 do
                    agendamento online.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings(settingsForm)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-6 py-2.5 text-xs font-semibold transition-all shadow-xs self-start"
                >
                  <Check className="w-4 h-4" />
                  Salvar Configurações de Pagamento
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* PIX CONFIG */}
                <div className="rounded-2xl bg-[#F4F1EA] border border-[#E5DEC9] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DEC9] flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-[#6E7F6A]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-[#2D2D2D]">
                          Pix (QR Code & Copia e Cola)
                        </h4>
                        <p className="text-xs text-[#68645E]">Pagamento online antecipado</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={settingsForm.paymentSettings.pixEnabled}
                      onClick={() =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          paymentSettings: {
                            ...prev.paymentSettings,
                            pixEnabled: !prev.paymentSettings.pixEnabled,
                          },
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        settingsForm.paymentSettings.pixEnabled ? 'bg-[#8A9A86]' : 'bg-[#D5CFC4]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          settingsForm.paymentSettings.pixEnabled
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settingsForm.paymentSettings.pixEnabled && (
                    <div className="grid grid-cols-1 gap-3 pt-2 border-t border-[#E5DEC9]">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-[#68645E] mb-1">
                          Chave Pix (E-mail, CPF/CNPJ, Telefone ou Aleatória)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.paymentSettings.pixKey}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              paymentSettings: {
                                ...prev.paymentSettings,
                                pixKey: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs text-[#2D2D2D]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-[#68645E] mb-1">
                          Nome do Favorecido no Pix
                        </label>
                        <input
                          type="text"
                          value={settingsForm.paymentSettings.pixHolderName}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              paymentSettings: {
                                ...prev.paymentSettings,
                                pixHolderName: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs text-[#2D2D2D]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* CREDIT CARD CONFIG */}
                <div className="rounded-2xl bg-[#F4F1EA] border border-[#E5DEC9] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DEC9] flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-[#C8A29E]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-[#2D2D2D]">Cartão de Crédito</h4>
                        <p className="text-xs text-[#68645E]">
                          Permite configurar limite de parcelas
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={settingsForm.paymentSettings.creditCardEnabled}
                      onClick={() =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          paymentSettings: {
                            ...prev.paymentSettings,
                            creditCardEnabled: !prev.paymentSettings.creditCardEnabled,
                          },
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        settingsForm.paymentSettings.creditCardEnabled
                          ? 'bg-[#8A9A86]'
                          : 'bg-[#D5CFC4]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          settingsForm.paymentSettings.creditCardEnabled
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settingsForm.paymentSettings.creditCardEnabled && (
                    <div className="pt-2 border-t border-[#E5DEC9]">
                      <label className="block text-[10px] font-semibold uppercase text-[#68645E] mb-1">
                        Número Máximo de Parcelas Permitidas
                      </label>
                      <select
                        value={settingsForm.paymentSettings.creditCardMaxInstallments}
                        onChange={(e) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            paymentSettings: {
                              ...prev.paymentSettings,
                              creditCardMaxInstallments: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs font-semibold text-[#2D2D2D]"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                          <option key={num} value={num}>
                            Até {num}x no Cartão de Crédito
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* DEBIT CARD CONFIG */}
                <div className="rounded-2xl bg-[#F4F1EA] border border-[#E5DEC9] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DEC9] flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#68645E]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[#2D2D2D]">Cartão de Débito</h4>
                      <p className="text-xs text-[#68645E]">Pagamento na maquininha do espaço</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={settingsForm.paymentSettings.debitCardEnabled}
                    onClick={() =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        paymentSettings: {
                          ...prev.paymentSettings,
                          debitCardEnabled: !prev.paymentSettings.debitCardEnabled,
                        },
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settingsForm.paymentSettings.debitCardEnabled
                        ? 'bg-[#8A9A86]'
                        : 'bg-[#D5CFC4]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        settingsForm.paymentSettings.debitCardEnabled
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* IN-PERSON CASH CONFIG */}
                <div className="rounded-2xl bg-[#F4F1EA] border border-[#E5DEC9] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DEC9] flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[#2D2D2D]">
                        Dinheiro / Presencial na Hora
                      </h4>
                      <p className="text-xs text-[#68645E]">
                        Cliente realiza o pagamento no dia do atendimento
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={settingsForm.paymentSettings.cashInPersonEnabled}
                    onClick={() =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        paymentSettings: {
                          ...prev.paymentSettings,
                          cashInPersonEnabled: !prev.paymentSettings.cashInPersonEnabled,
                        },
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settingsForm.paymentSettings.cashInPersonEnabled
                        ? 'bg-[#8A9A86]'
                        : 'bg-[#D5CFC4]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                        settingsForm.paymentSettings.cashInPersonEnabled
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Cash Flow & Transactions Control */}
            <div className="rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                    Controle de Recebimentos e Fluxo de Caixa
                  </h3>
                  <p className="text-xs text-[#68645E]">
                    Entradas automáticas dos agendamentos e lançamentos manuais de receitas ou
                    despesas (ex: compra de insumos de cílios ou cremes).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2D2D2D] hover:bg-[#404040] text-white px-5 py-2.5 text-xs font-semibold transition-all self-start"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  Lançar Receita / Despesa Manual
                </button>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EFECE4]">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Todos os Status' },
                      { id: 'paid', label: 'Pago / Recebido' },
                      { id: 'pending', label: 'Pendente / Pagar na hora' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setTxPaymentStatusFilter(st.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        txPaymentStatusFilter === st.id
                          ? 'bg-[#8A9A86] text-white font-semibold'
                          : 'bg-[#F4F1EA] text-[#68645E] hover:bg-[#E5DEC9]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Entradas & Saídas' },
                      { id: 'income', label: 'Apenas Receitas' },
                      { id: 'expense', label: 'Apenas Despesas (Insumos)' },
                    ] as const
                  ).map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setTxTypeFilter(tp.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        txTypeFilter === tp.id
                          ? 'bg-[#2D2D2D] text-white font-semibold'
                          : 'bg-[#F4F1EA] text-[#68645E] hover:bg-[#E5DEC9]'
                      }`}
                    >
                      {tp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5DEC9] text-[11px] uppercase tracking-wider text-[#68645E]">
                      <th className="py-3 pr-4">Data</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Status Pagamento</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 pl-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE4] text-sm">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#F4F1EA]/50">
                        <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-[#68645E]">
                          {formatDateBR(tx.date)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#2D2D2D]">
                          {tx.description}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#68645E]">{tx.category}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                              tx.type === 'income'
                                ? 'bg-[#EBF0E9] text-[#6E7F6A]'
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {tx.type === 'income' ? 'Entrada' : 'Despesa'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              tx.paymentStatus === 'paid'
                                ? 'bg-[#EBF0E9] text-[#6E7F6A]'
                                : 'bg-[#F7EDEB] text-[#A97E79]'
                            }`}
                          >
                            {tx.paymentStatus === 'paid' ? 'Pago' : 'Pendente / Pagar na hora'}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-4 font-bold whitespace-nowrap ${
                            tx.type === 'income' ? 'text-[#6E7F6A]' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'expense' ? '- ' : '+ '}
                          {formatCurrencyBRL(tx.amount)}
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap space-x-2">
                          {tx.paymentStatus === 'pending' && (
                            <button
                              type="button"
                              onClick={() => markPaymentReceived(tx.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Dar Baixa (1 Clique)
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteFinancialTransaction(tx.id)}
                            className="inline-flex items-center justify-center rounded-xl border border-[#E5DEC9] hover:border-red-300 p-1.5 text-[#8E8880] hover:text-red-600"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MÓDULO D: CENTRAL DE DISPARO DE MENSAGENS (MARKETING & LEMBRETES)   */}
        {/* =================================================================== */}
        {activeTab === 'marketing' && (
          <div className="space-y-8">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#A97E79] font-semibold">
                Relacionamento & Retenção
              </span>
              <h2 className="font-serif-editorial text-3xl sm:text-4xl text-[#2D2D2D]">
                Central de Disparo de Mensagens & Base de Clientes
              </h2>
              <p className="text-xs sm:text-sm text-[#68645E]">
                Envie lembretes de agendamento, avisos de manutenção de cílios (15 dias), promoções
                e convites para o Grupo VIP via WhatsApp ou E-mail Marketing.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Campaign Composer & Templates */}
              <div className="lg:col-span-7 rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 sm:p-8 shadow-xs space-y-6">
                <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                  Ferramenta de Disparo Inteligente
                </h3>

                {/* 1. Channel Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-2">
                    1. Canal de Envio
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDispatchChannel('whatsapp')}
                      className={`flex items-center justify-center gap-2.5 rounded-2xl border p-3.5 text-xs sm:text-sm font-semibold transition-all ${
                        dispatchChannel === 'whatsapp'
                          ? 'bg-[#6E7F6A] border-[#6E7F6A] text-white shadow-xs'
                          : 'bg-white border-[#E5DEC9] text-[#2D2D2D]'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp (Links Dinâmicos / API)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispatchChannel('email')}
                      className={`flex items-center justify-center gap-2.5 rounded-2xl border p-3.5 text-xs sm:text-sm font-semibold transition-all ${
                        dispatchChannel === 'email'
                          ? 'bg-[#A97E79] border-[#A97E79] text-white shadow-xs'
                          : 'bg-white border-[#E5DEC9] text-[#2D2D2D]'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      E-mail Marketing (SMTP / Resend)
                    </button>
                  </div>
                </div>

                {/* 2. Ready-to-use Editable Templates */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-2">
                    2. Modelos Prontos Editáveis (Templates)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {db.templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`rounded-2xl border p-3 text-left transition-all ${
                          selectedTemplateId === tpl.id
                            ? 'border-[#8A9A86] bg-[#EBF0E9]/60 font-semibold text-[#2D2D2D]'
                            : 'border-[#E5DEC9] bg-white text-[#68645E] hover:border-[#C8A29E]'
                        }`}
                      >
                        <span className="text-xs block">{tpl.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Audience Filter */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-2">
                    3. Filtro de Público ({filteredAudienceClients.length} destinatárias
                    selecionadas)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'all', label: 'Todas as Clientes' },
                        { id: 'lash', label: 'Apenas Lash Design' },
                        { id: 'estetica', label: 'Apenas Estética & Cosmetologia' },
                        { id: 'massoterapia', label: 'Apenas Massoterapia' },
                        { id: 'inactive_30_days', label: 'Inativas há +30 dias' },
                      ] as const
                    ).map((aud) => (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => setAudienceFilter(aud.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                          audienceFilter === aud.id
                            ? 'bg-[#2D2D2D] text-white font-semibold'
                            : 'bg-[#F4F1EA] text-[#68645E] hover:bg-[#E5DEC9]'
                        }`}
                      >
                        {aud.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Editable Content */}
                <div className="space-y-3">
                  {dispatchChannel === 'email' && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#68645E] mb-1">
                        Assunto do E-mail
                      </label>
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm text-[#2D2D2D]"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#68645E]">
                        Mensagem Personalizável
                      </label>
                      <span className="text-[11px] text-[#6E7F6A]">
                        Variáveis: <code>{'{nome}'}</code>, <code>{'{procedimento}'}</code>,{' '}
                        <code>{'{link_vip}'}</code>
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full rounded-2xl border border-[#D5CFC4] bg-white p-4 text-sm text-[#2D2D2D] leading-relaxed focus:outline-none focus:border-[#8A9A86]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EFECE4]">
                  <button
                    type="button"
                    onClick={() => {
                      const currentTpl = db.templates.find((t) => t.id === selectedTemplateId);
                      if (currentTpl) {
                        updateTemplate({
                          ...currentTpl,
                          subject: customSubject,
                          content: customMessage,
                        });
                      }
                    }}
                    className="rounded-xl border border-[#D5CFC4] bg-white hover:bg-[#F4F1EA] px-4 py-2.5 text-xs font-semibold text-[#2D2D2D]"
                  >
                    Salvar Alterações no Template
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDispatchQueueOpen(true);
                      const currentTpl = db.templates.find((t) => t.id === selectedTemplateId);
                      recordCampaign({
                        templateTitle: currentTpl?.title || 'Campanha Personalizada',
                        channel: dispatchChannel,
                        audience: audienceFilter,
                        recipientsCount: filteredAudienceClients.length,
                      });
                      showToast(
                        dispatchChannel === 'whatsapp'
                          ? 'Fila de disparo WhatsApp gerada!'
                          : 'Campanha de E-mail preparada!',
                        `${filteredAudienceClients.length} clientes prontas para envio personalizado.`
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-6 py-3 text-xs sm:text-sm font-semibold transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    Gerar Fila de Disparo ({filteredAudienceClients.length} Clientes)
                  </button>
                </div>

                {/* Interactive Dispatch Queue Box */}
                {dispatchQueueOpen && (
                  <div className="rounded-2xl bg-[#F4F1EA] border border-[#8A9A86]/40 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7F6A]">
                        Fila de Disparo Dinâmica ({dispatchChannel.toUpperCase()})
                      </h4>
                      <button
                        type="button"
                        onClick={() => setDispatchQueueOpen(false)}
                        className="text-xs text-[#68645E] hover:text-[#2D2D2D]"
                      >
                        Fechar fila
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {filteredAudienceClients.map((cli) => {
                        const personalized = renderPersonalizedMessage(
                          customMessage,
                          cli.fullName,
                          cli.lastProcedureName
                        );
                        const actionHref =
                          dispatchChannel === 'whatsapp'
                            ? `https://wa.me/${cli.whatsapp.replace(
                                /\D/g,
                                ''
                              )}?text=${encodeURIComponent(personalized)}`
                            : `mailto:${cli.email}?subject=${encodeURIComponent(
                                customSubject
                              )}&body=${encodeURIComponent(personalized)}`;

                        return (
                          <div
                            key={cli.id}
                            className="rounded-xl bg-white border border-[#E5DEC9] p-3 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#2D2D2D] truncate">
                                {cli.fullName}
                              </p>
                              <p className="text-[11px] text-[#68645E] truncate">
                                {personalized.slice(0, 75)}...
                              </p>
                            </div>
                            <a
                              href={actionHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6E7F6A] hover:bg-[#5B6B57] text-white px-3 py-1.5 text-xs font-semibold shrink-0"
                            >
                              {dispatchChannel === 'whatsapp' ? (
                                <>
                                  <MessageCircle className="w-3.5 h-3.5" /> Disparar WhatsApp
                                </>
                              ) : (
                                <>
                                  <Mail className="w-3.5 h-3.5" /> Enviar E-mail
                                </>
                              )}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Automatic Client Database */}
              <div className="lg:col-span-5 rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                      Base de Clientes ({db.clients.length})
                    </h3>
                    <p className="text-xs text-[#68645E]">
                      Cadastradas automaticamente no 1º agendamento.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#EBF0E9] flex items-center justify-center text-[#6E7F6A]">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-[#8E8880] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nome ou WhatsApp..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white pl-9 pr-4 py-2 text-xs text-[#2D2D2D]"
                  />
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredAudienceClients.map((client) => (
                    <div
                      key={client.id}
                      className="rounded-2xl border border-[#E5DEC9] bg-white p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-[#2D2D2D]">{client.fullName}</h4>
                          <p className="text-xs text-[#68645E] flex items-center gap-2 mt-0.5">
                            <span>📱 {client.whatsapp}</span>
                            <span>•</span>
                            <span>✉️ {client.email}</span>
                          </p>
                        </div>
                        <span className="rounded-full bg-[#EBF0E9] text-[#6E7F6A] px-2.5 py-0.5 text-[10px] font-semibold">
                          {CATEGORY_SHORT_LABELS[client.lastCategory]}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#F4F1EA] flex items-center justify-between text-xs text-[#68645E]">
                        <span className="truncate max-w-[210px]">
                          Último: <strong className="text-[#2D2D2D]">{client.lastProcedureName}</strong>
                        </span>
                        <span>Visita: {formatDateBR(client.lastVisitAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MÓDULO E: GESTÃO DE AGENDA E DISPONIBILIDADE                        */}
        {/* =================================================================== */}
        {activeTab === 'schedule' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-[#6E7F6A] font-semibold">
                  Controle de Horários
                </span>
                <h2 className="font-serif-editorial text-3xl sm:text-4xl text-[#2D2D2D]">
                  Gestão de Agenda e Disponibilidade
                </h2>
                <p className="text-xs sm:text-sm text-[#68645E]">
                  Bloqueie horários de almoço, folgas ou férias e adicione agendamentos feitos pelo
                  WhatsApp.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setBlockForm((prev) => ({ ...prev, date: scheduleDate }));
                    setIsBlockModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#C8A29E] bg-[#F7EDEB] hover:bg-[#C8A29E] text-[#9B6B66] hover:text-white px-5 py-2.5 text-xs font-semibold transition-all"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Bloquear Horário / Folga
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManualAptForm((prev) => ({ ...prev, date: scheduleDate }));
                    setIsManualAptModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-5 py-2.5 text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Inserir Agendamento Manual
                </button>
              </div>
            </div>

            {/* Calendar Toolbar */}
            <div className="rounded-3xl bg-[#FAF9F6] border border-[#E5DEC9] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFECE4] pb-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#68645E]">
                    Data selecionada:
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2 text-xs font-semibold text-[#2D2D2D]"
                  />
                </div>

                <div className="inline-flex bg-[#F4F1EA] p-1 rounded-xl border border-[#E5DEC9]">
                  <button
                    type="button"
                    onClick={() => setScheduleViewMode('daily')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      scheduleViewMode === 'daily'
                        ? 'bg-[#8A9A86] text-white'
                        : 'text-[#68645E]'
                    }`}
                  >
                    Visão Diária Detalhada
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleViewMode('weekly')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      scheduleViewMode === 'weekly'
                        ? 'bg-[#8A9A86] text-white'
                        : 'text-[#68645E]'
                    }`}
                  >
                    Resumo Semanal (7 Dias)
                  </button>
                </div>
              </div>

              {scheduleViewMode === 'daily' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Visual Time Grid of the Day */}
                  <div className="lg:col-span-7 space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#68645E] mb-3">
                      Grade de Horários — {formatDateBR(scheduleDate)}
                    </h3>

                    {Array.from({ length: 20 }, (_, idx) => {
                      const slotMin = 9 * 60 + idx * 30;
                      const slotTime = minutesToTime(slotMin);

                      const matchingApt = db.appointments.find(
                        (a) =>
                          a.date === scheduleDate &&
                          a.status !== 'cancelled' &&
                          slotMin >= timeToMinutes(a.startTime) &&
                          slotMin < timeToMinutes(a.endTime)
                      );

                      const matchingBlock = db.scheduleBlocks.find(
                        (b) =>
                          b.date === scheduleDate &&
                          slotMin >= timeToMinutes(b.startTime) &&
                          slotMin < timeToMinutes(b.endTime)
                      );

                      return (
                        <div
                          key={slotTime}
                          className={`rounded-2xl border px-4 py-2.5 flex items-center justify-between gap-4 ${
                            matchingApt
                              ? 'bg-[#EBF0E9]/80 border-[#8A9A86]/50'
                              : matchingBlock
                              ? 'bg-[#F7EDEB]/80 border-[#C8A29E]/50'
                              : 'bg-white border-[#EFECE4]'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-[#2D2D2D] w-12">
                              {slotTime}
                            </span>
                            {matchingApt ? (
                              <div>
                                <span className="text-xs font-bold text-[#6E7F6A]">
                                  Agendado: {matchingApt.clientName}
                                </span>
                                <span className="text-xs text-[#524E48] block">
                                  {matchingApt.procedureNames.join(' + ')} ({matchingApt.startTime}{' '}
                                  às {matchingApt.endTime})
                                </span>
                              </div>
                            ) : matchingBlock ? (
                              <div>
                                <span className="text-xs font-bold text-[#A97E79]">
                                  Bloqueado: {matchingBlock.reason}
                                </span>
                                <span className="text-[11px] text-[#68645E] block">
                                  ({matchingBlock.startTime} às {matchingBlock.endTime})
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#8E8880]">Horário Livre</span>
                            )}
                          </div>

                          <div>
                            {matchingBlock ? (
                              <button
                                type="button"
                                onClick={() => removeScheduleBlock(matchingBlock.id)}
                                className="text-xs text-[#A97E79] hover:underline font-semibold"
                              >
                                Desbloquear
                              </button>
                            ) : !matchingApt ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setBlockForm({
                                    date: scheduleDate,
                                    startTime: slotTime,
                                    endTime: minutesToTime(slotMin + 60),
                                    reason: 'Horário Bloqueado pela Larissa',
                                    blockType: 'custom',
                                  });
                                  setIsBlockModalOpen(true);
                                }}
                                className="text-xs text-[#68645E] hover:text-[#2D2D2D] font-medium"
                              >
                                Bloquear faixa
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Active Blocks List */}
                  <div className="lg:col-span-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#68645E]">
                      Bloqueios Cadastrados (Almoço, Folgas e Férias)
                    </h3>

                    {db.scheduleBlocks.length === 0 ? (
                      <p className="text-xs text-[#8E8880]">Nenhum bloqueio ativo no momento.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {db.scheduleBlocks.map((blk) => (
                          <div
                            key={blk.id}
                            className="rounded-2xl border border-[#E5DEC9] bg-white p-4 flex items-center justify-between gap-3"
                          >
                            <div>
                              <span className="text-xs font-bold text-[#A97E79] block">
                                {formatDateBR(blk.date)} • {blk.startTime} às {blk.endTime}
                              </span>
                              <span className="text-sm font-medium text-[#2D2D2D]">
                                {blk.reason}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeScheduleBlock(blk.id)}
                              className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                              title="Remover bloqueio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Weekly View (7 days overview) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                  {Array.from({ length: 7 }, (_, i) => {
                    const dayIso = getOffsetDateISO(i);
                    const aptsForDay = db.appointments.filter(
                      (a) => a.date === dayIso && a.status !== 'cancelled'
                    );
                    const blocksForDay = db.scheduleBlocks.filter((b) => b.date === dayIso);

                    return (
                      <div
                        key={dayIso}
                        className="rounded-2xl border border-[#E5DEC9] bg-white p-4 space-y-3"
                      >
                        <div className="border-b border-[#F4F1EA] pb-2">
                          <span className="text-xs font-bold text-[#2D2D2D] block">
                            {formatDateBR(dayIso)}
                          </span>
                          <span className="text-[11px] text-[#6E7F6A]">
                            {aptsForDay.length} agendamento(s)
                          </span>
                        </div>

                        <div className="space-y-2">
                          {aptsForDay.map((a) => (
                            <div
                              key={a.id}
                              className="rounded-xl bg-[#EBF0E9] p-2 text-[11px] text-[#2D2D2D]"
                            >
                              <strong>{a.startTime}</strong> — {a.clientName.split(' ')[0]}
                            </div>
                          ))}
                          {blocksForDay.map((b) => (
                            <div
                              key={b.id}
                              className="rounded-xl bg-[#F7EDEB] p-2 text-[11px] text-[#A97E79]"
                            >
                              <strong>
                                {b.startTime}-{b.endTime}
                              </strong>{' '}
                              Bloqueado
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* MODAL 1: PROCEDURE CREATE / EDIT                                      */}
      {/* ===================================================================== */}
      {isProcModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#E5DEC9] shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
              <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                {editingProc ? 'Editar Procedimento' : 'Cadastrar Novo Procedimento'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProcModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#E5DEC9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProcedureForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                  Nome do Procedimento *
                </label>
                <input
                  type="text"
                  required
                  value={procForm.name}
                  onChange={(e) => setProcForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Limpeza de Pele Botânica"
                  className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm text-[#2D2D2D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Especialidade Exclusiva *
                  </label>
                  <select
                    value={procForm.category}
                    onChange={(e) =>
                      setProcForm((prev) => ({
                        ...prev,
                        category: e.target.value as SpecialtyCategory,
                      }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm text-[#2D2D2D]"
                  >
                    <option value="estetica">Estética Facial & Corporal (Cosmetologia)</option>
                    <option value="massoterapia">Massoterapia</option>
                    <option value="lash">Lash Design</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Duração (em minutos) *
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    step={15}
                    value={procForm.durationMinutes}
                    onChange={(e) =>
                      setProcForm((prev) => ({
                        ...prev,
                        durationMinutes: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm text-[#2D2D2D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                  Descrição dos Benefícios *
                </label>
                <textarea
                  rows={2}
                  required
                  value={procForm.description}
                  onChange={(e) =>
                    setProcForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#D5CFC4] bg-white p-3 text-sm text-[#2D2D2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                  Destaques / Benefícios (1 por linha)
                </label>
                <textarea
                  rows={3}
                  value={procForm.benefitsText}
                  onChange={(e) =>
                    setProcForm((prev) => ({ ...prev, benefitsText: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#D5CFC4] bg-white p-3 text-xs text-[#2D2D2D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Valor Original (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={procForm.originalPrice}
                    onChange={(e) =>
                      setProcForm((prev) => ({
                        ...prev,
                        originalPrice: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm font-bold text-[#2D2D2D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Foto Ilustrativa do Procedimento
                  </label>
                  <select
                    value={procForm.imageUrl}
                    onChange={(e) =>
                      setProcForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-xs text-[#2D2D2D]"
                  >
                    {AVAILABLE_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Promotion Toggle inside Modal */}
              <div className="rounded-2xl bg-[#F4F1EA] border border-[#E5DEC9] p-4 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-[#2D2D2D]">
                    Ativar &ldquo;Em Promoção?&rdquo; neste procedimento
                  </span>
                  <input
                    type="checkbox"
                    checked={procForm.onPromo}
                    onChange={(e) =>
                      setProcForm((prev) => ({ ...prev, onPromo: e.target.checked }))
                    }
                    className="w-4 h-4 accent-[#8A9A86]"
                  />
                </label>

                {procForm.onPromo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5DEC9]">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-[#68645E] mb-1">
                        Valor Promocional (R$)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={procForm.promoPrice}
                        onChange={(e) =>
                          setProcForm((prev) => ({
                            ...prev,
                            promoPrice: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs font-bold text-[#6E7F6A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-[#68645E] mb-1">
                        Data de Validade da Oferta
                      </label>
                      <input
                        type="date"
                        value={procForm.promoValidUntil}
                        onChange={(e) =>
                          setProcForm((prev) => ({
                            ...prev,
                            promoValidUntil: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs text-[#2D2D2D]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => setIsProcModalOpen(false)}
                  className="rounded-full border border-[#D5CFC4] px-5 py-2.5 text-xs font-medium text-[#68645E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-6 py-2.5 text-xs font-semibold"
                >
                  Salvar Procedimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: MANUAL FINANCIAL TRANSACTION                                 */}
      {/* ===================================================================== */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#E5DEC9] shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
              <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                Lançar Receita ou Despesa Manual
              </h3>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#E5DEC9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTxForm((prev) => ({ ...prev, type: 'expense' }))}
                  className={`py-2.5 rounded-xl text-xs font-semibold border ${
                    txForm.type === 'expense'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-[#68645E] border-[#D5CFC4]'
                  }`}
                >
                  Despesa (Compra de Insumos)
                </button>
                <button
                  type="button"
                  onClick={() => setTxForm((prev) => ({ ...prev, type: 'income' }))}
                  className={`py-2.5 rounded-xl text-xs font-semibold border ${
                    txForm.type === 'income'
                      ? 'bg-[#6E7F6A] text-white border-[#6E7F6A]'
                      : 'bg-white text-[#68645E] border-[#D5CFC4]'
                  }`}
                >
                  Receita Extra
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de fios de seda Lash e adesivo"
                  value={txForm.description}
                  onChange={(e) =>
                    setTxForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm text-[#2D2D2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={txForm.amount}
                    onChange={(e) =>
                      setTxForm((prev) => ({ ...prev, amount: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm font-bold text-[#2D2D2D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-xs text-[#2D2D2D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="rounded-full border border-[#D5CFC4] px-5 py-2 text-xs font-medium text-[#68645E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-6 py-2 text-xs font-semibold"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: SCHEDULE BLOCK (LUNCH / DAY OFF / VACATION)                  */}
      {/* ===================================================================== */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#E5DEC9] shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
              <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                Bloquear Horário na Agenda
              </h3>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#E5DEC9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlockForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                  Motivo do Bloqueio *
                </label>
                <input
                  type="text"
                  required
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ex: Horário de Almoço, Folga, Curso..."
                  className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm text-[#2D2D2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={blockForm.date}
                  onChange={(e) => setBlockForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm text-[#2D2D2D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={blockForm.startTime}
                    onChange={(e) =>
                      setBlockForm((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm text-[#2D2D2D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Término *
                  </label>
                  <input
                    type="time"
                    required
                    value={blockForm.endTime}
                    onChange={(e) =>
                      setBlockForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2.5 text-sm text-[#2D2D2D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="rounded-full border border-[#D5CFC4] px-5 py-2 text-xs font-medium text-[#68645E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#A97E79] hover:bg-[#8F6560] text-white px-6 py-2 text-xs font-semibold"
                >
                  Bloquear Horário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: MANUAL APPOINTMENT INSERTION (FROM WHATSAPP)                 */}
      {/* ===================================================================== */}
      {isManualAptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF9F6] rounded-3xl border border-[#E5DEC9] shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
              <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                Inserir Agendamento Manual (WhatsApp)
              </h3>
              <button
                type="button"
                onClick={() => setIsManualAptModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#E5DEC9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAppointment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                  Nome da Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carolina Mendes"
                  value={manualAptForm.clientName}
                  onChange={(e) =>
                    setManualAptForm((prev) => ({ ...prev, clientName: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2 text-sm text-[#2D2D2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                  WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 5511988776655"
                  value={manualAptForm.clientWhatsapp}
                  onChange={(e) =>
                    setManualAptForm((prev) => ({ ...prev, clientWhatsapp: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2 text-sm text-[#2D2D2D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                  Procedimento *
                </label>
                <select
                  value={manualAptForm.procedureId}
                  onChange={(e) =>
                    setManualAptForm((prev) => ({ ...prev, procedureId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3.5 py-2 text-xs text-[#2D2D2D]"
                >
                  {db.procedures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrencyBRL(getEffectivePrice(p))})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualAptForm.date}
                    onChange={(e) =>
                      setManualAptForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs text-[#2D2D2D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={manualAptForm.startTime}
                    onChange={(e) =>
                      setManualAptForm((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs text-[#2D2D2D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Meio de Pagamento
                  </label>
                  <select
                    value={manualAptForm.paymentMethod}
                    onChange={(e) =>
                      setManualAptForm((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value as PaymentMethodType,
                      }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs text-[#2D2D2D]"
                  >
                    <option value="pix">Pix</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="cash_in_person">Dinheiro / Presencial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-[#68645E] mb-1">
                    Status do Pagamento
                  </label>
                  <select
                    value={manualAptForm.paymentStatus}
                    onChange={(e) =>
                      setManualAptForm((prev) => ({
                        ...prev,
                        paymentStatus: e.target.value as 'paid' | 'pending',
                      }))
                    }
                    className="w-full rounded-xl border border-[#D5CFC4] bg-white px-3 py-2 text-xs text-[#2D2D2D]"
                  >
                    <option value="pending">Pagar na hora (Pendente)</option>
                    <option value="paid">Já Pago Antecipado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => setIsManualAptModalOpen(false)}
                  className="rounded-full border border-[#D5CFC4] px-5 py-2 text-xs font-medium text-[#68645E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-6 py-2 text-xs font-semibold"
                >
                  Salvar na Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
