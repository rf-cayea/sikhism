import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, ArrowLeft, BookOpen, Bookmark, Check, CheckCircle2, ChevronRight, Circle, Clock3, Compass, Heart, Home as HomeIcon, Leaf, Moon, Search, Settings2, Sparkles, Sun, X } from 'lucide-react';
import { lessons } from './content';
import { getBani, matchesBani, normalizeVerse, translationNames } from './data.mjs';

const icons = { sun: Sun, book: BookOpen, leaf: Leaf, heart: Heart, circle: Circle, home: HomeIcon };
const nav = [['/', 'Discover', Compass], ['/gurbani', 'Gurbani', BookOpen], ['/learn', 'Learn Sikhi', Leaf], ['/saved', 'Saved', Bookmark]];

function useRoute() {
  const [hash, setHash] = useState(location.hash.slice(1) || '/');
  useEffect(() => {
    const update = () => setHash(location.hash.slice(1) || '/');
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const [path, query] = hash.split('?');
  return { path, params: new URLSearchParams(query) };
}
function useStored(key, initial, validate) {
  const [value, setValue] = useState(() => {
    try { const item = JSON.parse(localStorage.getItem(key)); return validate(item) ? item : initial; } catch { return initial; }
  });
  const [failed, setFailed] = useState(false);
  function update(next) {
    setValue(current => {
      const result = typeof next === 'function' ? next(current) : next;
      try { localStorage.setItem(key, JSON.stringify(result)); } catch { setFailed(true); }
      return result;
    });
  }
  return [value, update, failed];
}
function useResource(path) {
  const [state, setState] = useState({ loading: !!path, data: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!path) { setState({ loading: false, data: null, error: '' }); return; }
    const controller = new AbortController();
    setState({ loading: true, data: null, error: '' });
    getBani(path, controller.signal)
      .then(data => { if (!controller.signal.aborted) setState({ data, error: '', loading: false }); })
      .catch(error => { if (!controller.signal.aborted) setState({ data: null, error: error.message, loading: false }); });
    return () => controller.abort();
  }, [path, attempt]);
  return { ...state, retry: () => setAttempt(n => n + 1) };
}
function Link({ to, children, ...props }) { return <a href={`#${to}`} {...props}>{children}</a>; }
function Eyebrow({ children }) { return <p className="eyebrow">{children}</p>; }
function Loading() { return <div className="loading" role="status"><span className="spinner" /> Bringing your reading to you…</div>; }
function ErrorBox({ message, retry }) {
  return <div className="error-box" role="alert"><BookOpen size={26} /><div><h3>A little pause in your reading</h3><p>{message}</p><div className="inline-actions"><button className="text-button" onClick={retry}>Try again <ArrowRight size={15} /></button><Link to="/learn">Explore Learn Sikhi</Link></div></div></div>;
}

function SanctuaryArt() {
  return <svg className="sanctuary-art" viewBox="0 0 540 400" fill="none" role="img" aria-labelledby="art-title"><title id="art-title">An illustration of a gurdwara beside a quiet pool</title>
    <defs><linearGradient id="sky" x2="0" y2="1"><stop stopColor="#eadbbd"/><stop offset="1" stopColor="#f5eddf"/></linearGradient><pattern id="ripples" width="65" height="16" patternUnits="userSpaceOnUse"><path d="M5 8h35m10 0h9" stroke="#abc5bb" strokeWidth="1"/></pattern><linearGradient id="dome" x2="1" y2="0"><stop stopColor="#bd8b42"/><stop offset=".5" stopColor="#ebc784"/><stop offset="1" stopColor="#c59b52"/></linearGradient></defs>
    <circle cx="280" cy="195" r="163" fill="url(#sky)"/><circle cx="385" cy="94" r="26" fill="#fff8e7"/>
    <path d="M47 285c45-17 65-9 90-13m290 0c23-7 42-4 67 8" stroke="#a9b8a3" strokeWidth="2"/>
    <path d="M73 290h395v72H73z" fill="#d0dfd3"/><path d="M73 290h395v72H73z" fill="url(#ripples)"/>
    <path d="M214 309h108l-8 38h-93z" fill="#d6c8a8" opacity=".4"/>
    <path d="M124 280h294v10H124z" fill="#d2b77d"/><path d="M135 268h272v12H135z" fill="#e7d8b6"/>
    <path d="M170 192h202v76H170z" fill="#f8efd8" stroke="#cfb37c"/>
    <path d="M160 187h222v10H160z" fill="#ceac69"/><path d="M209 164h124v106H209z" fill="#fff4d9" stroke="#c4a05e"/>
    <path d="M203 158h136v10H203z" fill="#cbaa66"/>
    <path d="M216 153c0-28 42-35 55-68 13 33 55 40 55 68H216Z" fill="url(#dome)" stroke="#b78c43"/>
    <path d="M271 89v-23" stroke="#bd8c3c" strokeWidth="3"/><circle cx="271" cy="64" r="3" fill="#bd8c3c"/>
    <path d="M251 268v-44q20-29 40 0v44" fill="#50645a"/><path d="M248 268v-46q23-34 46 0v46" stroke="#bf9b59" strokeWidth="3"/>
    <path d="M227 188v-9q7-13 14 0v9m60 0v-9q7-13 14 0v9" fill="#c6b07c"/>
    {[183, 345].map(x => <g key={x}><path d={`M${x} 246v-24q7-12 14 0v24`} fill="#879582"/><path d={`M${x-3} 268v-64h20v64`} stroke="#d0bb8c"/></g>)}
    {[147, 383].map(x => <g key={x}><path d={`M${x} 270v-119h18v119`} fill="#f7e8c4" stroke="#c5a46b"/><path d={`M${x-4} 151c0-12 12-14 13-27 1 13 13 15 13 27z`} fill="url(#dome)"/><path d={`M${x-5} 153h28v5h-28m5 32h18m-18 39h18`} stroke="#ba9758" strokeWidth="2"/></g>)}
    <path d="M103 274v-97m0 0 25 11-25 10" stroke="#c68d37" strokeWidth="2" fill="#d6a34a"/>
    <path d="M92 364h358" stroke="#afc4b6"/><path d="M112 88h27m-13-13v27" stroke="#b89962" opacity=".5"/>
    <path d="M426 178h14m-7-7v14" stroke="#b89962" opacity=".5"/>
  </svg>;
}

function SearchForm({ initial = '', initialType = '3' }) {
  const [query, setQuery] = useState(initial);
  const [type, setType] = useState(initialType);
  useEffect(() => { setQuery(initial); setType(initialType); }, [initial, initialType]);
  return <form className="search-form" onSubmit={e => { e.preventDefault(); if (query.trim()) location.hash = `/gurbani?q=${encodeURIComponent(query.trim())}&type=${type}`; }}>
    <div className="search-input"><Search size={20} /><input aria-label="Search Gurbani" placeholder="Search a word, a verse, a meaning…" value={query} onChange={e => setQuery(e.target.value)} required maxLength={200} /><button className="primary" type="submit" aria-label="Search"><span>Search</span><ArrowRight size={17} /></button></div>
    <div className="search-options"><label htmlFor="search-type">Search in</label><select id="search-type" value={type} onChange={e => setType(e.target.value)}><option value="3">English translation</option><option value="2">Gurmukhi words</option><option value="4">Roman transliteration</option><option value="7">First letters (English)</option></select></div>
  </form>;
}

function LessonCard({ lesson, complete }) {
  const Icon = icons[lesson.icon];
  return <Link className="lesson-card" to={`/learn/${lesson.id}`}><div className="lesson-top"><span className={`lesson-icon ${lesson.icon}`}><Icon size={23} strokeWidth={1.5} /></span><span className="time">{complete ? <><CheckCircle2 size={13} /> Completed</> : <><Clock3 size={13} /> {lesson.minutes} min read</>}</span></div><Eyebrow>{lesson.category}</Eyebrow><h3>{lesson.title}</h3><p>{lesson.summary}</p><span className="card-link">Start exploring <ArrowUpRight size={17} /></span></Link>;
}

function Discover({ completed }) {
  return <>
    <section className="hero"><div className="hero-copy"><Eyebrow><span className="small-line" /> A LITTLE CLOSER, EVERY DAY</Eyebrow><h1>A space to read.<br />A path to <em>understand.</em></h1><p>Explore the wisdom of Gurbani and discover the way of Sikhi. Wherever you’re starting, you’re welcome here.</p><div className="hero-actions"><Link className="primary" to="/gurbani">Explore Gurbani <ArrowRight size={17} /></Link><Link className="secondary" to="/learn">Begin learning <ArrowUpRight size={17} /></Link></div><div className="hero-footnote"><span className="mini-icon"><Leaf size={15} /></span> Rooted in wisdom. Open to everyone.</div></div><div className="hero-visual"><div className="art-caption">ਇੱਕ ਨਵੀਂ ਸ਼ੁਰੂਆਤ <span>A NEW BEGINNING</span></div><SanctuaryArt /><div className="art-label"><span /> Find a quiet moment.</div></div></section>
    <div className="values-strip"><span><BookOpen size={17} /> Gurbani from BaniDB</span><span><Leaf size={17} /> Learn at your own pace</span><span><Heart size={17} /> A place for every learner</span></div>
    <section className="daily-section"><div className="daily-ornament"><Sun size={36} strokeWidth={1.2} /><span>PAUSE & REFLECT</span></div><div className="daily-copy"><Eyebrow>YOUR DAILY MOMENT</Eyebrow><h2>Let reflection be part of your day.</h2><p>Read the latest available Hukamnama, with Gurmukhi, transliteration, and English translation.</p></div><Link className="secondary" to="/read/hukamnama">Read Hukamnama <ArrowUpRight size={17} /></Link></section>
    <section className="section"><div className="section-heading"><div><Eyebrow>CURIOUS IS A GOOD PLACE TO START</Eyebrow><h2>Small steps. Deeper understanding.</h2></div><Link className="text-link" to="/learn">All learning guides <ArrowRight size={17} /></Link></div><div className="lesson-grid">{lessons.slice(0, 3).map(lesson => <LessonCard key={lesson.id} lesson={lesson} complete={completed.includes(lesson.id)} />)}</div></section>
    <section className="invitation"><span className="invitation-icon"><Heart size={27} strokeWidth={1.3} /></span><div><h3>Learning becomes a way of living.</h3><p>Discover seva, community, and the everyday practice of Sikhi.</p></div><Link to="/learn/seva" className="text-link">Explore seva <ArrowRight size={17} /></Link></section>
  </>;
}

function Learn({ completed }) {
  return <div className="page-body"><div className="page-intro"><Eyebrow>A LIFELONG PRACTICE OF LEARNING</Eyebrow><h1>Begin with <em>curiosity.</em></h1><p>Approachable guides to Sikh beliefs, history, and everyday life. Take your time. There’s no perfect place to start.</p></div><div className="learning-note"><Leaf size={21} /><span>These are introductory guides, separate from Gurbani. Explore the linked resources and learn with your local Sikh community.</span><span className="progress-label">{completed.length} of {lessons.length} read</span></div><div className="lesson-grid all-lessons">{lessons.map(lesson => <LessonCard key={lesson.id} lesson={lesson} complete={completed.includes(lesson.id)} />)}</div></div>;
}
function Lesson({ id, completed, setCompleted }) {
  const lesson = lessons.find(l => l.id === id);
  if (!lesson) return <NotFound />;
  const done = completed.includes(id);
  const next = lessons[lessons.indexOf(lesson) + 1];
  return <div className="article-layout"><Link className="back-link" to="/learn"><ArrowLeft size={16} /> All learning guides</Link><article className="article"><Eyebrow>{lesson.category}</Eyebrow><h1>{lesson.title}</h1><p className="article-meta"><Clock3 size={14} /> {lesson.minutes} min read <span>•</span> An introductory guide</p><p className="article-lead">{lesson.intro}</p>{lesson.sections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}<aside className="reflection"><Sparkles size={21} /><div><Eyebrow>A MOMENT TO REFLECT</Eyebrow><p>{lesson.reflection}</p></div></aside><section className="sources"><h3>Continue learning</h3><p>Further reading and reference resources:</p>{lesson.sources.map(([title, url]) => <a key={url} href={url} target="_blank" rel="noreferrer">{title} <ArrowUpRight size={15} /></a>)}</section><div className="article-bottom"><button className={done ? 'secondary' : 'primary'} onClick={() => setCompleted(list => done ? list.filter(v => v !== id) : [...list, id])}>{done ? <CheckCircle2 size={17} /> : <Check size={17} />}{done ? 'Marked as read' : 'Mark as read'}</button>{next && <Link className="text-link" to={`/learn/${next.id}`}>Next guide <ArrowRight size={17} /></Link>}</div></article></div>;
}

function Gurbani({ params, saved, toggleSaved }) {
  const query = params.get('q') || '';
  const type = ['2', '3', '4', '7'].includes(params.get('type')) ? params.get('type') : '3';
  const rawPage = Number(params.get('page') || 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 && rawPage < 10000 ? rawPage : 1;
  const resource = useResource(query ? `search/${encodeURIComponent(query)}?searchtype=${type}&page=${page}` : 'banis');
  const [baniFilter, setBaniFilter] = useState('');
  const data = resource.data;
  const banis = Array.isArray(data) ? data : [];
  const filtered = banis.filter(bani => matchesBani(bani, baniFilter));
  const verses = Array.isArray(data?.verses) ? data.verses : [];
  const returnedPage = data?.resultsInfo?.pages?.page;
  const currentPage = Number.isInteger(returnedPage) && returnedPage > 0 ? returnedPage : page;
  return <div className="page-body"><div className="page-intro"><Eyebrow>READ. LISTEN WITHIN. REFLECT.</Eyebrow><h1>Find a moment <em>in Gurbani.</em></h1><p>Search the words that speak to you, or settle into a familiar bani. Original text is provided by BaniDB.</p></div><SearchForm initial={query} initialType={type} /><div className="section-heading reading-heading"><div><Eyebrow>{query ? 'CONTINUE YOUR EXPLORATION' : 'MAKE SPACE FOR YOUR PRACTICE'}</Eyebrow><h2>{query ? `Results for “${query}”` : 'The Bani library'}</h2></div>{query ? <Link className="text-link" to="/gurbani">Browse banis <ArrowRight size={16} /></Link> : <Link className="text-link" to="/read/hukamnama">Latest Hukamnama <ArrowUpRight size={16} /></Link>}</div>
    {resource.loading ? <Loading /> : resource.error ? <ErrorBox message={resource.error} retry={resource.retry} /> : query ? <>
      {verses.length ? <><p className="result-count">{data.resultsInfo?.totalResults ?? verses.length} matching verses · Page {currentPage}</p><div className="search-results">{verses.map((row, i) => { const verse = normalizeVerse(row); return <div className="result-card" key={verse.id ?? i}><div className="result-meta"><span>{row.source?.english || 'Gurbani'}{verse.page ? ` · Ang ${verse.page}` : ''}</span><span>{row.writer?.english}</span></div><p className="gurmukhi" lang="pa">{verse.gurmukhi}</p>{verse.translation.text && <p className="verse-translation">{verse.translation.text}</p>}<div className="result-actions"><Link className="text-link" to={`/read/shabad/${verse.shabadId}`}>Read full shabad <ArrowRight size={16} /></Link><SaveButton saved={saved} toggleSaved={toggleSaved} item={{ key: `shabad/${verse.shabadId}`, title: `Shabad${verse.page ? ` · Ang ${verse.page}` : ''}`, kind: 'Shabad' }} /></div></div>; })}</div><div className="pagination">{currentPage > 1 && <Link className="secondary" to={`/gurbani?q=${encodeURIComponent(query)}&type=${type}&page=${currentPage - 1}`}><ArrowLeft size={16} /> Previous</Link>}{currentPage < (data.resultsInfo?.pages?.totalPages || 1) && <Link className="secondary" to={`/gurbani?q=${encodeURIComponent(query)}&type=${type}&page=${currentPage + 1}`}>Next page <ArrowRight size={16} /></Link>}</div></> : <div className="empty-state"><Search size={30} /><h3>No matching verses</h3><p>Try a different word or switch the search language.</p></div>}
    </> : <><label className="library-filter"><Search size={17} /><input aria-label="Filter banis" placeholder="Find a bani…" value={baniFilter} onChange={e => setBaniFilter(e.target.value)} /></label><div className="bani-grid">{filtered.map(bani => <Link to={`/read/bani/${bani.ID}`} className="bani-card" key={bani.ID}><span className="bani-icon"><BookOpen size={22} strokeWidth={1.4} /></span><div><p lang="pa">{bani.gurmukhiUni}</p><h3>{bani.transliteration || bani.transliterations?.en || `Bani ${bani.ID}`}</h3></div><ChevronRight size={18} /></Link>)}</div>{!filtered.length && <div className="empty-state"><BookOpen size={28} /><h3>{baniFilter ? 'No banis match that name' : 'The library is empty'}</h3><p>{baniFilter ? 'Try another spelling.' : 'Please try again later.'}</p></div>}</>}
    <p className="provider-note">Gurbani content and available translations: <a href="https://www.banidb.com/" target="_blank" rel="noreferrer">BaniDB <ArrowUpRight size={12} /></a>. Translations are aids to understanding.</p>
  </div>;
}

function SaveButton({ saved, toggleSaved, item }) {
  const active = saved.some(s => s.key === item.key);
  return <button className={`save-button ${active ? 'is-saved' : ''}`} aria-label={active ? 'Remove bookmark' : 'Save reading'} aria-pressed={active} onClick={() => toggleSaved(item)}><Bookmark size={17} fill={active ? 'currentColor' : 'none'} /><span>{active ? 'Saved' : 'Save'}</span></button>;
}

function Reader({ route, saved, toggleSaved, prefs, setPrefs }) {
  const parts = route.split('/');
  const kind = parts[2];
  const id = parts[3];
  const valid = kind === 'hukamnama' ? parts.length === 3 : ['bani', 'shabad'].includes(kind) && /^\d+$/.test(id || '') && parts.length === 4;
  const path = valid ? kind === 'hukamnama' ? 'hukamnamas' : `${kind === 'bani' ? 'banis' : 'shabads'}/${id}` : null;
  const resource = useResource(path);
  const [settings, setSettings] = useState(false);
  if (!valid) return <NotFound />;
  const data = resource.data;
  const isHukam = kind === 'hukamnama';
  const groups = data ? (isHukam ? data.shabads || [] : [data]) : [];
  const date = data?.date?.gregorian;
  const dated = date ? new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(date.year, date.month - 1, date.date))) : '';
  const title = kind === 'bani' ? data?.baniInfo?.english || data?.baniInfo?.en || 'Bani reading' : isHukam ? 'A moment with the Hukamnama.' : `Shabad${data?.shabadInfo?.pageNo ? ` · Ang ${data.shabadInfo.pageNo}` : ''}`;
  const bookmark = { key: `${kind}/${id}`, title, kind: kind === 'bani' ? 'Bani' : 'Shabad' };
  return <div className="reader-layout"><Link className="back-link" to="/gurbani"><ArrowLeft size={16} /> Back to Gurbani</Link><header className="reader-heading"><Eyebrow>{isHukam ? 'LATEST AVAILABLE HUKAMNAMA' : 'A LITTLE SPACE FOR REFLECTION'}</Eyebrow><h1>{title}</h1>{dated && <p className="hukam-date">{dated} · Date supplied by BaniDB</p>}{!isHukam && data?.baniInfo?.unicode && <p className="bani-subtitle" lang="pa">{data.baniInfo.unicode}</p>}<div className="reader-toolbar"><span><BookOpen size={15} /> Gurbani · BaniDB</span><div>{!isHukam && data && <SaveButton saved={saved} toggleSaved={toggleSaved} item={bookmark} />}<button className="secondary compact" aria-expanded={settings} aria-controls="reading-settings" onClick={() => setSettings(s => !s)}><Settings2 size={16} /> Reading settings</button></div></div>{settings && <div className="reading-settings" id="reading-settings"><label><input type="checkbox" checked={prefs.translation} onChange={e => setPrefs(p => ({ ...p, translation: e.target.checked }))} /> English translation</label><label><input type="checkbox" checked={prefs.transliteration} onChange={e => setPrefs(p => ({ ...p, transliteration: e.target.checked }))} /> Transliteration</label><label>Gurmukhi text size <input aria-label="Gurmukhi text size" type="range" min="22" max="40" value={prefs.fontSize} onChange={e => setPrefs(p => ({ ...p, fontSize: Number(e.target.value) }))} /></label></div>}</header>
    {resource.loading ? <Loading /> : resource.error ? <ErrorBox message={resource.error} retry={resource.retry} /> : groups.length ? <div className="reading-content" style={{ '--verse-size': `${prefs.fontSize}px` }}>{groups.map((group, index) => <section className="shabad-group" key={index}>{group.shabadInfo && <div className="shabad-meta">{[group.shabadInfo.writer?.english, group.shabadInfo.raag?.english, group.shabadInfo.pageNo && `Ang ${group.shabadInfo.pageNo}`].filter(Boolean).join(' · ')}</div>}{(group.verses || []).map((row, i) => { const verse = normalizeVerse(row); return <div className="verse-row" key={verse.id ?? i}><span className="verse-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><div><p className="gurmukhi" lang="pa">{verse.gurmukhi}</p>{prefs.transliteration && verse.transliteration && <p className="verse-transliteration">{verse.transliteration}</p>}{prefs.translation && verse.translation.text && <><p className="verse-translation">{verse.translation.text}</p><span className="translation-source">Translation: {translationNames[verse.translation.author] || verse.translation.author || 'BaniDB'}</span></>}</div></div>; })}</section>)}</div> : <div className="empty-state"><BookOpen size={30} /><h3>No reading was returned</h3><p>Please try again later.</p><button className="secondary" onClick={resource.retry}>Try again</button></div>}
    <p className="provider-note">Original text and translations provided by <a href="https://www.banidb.com/" target="_blank" rel="noreferrer">BaniDB <ArrowUpRight size={12} /></a>. Translations offer interpretations of the original Gurbani.</p>
  </div>;
}

function Saved({ saved, toggleSaved }) {
  return <div className="page-body"><div className="page-intro"><Eyebrow>KEEP WHAT BRINGS YOU BACK</Eyebrow><h1>Your quiet <em>corner.</em></h1><p>A place for readings you’d like to return to. Bookmarks stay in this browser on this device.</p></div>{saved.length ? <div className="saved-list">{saved.map(item => <div className="saved-item" key={item.key}><span className="bani-icon"><Bookmark size={22} /></span><Link to={`/read/${item.key}`}><Eyebrow>{item.kind}</Eyebrow><h3>{item.title}</h3></Link><button className="icon-button" onClick={() => toggleSaved(item)} aria-label={`Remove ${item.title}`}><X size={18} /></button></div>)}</div> : <div className="empty-state saved-empty"><span className="empty-icon"><Bookmark size={32} strokeWidth={1.3} /></span><h2>Something to come back to.</h2><p>Save a bani or shabad as you read, and find it here whenever you need a moment.</p><Link className="primary" to="/gurbani">Find your next reading <ArrowRight size={17} /></Link></div>}</div>;
}
function NotFound() { return <div className="empty-state"><Compass size={35} /><h1>Let’s find your path.</h1><p>This page doesn’t exist.</p><Link to="/" className="primary">Back to Discover <ArrowRight size={17} /></Link></div>; }

export default function App() {
  const { path, params } = useRoute();
  const [prefs, setPrefs, prefsFailed] = useStored('sikhi-path.preferences', { theme: 'light', fontSize: 28, translation: true, transliteration: true }, v => v && ['light', 'dark'].includes(v.theme) && Number.isFinite(v.fontSize) && v.fontSize >= 22 && v.fontSize <= 40 && typeof v.translation === 'boolean' && typeof v.transliteration === 'boolean');
  const [saved, setSaved, savedFailed] = useStored('sikhi-path.saved', [], v => Array.isArray(v) && v.every(s => s && /^(bani|shabad)\/\d+$/.test(s.key) && typeof s.title === 'string' && typeof s.kind === 'string'));
  const [completed, setCompleted, completedFailed] = useStored('sikhi-path.completed', [], v => Array.isArray(v) && new Set(v).size === v.length && v.every(id => lessons.some(l => l.id === id)));
  const toggleSaved = item => setSaved(list => list.some(s => s.key === item.key) ? list.filter(s => s.key !== item.key) : [...list, item]);
  useEffect(() => { document.documentElement.dataset.theme = prefs.theme; }, [prefs.theme]);
  useEffect(() => {
    const title = path.startsWith('/learn/') ? lessons.find(l => path.endsWith(`/${l.id}`))?.title : path === '/learn' ? 'Learn Sikhi' : path === '/gurbani' ? 'Explore Gurbani' : path.startsWith('/read') ? 'Gurbani reader' : path === '/saved' ? 'Saved readings' : 'Read. Learn. Reflect.';
    document.title = `${title || 'Explore'} — Sikhi Path`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector('#main-content')?.focus({ preventScroll: true });
  }, [path, params.toString()]);
  let content;
  if (path === '/') content = <Discover completed={completed} />;
  else if (path === '/learn') content = <Learn completed={completed} />;
  else if (path.startsWith('/learn/')) content = <Lesson id={path.slice(7)} completed={completed} setCompleted={setCompleted} />;
  else if (path === '/gurbani') content = <Gurbani params={params} saved={saved} toggleSaved={toggleSaved} />;
  else if (path === '/saved') content = <Saved saved={saved} toggleSaved={toggleSaved} />;
  else if (path.startsWith('/read/')) content = <Reader route={path} saved={saved} toggleSaved={toggleSaved} prefs={prefs} setPrefs={setPrefs} />;
  else content = <NotFound />;
  return <><a href="#main-content" className="skip-link" onClick={e => { e.preventDefault(); document.querySelector('#main-content')?.focus(); }}>Skip to content</a><header className="site-header"><div className="header-inner"><Link to="/" className="brand" aria-label="Sikhi Path home"><span className="brand-mark"><BookOpen size={23} strokeWidth={1.5} /></span><span>Sikhi<span className="brand-light">Path</span><span className="brand-dot">.</span></span></Link><nav aria-label="Main navigation">{nav.map(([to, title, Icon]) => { const active = to === '/' ? path === '/' : path.startsWith(to) || (to === '/gurbani' && path.startsWith('/read/')); return <Link to={to} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} key={to}><Icon size={16} /><span>{title}</span></Link>; })}</nav><button className="theme-button icon-button" aria-label={prefs.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} onClick={() => setPrefs(p => ({ ...p, theme: p.theme === 'light' ? 'dark' : 'light' }))}>{prefs.theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button></div></header><main id="main-content" tabIndex={-1} className="site-main">{(prefsFailed || savedFailed || completedFailed) && <p className="storage-notice" role="status">Your browser couldn’t save changes. They’ll be kept for this visit only.</p>}{content}</main><footer className="site-footer"><div><Link to="/" className="footer-brand">Sikhi Path<span>.</span></Link><p>Read. Learn. Reflect.</p></div><p>A small step on a lifelong path.<br /><span>Gurbani powered by <a href="https://www.banidb.com/" target="_blank" rel="noreferrer">BaniDB</a></span></p><div className="footer-links"><Link to="/learn">Start learning <ArrowUpRight size={13} /></Link><a href="https://www.banidb.com/tos" target="_blank" rel="noreferrer">BaniDB terms <ArrowUpRight size={13} /></a></div></footer></>;
}
