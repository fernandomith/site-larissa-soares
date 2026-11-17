'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Lock,
  Sparkles,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Camera,
  MessageCircle,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Award,
  ArrowUpRight,
  Menu,
  X,
  Navigation,
  Users,
  Flower2,
  Eye,
} from 'lucide-react';
import { useClinic, formatCurrencyBRL, formatDateBR } from '@/lib/store';
import { CATEGORY_LABELS, SpecialtyCategory } from '@/lib/types';
import BookingSection from '@/components/BookingSection';

export default function HomePage() {
  const { db, getEffectivePrice, isPromoValid } = useClinic();
  const [selectedCategory, setSelectedCategory] = useState<'all' | SpecialtyCategory>('all');
  const [preselectedBookingIds, setPreselectedBookingIds] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeProcedures = useMemo(
    () => db.procedures.filter((p) => p.active),
    [db.procedures]
  );

  const visibleProcedures = useMemo(() => {
    if (selectedCategory === 'all') return activeProcedures;
    return activeProcedures.filter((p) => p.category === selectedCategory);
  }, [activeProcedures, selectedCategory]);

  const handleBookProcedure = (procedureId: string) => {
    setPreselectedBookingIds([procedureId]);
    const el = document.getElementById('agendamento');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whatsappDirectUrl = `https://wa.me/${db.settings.whatsappNumber.replace(
    /\D/g,
    ''
  )}?text=${encodeURIComponent(
    'Olá Larissa! Gostaria de tirar uma dúvida sobre os procedimentos e horários disponíveis.'
  )}`;

  return (
    <div id="inicio" className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#2D2D2D]">
      {/* 1. CABEÇALHO (HEADER) LIMPO */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E8E2D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <a href="#inicio" className="group flex flex-col">
            <span className="font-serif-editorial text-2xl sm:text-[28px] font-medium tracking-wide text-[#2D2D2D] leading-none">
              Estética Larissa Soares
            </span>
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#6E7F6A] mt-1 font-medium">
              Estética & Cosmetologia • Massoterapia • Lash Design
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#524E48]">
            <a href="#inicio" className="hover:text-[#6E7F6A] transition-colors">
              Início
            </a>
            <a href="#procedimentos" className="hover:text-[#6E7F6A] transition-colors">
              Procedimentos
            </a>
            <a href="#sobre-mim" className="hover:text-[#6E7F6A] transition-colors">
              Sobre Mim
            </a>
            <a href="#comunidade-vip" className="hover:text-[#6E7F6A] transition-colors">
              Comunidade VIP
            </a>
            <a href="#contato" className="hover:text-[#6E7F6A] transition-colors">
              Contato
            </a>
          </nav>

          {/* Header Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#agendamento"
              id="header-cta-agendar"
              className="inline-flex items-center gap-2 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              Agendar Horário
            </a>
            <Link
              href="/admin"
              id="header-admin-lock"
              title="Área Restrita — Acesso exclusivo Larissa Soares"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E2DBD0] bg-[#F4F1EA]/80 hover:bg-[#EBE5D9] hover:border-[#D4AF37]/50 text-[#68645E] hover:text-[#2D2D2D] px-3.5 py-2 text-xs font-medium transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden md:inline">Área Restrita</span>
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/admin"
              className="p-2 rounded-full border border-[#E2DBD0] bg-[#F4F1EA] text-[#68645E]"
              aria-label="Área Restrita"
            >
              <Lock className="w-4 h-4 text-[#D4AF37]" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl border border-[#E2DBD0] text-[#2D2D2D]"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FAF9F6] border-b border-[#E8E2D5] px-4 pt-3 pb-6 space-y-3">
            <div className="flex flex-col space-y-2.5 text-sm font-medium text-[#2D2D2D]">
              <a
                href="#inicio"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#6E7F6A]"
              >
                Início
              </a>
              <a
                href="#procedimentos"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#6E7F6A]"
              >
                Procedimentos
              </a>
              <a
                href="#sobre-mim"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#6E7F6A]"
              >
                Sobre Mim
              </a>
              <a
                href="#comunidade-vip"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#6E7F6A]"
              >
                Comunidade VIP
              </a>
              <a
                href="#contato"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#6E7F6A]"
              >
                Contato
              </a>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="#agendamento"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#8A9A86] text-white py-3 text-sm font-semibold"
              >
                <Calendar className="w-4 h-4" />
                Agendar Horário Online
              </a>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#E2DBD0] bg-[#F4F1EA] text-[#68645E] py-2.5 text-xs font-medium"
              >
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                Área Restrita (Proprietária)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION (BANNER PRINCIPAL) */}
      <section className="relative overflow-hidden bg-luxury-texture pt-10 pb-20 sm:py-24 border-b border-[#EBE5D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left Editorial Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 border-b border-[#D4AF37]/50 pb-1.5">
                <span className="text-xs uppercase tracking-[0.22em] text-[#6E7F6A] font-semibold">
                  Atendimento Exclusivo & Individualizado
                </span>
              </div>

              <h1 className="font-serif-editorial text-4xl sm:text-5xl lg:text-[58px] text-[#2D2D2D] font-normal leading-[1.08] tracking-tight">
                Autocuidado sereno que realça a sua{' '}
                <span className="italic font-medium text-[#A97E79]">beleza natural</span>.
              </h1>

              <p className="text-base sm:text-lg text-[#5C5852] leading-relaxed max-w-2xl">
                Um refúgio acolhedor sob o cuidado integral de{' '}
                <strong className="font-semibold text-[#2D2D2D]">Larissa Soares</strong> — com
                formação e atuação dedicada exclusivamente em{' '}
                <span className="text-[#2D2D2D] font-medium">
                  Estética & Cosmetologia, Massoterapia e Lash Design
                </span>
                .
              </p>

              {/* CTA Group */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <a
                  href="#agendamento"
                  id="hero-cta-agendar"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-8 py-4 text-sm sm:text-base font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <Calendar className="w-4 h-4" />
                  Agendar Horário
                </a>
                <a
                  href="#procedimentos"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D6CFC2] bg-[#FAF9F6] hover:border-[#C8A29E] hover:bg-[#F7EDEB]/40 text-[#2D2D2D] px-7 py-4 text-sm sm:text-base font-medium transition-all"
                >
                  Conhecer Procedimentos
                </a>
              </div>

              {/* 3 Exclusive Pillars Highlight */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#E6DFD3]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EBF0E9] border border-[#8A9A86]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Flower2 className="w-4 h-4 text-[#6E7F6A]" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2D2D]">
                      Estética & Cosmetologia
                    </h2>
                    <p className="text-xs text-[#68645E] mt-0.5">
                      Protocolos faciais e corporais não invasivos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F7EDEB] border border-[#C8A29E]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Heart className="w-4 h-4 text-[#A97E79]" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2D2D]">
                      Massoterapia
                    </h2>
                    <p className="text-xs text-[#68645E] mt-0.5">
                      Drenagem linfática e relaxamento profundo
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F7F1DF] border border-[#D4AF37]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Eye className="w-4 h-4 text-[#B38F22]" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2D2D]">
                      Lash Design
                    </h2>
                    <p className="text-xs text-[#68645E] mt-0.5">
                      Extensão fio a fio e Lash Lifting saudável
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-[32px] overflow-hidden border border-[#E2DBD0] shadow-xl bg-[#F4F1EA]">
                <img
                  src="/images/hero-sanctuary.jpg"
                  alt="Ambiente acolhedor e minimalista da clínica Estética Larissa Soares"
                  className="w-full h-[380px] sm:h-[460px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D2D2D]/45 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-[#FAF9F6]/95 backdrop-blur-md p-4 border border-[#D4AF37]/40 shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E7F6A] font-semibold">
                        Cabine Exclusiva • Hora Marcada
                      </p>
                      <p className="font-serif-editorial text-lg text-[#2D2D2D] font-medium">
                        Você é atendida do início ao fim pela Larissa Soares
                      </p>
                    </div>
                    <span className="w-10 h-10 rounded-full bg-[#EBF0E9] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-[#6E7F6A]" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATÁLOGO DE PROCEDIMENTOS (DINÂMICO) */}
      <section id="procedimentos" className="py-20 sm:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs uppercase tracking-[0.22em] text-[#A97E79] font-semibold block mb-2">
                Menu de Protocolos Exclusivos
              </span>
              <h2 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl text-[#2D2D2D] font-normal">
                Catálogo de Procedimentos
              </h2>
              <p className="text-sm sm:text-base text-[#68645E] mt-2 max-w-xl">
                Protocolos desenvolvidos exclusivamente dentro das três áreas de atuação de Larissa
                Soares, priorizando saúde, naturalidade e bem-estar.
              </p>
            </div>

            {/* Exclusive 3 Specialty Filter Tabs */}
            <div
              className="flex flex-wrap gap-2 bg-[#F4F1EA] p-1.5 rounded-2xl border border-[#E5DEC9]"
              role="tablist"
              aria-label="Filtro de especialidades"
            >
              {(
                [
                  { id: 'all', label: 'Todas as Áreas' },
                  { id: 'estetica', label: 'Estética Facial & Corporal' },
                  { id: 'massoterapia', label: 'Massoterapia' },
                  { id: 'lash', label: 'Lash Design' },
                ] as const
              ).map((tab) => {
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#8A9A86] text-white shadow-xs font-semibold'
                        : 'text-[#5C5852] hover:text-[#2D2D2D] hover:bg-[#FAF9F6]/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Procedures Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {visibleProcedures.map((proc) => {
              const hasPromo = isPromoValid(proc);
              const finalPrice = getEffectivePrice(proc);

              return (
                <article
                  key={proc.id}
                  className="group rounded-3xl bg-white border border-[#E6DFD3] hover:border-[#C8A29E] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Card Image + Badges */}
                  <div className="relative h-56 overflow-hidden bg-[#F4F1EA]">
                    <img
                      src={proc.imageUrl}
                      alt={proc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#FAF9F6]/95 backdrop-blur-xs border border-[#E5DEC9] px-3 py-1 text-[11px] font-semibold text-[#2D2D2D]">
                        {CATEGORY_LABELS[proc.category]}
                      </span>
                    </div>

                    {hasPromo && (
                      <div className="absolute top-3.5 right-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A29E] text-white px-3 py-1 text-xs font-semibold shadow-md">
                          <Sparkles className="w-3 h-3" />
                          Promoção
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3 rounded-full bg-[#2D2D2D]/80 backdrop-blur-xs text-[#FAF9F6] px-3 py-1 text-xs font-medium inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {proc.durationMinutes} min
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-3">
                      <h3 className="font-serif-editorial text-2xl text-[#2D2D2D] font-medium leading-snug">
                        {proc.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#68645E] leading-relaxed">
                        {proc.description}
                      </p>

                      {proc.benefits && proc.benefits.length > 0 && (
                        <ul className="space-y-1.5 pt-1">
                          {proc.benefits.map((b, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-[#524E48]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#8A9A86] shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Price + CTA */}
                    <div className="pt-4 border-t border-[#F0ECE1] space-y-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-[#8E8880] block">
                            Investimento
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            {hasPromo && (
                              <span className="text-sm text-[#9E9890] line-through">
                                {formatCurrencyBRL(proc.originalPrice)}
                              </span>
                            )}
                            <span className="text-2xl font-bold text-[#2D2D2D]">
                              {formatCurrencyBRL(finalPrice)}
                            </span>
                          </div>
                        </div>

                        {hasPromo && proc.promoValidUntil && (
                          <span className="text-[11px] text-[#A97E79] font-medium bg-[#F7EDEB] px-2.5 py-1 rounded-lg">
                            Oferta até {formatDateBR(proc.promoValidUntil)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookProcedure(proc.id)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#FAF9F6] hover:bg-[#8A9A86] text-[#2D2D2D] hover:text-white border border-[#D5CFC4] hover:border-[#8A9A86] py-3 px-5 text-xs sm:text-sm font-semibold transition-all"
                      >
                        <Calendar className="w-4 h-4" />
                        Agendar este procedimento
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SOBRE A ESPECIALISTA */}
      <section
        id="sobre-mim"
        className="py-20 sm:py-24 bg-[#F4F1EA] border-t border-[#E6DFD3] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Specialist Portrait */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                <div className="rounded-[32px] overflow-hidden border-2 border-[#D4AF37]/40 shadow-lg bg-[#FAF9F6]">
                  <img
                    src="/images/larissa-portrait.jpg"
                    alt="Larissa Soares — Esteticista e Cosmetóloga, Massoterapeuta e Lash Designer"
                    className="w-full h-[460px] object-cover object-top"
                  />
                </div>
                <div className="mt-4 rounded-2xl bg-[#FAF9F6] border border-[#E5DEC9] p-4 flex items-center gap-3.5 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#F7F1DF] border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-[#B38F22]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#2D2D2D]">
                      {db.settings.professionalName}
                    </p>
                    <p className="text-[11px] text-[#68645E]">
                      {db.settings.crbmOrRegister}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Specialist Bio & Credentials */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#6E7F6A] font-semibold">
                Conheça a Especialista
              </span>

              <h2 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl text-[#2D2D2D] font-normal leading-tight">
                Cuidado artesanal, técnico e individualizado por{' '}
                <span className="italic text-[#A97E79]">Larissa Soares</span>
              </h2>

              <p className="text-sm sm:text-base text-[#5C5852] leading-relaxed">
                Acredito que a verdadeira estética vai muito além de padrões artificiais: ela nasce
                do equilíbrio entre uma pele saudável, um corpo livre de tensões e um olhar que
                expressa sua essência com leveza.
              </p>

              <p className="text-sm sm:text-base text-[#5C5852] leading-relaxed">
                Em meu espaço, sou a única profissional atuante. Isso significa que cada avaliação,
                cada escolha de ativo cosmético, cada manobra de massoterapia e cada mapeamento de
                cílios é realizado pessoalmente por mim, no seu tempo e sem pressa.
              </p>

              {/* 3 Qualification Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5DEC9] p-4">
                  <span className="text-[11px] uppercase tracking-wider text-[#6E7F6A] font-bold">
                    Formação 01
                  </span>
                  <h3 className="font-serif-editorial text-xl text-[#2D2D2D] font-semibold mt-1">
                    Esteticista & Cosmetóloga
                  </h3>
                  <p className="text-xs text-[#68645E] mt-1.5 leading-relaxed">
                    Análise bioquímica da pele e formulações botânicas seguras para resultados
                    reais e duradouros.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5DEC9] p-4">
                  <span className="text-[11px] uppercase tracking-wider text-[#A97E79] font-bold">
                    Formação 02
                  </span>
                  <h3 className="font-serif-editorial text-xl text-[#2D2D2D] font-semibold mt-1">
                    Massoterapeuta
                  </h3>
                  <p className="text-xs text-[#68645E] mt-1.5 leading-relaxed">
                    Domínio anatômico em drenagem linfática manual e liberação miofascial
                    relaxante.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5DEC9] p-4">
                  <span className="text-[11px] uppercase tracking-wider text-[#B38F22] font-bold">
                    Formação 03
                  </span>
                  <h3 className="font-serif-editorial text-xl text-[#2D2D2D] font-semibold mt-1">
                    Lash Designer
                  </h3>
                  <p className="text-xs text-[#68645E] mt-1.5 leading-relaxed">
                    Visagismo do olhar com isolamento técnico impecável que preserva 100% a saúde
                    dos fios naturais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMUNIDADE VIP & REDES SOCIAIS */}
      <section id="comunidade-vip" className="py-20 sm:py-24 bg-[#FAF9F6] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[36px] bg-gradient-to-br from-[#EBF0E9] via-[#FAF9F6] to-[#F7EDEB] border border-[#D4AF37]/40 p-8 sm:p-12 lg:p-14 shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 border border-[#D4AF37]/40 px-3.5 py-1 text-xs font-semibold text-[#6E7F6A]">
                  <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Clube Exclusivo de Clientes
                </div>

                <h2 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl text-[#2D2D2D] font-normal leading-tight">
                  Faça parte do nosso{' '}
                  <span className="italic font-medium text-[#6E7F6A]">Grupo VIP no WhatsApp</span>
                </h2>

                <p className="text-sm sm:text-base text-[#5C5852] leading-relaxed max-w-xl">
                  Um canal silencioso, acolhedor e sem spam onde a Larissa compartilha em primeira
                  mão oportunidades especiais para quem ama se cuidar:
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[#2D2D2D]">
                  <li className="flex items-center gap-2.5 bg-white/80 rounded-xl p-3 border border-[#E5DEC9]">
                    <CheckCircle2 className="w-4 h-4 text-[#6E7F6A] shrink-0" />
                    <span>Avisos de horários vagos de última hora</span>
                  </li>
                  <li className="flex items-center gap-2.5 bg-white/80 rounded-xl p-3 border border-[#E5DEC9]">
                    <CheckCircle2 className="w-4 h-4 text-[#6E7F6A] shrink-0" />
                    <span>Condições e mimos exclusivos para membros</span>
                  </li>
                  <li className="flex items-center gap-2.5 bg-white/80 rounded-xl p-3 border border-[#E5DEC9]">
                    <CheckCircle2 className="w-4 h-4 text-[#6E7F6A] shrink-0" />
                    <span>Dicas práticas de skincare e rotina em casa</span>
                  </li>
                  <li className="flex items-center gap-2.5 bg-white/80 rounded-xl p-3 border border-[#E5DEC9]">
                    <CheckCircle2 className="w-4 h-4 text-[#6E7F6A] shrink-0" />
                    <span>Cuidados pós-Lash e automassagem facial</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <a
                    href={db.settings.vipGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="vip-whatsapp-btn"
                    className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#6E7F6A] hover:bg-[#5B6B57] text-white px-8 py-4 text-sm sm:text-base font-semibold transition-all shadow-md"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Entrar no Grupo VIP do WhatsApp
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Social Channels Card */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl bg-white/95 border border-[#E5DEC9] p-6 sm:p-8 space-y-5 shadow-xs">
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] text-[#A97E79] font-semibold">
                      Canais Oficiais
                    </span>
                    <h3 className="font-serif-editorial text-2xl text-[#2D2D2D] mt-1">
                      Acompanhe resultados reais e rotina no espaço
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <a
                      href={db.settings.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl border border-[#E5DEC9] hover:border-[#C8A29E] bg-[#FAF9F6] transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#F7EDEB] flex items-center justify-center text-[#A97E79]">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#2D2D2D]">Instagram Oficial</p>
                          <p className="text-xs text-[#68645E]">@esteticalarissasoares</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#8E8880] group-hover:text-[#2D2D2D]" />
                    </a>

                    <a
                      href={db.settings.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl border border-[#E5DEC9] hover:border-[#C8A29E] bg-[#FAF9F6] transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#F7F1DF] flex items-center justify-center text-[#B38F22]">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#2D2D2D]">TikTok & Reels</p>
                          <p className="text-xs text-[#68645E]">Bastidores, ASMR Spa & Dicas</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#8E8880] group-hover:text-[#2D2D2D]" />
                    </a>

                    <a
                      href={whatsappDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl border border-[#E5DEC9] hover:border-[#8A9A86] bg-[#FAF9F6] transition-all group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#EBF0E9] flex items-center justify-center text-[#6E7F6A]">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#2D2D2D]">
                            WhatsApp Direto da Larissa
                          </p>
                          <p className="text-xs text-[#68645E]">Atendimento e dúvidas</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#8E8880] group-hover:text-[#2D2D2D]" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SISTEMA DE AGENDAMENTO ONLINE (FLUXO DE 4 PASSOS) */}
      <BookingSection
        preselectedProcedureIds={preselectedBookingIds}
        onClearPreselected={() => setPreselectedBookingIds([])}
      />

      {/* 7. RODAPÉ (FOOTER) */}
      <footer id="contato" className="bg-[#2D2D2D] text-[#FAF9F6] pt-16 pb-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-4">
              <span className="font-serif-editorial text-3xl text-[#FAF9F6] block">
                {db.settings.clinicName}
              </span>
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                {db.settings.professionalTitle}
              </p>
              <p className="text-sm text-[#C8C3B9] leading-relaxed">
                Espaço dedicado exclusivamente à Estética Facial & Corporal, Massoterapia e Lash
                Design, com biossegurança rigorosa e atendimento individualizado.
              </p>
            </div>

            {/* Location & Maps/Waze Links */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                Localização & Horário de Atendimento
              </h3>
              <div className="flex items-start gap-3 text-sm text-[#E5E0D8]">
                <MapPin className="w-4 h-4 text-[#C8A29E] shrink-0 mt-1" />
                <span>{db.settings.addressLine}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-[#E5E0D8]">
                <Clock className="w-4 h-4 text-[#8A9A86] shrink-0 mt-1" />
                <span>{db.settings.openingHoursText}</span>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={db.settings.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF9F6] px-4 py-2 text-xs font-medium transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Abrir no Google Maps
                </a>
                <a
                  href={db.settings.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF9F6] px-4 py-2 text-xs font-medium transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#8A9A86]" />
                  Como chegar pelo Waze
                </a>
              </div>
            </div>

            {/* Quick Links & Admin Access */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                Navegação Rápida
              </h3>
              <ul className="space-y-2 text-sm text-[#C8C3B9]">
                <li>
                  <a href="#procedimentos" className="hover:text-white transition-colors">
                    Catálogo de Procedimentos
                  </a>
                </li>
                <li>
                  <a href="#sobre-mim" className="hover:text-white transition-colors">
                    Sobre Larissa Soares
                  </a>
                </li>
                <li>
                  <a href="#comunidade-vip" className="hover:text-white transition-colors">
                    Comunidade VIP WhatsApp
                  </a>
                </li>
                <li>
                  <a href="#agendamento" className="hover:text-white transition-colors">
                    Agendamento Online
                  </a>
                </li>
              </ul>

              <div className="pt-3">
                <Link
                  href="/admin"
                  id="footer-admin-login-link"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs text-[#E5E0D8] transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Acesso Administrativo (Larissa)
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9E9890]">
            <p>
              © {new Date().getFullYear()} {db.settings.clinicName}. Todos os direitos reservados.
            </p>
            <p>
              Atuação exclusiva: Estética & Cosmetologia • Massoterapia • Lash Design
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
