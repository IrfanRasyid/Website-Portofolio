import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Mail, Phone, MapPin, ExternalLink,
  GraduationCap, Code, Database, BarChart, Menu, X,
} from 'lucide-react';

/* ─────────────────────────── SVG Icons ─────────────────────────── */
const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
  </svg>
);

/* ─────────────────────── Typewriter Hook ───────────────────────── */
function useTypewriter(words: string[], speed = 80, pause = 1800) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!deleting && subIndex === words[index].length) {
      setTimeout(() => setDeleting(true), pause); return;
    }
    if (deleting && subIndex === 0) {
      setDeleting(false); setIndex(p => (p + 1) % words.length); return;
    }
    const t = setTimeout(() => {
      setSubIndex(p => p + (deleting ? -1 : 1));
      setText(words[index].substring(0, subIndex + (deleting ? -1 : 1)));
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [subIndex, deleting, index, words, speed, pause]);

  return text;
}

/* ─────────────────────── GitHub API Hook ───────────────────────── */
const LANG_EMOJI: Record<string, string> = {
  Python: '🐍', 'Jupyter Notebook': '📊', TypeScript: '💎',
  JavaScript: '⚡', Go: '🚀', HTML: '🌐', CSS: '🎨',
  Java: '☕', Rust: '🦀', 'C++': '⚙️', Shell: '🖥️',
};

const PINNED_FIRST = [
  'sewa_lapangan_migas', 'Data-Analyst-Portofolio', 'Tugas-Akhir',
  'Ular-Tangga-PJOK', 'sql_learning_smk', 'web_comipara',
];

interface GHRepo {
  id: number; name: string; full_name: string; description: string | null;
  html_url: string; homepage: string | null; language: string | null;
  topics: string[]; pushed_at: string; fork: boolean; private: boolean;
}

interface Project {
  emoji: string; title: string; date: string; tools: string[];
  objective: string; highlights: string[]; link: string;
}

function repoToProject(repo: GHRepo): Project {
  const lang = repo.language ?? 'Code';
  const emoji = LANG_EMOJI[lang] ?? '📁';
  const tools: string[] = [];
  if (repo.language) tools.push(repo.language);
  repo.topics.slice(0, 3).forEach(t => {
    const lbl = t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (!tools.includes(lbl)) tools.push(lbl);
  });
  if (tools.length === 0) tools.push('GitHub');
  const date = new Date(repo.pushed_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return {
    emoji,
    title: repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    date,
    tools: tools.slice(0, 3),
    objective: repo.description ?? `A ${lang} project on GitHub.`,
    highlights: [
      `Primary language: ${lang}.`,
      repo.topics.length > 0 ? `Topics: ${repo.topics.slice(0, 3).join(', ')}.` : 'Open source project.',
      repo.homepage ? `Live: ${repo.homepage}` : 'View source on GitHub.',
    ],
    link: repo.html_url,
  };
}

function useGitHubRepos(username: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=30&type=owner`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() as Promise<GHRepo[]>; })
      .then((repos: GHRepo[]) => {
        if (cancelled) return;
        const filtered = repos.filter(r =>
          !r.fork && !r.private &&
          !r.name.toLowerCase().includes('portofolio-website') &&
          !r.name.toLowerCase().includes('portfolio-website')
        );
        const pinned = PINNED_FIRST.map(n => filtered.find(r => r.name === n)).filter((r): r is GHRepo => !!r);
        const rest = filtered.filter(r => !PINNED_FIRST.includes(r.name));
        setProjects([...pinned, ...rest].slice(0, 9).map(repoToProject));
        setLoading(false);
      })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [username]);

  return { projects, loading, error };
}

/* ─────────────────────── Static Fallback ───────────────────────── */
const PROJECTS_FALLBACK: Project[] = [
  {
    emoji: '📊', title: 'Data Analyst Portfolio', date: 'Dec 2024',
    tools: ['Jupyter Notebook', 'Python', 'SQL'],
    objective: 'E-commerce data analysis using SQL, Python, and Looker Studio — MySkill Bootcamp B4-19.',
    highlights: ['SQL: top category analysis', 'Python EDA with pandas/seaborn', 'Interactive Looker dashboard'],
    link: 'https://github.com/IrfanRasyid/Data-Analyst-Portofolio',
  },
  {
    emoji: '🏸', title: 'Sewa Lapangan Migas 61', date: 'Feb 2026',
    tools: ['React.js', 'Golang', 'PostgreSQL'],
    objective: 'Full-stack badminton court booking with JWT auth, QRIS payment, and Vercel/Docker deployment.',
    highlights: ['Golang Gin REST API (Clean Arch)', 'JWT role-based booking flow', 'Live on Vercel'],
    link: 'https://github.com/IrfanRasyid/sewa_lapangan_migas',
  },
  {
    emoji: '🌾', title: 'Prediksi Harga Beras', date: '2024',
    tools: ['Python', 'Random Forest', 'Linear Regression'],
    objective: 'Final thesis: predicting Indonesian premium rice prices with ML model comparison.',
    highlights: ['Random Forest vs Linear Regression', 'Feature engineering', 'RMSE / R² evaluation'],
    link: 'https://github.com/IrfanRasyid/Tugas-Akhir',
  },
  {
    emoji: '🎲', title: 'Ular Tangga PJOK', date: 'Mar 2026',
    tools: ['React', 'TypeScript', 'Supabase'],
    objective: 'Snakes & Ladders educational game for SMK Physical Education classes.',
    highlights: ['96.6% TypeScript', 'Real-time Supabase backend', 'Deployed on Vercel'],
    link: 'https://github.com/IrfanRasyid/Ular-Tangga-PJOK',
  },
  {
    emoji: '🗄️', title: 'SQL Learning SMK', date: 'Apr 2026',
    tools: ['TypeScript', 'React', 'SQL'],
    objective: 'Interactive SQL learning platform for SMK Barunawati Jakarta.',
    highlights: ['Hands-on SQL exercises', 'SELECT, JOIN, aggregation', 'Modern React UX'],
    link: 'https://github.com/IrfanRasyid/sql_learning_smk',
  },
  {
    emoji: '🌐', title: 'Gepeng Punya Souvenir', date: 'Mar 2026',
    tools: ['React', 'TypeScript', 'Supabase'],
    objective: 'Full-stack app with React + Vite, Supabase PostgreSQL, PLpgSQL migrations, and Netlify CI/CD.',
    highlights: ['93.3% TypeScript', 'GitHub Actions → Netlify', 'PLpgSQL schema migrations'],
    link: 'https://gepengpunyasovenir.netlify.app/',
  },
];

/* ─────────────────────── Animated Number ────────────────────────── */
function AnimatedNumber({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let n = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      n += step;
      if (n >= to) { setVal(to); clearInterval(timer); } else setVal(n);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─────────────────────── Skill Bar ─────────────────────────────── */
function SkillBar({ name, pct }: { name: string; pct: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <div ref={ref} className="mb-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)' }}>{pct}%</span>
      </div>
      <div className="skill-track">
        <motion.div
          className="skill-fill"
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────── Project Card ──────────────────────────── */
function ProjectCard({ project, idx }: { project: Project; idx: number }) {
  return (
    <motion.div
      className="proj-card"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: idx * 0.07 }}
      style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column' }}
    >
      {/* Corner dots */}
      <span className="corner-dot tl" /><span className="corner-dot tr" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>{project.emoji}</span>
        <a href={project.link} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--text-muted)', transition: 'color .2s' }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--orange)')}
          onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Tools */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {project.tools.slice(0, 3).map((t, i) => (
          <span key={i} style={{
            padding: '2px 8px', border: '1px solid var(--border-mid)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-mid)',
          }}>{t}</span>
        ))}
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, lineHeight: 1.25 }}>{project.title}</h3>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', marginBottom: 10, letterSpacing: '0.06em' }}>{project.date}</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6, flex: 1 }}
        className="line-clamp-2">{project.objective}</p>

      <ul style={{ marginBottom: 20, listStyle: 'none' }}>
        {project.highlights.map((h, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-mid)', marginBottom: 6 }}>
            <span className="orange-sq" style={{ marginTop: 4 }} />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <a href={project.link} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11,
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--text)', transition: 'color .2s'
          }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--orange)')}
          onMouseOut={e => (e.currentTarget.style.color = 'var(--text)')}
        >
          VIEW REPOSITORY <ExternalLink size={11} />
        </a>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── App Data ──────────────────────────────── */
const NAV_LINKS = ['About', 'Experience', 'Skills', 'Projects', 'Contact'];

const SKILLS = [
  {
    cat: 'Data & Analytics', icon: <BarChart size={18} />, items: [
      { name: 'Python (pandas, numpy, matplotlib)', pct: 85 },
      { name: 'SQL / PostgreSQL', pct: 88 },
      { name: 'Google Looker Studio', pct: 82 },
      { name: 'Jupyter Notebook', pct: 87 },
    ]
  },
  {
    cat: 'Frontend', icon: <Code size={18} />, items: [
      { name: 'React / TypeScript', pct: 82 },
      { name: 'Tailwind CSS', pct: 80 },
      { name: 'HTML / CSS / JS', pct: 90 },
      { name: 'Vite', pct: 78 },
    ]
  },
  {
    cat: 'Backend & DevOps', icon: <Database size={18} />, items: [
      { name: 'Golang (Gin)', pct: 70 },
      { name: 'Supabase / Firebase', pct: 78 },
      { name: 'Docker / CI/CD', pct: 65 },
      { name: 'REST API Design', pct: 80 },
    ]
  },
];

const EXPERIENCE = [
  {
    role: 'Teaching Intern — Informatics',
    company: 'SMKS Barunawati Jakarta',
    period: 'Jan 2026 – Apr 2026',
    bullets: [
      'Taught basic programming, SQL, and web development to vocational students.',
      'Built interactive learning tools: SQL Learning Platform & Ular Tangga PJOK game.',
      'Mentored students through hands-on project-based learning.',
    ],
  },
  {
    role: 'Data Analyst (Bootcamp)',
    company: 'MySkill — Kelompok B4 Batch 19',
    period: 'Nov 2024 – Dec 2024',
    bullets: [
      'Analyzed e-commerce datasets using SQL, Python, pandas, and seaborn.',
      'Built interactive Google Looker Studio dashboard with filters & insights.',
      'Presented findings: Mobiles & Tablets top category, COD most popular payment.',
    ],
  },
  {
    role: 'Data Entry Intern',
    company: 'LPPM Universitas Mercubuana',
    period: '2022 – 2023',
    bullets: [
      'Managed research and community service data from university lecturers.',
      'Ensured accuracy, consistency, and completeness of data entries in the database.',
      'Generated periodic reports on data input outcomes with precision.',
      'Maintained confidentiality of critical information related to academic research.',
    ],
  },
];

const TECH_STACK = [
  'Python', 'SQL', 'PostgreSQL', 'React', 'TypeScript',
  'Supabase', 'Docker', 'Looker Studio', 'Jupyter', 'Vite', 'Tailwind',
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [activeSection, setActiveSection] = useState('about');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const { projects: ghProjects, loading: ghLoading, error: ghError } = useGitHubRepos('IrfanRasyid');

  const typedRole = useTypewriter(
    ['Data Analyst', 'CS Graduate', 'SQL Expert', 'Web Developer', 'Teacher', 'Vibe Coder', 'Content Creator'],
    75, 1800
  );

  /* Scroll spy */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      for (const id of [...NAV_LINKS.map(l => l.toLowerCase())].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 100) { setActiveSection(id); break; }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  /* ─── NAV ─────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Read progress */}
      <motion.div className="read-progress" style={{ width: progressWidth }} />

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        backgroundColor: scrolled ? '#fff' : 'rgba(235,235,235,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(0,0,0,0.12)' : 'transparent'}`,
        transition: 'all 0.3s',
        height: 60,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: 'var(--orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900,
              fontSize: 14, color: '#fff', letterSpacing: '0.04em',
            }}>IR</div>
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.04em' }}>IRFAN RASYID</span>
          </div>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hide-mobile">
            {NAV_LINKS.map(link => {
              const id = link.toLowerCase();
              return (
                <button key={link} onClick={() => scrollTo(id)}
                  className={`nav-link ${activeSection === id ? 'active' : ''}`}
                  style={{ background: 'none' }}>
                  {link}
                </button>
              );
            })}
          </nav>

          {/* CTA + mobile toggle */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="mailto:ir16151@gmail.com" className="btn-orange hide-mobile">
              HIRE ME
            </a>
            <button onClick={() => setMenuOpen(p => !p)} className="show-mobile"
              style={{ padding: 6 }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute', top: 60, left: 0, right: 0,
              background: '#fff', borderBottom: '1px solid var(--border-mid)',
              padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12,
            }}>
            {NAV_LINKS.map(link => (
              <button key={link} onClick={() => scrollTo(link.toLowerCase())}
                className="nav-link" style={{ textAlign: 'left', padding: '8px 0', background: 'none' }}>
                {link}
              </button>
            ))}
            <a href="mailto:ir16151@gmail.com" className="btn-orange" style={{ width: 'fit-content' }}>
              HIRE ME
            </a>
          </motion.div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────────────────── */}
      <section id="about" style={{ paddingTop: 60, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* HUGE NAME */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          borderBottom: '1px solid var(--border-mid)', overflow: 'hidden',
        }}>
          {/* Name block */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ padding: '32px 40px 24px', overflow: 'hidden', textAlign: 'center' }}
          >
            <div className="hero-title" style={{
              fontSize: 'clamp(48px, 11vw, 140px)',
              letterSpacing: '-0.03em',
            }}>
              IRFAN
            </div>
            <div className="hero-title" style={{
              fontSize: 'clamp(48px, 11vw, 140px)',
              letterSpacing: '-0.03em',
              WebkitTextStroke: '2px var(--text)',
              color: 'transparent',
            }}>
              RASYID
            </div>
          </motion.div>

          {/* Bottom row: description + role + stats */}
          <div className="hero-bottom-row" style={{
            display: 'grid', 
            borderTop: '1px solid var(--border-mid)',
            width: '100%',
            maxWidth: '100vw'
          }}>
            {/* Description cell */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="hero-cell"
              style={{ 
                padding: '48px 56px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center'
              }}
            >
              <p style={{ fontSize: 'clamp(18px, 1.5vw, 24px)', lineHeight: 1.6, color: 'var(--text-mid)', marginBottom: 32, maxWidth: 500 }}>
                Building data-driven solutions and modern web experiences. Currently seeking new opportunities.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <a href="#projects" className="btn-orange" style={{ padding: '16px 28px', fontSize: 14 }} onClick={e => { e.preventDefault(); scrollTo('projects'); }}>
                  VIEW MY WORK
                </a>
                <a href="mailto:ir16151@gmail.com" className="btn-outline" style={{ padding: '16px 28px', fontSize: 14 }}>
                  CONTACT ME
                </a>
              </div>
            </motion.div>

            {/* Typewriter / role cell */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="hero-cell"
              style={{
                padding: '48px 56px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
                CURRENTLY A
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800,
                  fontSize: 'clamp(32px, 4vw, 56px)', textTransform: 'uppercase',
                  letterSpacing: '-0.01em', color: 'var(--orange)',
                }}>
                  {typedRole}
                </span>
                <span style={{
                  width: 4, height: 'clamp(32px, 4vw, 56px)', background: 'var(--orange)',
                  animation: 'fadeIn 0.8s steps(2, start) infinite',
                  display: 'inline-block',
                }} />
              </div>
              <div style={{ marginTop: 32, display: 'flex', gap: 20 }}>
                <a href="https://github.com/IrfanRasyid/" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--text-muted)', transition: 'color .2s', transform: 'scale(1.5)', transformOrigin: 'left center' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'var(--orange)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  <GithubIcon />
                </a>
                <a href="#" style={{ color: 'var(--text-muted)', transition: 'color .2s', transform: 'scale(1.5)', transformOrigin: 'center center' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'var(--orange)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  <LinkedinIcon />
                </a>
                <a href="mailto:ir16151@gmail.com" style={{ color: 'var(--text-muted)', transition: 'color .2s', transform: 'scale(1.5)', transformOrigin: 'center center' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'var(--orange)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                  <Mail size={18} />
                </a>
              </div>
            </motion.div>

            {/* Stats cell */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="hero-cell hero-stats-cell"
              style={{ 
                padding: '48px 56px', 
                display: 'grid', gap: 40, alignContent: 'center',
                gridTemplateColumns: '1fr 1fr'
              }}
            >
              {[
                { n: 10, s: '+', label: 'Projects\nDelivered' },
                { n: 3, s: '+', label: 'Years of\nExperience' },
                { n: 14, s: '', label: 'GitHub\nRepositories' },
                { n: 100, s: '%', label: 'Open to\nOpportunities' },
              ].map(({ n, s, label }) => (
                <div key={label}>
                  <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(48px, 5vw, 64px)',
                    fontWeight: 900, color: 'var(--orange)', lineHeight: 1,
                  }}>
                    <AnimatedNumber to={n} suffix={s} />
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Tech marquee strip */}
        <div style={{
          borderBottom: '1px solid var(--border-mid)', overflow: 'hidden',
          height: 44, display: 'flex', alignItems: 'center', background: 'var(--bg-white)',
        }}>
          <div className="marquee-track" style={{ display: 'flex', gap: 48, whiteSpace: 'nowrap' }}>
            {[...TECH_STACK, ...TECH_STACK].map((t, i) => (
              <span key={i} style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span className="orange-sq" style={{ width: 6, height: 6 }} />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          EXPERIENCE
      ───────────────────────────────────────────────────────── */}
      <section id="experience" style={{ padding: '96px 0', background: 'var(--bg-white)', borderTop: '1px solid var(--border-mid)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>

          {/* Heading */}
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} style={{ marginBottom: 64 }}>
            <div className="section-tag" style={{ marginBottom: 16 }}>
              <span className="orange-sq" /> EXPERIENCE
            </div>
            <div className="section-title" style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
              WHAT I'VE <span style={{ color: 'var(--orange)' }}>DONE</span>
            </div>
          </motion.div>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {EXPERIENCE.map((exp, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  display: 'grid', gridTemplateColumns: '200px 1fr',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 32, paddingBottom: 32, gap: 40,
                }}>
                {/* Left: period */}
                <div style={{ paddingTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div className="exp-dot" />
                    {i < EXPERIENCE.length - 1 && (
                      <div style={{ display: 'none' }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {exp.period}
                  </div>
                </div>

                {/* Right: details */}
                <div>
                  <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{exp.role}</h3>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 500 }}>
                    {exp.company}
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {exp.bullets.map((b, j) => (
                      <li key={j} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-mid)' }}>
                        <span className="orange-sq" style={{ marginTop: 5 }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Education strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
            style={{
              marginTop: 48, padding: '32px', background: 'var(--bg)',
              border: '1px solid var(--border-mid)', display: 'flex',
              alignItems: 'center', gap: 24, position: 'relative',
            }}>
            <span className="corner-dot tl" /><span className="corner-dot br" />
            <div style={{
              width: 48, height: 48, background: 'var(--orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>EDUCATION</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Bachelor of Computer Science</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Universitas Mercubuana · 2020 – 2024</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SKILLS
      ───────────────────────────────────────────────────────── */}
      <section id="skills" style={{ padding: '96px 0', borderTop: '1px solid var(--border-mid)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} style={{ marginBottom: 64 }}>
            <div className="section-tag" style={{ marginBottom: 16 }}>
              <span className="orange-sq" /> SKILLS
            </div>
            <div className="section-title" style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
              MY <span style={{ color: 'var(--orange)' }}>TOOLBOX</span>
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 1, border: '1px solid var(--border-mid)' }}>
            {SKILLS.map((cat, ci) => (
              <motion.div key={ci}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: ci * 0.1 }}
                style={{
                  padding: '36px 32px', background: 'var(--bg-white)',
                  borderRight: ci < SKILLS.length - 1 ? '1px solid var(--border-mid)' : 'none',
                }}>
                {/* Category header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                  <div style={{ color: 'var(--orange)' }}>{cat.icon}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {cat.cat}
                  </span>
                </div>
                {cat.items.map(({ name, pct }, si) => (
                  <SkillBar key={si} name={name} pct={pct} />
                ))}
              </motion.div>
            ))}
          </div>

          {/* Tech pills cloud */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
            style={{ marginTop: 48, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Machine Learning', 'Data Visualization', 'ETL Pipelines', 'Clean Architecture',
              'JWT Auth', 'Responsive Design', 'Agile / Scrum', 'Git / GitHub Actions',
              'Netlify', 'Vercel', 'PLpgSQL', 'REST API'].map((tag, i) => (
                <span key={i} style={{
                  padding: '6px 14px', border: '1px solid var(--border-dark)',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--text-mid)',
                  transition: 'all .2s', cursor: 'default',
                }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--orange)';
                    (e.currentTarget as HTMLElement).style.color = '#fff';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--orange)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-mid)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-dark)';
                  }}
                >{tag}</span>
              ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          PROJECTS
      ───────────────────────────────────────────────────────── */}
      <section id="projects" style={{ padding: '96px 0', background: 'var(--bg-white)', borderTop: '1px solid var(--border-mid)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px' }}>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} style={{ marginBottom: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div className="section-tag" style={{ marginBottom: 16 }}>
                <span className="orange-sq" /> PORTFOLIO
              </div>
              <div className="section-title" style={{ fontSize: 'clamp(36px, 6vw, 72px)' }}>
                FEATURED <span style={{ color: 'var(--orange)' }}>PROJECTS</span>
              </div>
            </div>
            {!ghLoading && (
              <a href="https://github.com/IrfanRasyid?tab=repositories"
                target="_blank" rel="noopener noreferrer" className="btn-outline"
                style={{ marginBottom: 8 }}>
                <GithubIcon /> ALL REPOS
              </a>
            )}
          </motion.div>

          {/* GitHub error banner */}
          {ghError && (
            <div style={{
              marginBottom: 32, padding: '12px 20px', border: '1px solid #e8a400',
              background: '#fffbf0', fontSize: 12, color: '#a06d00', display: 'flex', gap: 8,
            }}>
              ⚠️ GitHub API unavailable ({ghError}) — showing cached data
            </div>
          )}

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {ghLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ padding: 28, border: '1px solid var(--border-mid)', background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 4 }} />
                    <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div className="skeleton" style={{ width: 60, height: 20 }} />
                    <div className="skeleton" style={{ width: 80, height: 20 }} />
                  </div>
                  <div className="skeleton" style={{ width: '75%', height: 20, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: 60, height: 12, marginBottom: 16 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ width: '100%', height: 12 }} />
                    <div className="skeleton" style={{ width: '85%', height: 12 }} />
                    <div className="skeleton" style={{ width: '70%', height: 12 }} />
                  </div>
                </div>
              ))
              : (ghError ? PROJECTS_FALLBACK : ghProjects).map((p, idx) => (
                <ProjectCard key={idx} project={p} idx={idx} />
              ))
            }
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          CONTACT
      ───────────────────────────────────────────────────────── */}
      <section id="contact" style={{ borderTop: '1px solid var(--border-mid)' }}>
        {/* Orange band */}
        <div style={{ background: 'var(--orange)', padding: '80px 40px', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative grid lines */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ maxWidth: 640 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
                LET'S TALK
              </div>
              <div style={{
                fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, textTransform: 'uppercase',
                fontSize: 'clamp(40px, 8vw, 96px)', color: '#fff', lineHeight: 0.9, marginBottom: 32,
                letterSpacing: '-0.02em',
              }}>
                OPEN TO NEW<br />OPPORTUNITIES
              </div>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
                Looking for internships, freelance work, or full-time roles in Teaching Coding and Design, Data Analytics or Web Development. Let's build something great together.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="mailto:ir16151@gmail.com" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                  background: '#fff', color: 'var(--orange)', fontWeight: 700, fontSize: 12,
                  letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'transform .2s',
                }}
                  onMouseOver={e => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)')}
                  onMouseOut={e => ((e.currentTarget as HTMLElement).style.transform = 'translateY(0)')}>
                  <Mail size={16} /> SEND EMAIL
                </a>
                <a href="https://github.com/IrfanRasyid/" target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                    background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 12,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: '1px solid rgba(255,255,255,0.4)', transition: 'all .2s',
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <GithubIcon /> GITHUB
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Contact details strip */}
        <div style={{ background: 'var(--bg-dark)', padding: '0 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { icon: <Mail size={16} />, label: 'EMAIL', value: 'ir16151@gmail.com', href: 'mailto:ir16151@gmail.com' },
              { icon: <Phone size={16} />, label: 'PHONE', value: '+62 851-5680-2044', href: 'tel:+6285156802044' },
              { icon: <MapPin size={16} />, label: 'LOCATION', value: 'Jakarta, Indonesia', href: '#' },
            ].map(({ icon, label, value, href }, i) => (
              <a key={i} href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '24px 32px',
                  borderRight: 'none', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color .2s',
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
                onMouseOver={e => ((e.currentTarget as HTMLElement).style.color = 'var(--orange)')}
                onMouseOut={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}>
                <span style={{ color: 'var(--orange)' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', marginBottom: 2, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--bg-dark)', padding: '24px 40px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, background: 'var(--orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 12, color: '#fff',
            }}>IR</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              © 2026 Irfan Rasyid — Built with React + Vite
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {NAV_LINKS.map(link => (
              <button key={link} onClick={() => scrollTo(link.toLowerCase())}
                style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', background: 'none', cursor: 'pointer', transition: 'color .2s' }}
                onMouseOver={e => ((e.currentTarget as HTMLElement).style.color = 'var(--orange)')}
                onMouseOut={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)')}>
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          
          .hero-title {
             font-size: clamp(48px, 16vw, 140px) !important;
          }
          
          .hero-bottom-row {
            grid-template-columns: 1fr !important;
          }
          
          .hero-cell {
            border-right: none !important;
            border-bottom: 1px solid var(--border-mid);
            padding: 32px 24px !important;
          }
          
          .hero-cell:last-child {
            border-bottom: none;
          }
          
          .hero-stats-cell {
             grid-template-columns: 1fr 1fr !important;
             gap: 24px !important;
          }
        }
        
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .hero-bottom-row {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) !important;
            width: 100% !important;
          }
          .hero-cell {
            border-right: 1px solid var(--border-mid);
            min-width: 0;
          }
          .hero-cell:last-child {
            border-right: none;
          }
          .hero-stats-cell {
             grid-template-columns: 1fr 1fr !important;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
