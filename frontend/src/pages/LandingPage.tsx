import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  Package, ShoppingCart, Users, BarChart3, FileText, TrendingUp, PieChart, Globe,
  CheckCircle2, ArrowRight, Menu, X, Star, ChevronDown, ChevronUp,
  Zap, Shield, Headphones, RefreshCw, Lock, Database, Cpu,
  LayoutDashboard, UserCheck, Scan,
  Building2, Award, Phone, Mail, MapPin,
  Sparkles, Play, Crown, MessageCircle, Send,
} from 'lucide-react';
import { MOCK_PACKAGES, yearlyDiscount, monthlyEquivalent, representativeYearlyDiscount } from '../data/mockPackages';
import type { Package as PkgType } from '../redux/api/packagesApi';

// ─── Tokens ──────────────────────────────────────────────────────────────────
// Primary brand  #f97316  (orange-500 — warmer, less harsh than #ff6d29)
// Dark canvas    #09090b  (zinc-950)
// Surface dark   #18181b  (zinc-900)
// Border dark    #27272a  (zinc-800)
// Muted text     #71717a  (zinc-500)
// Accent violet  #7c3aed  (violet-600)
// Accent teal    #0d9488  (teal-600)

const NAV = [
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#modules' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'Reviews',      href: '#testimonials' },
  { label: 'FAQ',          href: '#faq' },
];

const STATS = [
  { value: '5,000+',  label: 'Active Businesses',       sub: 'and growing daily' },
  { value: '৳2.4B+',  label: 'Transactions Processed',  sub: 'zero calculation errors' },
  { value: '99.9%',   label: 'Uptime SLA',              sub: 'monitored 24 / 7' },
  { value: '< 100ms', label: 'Avg API Response',        sub: 'Redis-powered cache' },
];

const FEATURES = [
  { icon: Package,     title: 'Smart Inventory',          desc: 'Multi-warehouse tracking, barcode scan, stock ledger, alerts & FIFO costing.',       grad: 'from-blue-500 to-cyan-500',    soft: 'bg-blue-50 text-blue-600' },
  { icon: ShoppingCart,title: 'Lightning POS',            desc: 'Hold/resume sales, split payments, thermal receipt & A4 invoice in one tap.',          grad: 'from-orange-500 to-rose-500',  soft: 'bg-orange-50 text-orange-600' },
  { icon: Users,       title: 'Full HRM Suite',           desc: 'Attendance, payroll, leave, loans, KPI evaluation and exit clearance.',               grad: 'from-green-500 to-teal-500',   soft: 'bg-green-50 text-green-600' },
  { icon: BarChart3,   title: 'Double-Entry Accounting',  desc: 'P&L, Balance Sheet, Cash Flow & Trial Balance. DECIMAL(15,2) precision.',             grad: 'from-violet-500 to-purple-600',soft: 'bg-violet-50 text-violet-600' },
  { icon: FileText,    title: 'Purchase & Suppliers',     desc: 'Supplier ledger, purchase invoices, return management and auto stock updates.',        grad: 'from-amber-500 to-yellow-500', soft: 'bg-amber-50 text-amber-600' },
  { icon: TrendingUp,  title: 'Sales & CRM',              desc: 'Customer ledger, quotations, returns, collection reports and aging analysis.',         grad: 'from-pink-500 to-rose-500',    soft: 'bg-pink-50 text-pink-600' },
  { icon: PieChart,    title: 'Reports & Analytics',      desc: 'Sales, purchase, stock, P&L, customer, supplier, HRM — all exportable.',              grad: 'from-teal-500 to-cyan-500',    soft: 'bg-teal-50 text-teal-600' },
  { icon: Globe,       title: 'SMS Marketing',            desc: 'Bulk campaigns, templated messages, customer groups, due reminders & delivery logs.',  grad: 'from-indigo-500 to-blue-600',  soft: 'bg-indigo-50 text-indigo-600' },
];

const MODULES = [
  {
    tag: 'Inventory', tagColor: 'text-blue-400 bg-blue-400/10 border border-blue-400/20',
    title: 'Complete Inventory Control',
    subtitle: 'Never lose track of a single item across any warehouse.',
    points: ['Multi-warehouse stock management','Product variants, SKUs & barcodes','Immutable append-only stock ledger','Stock adjustment & inter-warehouse transfer','Low-stock alerts & reorder management','Opening stock & avg-cost tracking'],
    icon: Package, accent: '#3b82f6',
    mockBars: [55,70,45,85,60,90,75,95,65,80],
  },
  {
    tag: 'POS', tagColor: 'text-orange-400 bg-orange-400/10 border border-orange-400/20',
    title: 'Blazing Fast Point of Sale',
    subtitle: 'Serve more customers, faster, with fewer errors.',
    points: ['Barcode & QR-code scan billing','Hold & resume multiple carts','Split payments — cash, card, mobile','Coupon & gift-card redemption','A4 invoice + 58 mm thermal receipt','Offline-ready with auto sync'],
    icon: Scan, accent: '#f97316',
    mockBars: [40,65,80,55,90,70,85,60,95,75],
  },
  {
    tag: 'Accounting', tagColor: 'text-violet-400 bg-violet-400/10 border border-violet-400/20',
    title: 'Fintech-Grade Accounting',
    subtitle: 'প্রতিটি পয়সার হিসাব সঠিক।',
    points: ['True double-entry bookkeeping','Cash, bank & mobile banking accounts','P&L, Balance Sheet, Trial Balance','Cash Flow & Statement of Accounts','Expense & income categorisation','DECIMAL(15,2) — zero rounding errors'],
    icon: BarChart3, accent: '#7c3aed',
    mockBars: [60,75,50,85,65,95,70,80,55,90],
  },
  {
    tag: 'HRM', tagColor: 'text-green-400 bg-green-400/10 border border-green-400/20',
    title: 'End-to-End HR Management',
    subtitle: 'Every employee journey, fully managed.',
    points: ['Employee profiles & document vault','Attendance — manual, QR or device','Leave types, requests & approvals','Payroll structure & auto-generation','Loan & advance instalment tracking','KPI evaluation & exit clearance'],
    icon: UserCheck, accent: '#22c55e',
    mockBars: [50,65,80,45,90,60,75,85,55,95],
  },
];

const WHY = [
  { icon: Zap,        title: 'Sub-100 ms Responses',  desc: 'Redis caching layer on every hot path. 5,000+ concurrent shops with zero slowdown.' },
  { icon: Shield,     title: 'Bank-Level Security',   desc: 'JWT + OTP, row-level multi-tenancy, bcrypt, rate limiting, full audit trails.' },
  { icon: Database,   title: 'Atomic Transactions',   desc: 'Every write that touches multiple tables runs inside a Prisma interactive transaction.' },
  { icon: Cpu,        title: 'Fintech Precision',      desc: 'DECIMAL(15,2) money, DECIMAL(15,4) stock. Floating-point errors simply do not exist.' },
  { icon: Globe,      title: 'EN / বাংলা UI',          desc: 'Full language toggle — instant switch, no reload. Built for Bangladesh from day one.' },
  { icon: Headphones, title: '24 / 7 Support',        desc: 'Live chat, ticket system, and comprehensive docs. Real humans, fast responses.' },
  { icon: Lock,       title: 'Total Data Isolation',  desc: 'Tenant data is row-level isolated. No other business can ever see your records.' },
  { icon: RefreshCw,  title: 'Always Current',        desc: 'Monthly feature drops, zero manual upgrades, backwards-compatible migrations.' },
];

// pricing data pulled from shared mock (replaced by API in prod)
const ACTIVE_PLANS = MOCK_PACKAGES.filter((p) => p.isActive);
const YEARLY_SAVE_PCT = representativeYearlyDiscount(ACTIVE_PLANS);

const TESTIMONIALS = [
  { name: 'Md. Karim Uddin',  role: 'Owner, Karim Electronics',  loc: 'Dhaka',     av: 'KU', c: 'bg-blue-500',   r: 5, text: 'SolvexBD transformed how I run my shop. The POS is incredibly fast and inventory alerts mean I never run out of hot products. My accountant loves the reports!' },
  { name: 'Fatema Begum',     role: 'Director, Fatema Garments', loc: 'Chittagong', av: 'FB', c: 'bg-rose-500',   r: 5, text: 'আমার গার্মেন্টস ব্যবসার জন্য SolvexBD সেরা সফটওয়্যার। HR থেকে accounting পর্যন্ত সব কিছু এক জায়গায়। দাম অনেক সাশ্রয়ী।' },
  { name: 'Rafiqul Islam',    role: 'CEO, Rafiq Wholesale',      loc: 'Sylhet',     av: 'RI', c: 'bg-green-600',  r: 5, text: 'Switched from a costly ERP that required IT staff. Setup took 30 minutes. The double-entry accounting is exactly what our auditor needed.' },
  { name: 'Nasreen Akter',    role: 'Manager, City Pharmacy',    loc: 'Rajshahi',   av: 'NA', c: 'bg-violet-500', r: 5, text: 'Stock management for pharmacy was a nightmare before SolvexBD. Now I get alerts, the purchase-to-sale trail is perfect, and SMS reminders boost retention.' },
  { name: 'Tariqul Hasan',    role: 'Owner, Hassan Auto Parts',  loc: 'Cumilla',    av: 'TH', c: 'bg-orange-500', r: 5, text: 'Best investment I ever made. Supplier ledger and customer due tracking helped me collect ৳3 lakh in outstanding payments in just 2 months.' },
  { name: 'Sabina Yesmin',    role: 'CFO, TechTrade Ltd.',       loc: 'Dhaka',      av: 'SY', c: 'bg-teal-500',   r: 5, text: 'The P&L and Balance Sheet are audit-ready. We saved ৳40,000/month by replacing our legacy software. Access control is excellent.' },
];

const FAQS = [
  { q: 'Is there a free trial?', a: 'Yes — both plans include a 15-day free trial with full access. No credit card required.' },
  { q: 'Can multiple users share one account?', a: 'Absolutely. Starter supports 3 users, Pro supports 25. Each user gets a role (Admin, Manager, Cashier, Employee) plus fine-grained permission overrides.' },
  { q: 'Is my data safe from other businesses?', a: 'Every database query is filtered by your unique business ID at the row level. It is technically impossible for another tenant to access your data.' },
  { q: 'Does it work on mobile phones?', a: 'Yes — 100% mobile-responsive. The POS works great on tablets, the dashboard on phones, and all screens are touch-optimised (44 px minimum tap targets).' },
  { q: 'Can I upgrade mid-cycle?', a: 'Upgrade anytime from Settings → Subscription. Data is preserved, limits increase immediately, and billing is prorated.' },
  { q: 'Is Bangla language supported?', a: 'Full English / Bangla toggle in the navigation bar. Instant switch, no page reload.' },
  { q: 'What payment methods do you accept?', a: 'bKash, Nagad, Rocket, bank transfer, and VISA / Mastercard. All transactions are SSL-secured.' },
  { q: 'Do you have an affiliate program?', a: 'Yes! Earn 10% commission per month for every business you refer. Apply from Settings → My Affiliate after logging in.' },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

const Stars = ({ n = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < n ? 'fill-amber-400 text-amber-400' : 'fill-zinc-200 text-zinc-200'}`} />
    ))}
  </div>
);

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${className}`}>
      {children}
    </span>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? 'border-orange-200 bg-orange-50/50' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
        <span className="text-sm font-semibold text-zinc-900">{q}</span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${open ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>
      {open && <p className="px-6 pb-5 text-sm text-zinc-500 leading-relaxed border-t border-orange-100 pt-4">{a}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [menu, setMenu]    = useState(false);
  const [top, setTop]      = useState(true);
  const [mod, setMod]      = useState(0);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [enterpriseForm, setEnterpriseForm] = useState({ name: '', mobile: '', businessName: '', message: '' });
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [enterpriseSubmitted, setEnterpriseSubmitted] = useState(false);
  const isLoggedIn         = !!Cookies.get('access_token');

  useEffect(() => {
    const fn = () => setTop(window.scrollY < 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const goto = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenu(false);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white text-zinc-900 antialiased">

      {/* ════════════ NAV ════════════ */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${top ? 'bg-transparent' : 'bg-white/90 backdrop-blur-xl border-b border-zinc-200/70 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">

          {/* logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-500/30">
              <span className="text-white font-black text-xs tracking-tight">SX</span>
            </div>
            <span className={`font-extrabold text-sm tracking-tight transition-colors ${top ? 'text-white' : 'text-zinc-900'}`}>SolvexBD ERP</span>
          </Link>

          {/* desktop links */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV.map(n => (
              <button key={n.label} onClick={() => goto(n.href)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${top ? 'text-white/75 hover:text-white hover:bg-white/10' : 'text-zinc-600 hover:text-orange-600 hover:bg-orange-50'}`}>
                {n.label}
              </button>
            ))}
          </nav>

          {/* desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <Link to="/admin" className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl transition-colors shadow-md shadow-orange-500/25 flex items-center gap-1.5">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/login" className={`text-sm font-medium transition-colors ${top ? 'text-white/80 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}>Sign in</Link>
                <Link to="/login" className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl transition-colors shadow-md shadow-orange-500/25">
                  Free Trial →
                </Link>
              </>
            )}
          </div>

          {/* mobile toggle */}
          <button onClick={() => setMenu(!menu)} className={`lg:hidden p-2 rounded-lg transition-colors ${top ? 'text-white hover:bg-white/10' : 'text-zinc-700 hover:bg-zinc-100'}`}>
            {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* mobile menu */}
        {menu && (
          <div className="lg:hidden bg-white border-t border-zinc-200 shadow-xl">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {NAV.map(n => (
                <button key={n.label} onClick={() => goto(n.href)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors">
                  {n.label}
                </button>
              ))}
              <div className="pt-3 space-y-2">
                {isLoggedIn
                  ? <Link to="/admin" className="block text-center py-3 text-sm font-semibold bg-orange-500 text-white rounded-xl">Go to Dashboard →</Link>
                  : <>
                      <Link to="/login" className="block text-center py-3 text-sm font-medium border border-zinc-200 rounded-xl text-zinc-700">Sign in</Link>
                      <Link to="/login" className="block text-center py-3 text-sm font-semibold bg-orange-500 text-white rounded-xl">Start Free Trial</Link>
                    </>
                }
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ════════════ HERO ════════════ */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-zinc-950 pt-16">

        {/* layered background */}
        <div className="absolute inset-0">
          {/* mesh gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.15),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(124,58,237,0.08),transparent)]" />
          {/* grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
          {/* noise layer */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* left */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 mb-6 sm:mb-8">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-orange-300 tracking-wide">Bangladesh's #1 Business ERP Platform</span>
              </div>

              <h1 className="text-[2.4rem] sm:text-5xl lg:text-[4.5rem] font-black leading-[1.05] tracking-tight text-white mb-5 sm:mb-6">
                Manage every{' '}
                <span className="relative">
                  <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-orange-300 bg-clip-text text-transparent">
                    part
                  </span>
                </span>
                {' '}of your business.
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 max-w-lg mx-auto lg:mx-0 mb-8 sm:mb-10 leading-relaxed">
                Inventory · POS · HRM · Accounting — one seamless platform built for Bangladeshi SMEs.{' '}
                <span className="text-zinc-200 font-medium">প্রতিটি পয়সার হিসাব সঠিক।</span>
              </p>

              <div className="flex flex-col xs:flex-row gap-3 justify-center lg:justify-start mb-7 sm:mb-10">
                <Link to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-7 sm:px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-orange-500/30 text-sm w-full xs:w-auto">
                  Start 15-Day Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={() => goto('#modules')}
                  className="inline-flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white font-semibold px-7 sm:px-8 py-4 rounded-2xl transition-all text-sm w-full xs:w-auto">
                  <Play className="w-4 h-4" />
                  See How It Works
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center lg:justify-start">
                {['No credit card', 'Setup in 5 min', 'Cancel anytime'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-zinc-500 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />{t}
                  </span>
                ))}
              </div>
            </div>

            {/* right — UI mockup: hidden on small mobile, shown sm+ as smaller card, full lg+ */}
            <div className="relative hidden sm:block">
              <div className="absolute -inset-4 bg-gradient-to-br from-orange-500/10 via-violet-500/5 to-transparent rounded-[2.5rem] blur-2xl" />

              {/* browser chrome */}
              <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
                {/* titlebar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                  <div className="flex gap-1.5">
                    {['bg-red-500','bg-yellow-500','bg-green-500'].map(c=><div key={c} className={`w-2.5 h-2.5 rounded-full ${c} opacity-70`}/>)}
                  </div>
                  <div className="flex-1 mx-4 bg-zinc-800 rounded-md px-3 py-1 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    <span className="text-zinc-500 text-[11px] font-mono">app.solvexbd.com/admin</span>
                  </div>
                </div>

                {/* app UI */}
                <div className="flex" style={{ height: 320 }}>
                  {/* sidebar */}
                  <div className="w-14 bg-zinc-950 flex flex-col items-center gap-2 py-4 border-r border-zinc-800">
                    {[LayoutDashboard,Package,ShoppingCart,Users,BarChart3,FileText].map((Icon,i)=>(
                      <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${i===0 ? 'bg-orange-500 shadow-md shadow-orange-500/40' : 'text-zinc-600 hover:bg-zinc-800'}`}>
                        <Icon className={`w-4 h-4 ${i===0?'text-white':'text-zinc-500'}`}/>
                      </div>
                    ))}
                  </div>

                  {/* content */}
                  <div className="flex-1 p-4 overflow-hidden space-y-3">
                    {/* header row */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-bold">Dashboard</p>
                        <p className="text-zinc-500 text-[11px]">Saturday, 7 Jun 2025</p>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center"><span className="text-blue-400 text-[9px] font-bold">SK</span></div>
                      </div>
                    </div>

                    {/* stat cards */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {l:"Today's Sales",v:'৳18,450',d:'+12%',c:'text-green-400'},
                        {l:'Receivable',  v:'৳34,200',d:'-3%', c:'text-red-400'},
                        {l:'Stock Items', v:'1,284',   d:'+5%', c:'text-green-400'},
                        {l:'Employees',  v:'28',       d:'',    c:'text-zinc-500'},
                      ].map(s=>(
                        <div key={s.l} className="bg-zinc-800/60 rounded-xl p-2.5 border border-zinc-700/50">
                          <p className="text-white font-bold text-xs leading-tight">{s.v}</p>
                          <p className="text-zinc-500 text-[9px] mt-0.5 truncate">{s.l}</p>
                          {s.d && <p className={`text-[9px] font-semibold ${s.c}`}>{s.d}</p>}
                        </div>
                      ))}
                    </div>

                    {/* mini chart */}
                    <div className="bg-zinc-800/40 rounded-xl p-3 border border-zinc-700/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-400 text-[10px] font-semibold">Revenue — Last 12 months</span>
                        <span className="text-orange-400 text-[10px] font-bold">৳2.4L total</span>
                      </div>
                      <div className="h-16 flex items-end gap-1">
                        {[35,55,40,70,50,80,60,90,65,85,70,95].map((h,i)=>(
                          <div key={i} className={`flex-1 rounded-sm ${i===11?'bg-orange-500 shadow-sm shadow-orange-500/50':'bg-orange-500/25'}`} style={{height:`${h}%`}}/>
                        ))}
                      </div>
                    </div>

                    {/* recent invoices */}
                    <div className="space-y-1.5">
                      <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Recent Invoices</p>
                      {[
                        {n:'INV-1042',c:'Karim Electronics',v:'৳4,500',s:'Paid',sc:'text-green-400 bg-green-500/10'},
                        {n:'INV-1041',c:'City Pharmacy',    v:'৳1,200',s:'Due', sc:'text-red-400 bg-red-500/10'},
                        {n:'INV-1040',c:'Rafiq Wholesale',  v:'৳8,700',s:'Paid',sc:'text-green-400 bg-green-500/10'},
                      ].map(r=>(
                        <div key={r.n} className="flex items-center gap-2 bg-zinc-800/40 rounded-lg px-3 py-2 border border-zinc-700/30">
                          <div className="w-5 h-5 rounded bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-3 h-3 text-orange-400"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-zinc-300 text-[10px] font-medium truncate">{r.n} · {r.c}</p>
                          </div>
                          <span className="text-zinc-300 text-[10px] font-bold">{r.v}</span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.sc}`}>{r.s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* floating chips */}
              <div className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-xl border border-zinc-100 px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center shadow-md shadow-green-500/30">
                  <TrendingUp className="w-4 h-4 text-white"/>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-medium">Monthly Revenue</p>
                  <p className="text-sm font-black text-zinc-900">+24% ↑</p>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl border border-zinc-100 px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30">
                  <CheckCircle2 className="w-4 h-4 text-white"/>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-medium">System Status</p>
                  <p className="text-sm font-black text-zinc-900">All systems up</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/60 animate-pulse" />
        </div>
      </section>

      {/* ════════════ STATS BAND ════════════ */}
      <div className="bg-zinc-950 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
            {STATS.map(s=>(
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-black text-white mb-0.5">{s.value}</p>
                <p className="text-xs sm:text-sm text-zinc-300 font-semibold">{s.label}</p>
                <p className="text-[11px] sm:text-xs text-zinc-600 mt-0.5 hidden sm:block">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ FEATURES ════════════ */}
      <section id="features" className="py-16 sm:py-20 lg:py-32 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <Pill className="bg-orange-100 text-orange-600 mb-4 sm:mb-5">
              <Sparkles className="w-3 h-3" /> Everything You Need
            </Pill>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 mb-4 sm:mb-5 tracking-tight">
              One platform.<br className="hidden sm:block" />
              <span className="text-orange-500">Every function.</span>
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Stop juggling 5 different tools. SolvexBD integrates Inventory, POS, Sales,
              Purchase, Accounting, HRM, and Reports seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="group relative bg-white rounded-2xl p-6 border border-zinc-200 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                {/* gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.grad} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />
                <div className={`w-12 h-12 rounded-2xl ${f.soft} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mb-2">{f.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${f.grad} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS / MODULES ════════════ */}
      <section id="modules" className="py-16 sm:py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <Pill className="bg-violet-100 text-violet-600 mb-4 sm:mb-5">
              <BarChart3 className="w-3 h-3" /> Deep Dive
            </Pill>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 mb-4 sm:mb-5 tracking-tight">Powerful in every module</h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-base sm:text-lg">
              Feature-complete and battle-tested by thousands of real Bangladeshi businesses.
            </p>
          </div>

          {/* tab strip */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-12">
            {MODULES.map((m, i) => (
              <button key={m.tag} onClick={() => setMod(i)}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  mod === i
                    ? 'bg-zinc-900 text-white shadow-lg'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}>
                <m.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {m.tag}
              </button>
            ))}
          </div>

          {/* panel */}
          {MODULES.map((m, i) => (
            <div key={m.tag} className={mod === i ? 'block' : 'hidden'}>
              <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">

                {/* text side */}
                <div>
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 sm:mb-5 ${m.tagColor}`}>{m.tag}</span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 mb-3 tracking-tight">{m.title}</h3>
                  <p className="text-zinc-500 text-base sm:text-lg mb-6 sm:mb-8">{m.subtitle}</p>

                  <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3 mb-7 sm:mb-10">
                    {m.points.map(p => (
                      <div key={p} className="flex items-start gap-2.5 sm:gap-3 bg-zinc-50 rounded-xl p-3 sm:p-3.5 border border-zinc-100">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-zinc-700">{p}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/login"
                    className="inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold px-6 sm:px-7 py-3.5 rounded-2xl transition-colors w-full sm:w-auto">
                    Try {m.tag} for free <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* visual side */}
                <div className="relative mt-2 lg:mt-0">
                  <div className="absolute -inset-4 rounded-[2rem] blur-2xl" style={{ background: `${m.accent}12` }} />
                  <div className="relative bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl p-4 sm:p-6">
                    {/* header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${m.accent}20` }}>
                        <m.icon className="w-5 h-5" style={{ color: m.accent }} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{m.title}</p>
                        <p className="text-zinc-500 text-xs">SolvexBD ERP · Live</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-400 text-xs font-medium">Active</span>
                      </div>
                    </div>

                    {/* mini chart */}
                    <div className="bg-zinc-900 rounded-xl p-4 mb-4 border border-zinc-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-zinc-400 text-xs font-semibold">Performance — 10 days</span>
                        <span className="text-xs font-bold" style={{ color: m.accent }}>+18% ↑</span>
                      </div>
                      <div className="h-16 flex items-end gap-1">
                        {m.mockBars.map((h, j) => (
                          <div key={j} className="flex-1 rounded-sm transition-all"
                            style={{ height: `${h}%`, background: j === m.mockBars.length - 1 ? m.accent : `${m.accent}35` }} />
                        ))}
                      </div>
                    </div>

                    {/* feature pills */}
                    <div className="space-y-2">
                      {m.points.slice(0, 3).map((p, j) => (
                        <div key={j} className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-2.5 border border-zinc-800">
                          <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${m.accent}20` }}>
                            <CheckCircle2 className="w-3 h-3" style={{ color: m.accent }} />
                          </div>
                          <span className="text-zinc-300 text-xs">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ WHY SOLVEXBD ════════════ */}
      <section className="py-16 sm:py-20 lg:py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <Pill className="bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4 sm:mb-5">
              <Award className="w-3 h-3" /> Why SolvexBD
            </Pill>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-5 tracking-tight">
              Not just another ERP.
              <br /><span className="text-orange-400">Your competitive edge.</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-base sm:text-lg">
              Built for Bangladesh from day one — not a Western tool with broken localisation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-16">
            {WHY.map(w => (
              <div key={w.title}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/30 hover:bg-zinc-800/80 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 flex items-center justify-center mb-5 group-hover:bg-orange-500/20 transition-colors">
                  <w.icon className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{w.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>

          {/* comparison table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-5 sm:p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3 sm:mb-4">The old way</p>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">Legacy ERPs are costing you</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-5 sm:mb-6">
                  ৳5,000–৳15,000/month, weeks of setup, dedicated IT staff required,
                  no Bangla support, and extra charges for every update.
                </p>
                <div className="space-y-3">
                  {['৳5,000+ per month minimum','2–4 weeks implementation','Requires dedicated IT','No Bangla language support','Updates cost extra'].map(t=>(
                    <div key={t} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 text-red-400" />
                      </div>
                      <span className="text-sm text-zinc-400">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 sm:p-8 lg:p-12">
                <p className="text-xs text-orange-400 uppercase tracking-widest font-semibold mb-3 sm:mb-4">The SolvexBD way</p>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3 sm:mb-4">Affordable. Fast. Bangladeshi.</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-5 sm:mb-6">
                  Start at just ৳500/month, live in 30 minutes, no IT needed, full
                  Bangla/English toggle, and all updates are free forever.
                </p>
                <div className="space-y-3">
                  {['From ৳500 per month only','Live in 30 minutes or less','Zero IT staff required','Full Bangla / English UI','Free updates forever included'].map(t=>(
                    <div key={t} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-sm text-zinc-200">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ PRICING ════════════ */}
      <section id="pricing" className="py-16 sm:py-20 lg:py-32 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* heading */}
          <div className="text-center mb-8 sm:mb-12">
            <Pill className="bg-green-100 text-green-700 mb-4 sm:mb-5">
              <Zap className="w-3 h-3" /> Simple Pricing
            </Pill>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 mb-4 sm:mb-5 tracking-tight">
              Transparent. No surprises.
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-base sm:text-lg mb-8">
              All plans include a {ACTIVE_PLANS[0]?.trialDays ?? 15}-day free trial. No credit card. Cancel anytime.
            </p>

            {/* billing toggle */}
            <div className="inline-flex items-center gap-1 p-1 bg-zinc-200 rounded-2xl relative">
              {(['monthly', 'yearly'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    billing === b
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {b === 'monthly' ? 'Monthly' : 'Yearly'}
                  {b === 'yearly' && (
                    <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap shadow">
                      SAVE {YEARLY_SAVE_PCT}%
                    </span>
                  )}
                </button>
              ))}
            </div>
            {billing === 'yearly' && (
              <p className="text-xs text-green-600 font-medium mt-3">
                🎉 Yearly billing saves you {YEARLY_SAVE_PCT}% — paid once annually
              </p>
            )}
          </div>

          {/* plan cards */}
          <div className={`grid grid-cols-1 gap-5 sm:gap-6 max-w-6xl mx-auto ${
            ACTIVE_PLANS.length === 3 ? 'lg:grid-cols-3' : 'sm:grid-cols-2 max-w-3xl'
          }`}>
            {ACTIVE_PLANS.map((plan: PkgType) => {
              const isHighlight = plan.highlight;
              const isEnterprise = plan.isEnterprise;
              const price = billing === 'monthly' ? plan.monthlyPrice : monthlyEquivalent(plan);
              const discount = yearlyDiscount(plan);
              const PlanIcon = plan.name === 'Pro' ? Crown : plan.name === 'Enterprise' ? Building2 : Zap;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl transition-all ${
                    isHighlight
                      ? 'bg-zinc-950 border-2 border-orange-500/50 shadow-2xl shadow-orange-500/10'
                      : 'bg-white border-2 border-zinc-200 shadow-sm hover:shadow-md'
                  } ${plan.badge ? 'mt-5' : ''}`}
                >
                  {/* badge */}
                  {plan.badge && !isEnterprise && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-block bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/30 whitespace-nowrap">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  {isEnterprise && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-block bg-zinc-900 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow whitespace-nowrap">
                        Enterprise
                      </span>
                    </div>
                  )}

                  {isHighlight && (
                    <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08),transparent_60%)] pointer-events-none" />
                  )}

                  <div className="p-6 sm:p-8 relative flex-1 flex flex-col">
                    {/* plan name + icon */}
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className={`p-2 rounded-xl ${isHighlight ? 'bg-orange-500/20' : 'bg-orange-50'}`}>
                        <PlanIcon className={`w-5 h-5 ${isHighlight ? 'text-orange-400' : 'text-orange-500'}`} />
                      </div>
                      <h3 className={`text-xl font-black ${isHighlight ? 'text-white' : 'text-zinc-900'}`}>{plan.name}</h3>
                    </div>

                    {/* price */}
                    {isEnterprise ? (
                      <div className="mb-6">
                        <p className={`text-4xl font-black mb-1 ${isHighlight ? 'text-white' : 'text-zinc-900'}`}>Custom</p>
                        <p className={`text-sm ${isHighlight ? 'text-zinc-400' : 'text-zinc-500'}`}>Talk to our team for a quote</p>
                      </div>
                    ) : (
                      <div className="mb-1">
                        <div className="flex items-end gap-1.5 mb-1">
                          <span className={`text-4xl sm:text-5xl font-black ${isHighlight ? 'text-white' : 'text-zinc-900'}`}>
                            ৳{price.toLocaleString()}
                          </span>
                          <span className={`text-sm mb-2 ${isHighlight ? 'text-zinc-400' : 'text-zinc-400'}`}>/mo</span>
                        </div>
                        {billing === 'yearly' && discount > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs line-through ${isHighlight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                              ৳{plan.monthlyPrice}/mo
                            </span>
                            <span className="text-xs font-bold text-green-500">Save {discount}%</span>
                          </div>
                        )}
                        {billing === 'yearly' && (
                          <p className={`text-xs mb-4 ${isHighlight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            Billed ৳{plan.yearlyPrice.toLocaleString()} annually
                          </p>
                        )}
                        {billing === 'monthly' && (
                          <p className={`text-xs mb-4 ${isHighlight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            Billed monthly · Save {discount}% with yearly
                          </p>
                        )}
                      </div>
                    )}

                    {/* trial badge */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold mb-5 self-start ${
                      isHighlight ? 'bg-orange-500/15 text-orange-400' : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {plan.trialDays}-day free trial included
                    </div>

                    {/* features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isHighlight ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                            <CheckCircle2 className={`w-3 h-3 ${isHighlight ? 'text-orange-400' : 'text-orange-500'}`} />
                          </div>
                          <span className={`text-sm leading-snug ${isHighlight ? 'text-zinc-300' : 'text-zinc-600'}`}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {isEnterprise ? (
                      <div className="space-y-2.5">
                        <a
                          href={`https://wa.me/8801XXXXXXXXX?text=${encodeURIComponent('Hi! I am interested in SolvexBD Enterprise plan.')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-bold transition-all shadow-lg shadow-green-500/20"
                        >
                          <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                        </a>
                        <button
                          onClick={() => setEnterpriseOpen((v) => !v)}
                          className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                            isHighlight
                              ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                              : 'border-zinc-300 text-zinc-700 hover:border-zinc-400'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                          {enterpriseOpen ? 'Close Form' : 'Send Enquiry'}
                        </button>
                        {enterpriseOpen && !enterpriseSubmitted && (
                          <form
                            onSubmit={(e) => { e.preventDefault(); setEnterpriseSubmitted(true); }}
                            className={`space-y-2.5 pt-1 ${isHighlight ? '' : ''}`}
                          >
                            {[
                              { name: 'name', placeholder: 'Your Name', type: 'text' },
                              { name: 'mobile', placeholder: 'Mobile Number', type: 'tel' },
                              { name: 'businessName', placeholder: 'Business Name', type: 'text' },
                            ].map(({ name, placeholder, type }) => (
                              <input
                                key={name}
                                type={type}
                                required
                                placeholder={placeholder}
                                value={(enterpriseForm as any)[name]}
                                onChange={(e) => setEnterpriseForm((p) => ({ ...p, [name]: e.target.value }))}
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 transition-colors ${
                                  isHighlight ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-zinc-200 text-zinc-900'
                                }`}
                              />
                            ))}
                            <textarea
                              required rows={2}
                              placeholder="Tell us about your requirements..."
                              value={enterpriseForm.message}
                              onChange={(e) => setEnterpriseForm((p) => ({ ...p, message: e.target.value }))}
                              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 resize-none transition-colors ${
                                isHighlight ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-zinc-200 text-zinc-900'
                              }`}
                            />
                            <button type="submit"
                              className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-all">
                              Submit Request
                            </button>
                          </form>
                        )}
                        {enterpriseSubmitted && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            Request submitted! We'll reach out within 24 hours.
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link to="/login"
                        className={`block text-center text-sm font-bold py-4 rounded-2xl transition-all ${
                          isHighlight
                            ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/30'
                            : 'border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        {plan.name === 'Starter' ? 'Start Free Trial' : 'Get Started Now'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-zinc-400 mt-10">
            All prices are exclusive of VAT ·{' '}
            <a href="mailto:hello@solvexbd.com" className="text-orange-500 font-semibold hover:underline">
              hello@solvexbd.com
            </a>
          </p>
        </div>
      </section>

      {/* ════════════ TESTIMONIALS ════════════ */}
      <section id="testimonials" className="py-16 sm:py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <Pill className="bg-amber-100 text-amber-700 mb-4 sm:mb-5">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Customer Love
            </Pill>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 mb-4 sm:mb-5 tracking-tight">
              5,000+ businesses<br className="hidden sm:block" /> can't be wrong
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <Stars n={5} />
              <span className="text-sm font-black text-zinc-900">4.9</span>
              <span className="text-sm text-zinc-400">/ 5 — 2,400+ verified reviews</span>
            </div>
          </div>

          {/* masonry-ish grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-5 space-y-4 sm:space-y-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name}
                className="break-inside-avoid bg-zinc-50 border border-zinc-200 rounded-2xl p-6 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300">
                <Stars n={t.r} />
                <p className="text-sm text-zinc-600 leading-relaxed mt-4 mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
                  <div className={`w-9 h-9 rounded-full ${t.c} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-white text-xs font-black">{t.av}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.name}</p>
                    <p className="text-xs text-zinc-400">{t.role} · {t.loc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ INDUSTRIES ════════════ */}
      <div className="bg-zinc-50 border-y border-zinc-200 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-5 sm:mb-8">
            Trusted by businesses in every industry
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {['Electronics','Garments','Pharmacy','Wholesale','Restaurant','Auto Parts','Fashion','Hardware','Cosmetics','Furniture'].map(b => (
              <div key={b} className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-zinc-500 hover:border-orange-300 hover:text-orange-600 transition-colors">
                <Building2 className="w-3 h-3 flex-shrink-0" />{b}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ FAQ ════════════ */}
      <section id="faq" className="py-16 sm:py-20 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <Pill className="bg-zinc-100 text-zinc-600 mb-4 sm:mb-5">FAQ</Pill>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 mb-4 tracking-tight">Common questions</h2>
            <p className="text-zinc-500">
              Can't find your answer?{' '}
              <a href="mailto:hello@solvexbd.com" className="text-orange-500 font-semibold hover:underline">Contact us →</a>
            </p>
          </div>
          <div className="space-y-3">
            {FAQS.map(f => <FAQ key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ════════════ FINAL CTA ════════════ */}
      <section className="py-24 lg:py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(249,115,22,0.12),transparent)]" />
          <div className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 items-center justify-center mx-auto mb-8">
            <Award className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
            Ready to transform<br className="hidden sm:block" /> your business?
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join 5,000+ Bangladeshi businesses already on SolvexBD ERP.
            Start your 15-day free trial — no credit card, no commitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-2xl shadow-orange-500/25 text-base">
              Start Free — 15 Days
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+8801XXXXXXXXX"
              className="inline-flex items-center justify-center gap-2.5 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white font-semibold px-10 py-4 rounded-2xl transition-all text-base">
              <Phone className="w-5 h-5" /> Talk to Sales
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {['No credit card required','Full access for 15 days','Live in 30 minutes','Cancel anytime'].map(t => (
              <span key={t} className="flex items-center gap-2 text-zinc-500 text-sm">
                <CheckCircle2 className="w-4 h-4 text-orange-500/70" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="bg-[#09090b] border-t border-zinc-800 pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-800">

            {/* brand */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-black text-sm">SX</span>
                </div>
                <span className="text-white font-extrabold text-sm tracking-tight">SolvexBD ERP</span>
              </Link>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mb-5">
                Bangladesh's most trusted multi-tenant ERP for SMEs. Every paisa accounted for.
              </p>
              <p className="text-sm text-orange-400 font-semibold mb-6">প্রতিটি পয়সার হিসাব সঠিক।</p>
              <div className="flex gap-2">
                {[
                  { Icon: Building2, label: 'Facebook' },
                  { Icon: Globe,     label: 'Twitter' },
                  { Icon: FileText,  label: 'LinkedIn' },
                ].map(({ Icon, label }) => (
                  <a key={label} href="#" aria-label={label}
                    className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-orange-400 hover:border-orange-500/40 hover:bg-orange-500/10 transition-all">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-white text-xs font-bold uppercase tracking-wider mb-5">Product</p>
              <ul className="space-y-3">
                {['Inventory','POS Terminal','HRM Suite','Accounting','Reports','SMS Marketing'].map(l => (
                  <li key={l}><a href="#features" className="text-sm text-zinc-500 hover:text-orange-400 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-white text-xs font-bold uppercase tracking-wider mb-5">Company</p>
              <ul className="space-y-3">
                {['About Us','Blog','Careers','Affiliate Program','Privacy Policy','Terms of Service'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-zinc-500 hover:text-orange-400 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-white text-xs font-bold uppercase tracking-wider mb-5">Contact</p>
              <ul className="space-y-4">
                {[
                  { Icon: MapPin, text: 'Dhaka, Bangladesh' },
                  { Icon: Phone,  text: '+880 1XXX-XXXXXX' },
                  { Icon: Mail,   text: 'hello@solvexbd.com' },
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-zinc-500">
                    <Icon className="w-4 h-4 text-orange-500/70 flex-shrink-0" />{text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">© 2025 SolvexBD ERP. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {['Privacy','Terms','Security','Cookies'].map(l => (
                <a key={l} href="#" className="text-xs text-zinc-600 hover:text-orange-400 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
