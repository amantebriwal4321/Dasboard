import React, { useState, useEffect, useRef } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const load = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } };
const save = (key, v) => localStorage.setItem(key, JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const fmtDateLong = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const thisMonth = () => new Date().toISOString().slice(0, 7);
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const getWeekDates = () => {
  const dates = [], now = new Date(), dow = now.getDay(), mon = new Date(now);
  mon.setDate(now.getDate() - ((dow + 6) % 7));
  for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); dates.push(d.toISOString().slice(0, 10)); }
  return dates;
};

const CATEGORIES = {
  work:     { label: 'Work',     bg: 'bg-blue-50 text-blue-700',      dot: 'bg-blue-500'    },
  personal: { label: 'Personal', bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  learning: { label: 'Learning', bg: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-500'   },
  health:   { label: 'Health',   bg: 'bg-rose-50 text-rose-700',       dot: 'bg-rose-500'    },
};
const GOAL_CATS = ['Career', 'Skills', 'Finance', 'Health', 'Personal'];
const GOAL_CAT_STYLES = {
  Career:   'bg-blue-50 text-blue-700',
  Skills:   'bg-violet-50 text-violet-700',
  Finance:  'bg-emerald-50 text-emerald-700',
  Health:   'bg-rose-50 text-rose-700',
  Personal: 'bg-sky-50 text-sky-700',
};
const PRI_LABELS = { high: '↑ High', medium: '→ Med', low: '↓ Low' };
const PRI_STYLES = { high: 'text-rose-600', medium: 'text-amber-600', low: 'text-gray-400' };

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = ({ d, className = 'w-4 h-4', fill = false }) => (
  <svg className={className} fill={fill ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke={fill ? 'none' : 'currentColor'} strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={d}/></svg>
);
const Ic = {
  today:     (p) => <I {...p} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>,
  schedule:  (p) => <I {...p} d="M3 10h18M3 6h18M3 14h18M3 18h18"/>,
  workspace: (p) => <I {...p} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>,
  resources: (p) => <I {...p} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>,
  monthly:   (p) => <I {...p} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>,
  goals:     (p) => <I {...p} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>,
  plus:      (p) => <I {...p} d="M12 4v16m-8-8h16"/>,
  check:     (p) => <I {...p} d="M5 13l4 4L19 7"/>,
  trash:     (p) => <I {...p} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>,
  close:     (p) => <I {...p} d="M6 18L18 6M6 6l12 12"/>,
  edit:      (p) => <I {...p} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>,
  link:      (p) => <I {...p} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>,
  chevDown:  (p) => <I {...p} d="M19 9l-7 7-7-7"/>,
  chevRight: (p) => <I {...p} d="M9 5l7 7-7 7"/>,
  menu:      (p) => <I {...p} d="M4 6h16M4 12h16M4 18h16"/>,
  calendar:  (p) => <I {...p} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>,
  bolt:      (p) => <I {...p} d="M13 10V3L4 14h7v7l9-11h-7z"/>,
  clipboard: (p) => <I {...p} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>,
  note:      (p) => <I {...p} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>,
  ext:       (p) => <I {...p} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>,
};

// ─── Primitives ───────────────────────────────────────────────────────────────
const Checkbox = ({ checked, onChange, size = 'w-5 h-5' }) => (
  <button onClick={onChange} className={`${size} rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
    ${checked ? 'bg-blue-600 border-blue-600 animate-check' : 'border-gray-300 hover:border-blue-400 bg-white'}`}>
    {checked && <Ic.check className="w-3 h-3 text-white"/>}
  </button>
);
const ProgressBar = ({ value, color = 'bg-blue-500', h = 'h-1.5' }) => (
  <div className={`${h} w-full bg-blue-50 rounded-full overflow-hidden`}>
    <div className={`h-full ${color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }}/>
  </div>
);
const Modal = ({ open, onClose, title, children, wide }) => {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    if (open) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative card shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-50 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 !px-1.5 !rounded-full"><Ic.close className="w-4 h-4"/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
const Empty = ({ icon: C, text }) => (
  <div className="text-center py-14 select-none">
    <div className="inline-flex p-4 rounded-2xl bg-blue-50 text-blue-200 mb-3"><C className="w-7 h-7"/></div>
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  TODAY
// ═══════════════════════════════════════════════════════════════════════════════
function TodayView({ tasks, setTasks }) {
  const [input, setInput] = useState('');
  const [cat, setCat] = useState('work');
  const [pri, setPri] = useState('medium');
  const [showDone, setShowDone] = useState(true);
  const ref = useRef(null);
  const td = todayStr();
  const todayTasks = tasks.filter(t => t.date === td);
  const pending = todayTasks.filter(t => !t.done);
  const done = todayTasks.filter(t => t.done);

  useEffect(() => {
    const y = daysFromNow(-1);
    const left = tasks.filter(t => t.date === y && !t.done && !t.carriedOver);
    if (!left.length) return;
    setTasks(prev => {
      const flagged = prev.map(t => t.date === y && !t.done ? { ...t, carriedOver: true } : t);
      const copies = left.map(t => ({ ...t, id: uid(), date: td, carriedOver: true, done: false }));
      return [...flagged, ...copies];
    });
  }, []);

  const add = () => { const t = input.trim(); if (!t) return; setTasks(prev => [{ id: uid(), title: t, category: cat, priority: pri, done: false, date: td, carriedOver: false, createdAt: Date.now() }, ...prev]); setInput(''); ref.current?.focus(); };
  const toggle = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const del = (id) => setTasks(p => p.filter(t => t.id !== id));
  const pct = todayTasks.length ? Math.round((done.length / todayTasks.length) * 100) : 0;

  const Task = ({ task: t }) => (
    <div className={`group flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200 ${t.done ? 'opacity-50' : 'card card-hover'}`}>
      <div className="mt-0.5"><Checkbox checked={t.done} onChange={() => toggle(t.id)}/></div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${t.done ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>{t.title}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`tag ${CATEGORIES[t.category]?.bg}`}>{CATEGORIES[t.category]?.label}</span>
          <span className={`text-xs font-semibold ${PRI_STYLES[t.priority]}`}>{PRI_LABELS[t.priority]}</span>
          {t.carriedOver && <span className="text-xs text-orange-500 font-medium">↰ carried</span>}
        </div>
      </div>
      <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all p-1"><Ic.trash className="w-3.5 h-3.5"/></button>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="section-label">{fmtDate(td)}</p>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">Today <span className="text-gray-300">·</span> <span className="text-base text-gray-400 font-normal">{pending.length} remaining</span></h1>
        {todayTasks.length > 0 && <div className="mt-3"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>{done.length}/{todayTasks.length}</span><span className={pct === 100 ? 'text-emerald-600 font-bold' : ''}>{pct}%</span></div><ProgressBar value={pct} color={pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}/></div>}
      </div>
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <input ref={ref} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="What needs to be done?" className="input-base flex-1"/>
          <button onClick={add} className="btn-primary !px-3"><Ic.plus className="w-4 h-4"/></button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(CATEGORIES).map(([k, v]) => <button key={k} onClick={() => setCat(k)} className={`tag cursor-pointer transition-all ${k === cat ? v.bg + ' ring-2 ring-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{v.label}</button>)}
          <div className="w-px bg-gray-200 self-stretch mx-0.5"/>
          {['high','medium','low'].map(p => <button key={p} onClick={() => setPri(p)} className={`tag cursor-pointer transition-all ${p === pri ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>)}
        </div>
      </div>
      {pending.length > 0 && <div className="space-y-2"><h3 className="section-label">Pending</h3>{pending.map(t => <Task key={t.id} task={t}/>)}</div>}
      {!todayTasks.length && <Empty icon={Ic.bolt} text="No tasks yet — add one above!"/>}
      {pct === 100 && done.length > 0 && <div className="card p-4 text-center bg-emerald-50 border-emerald-200"><p className="text-emerald-700 font-bold text-sm">🎉 All done today!</p><p className="text-emerald-600/70 text-xs mt-0.5">{done.length} task{done.length > 1 ? 's' : ''} completed</p></div>}
      {done.length > 0 && (
        <div className="space-y-2">
          <button onClick={() => setShowDone(p => !p)} className="flex items-center gap-1.5 section-label hover:text-gray-600 transition-colors">
            {showDone ? <Ic.chevDown className="w-3 h-3"/> : <Ic.chevRight className="w-3 h-3"/>} Completed ({done.length})
          </button>
          {showDone && done.map(t => <Task key={t.id} task={t}/>)}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SCHEDULER
// ═══════════════════════════════════════════════════════════════════════════════
function SchedulerView({ tasks, setTasks }) {
  const [input, setInput] = useState('');
  const [sel, setSel] = useState(todayStr());
  const [cat, setCat] = useState('work');
  const week = getWeekDates();
  const tmr = daysFromNow(1);
  const td = todayStr();

  const add = () => { const t = input.trim(); if (!t) return; setTasks(p => [{ id: uid(), title: t, category: cat, priority: 'medium', done: false, date: sel, carriedOver: false, createdAt: Date.now() }, ...p]); setInput(''); };
  const toggle = (id) => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const del = (id) => setTasks(p => p.filter(t => t.id !== id));
  const dayN = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
  const dayD = (iso) => new Date(iso + 'T00:00:00').getDate();

  return (
    <div className="space-y-5 animate-fade-in">
      <div><p className="section-label">Schedule</p><h1 className="text-2xl font-extrabold text-gray-900">Week Planner</h1></div>
      <div className="card p-3">
        <div className="grid grid-cols-7 gap-1.5">
          {week.map(d => {
            const cnt = tasks.filter(t => t.date === d && !t.done).length;
            return (
              <button key={d} onClick={() => setSel(d)}
                className={`flex flex-col items-center py-2.5 rounded-xl text-xs font-medium transition-all duration-200
                  ${d === sel ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : d === td ? 'bg-blue-50 text-blue-700' : d < td ? 'text-gray-300' : 'text-gray-600 hover:bg-blue-50/60'}`}>
                <span className="text-[10px] uppercase">{dayN(d)}</span>
                <span className="text-lg font-bold mt-0.5">{dayD(d)}</span>
                {cnt > 0 && <span className={`w-1.5 h-1.5 rounded-full mt-1 ${d === sel ? 'bg-white' : 'bg-blue-400'}`}/>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setSel(td)} className={`btn-secondary flex-1 ${sel === td ? '!bg-blue-600 !text-white' : ''}`}>Today</button>
        <button onClick={() => setSel(tmr)} className={`btn-secondary flex-1 ${sel === tmr ? '!bg-blue-600 !text-white' : ''}`}>Tomorrow</button>
      </div>
      <div className="card p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">{fmtDateLong(sel)}</p>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={`Add task for ${fmtDate(sel)}…`} className="input-base flex-1"/>
          <button onClick={add} className="btn-primary !px-3"><Ic.plus className="w-4 h-4"/></button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(CATEGORIES).map(([k, v]) => <button key={k} onClick={() => setCat(k)} className={`tag cursor-pointer transition-all ${k === cat ? v.bg + ' ring-2 ring-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{v.label}</button>)}
        </div>
      </div>
      {(() => {
        const dt = tasks.filter(t => t.date === sel), p = dt.filter(t => !t.done), dn = dt.filter(t => t.done);
        if (!dt.length) return <Empty icon={Ic.calendar} text={`No tasks for ${fmtDate(sel)}`}/>;
        return <div className="space-y-2">{p.map(t => (
          <div key={t.id} className="card card-hover p-3.5 flex items-start gap-3 group">
            <div className="mt-0.5"><Checkbox checked={false} onChange={() => toggle(t.id)}/></div>
            <div className="flex-1 min-w-0"><p className="text-sm text-gray-800 font-medium">{t.title}</p><span className={`tag mt-1 ${CATEGORIES[t.category]?.bg}`}>{CATEGORIES[t.category]?.label}</span></div>
            <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all p-1"><Ic.trash className="w-3.5 h-3.5"/></button>
          </div>
        ))}{dn.map(t => (
          <div key={t.id} className="p-3.5 flex items-start gap-3 opacity-40">
            <div className="mt-0.5"><Checkbox checked={true} onChange={() => toggle(t.id)}/></div>
            <p className="text-sm line-through text-gray-400 flex-1">{t.title}</p>
          </div>
        ))}</div>;
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  WORKSPACE
// ═══════════════════════════════════════════════════════════════════════════════
function WorkspaceView() {
  const [projects, setProjects] = useState(() => load('projects', []));
  const [showModal, setShowModal] = useState(false);
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState('');
  useEffect(() => save('projects', projects), [projects]);
  const create = () => { const p = { id: uid(), title: 'New Project', description: '', links: [], notes: '', checklist: [], createdAt: Date.now() }; setProjects(prev => [p, ...prev]); setActive(p); setShowModal(true); };
  const update = (u) => setProjects(p => p.map(x => x.id === u.id ? u : x));
  const remove = (id) => { setProjects(p => p.filter(x => x.id !== id)); if (active?.id === id) { setShowModal(false); setActive(null); } };
  const filtered = projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><p className="section-label">Workspace</p><h1 className="text-2xl font-extrabold text-gray-900">Projects</h1></div>
        <button onClick={create} className="btn-primary flex items-center gap-1.5"><Ic.plus className="w-4 h-4"/> New</button>
      </div>
      {projects.length > 2 && <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="input-base"/>}
      {!filtered.length && <Empty icon={Ic.workspace} text="No projects yet"/>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(p => (
          <button key={p.id} onClick={() => { setActive(p); setShowModal(true); }} className="card card-hover p-4 text-left group space-y-2 animate-slide-up">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900 text-sm">{p.title}</h3>
              <Ic.edit className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 mt-0.5 transition-colors"/>
            </div>
            {p.description && <p className="text-xs text-gray-400 line-clamp-2">{p.description}</p>}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {p.links.length > 0 && <span className="flex items-center gap-1"><Ic.link className="w-3 h-3"/>{p.links.length}</span>}
              {p.checklist.length > 0 && <span className="flex items-center gap-1"><Ic.check className="w-3 h-3"/>{p.checklist.filter(c => c.done).length}/{p.checklist.length}</span>}
              {p.notes && <span className="flex items-center gap-1"><Ic.note className="w-3 h-3"/>Notes</span>}
            </div>
            {p.checklist.length > 0 && <ProgressBar value={(p.checklist.filter(c => c.done).length / p.checklist.length) * 100} color="bg-emerald-500"/>}
          </button>
        ))}
      </div>
      <ProjModal open={showModal} project={active} onClose={() => { setShowModal(false); setActive(null); }} onUpdate={update} onDelete={remove}/>
    </div>
  );
}
function ProjModal({ open, project, onClose, onUpdate, onDelete }) {
  const [tab, setTab] = useState('links');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [links, setLinks] = useState([]);
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [nL, setNL] = useState({ label: '', url: '' });
  const [nI, setNI] = useState('');
  useEffect(() => { if (project) { setTitle(project.title); setDesc(project.description || ''); setLinks(project.links || []); setNotes(project.notes || ''); setChecklist(project.checklist || []); setTab('links'); } }, [project]);
  const persist = (patch = {}) => { if (!project) return; onUpdate({ ...project, title, description: desc, links, notes, checklist, ...patch }); };
  const addLink = () => { const u = nL.url.trim(); if (!u) return; const l = [...links, { id: uid(), label: nL.label.trim() || u, url: u }]; setLinks(l); persist({ links: l }); setNL({ label: '', url: '' }); };
  const rmLink = (id) => { const l = links.filter(x => x.id !== id); setLinks(l); persist({ links: l }); };
  const addChk = () => { const t = nI.trim(); if (!t) return; const c = [...checklist, { id: uid(), text: t, done: false }]; setChecklist(c); persist({ checklist: c }); setNI(''); };
  const togChk = (id) => { const c = checklist.map(x => x.id === id ? { ...x, done: !x.done } : x); setChecklist(c); persist({ checklist: c }); };
  const rmChk = (id) => { const c = checklist.filter(x => x.id !== id); setChecklist(c); persist({ checklist: c }); };
  const TABS = [{ id: 'links', icon: Ic.link }, { id: 'notes', icon: Ic.note }, { id: 'checklist', icon: Ic.clipboard }];
  return (
    <Modal open={open} onClose={() => { persist(); onClose(); }} title="" wide>
      <div className="-mx-6 -mt-6">
        <div className="px-6 py-4 border-b border-blue-50 space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} onBlur={() => persist()} className="text-lg font-extrabold text-gray-900 bg-transparent border-none outline-none w-full placeholder:text-gray-300" placeholder="Project title…"/>
          <input value={desc} onChange={e => setDesc(e.target.value)} onBlur={() => persist()} className="text-sm text-gray-400 bg-transparent border-none outline-none w-full placeholder:text-gray-300" placeholder="Description…"/>
          <div className="flex gap-1 pt-1">{TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t.id ? 'bg-blue-50 text-blue-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}><t.icon className="w-3.5 h-3.5"/>{t.id}</button>)}</div>
        </div>
        <div className="p-6">
          {tab === 'links' && <div className="space-y-3">
            <div className="flex gap-2"><input value={nL.label} onChange={e => setNL(p => ({...p, label: e.target.value}))} placeholder="Label" className="input-base flex-1"/><input value={nL.url} onChange={e => setNL(p => ({...p, url: e.target.value}))} onKeyDown={e => e.key === 'Enter' && addLink()} placeholder="https://…" className="input-base flex-1"/><button onClick={addLink} className="btn-primary !px-3"><Ic.plus className="w-4 h-4"/></button></div>
            {!links.length && <p className="text-gray-300 text-xs text-center py-6">No links yet</p>}
            {links.map(l => <div key={l.id} className="flex items-center gap-2 group card p-3 rounded-xl"><Ic.ext className="w-4 h-4 text-gray-300 flex-shrink-0"/><a href={l.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-600 hover:underline truncate font-medium">{l.label}</a><button onClick={() => rmLink(l.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all"><Ic.close className="w-3.5 h-3.5"/></button></div>)}
          </div>}
          {tab === 'notes' && <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => persist()} placeholder="Write notes…" rows={12} className="input-base resize-none text-sm leading-relaxed"/>}
          {tab === 'checklist' && <div className="space-y-3">
            <div className="flex gap-2"><input value={nI} onChange={e => setNI(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChk()} placeholder="Add item…" className="input-base flex-1"/><button onClick={addChk} className="btn-primary !px-3"><Ic.plus className="w-4 h-4"/></button></div>
            {checklist.length > 0 && <div><ProgressBar value={(checklist.filter(c => c.done).length / checklist.length) * 100} color="bg-emerald-500"/><p className="text-xs text-gray-400 mt-1">{checklist.filter(c => c.done).length}/{checklist.length}</p></div>}
            {!checklist.length && <p className="text-gray-300 text-xs text-center py-6">No items</p>}
            {checklist.map(c => <div key={c.id} className="flex items-center gap-3 group"><Checkbox checked={c.done} onChange={() => togChk(c.id)}/><span className={`flex-1 text-sm ${c.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>{c.text}</span><button onClick={() => rmChk(c.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all"><Ic.close className="w-3.5 h-3.5"/></button></div>)}
          </div>}
          <div className="mt-6 pt-5 border-t border-blue-50 flex justify-end">
            <button onClick={() => { if (window.confirm('Delete this project?')) { onDelete(project.id); onClose(); } }} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-500 transition-colors"><Ic.trash className="w-3.5 h-3.5"/> Delete</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RESOURCES (inline links — add & open directly on cards)
// ═══════════════════════════════════════════════════════════════════════════════
function ResourcesView() {
  const [items, setItems] = useState(() => load('resources', []));
  const [showModal, setShowModal] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ topic: '', notes: '', tags: '' });
  const [expanded, setExpanded] = useState(null);
  const [inlineLink, setInlineLink] = useState({});
  useEffect(() => save('resources', items), [items]);

  const openNew = () => { setForm({ topic: '', notes: '', tags: '' }); setActiveItem(null); setShowModal(true); };
  const openEdit = (it) => { setForm({ topic: it.topic, notes: it.notes, tags: (it.tags || []).join(', ') }); setActiveItem(it); setShowModal(true); };

  const saveItem = () => {
    const topic = form.topic.trim(); if (!topic) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (activeItem) setItems(p => p.map(i => i.id === activeItem.id ? { ...i, topic, notes: form.notes, tags } : i));
    else setItems(p => [{ id: uid(), topic, notes: form.notes, links: [], tags, createdAt: Date.now() }, ...p]);
    setShowModal(false);
  };
  const deleteItem = (id) => { setItems(p => p.filter(i => i.id !== id)); setShowModal(false); };

  // Inline link management — directly on the card
  const addInlineLink = (itemId) => {
    const url = (inlineLink[itemId] || '').trim(); if (!url) return;
    setItems(p => p.map(i => i.id === itemId ? { ...i, links: [...(i.links || []), url] } : i));
    setInlineLink(p => ({ ...p, [itemId]: '' }));
  };
  const rmInlineLink = (itemId, idx) => {
    setItems(p => p.map(i => i.id === itemId ? { ...i, links: (i.links || []).filter((_, x) => x !== idx) } : i));
  };

  const filtered = items.filter(i => i.topic.toLowerCase().includes(search.toLowerCase()) || (i.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><p className="section-label">Knowledge Base</p><h1 className="text-2xl font-extrabold text-gray-900">Resources</h1></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5"><Ic.plus className="w-4 h-4"/> Add</button>
      </div>
      {items.length > 3 && <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics or tags…" className="input-base"/>}
      {!filtered.length && <Empty icon={Ic.resources} text="Save topics, links, and notes here."/>}
      <div className="space-y-3">{filtered.map(it => {
        const isExpanded = expanded === it.id;
        const links = it.links || [];
        return (
          <div key={it.id} className="card card-hover animate-slide-up overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm">{it.topic}</h3>
                  {it.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{it.notes}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(it.tags || []).map(tag => <span key={tag} className="tag bg-violet-50 text-violet-600">#{tag}</span>)}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setExpanded(isExpanded ? null : it.id)} className="btn-ghost p-1.5 !px-1.5 !rounded-full">{isExpanded ? <Ic.chevDown className="w-4 h-4"/> : <Ic.chevRight className="w-4 h-4"/>}</button>
                  <button onClick={() => openEdit(it)} className="btn-ghost p-1.5 !px-1.5 !rounded-full"><Ic.edit className="w-3.5 h-3.5"/></button>
                  <button onClick={() => { if (window.confirm('Delete?')) deleteItem(it.id); }} className="btn-ghost p-1.5 !px-1.5 !rounded-full hover:!text-rose-500"><Ic.trash className="w-3.5 h-3.5"/></button>
                </div>
              </div>

              {/* Links shown directly — clickable to open */}
              {links.length > 0 && !isExpanded && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {links.slice(0, 3).map((l, i) => (
                    <a key={i} href={l} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors truncate max-w-[200px]">
                      <Ic.ext className="w-3 h-3 flex-shrink-0"/>{l.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                    </a>
                  ))}
                  {links.length > 3 && <span className="text-xs text-gray-400">+{links.length - 3} more</span>}
                </div>
              )}
            </div>

            {/* Expanded: full links list + add link inline */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-blue-50 pt-3 bg-blue-50/30 animate-fade-in space-y-2">
                {links.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <Ic.ext className="w-3.5 h-3.5 text-blue-400 flex-shrink-0"/>
                    <a href={l} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1 font-medium">{l}</a>
                    <button onClick={() => rmInlineLink(it.id, i)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all"><Ic.close className="w-3 h-3"/></button>
                  </div>
                ))}
                {!links.length && <p className="text-xs text-gray-400 py-2">No links yet</p>}
                <div className="flex gap-2 pt-1">
                  <input value={inlineLink[it.id] || ''} onChange={e => setInlineLink(p => ({ ...p, [it.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addInlineLink(it.id)} placeholder="Paste a link and press Enter…" className="input-base flex-1 !py-2 text-xs"/>
                  <button onClick={() => addInlineLink(it.id)} className="btn-secondary !px-2.5 !py-2 text-xs"><Ic.plus className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            )}
          </div>
        );
      })}</div>

      {/* Modal only for topic / notes / tags */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={activeItem ? 'Edit Resource' : 'New Resource'}>
        <div className="space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Topic *</label><input value={form.topic} onChange={e => setForm(p => ({...p, topic: e.target.value}))} placeholder="e.g. React Patterns…" className="input-base" autoFocus/></div>
          <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Key takeaways…" rows={5} className="input-base resize-none"/></div>
          <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Tags</label><input value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} placeholder="react, AI…" className="input-base"/></div>
          <div className="flex items-center justify-between pt-2">
            {activeItem && <button onClick={() => { if (window.confirm('Delete?')) deleteItem(activeItem.id); }} className="text-xs text-gray-400 hover:text-rose-500 flex items-center gap-1"><Ic.trash className="w-3.5 h-3.5"/> Delete</button>}
            {!activeItem && <div/>}
            <div className="flex gap-2"><button onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button><button onClick={saveItem} className="btn-primary">{activeItem ? 'Save' : 'Add'}</button></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MONTHLY (with subtasks)
// ═══════════════════════════════════════════════════════════════════════════════
function MonthlyView({ tasks }) {
  const [goals, setGoals] = useState(() => load('monthlyGoals', []));
  const [showModal, setShowModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', subtasks: [] });
  const [newSub, setNewSub] = useState('');
  const [expandedGoal, setExpandedGoal] = useState(null);
  const month = thisMonth();
  const label = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  useEffect(() => save('monthlyGoals', goals), [goals]);

  const monthGoals = goals.filter(g => g.month === month);
  const monthTasks = tasks.filter(t => t.date.startsWith(month));
  const doneCnt = monthTasks.filter(t => t.done).length;
  const pct = monthTasks.length ? Math.round((doneCnt / monthTasks.length) * 100) : 0;
  const dayNum = new Date().getDate();
  const daysTotal = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const monthPct = Math.round((dayNum / daysTotal) * 100);
  const incompleteTasks = monthTasks.filter(t => !t.done && t.date < todayStr());

  const openNew = () => { setGoalForm({ title: '', subtasks: [] }); setNewSub(''); setShowModal(true); };
  const addGoal = () => {
    const t = goalForm.title.trim(); if (!t) return;
    const subs = goalForm.subtasks;
    const progress = subs.length ? Math.round((subs.filter(s => s.done).length / subs.length) * 100) : 0;
    setGoals(p => [...p, { id: uid(), title: t, progress, month, subtasks: subs, createdAt: Date.now() }]);
    setGoalForm({ title: '', subtasks: [] }); setShowModal(false);
  };
  const del = (id) => setGoals(p => p.filter(g => g.id !== id));

  // Subtask mgmt in form
  const addFormSub = () => { const t = newSub.trim(); if (!t) return; setGoalForm(p => ({ ...p, subtasks: [...p.subtasks, { id: uid(), text: t, done: false }] })); setNewSub(''); };
  const togFormSub = (id) => setGoalForm(p => ({ ...p, subtasks: p.subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s) }));
  const rmFormSub = (id) => setGoalForm(p => ({ ...p, subtasks: p.subtasks.filter(s => s.id !== id) }));

  // Toggle subtask on existing goal
  const toggleSub = (goalId, subId) => {
    setGoals(p => p.map(g => {
      if (g.id !== goalId) return g;
      const subs = (g.subtasks || []).map(s => s.id === subId ? { ...s, done: !s.done } : s);
      const progress = subs.length ? Math.round((subs.filter(s => s.done).length / subs.length) * 100) : g.progress;
      return { ...g, subtasks: subs, progress };
    }));
  };

  // Add subtask to existing goal
  const [inlineSub, setInlineSub] = useState({});
  const addInlineSub = (goalId) => {
    const t = (inlineSub[goalId] || '').trim(); if (!t) return;
    setGoals(p => p.map(g => {
      if (g.id !== goalId) return g;
      const subs = [...(g.subtasks || []), { id: uid(), text: t, done: false }];
      const progress = subs.length ? Math.round((subs.filter(s => s.done).length / subs.length) * 100) : g.progress;
      return { ...g, subtasks: subs, progress };
    }));
    setInlineSub(p => ({ ...p, [goalId]: '' }));
  };
  const rmSub = (goalId, subId) => {
    setGoals(p => p.map(g => {
      if (g.id !== goalId) return g;
      const subs = (g.subtasks || []).filter(s => s.id !== subId);
      const progress = subs.length ? Math.round((subs.filter(s => s.done).length / subs.length) * 100) : 0;
      return { ...g, subtasks: subs, progress };
    }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><p className="section-label">Monthly</p><h1 className="text-2xl font-extrabold text-gray-900">{label}</h1></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5"><Ic.plus className="w-4 h-4"/> Goal</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Month passed', v: `${monthPct}%`, c: 'text-blue-600', bar: monthPct, bc: 'bg-blue-500' },
          { l: 'Tasks done', v: `${doneCnt}/${monthTasks.length}`, c: 'text-emerald-600', bar: pct, bc: 'bg-emerald-500' },
          { l: 'Goals', v: monthGoals.length, c: 'text-amber-600' },
        ].map(c => <div key={c.l} className="card p-3.5 space-y-1.5"><p className="text-xs text-gray-400">{c.l}</p><p className={`text-xl font-extrabold ${c.c}`}>{c.v}</p>{c.bar !== undefined && <ProgressBar value={c.bar} color={c.bc}/>}</div>)}
      </div>
      {!monthGoals.length && <Empty icon={Ic.monthly} text="No goals for this month"/>}

      {monthGoals.map(g => {
        const subs = g.subtasks || [];
        const doneSubs = subs.filter(s => s.done).length;
        const expanded = expandedGoal === g.id;
        return (
          <div key={g.id} className="card card-hover overflow-hidden animate-slide-up">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {subs.length > 0 && <button onClick={() => setExpandedGoal(expanded ? null : g.id)} className="btn-ghost p-1 !px-1 !rounded-full flex-shrink-0">{expanded ? <Ic.chevDown className="w-4 h-4"/> : <Ic.chevRight className="w-4 h-4"/>}</button>}
                  <h3 className="font-bold text-gray-900 text-sm truncate">{g.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm font-extrabold ${g.progress === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>{g.progress}%</span>
                  <button onClick={() => del(g.id)} className="text-gray-300 hover:text-rose-500 transition-all"><Ic.trash className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              <ProgressBar value={g.progress} color={g.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'} h="h-2"/>
              {subs.length > 0 && <p className="text-xs text-gray-400 mt-1.5">{doneSubs}/{subs.length} subtasks done</p>}
              {subs.length === 0 && (
                <input type="range" min="0" max="100" value={g.progress}
                  onChange={e => setGoals(p => p.map(x => x.id === g.id ? { ...x, progress: parseInt(e.target.value) } : x))}
                  className="w-full mt-2 accent-blue-600 h-1 cursor-pointer"/>
              )}
            </div>
            {/* Expanded subtasks */}
            {expanded && (
              <div className="px-4 pb-4 border-t border-blue-50 pt-3 bg-blue-50/30 animate-fade-in">
                <div className="space-y-2 mb-3">
                  {subs.map(s => (
                    <div key={s.id} className="flex items-center gap-3 group">
                      <Checkbox checked={s.done} onChange={() => toggleSub(g.id, s.id)} size="w-4 h-4"/>
                      <span className={`text-sm flex-1 ${s.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{s.text}</span>
                      <button onClick={() => rmSub(g.id, s.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all"><Ic.close className="w-3 h-3"/></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={inlineSub[g.id] || ''} onChange={e => setInlineSub(p => ({ ...p, [g.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addInlineSub(g.id)} placeholder="Add subtask…" className="input-base flex-1 !py-2 text-xs"/>
                  <button onClick={() => addInlineSub(g.id)} className="btn-secondary !px-2.5 !py-2 text-xs"><Ic.plus className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {incompleteTasks.length > 0 && (
        <div>
          <h3 className="section-label text-rose-500">⚠ Missed Tasks</h3>
          <div className="space-y-1.5">{incompleteTasks.slice(0, 8).map(t => (
            <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100">
              <div className={`w-2 h-2 rounded-full ${CATEGORIES[t.category]?.dot}`}/><span className="text-sm text-rose-700 flex-1">{t.title}</span><span className="text-xs text-rose-400">{t.date.slice(5)}</span>
            </div>
          ))}</div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Monthly Goal">
        <div className="space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Goal title</label>
            <input value={goalForm.title} onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))} onKeyDown={e => e.key === 'Enter' && !goalForm.subtasks.length && addGoal()} placeholder="e.g. Ship v2 of the app" className="input-base" autoFocus/></div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Subtasks (break it down)</label>
            <div className="flex gap-2 mb-2">
              <input value={newSub} onChange={e => setNewSub(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFormSub()} placeholder="Add a step…" className="input-base flex-1"/>
              <button onClick={addFormSub} className="btn-secondary !px-3"><Ic.plus className="w-4 h-4"/></button>
            </div>
            {goalForm.subtasks.length > 0 && <div className="space-y-2 max-h-48 overflow-y-auto">{goalForm.subtasks.map(s => (
              <div key={s.id} className="flex items-center gap-3 group">
                <Checkbox checked={s.done} onChange={() => togFormSub(s.id)} size="w-4 h-4"/>
                <span className={`text-sm flex-1 ${s.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{s.text}</span>
                <button onClick={() => rmFormSub(s.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500"><Ic.close className="w-3 h-3"/></button>
              </div>
            ))}</div>}
          </div>
          <div className="flex gap-2 justify-end"><button onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button><button onClick={addGoal} className="btn-primary">Add Goal</button></div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GOALS (with dates + action lists)
// ═══════════════════════════════════════════════════════════════════════════════
function GoalsView() {
  const [goals, setGoals] = useState(() => load('longTermGoals', []));
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'Career', tags: '', deadline: '', actions: [] });
  const [nA, setNA] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [expanded, setExpanded] = useState(null);
  useEffect(() => save('longTermGoals', goals), [goals]);

  const openNew = () => { setForm({ title: '', description: '', category: 'Career', tags: '', deadline: '', actions: [] }); setEditGoal(null); setNA(''); setShowModal(true); };
  const openEdit = (g) => { setForm({ title: g.title, description: g.description || '', category: g.category, tags: (g.tags || []).join(', '), deadline: g.deadline || '', actions: g.actions || [] }); setEditGoal(g); setNA(''); setShowModal(true); };
  const saveGoal = () => {
    const title = form.title.trim(); if (!title) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const data = { title, description: form.description, category: form.category, tags, deadline: form.deadline, actions: form.actions };
    if (editGoal) setGoals(p => p.map(g => g.id === editGoal.id ? { ...g, ...data } : g));
    else setGoals(p => [...p, { id: uid(), ...data, createdAt: Date.now() }]);
    setShowModal(false);
  };
  const del = (id) => setGoals(p => p.filter(g => g.id !== id));
  const addAction = () => { const t = nA.trim(); if (!t) return; setForm(p => ({ ...p, actions: [...p.actions, { id: uid(), text: t, done: false }] })); setNA(''); };
  const togAction = (id) => setForm(p => ({ ...p, actions: p.actions.map(a => a.id === id ? { ...a, done: !a.done } : a) }));
  const rmAction = (id) => setForm(p => ({ ...p, actions: p.actions.filter(a => a.id !== id) }));
  const toggleGoalAction = (gid, aid) => setGoals(p => p.map(g => g.id === gid ? { ...g, actions: (g.actions || []).map(a => a.id === aid ? { ...a, done: !a.done } : a) } : g));

  const cats = ['All', ...GOAL_CATS];
  const filtered = goals.filter(g => filterCat === 'All' || g.category === filterCat);
  const daysUntil = (d) => { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><p className="section-label">Strategy</p><h1 className="text-2xl font-extrabold text-gray-900">Long-term Goals</h1></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5"><Ic.plus className="w-4 h-4"/> Goal</button>
      </div>
      <div className="flex gap-1.5 flex-wrap">{cats.map(c => <button key={c} onClick={() => setFilterCat(c)} className={`tag cursor-pointer transition-all ${c === filterCat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{c}</button>)}</div>
      {!filtered.length && <Empty icon={Ic.goals} text="No goals yet. Dream big."/>}
      <div className="space-y-3">{filtered.map(goal => {
        const actions = goal.actions || [], doneActs = actions.filter(a => a.done).length, dl = daysUntil(goal.deadline), exp = expanded === goal.id;
        return (
          <div key={goal.id} className="card card-hover animate-slide-up overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`tag ${GOAL_CAT_STYLES[goal.category]}`}>{goal.category}</span>
                    {(goal.tags || []).map(tag => <span key={tag} className="tag bg-gray-100 text-gray-500">#{tag}</span>)}
                    {goal.deadline && <span className={`tag ${dl !== null && dl < 0 ? 'bg-rose-50 text-rose-600' : dl !== null && dl <= 7 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}><Ic.calendar className="w-3 h-3 mr-1"/>{goal.deadline} {dl !== null && <span className="ml-1 font-bold">({dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'today' : `${dl}d left`})</span>}</span>}
                  </div>
                  <h3 className="font-bold text-gray-900 mt-2">{goal.title}</h3>
                  {goal.description && <p className="text-xs text-gray-400 mt-1">{goal.description}</p>}
                  {actions.length > 0 && <div className="mt-3 flex items-center gap-2"><ProgressBar value={actions.length ? (doneActs / actions.length) * 100 : 0} color="bg-emerald-500"/><span className="text-xs text-gray-400 flex-shrink-0">{doneActs}/{actions.length}</span></div>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {actions.length > 0 && <button onClick={() => setExpanded(exp ? null : goal.id)} className="btn-ghost p-1.5 !px-1.5 !rounded-full">{exp ? <Ic.chevDown className="w-4 h-4"/> : <Ic.chevRight className="w-4 h-4"/>}</button>}
                  <button onClick={() => openEdit(goal)} className="btn-ghost p-1.5 !px-1.5 !rounded-full"><Ic.edit className="w-3.5 h-3.5"/></button>
                  <button onClick={() => del(goal.id)} className="btn-ghost p-1.5 !px-1.5 !rounded-full hover:!text-rose-500"><Ic.trash className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            </div>
            {exp && actions.length > 0 && (
              <div className="px-4 pb-4 border-t border-blue-50 pt-3 space-y-2 bg-blue-50/30 animate-fade-in">
                {actions.map(a => <div key={a.id} className="flex items-center gap-3"><Checkbox checked={a.done} onChange={() => toggleGoalAction(goal.id, a.id)} size="w-4 h-4"/><span className={`text-sm flex-1 ${a.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{a.text}</span></div>)}
              </div>
            )}
          </div>
        );
      })}</div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editGoal ? 'Edit Goal' : 'New Goal'}>
        <div className="space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Title *</label><input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="What's the big goal?" className="input-base" autoFocus/></div>
          <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Why does it matter…" rows={2} className="input-base resize-none"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Deadline</label><input type="date" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} className="input-base"/></div>
            <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Tags</label><input value={form.tags} onChange={e => setForm(p => ({...p, tags: e.target.value}))} placeholder="AI, startup…" className="input-base"/></div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
            <div className="flex gap-1.5 flex-wrap">{GOAL_CATS.map(c => <button key={c} onClick={() => setForm(p => ({...p, category: c}))} className={`tag cursor-pointer transition-all ${c === form.category ? GOAL_CAT_STYLES[c] + ' ring-2 ring-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{c}</button>)}</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Action Items</label>
            <div className="flex gap-2 mb-2"><input value={nA} onChange={e => setNA(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAction()} placeholder="Add a step…" className="input-base flex-1"/><button onClick={addAction} className="btn-secondary !px-3"><Ic.plus className="w-4 h-4"/></button></div>
            {form.actions.length > 0 && <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">{form.actions.map(a => (
              <div key={a.id} className="flex items-center gap-2 group"><Checkbox checked={a.done} onChange={() => togAction(a.id)} size="w-4 h-4"/><span className={`text-sm flex-1 ${a.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{a.text}</span><button onClick={() => rmAction(a.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500"><Ic.close className="w-3 h-3"/></button></div>
            ))}</div>}
          </div>
          <div className="flex gap-2 justify-end pt-2"><button onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button><button onClick={saveGoal} className="btn-primary">{editGoal ? 'Save' : 'Add Goal'}</button></div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'today',     label: 'Today',     icon: Ic.today     },
  { id: 'schedule',  label: 'Schedule',  icon: Ic.schedule  },
  { id: 'workspace', label: 'Projects',  icon: Ic.workspace },
  { id: 'resources', label: 'Resources', icon: Ic.resources },
  { id: 'monthly',   label: 'Monthly',   icon: Ic.monthly   },
  { id: 'goals',     label: 'Goals',     icon: Ic.goals     },
];

export default function App() {
  const [tab, setTab] = useState('today');
  const [tasks, setTasks] = useState(() => load('tasks', []));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => save('tasks', tasks), [tasks]);
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const m = { '1':'today','2':'schedule','3':'workspace','4':'resources','5':'monthly','6':'goals' };
      if (m[e.key]) setTab(m[e.key]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const pending = tasks.filter(t => t.date === todayStr() && !t.done).length;
  const navItems = TABS.map(t => ({ ...t, badge: t.id === 'today' && pending > 0 ? pending : null }));

  return (
    <div className="min-h-screen bg-[#EFF6FF] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen border-r border-blue-100/60 bg-white fixed left-0 top-0 bottom-0 z-20">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-xl font-extrabold text-gradient">Personal OS</h1>
          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(todayStr())}</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((t, i) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`nav-item w-full justify-between ${tab === t.id ? 'active' : ''}`}>
              <span className="flex items-center gap-2.5"><t.icon className="w-4 h-4"/>{t.label}</span>
              <div className="flex items-center gap-1.5">
                {t.badge && <span className="text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{t.badge > 9 ? '9+' : t.badge}</span>}
                <span className="text-xs text-gray-300 font-mono">{i+1}</span>
              </div>
            </button>
          ))}
        </nav>
        <div className="p-5 border-t border-blue-50"><p className="text-xs text-gray-300">Press 1-6 to switch</p></div>
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 animate-fade-in">
          <div className="absolute inset-0 bg-blue-900/20" onClick={() => setSidebarOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-blue-100 flex flex-col animate-slide-up shadow-2xl">
            <div className="px-5 pt-6 pb-4 flex items-center justify-between">
              <h1 className="text-xl font-extrabold text-gradient">Personal OS</h1>
              <button onClick={() => setSidebarOpen(false)} className="btn-ghost p-1 !rounded-full"><Ic.close className="w-4 h-4"/></button>
            </div>
            <nav className="flex-1 px-3 space-y-0.5">{navItems.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSidebarOpen(false); }} className={`nav-item w-full justify-between ${tab === t.id ? 'active' : ''}`}>
                <span className="flex items-center gap-2.5"><t.icon className="w-4 h-4"/>{t.label}</span>
                {t.badge && <span className="text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{t.badge}</span>}
              </button>
            ))}</nav>
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-blue-100/60 sticky top-0 bg-white/95 backdrop-blur z-30">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-1.5 !px-1.5"><Ic.menu className="w-5 h-5 text-gray-700"/></button>
          <span className="text-sm font-bold text-gray-900">{TABS.find(t => t.id === tab)?.label}</span>
          {pending > 0 && tab !== 'today' ? <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5 font-bold">{pending}</span> : <div className="w-8"/>}
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full pb-24 lg:pb-8">
          {tab === 'today'     && <TodayView tasks={tasks} setTasks={setTasks}/>}
          {tab === 'schedule'  && <SchedulerView tasks={tasks} setTasks={setTasks}/>}
          {tab === 'workspace' && <WorkspaceView/>}
          {tab === 'resources' && <ResourcesView/>}
          {tab === 'monthly'   && <MonthlyView tasks={tasks}/>}
          {tab === 'goals'     && <GoalsView/>}
        </main>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-blue-100/60 flex z-30 shadow-lg">
          {navItems.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-all relative ${tab === t.id ? 'text-blue-600' : 'text-gray-400'}`}>
              <t.icon className="w-5 h-5"/>
              <span className="text-[10px] font-medium">{t.label}</span>
              {t.badge && <span className="absolute top-1 right-[calc(50%-16px)] text-[9px] bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">{t.badge > 9 ? '9+' : t.badge}</span>}
              {tab === t.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"/>}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
