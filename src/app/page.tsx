'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Lock,
  Clock,
  MapPin,
  Phone,
  Camera,
  MessageCircle,
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Navigation,
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
    'Olá Larissa! Gostaria de agendar uma avaliação ou tirar uma dúvida sobre os procedimentos.'
  )}`;

  return (
    <div id="inicio" className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#2D2D2D]">
      {/* 1. CABEÇALHO (HEADER) EDITORIAL LIMPO */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E6DFD2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-24 flex items-center justify-between gap-6">
          {/* Editorial Monogram & Logotype */}
          <a href="#inicio" className="group flex flex-col">
            <span className="font-serif-editorial text-2xl sm:text-[32px] font-light tracking-[0.04em] text-[#2D2D2D] leading-none">
              Larissa Soares
            </span>
            <span className="text-[9px] uppercase tracking-[0.34em] text-[#8A9A86] mt-1.5 font-medium">
              Estética • Massoterapia • Lash Design
            </span>
          </a>

          {/* Minimalist Editorial Navigation */}
          <nav className="hidden lg:flex items-center gap-9 text-[11px] uppercase tracking-[0.22em] font-medium text-[#5C5852]">
            <a href="#inicio" className="hover:text-[#2D2D2D] transition-colors">
              Início
            </a>
            <a href="#procedimentos" className="hover:text-[#2D2D2D] transition-colors">
              Protocolos
            </a>
            <a href="#sobre-mim" className="hover:text-[#2D2D2D] transition-colors">
              A Especialista
            </a>
            <a href="#comunidade-vip" className="hover:text-[#2D2D2D] transition-colors">
              Privé VIP
            </a>
            <a href="#contato" className="hover:text-[#2D2D2D] transition-colors">
              Atelier
            </a>
          </nav>

          {/* Header Actions */}
          <div className="hidden sm:flex items-center gap-4">
            <a
              href="#agendamento"
              id="header-cta-agendar"
              className="inline-flex items-center gap-2.5 bg-[#2D2D2D] hover:bg-[#8A9A86] text-[#FAF9F6] px-6 py-3 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors"
            >
              Agendar Horário
            </a>
            <Link
              href="/admin"
              id="header-admin-lock"
              title="Área Restrita — Acesso exclusivo Larissa Soares"
              className="inline-flex items-center gap-2 border border-[#DFD8CA] hover:border-[#D4AF37] text-[#68645E] hover:text-[#2D2D2D] px-3.5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-colors"
            >
              <Lock className="w-3 h-3 text-[#D4AF37] stroke-[1.5]" />
              <span className="hidden xl:inline">Área Restrita</span>
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2.5 sm:hidden">
            <Link
              href="/admin"
              className="p-2.5 border border-[#DFD8CA] text-[#68645E]"
              aria-label="Área Restrita"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2.5 border border-[#DFD8CA] text-[#2D2D2D]"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FAF9F6] border-b border-[#E6DFD2] px-6 py-8 space-y-6">
            <div className="flex flex-col space-y-4 text-xs uppercase tracking-[0.24em] text-[#2D2D2D]">
              <a href="#inicio" onClick={() => setMobileMenuOpen(false)}>
                Início
              </a>
              <a href="#procedimentos" onClick={() => setMobileMenuOpen(false)}>
                Protocolos
              </a>
              <a href="#sobre-mim" onClick={() => setMobileMenuOpen(false)}>
                A Especialista
              </a>
              <a href="#comunidade-vip" onClick={() => setMobileMenuOpen(false)}>
                Privé VIP
              </a>
              <a href="#contato" onClick={() => setMobileMenuOpen(false)}>
                Atelier & Contato
              </a>
            </div>
            <div className="pt-4 border-t border-[#E6DFD2] flex flex-col gap-3">
              <a
                href="#agendamento"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-[#2D2D2D] text-[#FAF9F6] py-3.5 text-xs uppercase tracking-[0.22em]"
              >
                Agendar Horário
              </a>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center border border-[#DFD8CA] text-[#68645E] py-3 text-[11px] uppercase tracking-[0.2em]"
              >
                Área Restrita (Proprietária)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION — VOGUE / KINFOLK EDITORIAL */}
      <section className="relative pt-14 pb-28 sm:py-32 border-b border-[#E6DFD2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Editorial Copy Column */}
            <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center gap-4">
                <span className="w-10 h-[1px] bg-[#D4AF37]" />
                <span className="text-[11px] uppercase tracking-[0.32em] text-[#8A9A86] font-medium">
                  Atelier de Estética & Bem-Estar
                </span>
              </div>

              <h1 className="font-serif-editorial text-5xl sm:text-6xl lg:text-[72px] text-[#2D2D2D] font-light leading-[1.03] tracking-[-0.01em]">
                A arte do autocuidado em sua forma mais{' '}
                <span className="italic text-[#C8A29E] font-normal">serena e natural</span>.
              </h1>

              <p className="text-base sm:text-lg text-[#5C5852] font-light leading-relaxed max-w-xl">
                Um espaço intimista conduzido integralmente por{' '}
                <span className="text-[#2D2D2D] font-normal">Larissa Soares</span>, com atuação
                exclusiva nas três vertentes do cuidado feminino:{' '}
                <span className="text-[#2D2D2D] font-normal">
                  Estética & Cosmetologia, Massoterapia e Lash Design
                </span>
                .
              </p>

              {/* Editorial CTA Group */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
                <a
                  href="#agendamento"
                  id="hero-cta-agendar"
                  className="inline-flex items-center justify-center gap-4 bg-[#8A9A86] hover:bg-[#6E7F6A] text-white px-9 py-4.5 text-xs uppercase tracking-[0.24em] font-medium transition-all"
                >
                  <span>Agendar Horário</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                </a>
                <a
                  href="#procedimentos"
                  className="inline-flex items-center justify-center gap-3 border-b border-[#2D2D2D] hover:border-[#C8A29E] text-[#2D2D2D] hover:text-[#A97E79] py-3 px-2 text-xs uppercase tracking-[0.24em] font-medium transition-colors"
                >
                  Explorar Catálogo de Protocolos
                </a>
              </div>

              {/* Roman Numeral Pillars */}
              <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 border-t border-[#E6DFD2]">
                <div>
                  <span className="font-serif-editorial italic text-lg text-[#D4AF37] block">
                    I.
                  </span>
                  <h2 className="text-xs uppercase tracking-[0.2em] text-[#2D2D2D] font-semibold mt-1">
                    Estética & Cosmetologia
                  </h2>
                  <p className="text-xs text-[#68645E] font-light mt-1.5 leading-relaxed">
                    Protocolos botânicos faciais e corporais não invasivos para saúde e viço da
                    pele.
                  </p>
                </div>

                <div>
                  <span className="font-serif-editorial italic text-lg text-[#D4AF37] block">
                    II.
                  </span>
                  <h2 className="text-xs uppercase tracking-[0.2em] text-[#2D2D2D] font-semibold mt-1">
                    Massoterapia
                  </h2>
                  <p className="text-xs text-[#68645E] font-light mt-1.5 leading-relaxed">
                    Drenagem linfática precisa e terapias manuais de descompressão muscular.
                  </p>
                </div>

                <div>
                  <span className="font-serif-editorial italic text-lg text-[#D4AF37] block">
                    III.
                  </span>
                  <h2 className="text-xs uppercase tracking-[0.2em] text-[#2D2D2D] font-semibold mt-1">
                    Lash Design
                  </h2>
                  <p className="text-xs text-[#68645E] font-light mt-1.5 leading-relaxed">
                    Visagismo do olhar com extensão fio a fio de seda e Lash Lifting nutritivo.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Architectural Arch Image */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                {/* Subtle Offset Gold Frame */}
                <div className="absolute -inset-3 rounded-t-[240px] border border-[#D4AF37]/40 pointer-events-none" />
                <div className="relative rounded-t-[230px] overflow-hidden bg-[#F4F1EA] shadow-[0_30px_70px_-20px_rgba(45,45,45,0.15)]">
                  <img
                    src="/images/hero-sanctuary.jpg"
                    alt="Interior minimalista do Atelier Estética Larissa Soares"
                    className="w-full h-[500px] sm:h-[560px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2D2D2D]/50 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-[#FAF9F6] border-t border-white/25 pt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
                        Atendimento Individualizado
                      </p>
                      <p className="font-serif-editorial italic text-xl mt-0.5">
                        Cabine privativa com hora marcada
                      </p>
                    </div>
                    <span className="font-serif-editorial text-xs tracking-[0.2em] uppercase opacity-80">
                      SP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATÁLOGO DE PROCEDIMENTOS (EDITORIAL GALLERY) */}
      <section id="procedimentos" className="py-28 sm:py-36 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Editorial Header + Minimal Filter Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20 border-b border-[#E6DFD2] pb-10">
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#A97E79] font-medium mb-3">
                Curadoria de Tratamentos
              </p>
              <h2 className="font-serif-editorial text-4xl sm:text-5xl lg:text-[56px] text-[#2D2D2D] font-light leading-[1.06]">
                Menu de <span className="italic text-[#8A9A86]">Protocolos</span>
              </h2>
            </div>

            {/* Delicate Underline Filter Tabs */}
            <div
              className="flex flex-wrap gap-6 sm:gap-8"
              role="tablist"
              aria-label="Especialidades"
            >
              {(
                [
                  { id: 'all', label: 'Todos os Protocolos' },
                  { id: 'estetica', label: 'I. Estética Facial & Corporal' },
                  { id: 'massoterapia', label: 'II. Massoterapia' },
                  { id: 'lash', label: 'III. Lash Design' },
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
                    className={`pb-2 text-xs uppercase tracking-[0.2em] transition-all border-b-2 ${
                      isActive
                        ? 'border-[#2D2D2D] text-[#2D2D2D] font-semibold'
                        : 'border-transparent text-[#8E8880] hover:text-[#2D2D2D]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editorial Procedure Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-9 gap-y-16">
            {visibleProcedures.map((proc) => {
              const hasPromo = isPromoValid(proc);
              const finalPrice = getEffectivePrice(proc);

              return (
                <article key={proc.id} className="group flex flex-col justify-between">
                  <div>
                    {/* Tall Editorial Image Container */}
                    <div className="relative h-80 overflow-hidden bg-[#F4F1EA] mb-6">
                      <img
                        src={proc.imageUrl}
                        alt={proc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />

                      {/* Category Tag */}
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#FAF9F6]/95 backdrop-blur-xs px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[#2D2D2D] font-medium">
                          {CATEGORY_LABELS[proc.category]}
                        </span>
                      </div>

                      {/* Promo Ribbon if active in /admin */}
                      {hasPromo && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-[#C8A29E] text-white px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] font-medium shadow-sm">
                            Promoção
                          </span>
                        </div>
                      )}

                      {/* Duration Pill */}
                      <div className="absolute bottom-4 left-4 bg-[#2D2D2D]/80 backdrop-blur-xs text-[#FAF9F6] px-3 py-1 text-[11px] tracking-[0.14em] inline-flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#D4AF37] stroke-[1.5]" />
                        {proc.durationMinutes} min
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-3">
                      <h3 className="font-serif-editorial text-2xl sm:text-[28px] text-[#2D2D2D] font-normal leading-snug">
                        {proc.name}
                      </h3>
                      <p className="text-sm text-[#68645E] font-light leading-relaxed">
                        {proc.description}
                      </p>

                      {proc.benefits && proc.benefits.length > 0 && (
                        <ul className="pt-2 space-y-1.5 border-t border-[#EFECE4]">
                          {proc.benefits.map((b, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-[#5C5852] font-light flex items-center gap-2.5"
                            >
                              <span className="w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Price & Editorial Action */}
                  <div className="pt-6 mt-6 border-t border-[#E6DFD2] flex items-end justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#8E8880] block">
                        Sessão Individual
                      </span>
                      <div className="flex items-baseline gap-2.5 mt-0.5">
                        {hasPromo && (
                          <span className="text-xs text-[#A59F96] line-through">
                            {formatCurrencyBRL(proc.originalPrice)}
                          </span>
                        )}
                        <span className="font-serif-editorial text-3xl text-[#2D2D2D]">
                          {formatCurrencyBRL(finalPrice)}
                        </span>
                      </div>
                      {hasPromo && proc.promoValidUntil && (
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#A97E79] block mt-0.5">
                          Válido até {formatDateBR(proc.promoValidUntil)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookProcedure(proc.id)}
                      className="inline-flex items-center gap-2 bg-[#2D2D2D] hover:bg-[#8A9A86] text-[#FAF9F6] px-5 py-3 text-[10px] uppercase tracking-[0.22em] font-medium transition-colors"
                    >
                      <span>Agendar</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. SOBRE A ESPECIALISTA — ASYMMETRIC MAGAZINE SPREAD */}
      <section
        id="sobre-mim"
        className="py-28 sm:py-36 bg-[#F4F1EA] border-t border-[#E6DFD2] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Portrait in Editorial Arch */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -inset-3 border border-[#D4AF37]/40 pointer-events-none" />
                <div className="relative overflow-hidden bg-[#FAF9F6]">
                  <img
                    src="/images/larissa-portrait.jpg"
                    alt="Retrato editorial de Larissa Soares"
                    className="w-full h-[520px] object-cover object-top"
                  />
                </div>
                <div className="mt-5 flex items-center justify-between border-b border-[#D5CFC4] pb-3">
                  <span className="font-serif-editorial italic text-xl text-[#2D2D2D]">
                    {db.settings.professionalName}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[#6E7F6A]">
                    Fundadora & Especialista
                  </span>
                </div>
              </div>
            </div>

            {/* Editorial Bio */}
            <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center gap-4">
                <span className="w-10 h-[1px] bg-[#D4AF37]" />
                <span className="text-[11px] uppercase tracking-[0.32em] text-[#6E7F6A] font-medium">
                  A Especialista
                </span>
              </div>

              <h2 className="font-serif-editorial text-4xl sm:text-5xl lg:text-[54px] text-[#2D2D2D] font-light leading-[1.08]">
                Um olhar técnico, sensível e{' '}
                <span className="italic text-[#A97E79]">inteiramente dedicado a você</span>.
              </h2>

              <p className="text-base text-[#5C5852] font-light leading-relaxed">
                Com formação e atuação dedicada exclusivamente como{' '}
                <strong className="font-medium text-[#2D2D2D]">
                  Esteticista e Cosmetóloga, Massoterapeuta e Lash Designer
                </strong>
                , Larissa Soares idealizou seu atelier para mulheres que valorizam resultados
                elegantes, naturais e livres de excessos.
              </p>

              <p className="text-base text-[#5C5852] font-light leading-relaxed">
                Por ser a única profissional atuante no espaço, cada sessão respeita o ritmo
                biológico da sua pele e do seu corpo — com escuta atenta, dermocosméticos de alta
                pureza e rigor absoluto em biossegurança.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#DFD8CA]">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#8A9A86] font-semibold">
                    Especialidade I
                  </span>
                  <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">
                    Estética & Cosmetologia
                  </h3>
                  <p className="text-xs text-[#68645E] font-light leading-relaxed">
                    Química cosmética aplicada à renovação celular, hidratação profunda e equilíbrio
                    cutâneo.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#A97E79] font-semibold">
                    Especialidade II
                  </span>
                  <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">Massoterapia</h3>
                  <p className="text-xs text-[#68645E] font-light leading-relaxed">
                    Drenagem linfática manual precisa e descompressão neuro-sensorial com pedras
                    quentes.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#B38F22] font-semibold">
                    Especialidade III
                  </span>
                  <h3 className="font-serif-editorial text-2xl text-[#2D2D2D]">Lash Design</h3>
                  <p className="text-xs text-[#68645E] font-light leading-relaxed">
                    Arquitetura do olhar com fios tecnológicos de seda e nutrição de queratina.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMUNIDADE VIP & REDES SOCIAIS — EDITORIAL PRIVÉ */}
      <section id="comunidade-vip" className="py-28 sm:py-36 bg-[#FAF9F6] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="border border-[#D4AF37]/45 bg-[#F4F1EA]/50 p-8 sm:p-14 lg:p-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="text-[11px] uppercase tracking-[0.32em] text-[#6E7F6A] font-medium block">
                  Privé • Comunidade Exclusiva
                </span>

                <h2 className="font-serif-editorial text-4xl sm:text-5xl text-[#2D2D2D] font-light leading-[1.08]">
                  Grupo VIP <span className="italic text-[#A97E79]">Larissa Soares</span> no
                  WhatsApp
                </h2>

                <p className="text-sm sm:text-base text-[#5C5852] font-light leading-relaxed max-w-xl">
                  Um círculo reservado para clientes que desejam acompanhar de perto a rotina do
                  atelier e ter acesso prioritário à agenda:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs uppercase tracking-[0.16em] text-[#2D2D2D]">
                  <div className="border-l-2 border-[#8A9A86] pl-4 py-1">
                    Avisos de horários vagos de última hora
                  </div>
                  <div className="border-l-2 border-[#C8A29E] pl-4 py-1">
                    Condições exclusivas em protocolos sazonais
                  </div>
                  <div className="border-l-2 border-[#D4AF37] pl-4 py-1">
                    Rituais de skincare e autocuidado em casa
                  </div>
                  <div className="border-l-2 border-[#8A9A86] pl-4 py-1">
                    Orientações de longevidade para Lash Design
                  </div>
                </div>

                <div className="pt-4">
                  <a
                    href={db.settings.vipGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="vip-whatsapp-btn"
                    className="inline-flex items-center gap-3 bg-[#6E7F6A] hover:bg-[#2D2D2D] text-white px-9 py-4 text-xs uppercase tracking-[0.24em] font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 stroke-[1.5]" />
                    <span>Ingressar no Grupo VIP</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[1.5]" />
                  </a>
                </div>
              </div>

              {/* Editorial Social Channels */}
              <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-[#DFD8CA] pt-8 lg:pt-0 lg:pl-12 space-y-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[#A97E79] block">
                    Presença Digital
                  </span>
                  <h3 className="font-serif-editorial text-3xl text-[#2D2D2D] font-light mt-1">
                    Canais Oficiais
                  </h3>
                </div>

                <div className="divide-y divide-[#E5DEC9] border-y border-[#E5DEC9]">
                  <a
                    href={db.settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <Camera className="w-4 h-4 text-[#A97E79] stroke-[1.5]" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#2D2D2D] font-medium">
                          Instagram
                        </p>
                        <p className="text-xs text-[#68645E] font-light">
                          @esteticalarissasoares
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#8E8880] group-hover:text-[#2D2D2D] transition-colors" />
                  </a>

                  <a
                    href={db.settings.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <Clock className="w-4 h-4 text-[#D4AF37] stroke-[1.5]" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#2D2D2D] font-medium">
                          TikTok & Diário Visual
                        </p>
                        <p className="text-xs text-[#68645E] font-light">
                          Bastidores & Rituais de Cabine
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#8E8880] group-hover:text-[#2D2D2D] transition-colors" />
                  </a>

                  <a
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-4 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <Phone className="w-4 h-4 text-[#6E7F6A] stroke-[1.5]" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#2D2D2D] font-medium">
                          Concierge WhatsApp
                        </p>
                        <p className="text-xs text-[#68645E] font-light">
                          Contato direto com Larissa Soares
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#8E8880] group-hover:text-[#2D2D2D] transition-colors" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SISTEMA DE AGENDAMENTO ONLINE (4 PASSOS) */}
      <BookingSection
        preselectedProcedureIds={preselectedBookingIds}
        onClearPreselected={() => setPreselectedBookingIds([])}
      />

      {/* 7. RODAPÉ (FOOTER) EDITORIAL */}
      <footer id="contato" className="bg-[#2D2D2D] text-[#FAF9F6] pt-20 pb-14 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
            <div className="lg:col-span-4 space-y-4">
              <span className="font-serif-editorial text-3xl text-[#FAF9F6] font-light tracking-wide block">
                {db.settings.clinicName}
              </span>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
                {db.settings.professionalTitle}
              </p>
              <p className="text-xs text-[#C8C3B9] font-light leading-relaxed max-w-sm">
                Atelier exclusivo voltado à Estética & Cosmetologia, Massoterapia e Lash Design.
              </p>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
                Endereço & Horário de Funcionamento
              </h3>
              <p className="text-xs text-[#E5E0D8] font-light flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C8A29E] shrink-0 mt-0.5 stroke-[1.5]" />
                <span>{db.settings.addressLine}</span>
              </p>
              <p className="text-xs text-[#E5E0D8] font-light flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#8A9A86] shrink-0 mt-0.5 stroke-[1.5]" />
                <span>{db.settings.openingHoursText}</span>
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={db.settings.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-white/15 hover:border-[#D4AF37] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#FAF9F6] transition-colors"
                >
                  <MapPin className="w-3 h-3 text-[#D4AF37]" />
                  Google Maps
                </a>
                <a
                  href={db.settings.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-white/15 hover:border-[#8A9A86] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#FAF9F6] transition-colors"
                >
                  <Navigation className="w-3 h-3 text-[#8A9A86]" />
                  Waze
                </a>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
                  Acesso Proprietária
                </h3>
                <p className="text-xs text-[#C8C3B9] font-light">
                  Gerenciamento de agenda, catálogo, promoções e fluxo financeiro.
                </p>
              </div>
              <div>
                <Link
                  href="/admin"
                  id="footer-admin-login-link"
                  className="inline-flex items-center gap-2.5 border border-white/20 hover:border-[#D4AF37] px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-[#FAF9F6] transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-[#D4AF37] stroke-[1.5]" />
                  Área Restrita (/admin)
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9E9890] font-light">
            <p>© {new Date().getFullYear()} Estética Larissa Soares.</p>
            <p className="uppercase tracking-[0.2em] text-[10px]">
              Estética & Cosmetologia • Massoterapia • Lash Design
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
