# Estética Larissa Soares — Plataforma Web & Painel Administrativo

Aplicação web completa (Landing Page Mobile-First, Sistema de Agendamento Online em 4 Passos e Painel Administrativo `/admin`) desenvolvida exclusivamente para a clínica **Estética Larissa Soares**.

## Especialidades Exclusivas

- **Estética & Cosmetologia (Facial & Corporal)**
- **Massoterapia**
- **Lash Design**

## Identidade Visual

- **Fundo Principal:** Off-White / Branco Gelo (`#FAF9F6`) e Linho Suave (`#F4F1EA`)
- **Destaques e Botões:** Verde Sálvia (`#8A9A86`) e Rosé Queimado (`#C8A29E`)
- **Tipografia & Leitura:** Cinza Chumbo (`#2D2D2D`) com títulos em *Cormorant Garamond* e textos em *Plus Jakarta Sans*
- **Detalhes:** Dourado Fosco (`#D4AF37`)

## Funcionalidades Implementadas

### 1. Área Pública (`/`)
- **Cabeçalho Limpo** com menu suave e acesso discreto à **Área Restrita** (ícone de cadeado).
- **Hero Section** com proposta de autocuidado e beleza natural + CTA de agendamento.
- **Catálogo Dinâmico de Procedimentos** filtrado exclusivamente nas 3 áreas, exibindo duração, benefícios, selo **"Promoção"**, preço original riscado e validade da oferta.
- **Sobre a Especialista (Larissa Soares)** destacando sua tripla formação e atendimento individualizado.
- **Comunidade VIP & Redes Sociais** com convite para o Grupo VIP do WhatsApp, Instagram, TikTok e WhatsApp direto.
- **Sistema de Agendamento Online (4 Passos):**
  1. Seleção de 1 ou mais procedimentos
  2. Escolha de data e horário (bloqueando automaticamente horários ocupados ou bloqueados pela Larissa)
  3. Dados da cliente (Nome, WhatsApp, E-mail e observações/alergias)
  4. Escolha da forma de pagamento (Pix antecipado com Copia e Cola/QR Code, Cartão de Crédito com parcelamento configurável ou Pagamento Presencial)
- **Rodapé** com endereço, links diretos para Google Maps e Waze, horário de funcionamento e login administrativo.

### 2. Painel Administrativo (`/admin`)
- **Credenciais Padrão:**
  - **E-mail:** `larissa@larissasoares.com.br`
  - **Senha:** `Larissa@2026`
- **Módulo A — Dashboard Principal:** Resumo financeiro do dia, semana e mês (Faturamento bruto, valores recebidos, valores a receber e despesas) + lista de agendamentos do dia com confirmação rápida via WhatsApp.
- **Módulo B — Gestão de Procedimentos e Promoções (CRUD):** Cadastro, edição, exclusão e chave seletora **"Em Promoção?"** com valor promocional e data de validade refletindo em tempo real no site público.
- **Módulo C — Gestão Financeira e Meios de Pagamento:** Chaves para ativar/desativar Pix, Cartão de Crédito (com limite de parcelas), Débito e Dinheiro/Presencial + Fluxo de Caixa com **baixa em 1 clique** para pagamentos presenciais e lançamento de despesas/insumos.
- **Módulo D — Central de Disparo de Mensagens:** Base de clientes cadastrada automaticamente + disparo via WhatsApp e E-mail Marketing com 4 templates editáveis e filtros de público (todas, por especialidade ou inativas há +30 dias).
- **Módulo E — Gestão de Agenda e Disponibilidade:** Grade diária e semanal para bloqueio de horários de almoço, folgas ou férias e inserção de agendamentos manuais.

## Banco de Dados (Persistência Local + Supabase SQL)

- A aplicação já funciona 100% de imediato com persistência via API (`/api/clinic` em `data/clinic-db.json` + sincronização instantânea no navegador).
- O schema completo do PostgreSQL / Supabase com Row Level Security (RLS) encontra-se em [`supabase/schema.sql`](./supabase/schema.sql).

## Como Executar

```bash
npm install
npm run dev
```
