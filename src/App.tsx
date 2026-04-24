import React, { useState, useEffect, Component } from 'react';
import { 
  Search, 
  ShieldAlert, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  LogIn,
  ExternalLink,
  ShieldX,
  MessageSquare,
  Sparkles,
  Zap,
  Bell,
  BellRing,
  History,
  FileText,
  Camera,
  Link as LinkIcon,
  ShieldAlert as ShieldIcon,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDocFromServer,
  getCountFromServer,
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit,
  updateDoc,
  doc,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, handleFirestoreError } from './lib/firebase';
import { cn, formatDate, maskData, calculateRiskScore } from './lib/utils';
import { ScamReport, ScamTargetType, ReportStatus, ScamCategory, AppNotification } from './types';

// Blacklist Database (Demo)
const PHONE_BLACKLIST = [
  '+1 (888) 234-9012',
  '+1 (800) 555-0199',
  '+44 20 7946 0958'
];

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Risk Analysis Helpers ---

function getHeuristicRisk(report: ScamReport) {
  const risks: string[] = [];
  const text = report.target + " " + report.description.toLowerCase();
  
  // 1. Website Job Scam Heuristic
  if (report.targetType === 'website') {
    if (text.includes('job') && text.includes('urgent') && text.includes('payment')) {
      risks.push("HIGH RISK: Characteristics of fraudulent recruitment (Job + Urgent + Payment)");
    }
  }

  // 2. Phone Blacklist
  if (report.targetType === 'phone' && PHONE_BLACKLIST.includes(report.target)) {
    risks.push("SCAM: This number matches records in our global threat blacklist");
  }

  // 3. GitHub Suspicious Patterns
  if (report.targetType === 'github') {
    if (text.includes('script') && text.includes('setup') && text.includes('token')) {
      risks.push("CRITICAL: Potential credential harvester. This repository requests sensitive authentication tokens during setup.");
    }
    if (text.includes('stars') && text.includes('buy') && text.includes('promo')) {
      risks.push("SUSPICIOUS: Manipulation patterns detected. This repository may be part of a 'star-buying' scam ring.");
    }
  }

  return risks;
}

// --- Home Components ---

const Hero = ({ onSearch, history }: { onSearch: (val: string) => void, history: string[] }) => {
  const [val, setVal] = useState('');
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-3 bg-dark-accent/10 text-dark-accent rounded-full inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-dark-accent/20"
      >
        <ShieldAlert size={14} />
        Real-time scam intelligence system
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-6xl md:text-8xl font-sans font-extralight tracking-tighter text-white mb-8"
      >
        Trust but <span className="text-dark-accent italic font-serif">Verify</span>.
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-dark-text-s mb-12 max-w-2xl leading-relaxed"
      >
        Search our community-powered database of thousands of reported websites, phone numbers, and GitHub repositories.
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-2xl relative"
      >
        <input 
          type="text" 
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Enter website, phone, email, or GitHub repo..."
          className="w-full h-20 pl-16 pr-40 rounded-3xl border border-dark-border focus:border-dark-accent text-lg transition-all outline-none bg-dark-surface text-white placeholder:text-dark-text-s/50 shadow-2xl"
          onKeyPress={(e) => e.key === 'Enter' && onSearch(val)}
        />
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-dark-text-s/50">
          <Search size={24} />
        </div>
        <button 
          onClick={() => onSearch(val)}
          className="absolute right-3 top-3 bottom-3 px-8 bg-dark-accent text-white rounded-2xl font-bold hover:bg-dark-accent/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-dark-accent/20"
        >
          Verify
        </button>
      </motion.div>

      {history.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 flex flex-wrap justify-center gap-3"
        >
          <span className="text-[9px] uppercase font-bold tracking-widest text-dark-text-s opacity-40 flex items-center gap-2 px-3 py-1">
            <History size={10} /> Recent:
          </span>
          {history.map((term, i) => (
            <button
              key={i}
              onClick={() => onSearch(term)}
              className="px-4 py-1.5 bg-dark-surface border border-dark-border rounded-full text-[10px] font-bold text-dark-text-s hover:border-dark-accent hover:text-white transition-all shadow-sm"
            >
              {term}
            </button>
          ))}
        </motion.div>
      )}
      
      <div className="mt-12 flex flex-wrap justify-center gap-6 text-[10px] uppercase font-bold tracking-widest text-dark-text-s">
        <span className="flex items-center gap-2"><CheckCircle2 size={12} className="text-dark-accent" /> Community Verified</span>
        <span className="flex items-center gap-2"><ShieldCheck size={12} className="text-dark-accent" /> Real-time Warnings</span>
        <span className="flex items-center gap-2"><TrendingUp size={12} className="text-dark-accent" /> Growing Database</span>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'home' | 'results' | 'report' | 'details' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ScamReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ScamReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('newest');
  const [selectedTypes, setSelectedTypes] = useState<ScamTargetType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ReportStatus[]>(['verified']); // Default to verified
  const [dbReady, setDbReady] = useState(false);
  const [recentReports, setRecentReports] = useState<ScamReport[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [globalStats, setGlobalStats] = useState({ totalReports: 0, savedEstimation: '2.1M' });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    setDbReady(true); // Don't block UI on database connection check

    // Fetch recent alerts for home page
    const fetchRecent = async () => {
      setLoadingRecent(true);
      try {
        const coll = collection(db, 'scamReports');
        const qRecent = query(
          coll, 
          where('status', '==', 'verified'),
          orderBy('createdAt', 'desc'), 
          limit(5)
        );
        const [snapRecent, snapCount] = await Promise.all([
          getDocs(qRecent),
          getCountFromServer(coll)
        ]);
        
        setRecentReports(snapRecent.docs.map(d => ({ id: d.id, ...d.data() })) as ScamReport[]);
        setGlobalStats(prev => ({ ...prev, totalReports: snapCount.data().count }));
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoadingRecent(false);
      }
    };
    fetchRecent();

    return unsub;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.info("Sign-in cancelled by user.");
        return;
      }
      if (error.code === 'auth/blocked-popup') {
        alert("The sign-in popup was blocked by your browser. Please allow popups for this site.");
        return;
      }
      console.error("Login failed:", error.code, error.message);
      alert("Sign-in failed. If you are using a private window or have popups blocked, try opening the app in a new tab.");
    }
  };

  const handleLogout = () => signOut(auth);

  // Alert System & History
  useEffect(() => {
    const savedHistory = localStorage.getItem('scam_search_history');
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));

    // Real-time listener for new verified reports to trigger alerts
    const q = query(
      collection(db, 'scamReports'),
      where('status', '==', 'verified'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newReport = { id: change.doc.id, ...change.doc.data() } as ScamReport;
          
          // Match against history
          const history = JSON.parse(localStorage.getItem('scam_search_history') || '[]');
          if (history.some((term: string) => 
            newReport.target.toLowerCase().includes(term.toLowerCase()) || 
            term.toLowerCase().includes(newReport.target.toLowerCase())
          )) {
            const newNotif: AppNotification = {
              id: Math.random().toString(36).substr(2, 9),
              title: "🚨 Match Found in Database",
              message: `A new verified scam report matching your search for "${newReport.target}" has been detected.`,
              type: 'alert',
              read: false,
              createdAt: new Date(),
              relatedReportId: newReport.id
            };
            setNotifications(prev => [newNotif, ...prev]);
            
            // Browser notification
            if (Notification.permission === 'granted') {
              new Notification(newNotif.title, { body: newNotif.message });
            }
          }
        }
      });
    });

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => unsubscribe();
  }, []);

  const handleSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    
    // Update history
    const cleanQuery = queryStr.trim().toLowerCase();
    setSearchHistory(prev => {
      const newHistory = [cleanQuery, ...prev.filter(h => h !== cleanQuery)].slice(0, 10);
      localStorage.setItem('scam_search_history', JSON.stringify(newHistory));
      return newHistory;
    });

    setLoading(true);
    setSearchQuery(queryStr);
    setView('results');
    setSelectedReport(null);
    
    try {
      // Very simple search: find exact match or contains (Firestore limitations apply)
      // For MVP we just try to find exact matches in target
      const q = query(
        collection(db, 'scamReports'), 
        where('target', '>=', queryStr.toLowerCase()),
        where('target', '<=', queryStr.toLowerCase() + '\uf8ff'),
        limit(10)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ScamReport[];
      setResults(data);
    } catch (err) {
      handleFirestoreError(err, 'list', 'scamReports');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reportId: string) => {
    if (!user) {
      alert("Please log in to vote.");
      return;
    }
    try {
      const reportRef = doc(db, 'scamReports', reportId);
      await updateDoc(reportRef, {
        votesCount: increment(1)
      });
      // Update local state
      setResults(prev => prev.map(r => r.id === reportId ? { ...r, votesCount: r.votesCount + 1 } : r));
    } catch (err) {
      handleFirestoreError(err, 'update', `scamReports/${reportId}`);
    }
  };

  const filteredAndSortedResults = React.useMemo(() => {
    let filtered = [...results];
    
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(r => selectedTypes.includes(r.targetType));
    }
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(r => selectedStatuses.includes(r.status));
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'votes') {
        return b.votesCount - a.votesCount;
      }
      // Newest
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [results, sortBy, selectedTypes, selectedStatuses]);

  const toggleTypeFilter = (type: ScamTargetType) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleStatusFilter = (status: ReportStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg font-sans text-dark-text-p selection:bg-dark-accent selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { setView('home'); setSearchQuery(''); }}
          >
            <div className="p-2 bg-dark-accent rounded-lg">
              <ShieldAlert className="text-white" size={20} />
            </div>
            <span className="text-2xl font-serif italic font-bold tracking-tighter">SCAMDB.</span>
          </div>

          <div className="flex items-center gap-8">
            <nav className="hidden lg:flex items-center gap-8">
              <div 
                className={cn("text-[11px] uppercase tracking-[0.1em] font-bold cursor-pointer transition-colors", view === 'home' ? "text-dark-accent" : "text-dark-text-s hover:text-dark-text-p")}
                onClick={() => setView('home')}
              >
                Database
              </div>
              <div 
                className="text-[11px] uppercase tracking-[0.1em] text-dark-text-s hover:text-dark-text-p transition-colors cursor-pointer relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                Alerts
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
            </nav>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  if (notifications.some(n => !n.read)) {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  }
                  setShowNotifications(!showNotifications);
                }}
                className={cn(
                  "p-2.5 rounded-full border transition-all relative",
                  notifications.some(n => !n.read) ? "bg-dark-accent/10 border-dark-accent/50 text-dark-accent" : "bg-dark-surface border-dark-border text-dark-text-s"
                )}
              >
                {notifications.some(n => !n.read) ? <BellRing size={18} /> : <Bell size={18} />}
              </button>

              <button 
                onClick={() => user ? setView('report') : handleLogin()}
                className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-dark-accent text-white rounded-full hover:bg-dark-accent/90 transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-dark-accent/20"
              >
                <PlusCircle size={14} />
                Report
              </button>
              
              {user ? (
                <div className="flex items-center gap-3 pl-6 border-l border-dark-border">
                  <div 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setView('profile')}
                  >
                    <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-dark-border group-hover:border-dark-accent transition-all" />
                    <span className="text-[10px] uppercase font-bold text-dark-text-s group-hover:text-white transition-colors hidden sm:block">Me</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-dark-text-s hover:text-red-400 transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-6 py-2.5 text-dark-text-p hover:bg-dark-surface rounded-full transition-colors font-bold text-xs uppercase tracking-wider"
                >
                  <LogIn size={14} />
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Notifications Overlay */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-20 right-8 w-80 bg-dark-surface border border-dark-border rounded-2xl shadow-2xl z-[60] overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Grid Notifications</h3>
                  <button onClick={() => setNotifications([])} className="text-[9px] font-bold uppercase text-dark-text-s hover:text-red-400">Clear All</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        if (n.relatedReportId) {
                          // Logic to view report
                        }
                        setShowNotifications(false);
                      }}
                      className="p-5 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <p className="font-bold text-white text-xs mb-1">{n.title}</p>
                      <p className="text-[10px] text-dark-text-s leading-relaxed line-clamp-2">{n.message}</p>
                      <p className="text-[9px] text-dark-accent mt-2 font-bold uppercase tracking-widest">New Threat Identified</p>
                    </div>
                  )) : (
                    <div className="p-10 text-center">
                      <BellRing size={30} className="mx-auto mb-4 opacity-10 text-dark-text-s" />
                      <p className="text-xs font-bold uppercase tracking-widest text-dark-text-s opacity-40">All clear. No active alerts.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto pb-20">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero onSearch={handleSearch} history={searchHistory} />
              
              {/* Recent Alerts */}
              <div className="px-8 max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-8 bg-dark-surface border border-dark-border rounded-2xl">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-dark-text-s mb-8 flex items-center gap-2 opacity-60">
                      <Clock size={12} />
                      Recent Activity
                    </h3>
                    <div className="grid gap-6">
                      {loadingRecent ? (
                        <div className="text-dark-text-s text-center py-4 text-xs font-bold uppercase tracking-widest opacity-40 animate-pulse">Syncing with Grid...</div>
                      ) : recentReports.length > 0 ? recentReports.map((item, i) => (
                        <div 
                          key={item.id} 
                          onClick={() => { setSelectedReport(item); setView('details'); }}
                          className="group flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-dark-accent shrink-0 animate-pulse" />
                            <div>
                              <p className="font-bold text-white text-sm tracking-tight group-hover:text-dark-accent transition-colors truncate max-w-[150px] md:max-w-[200px]">
                                {maskData(item.target, item.targetType === 'email' ? 'email' : item.targetType === 'phone' ? 'phone' : 'other')}
                              </p>
                              <div className="flex gap-2 items-center">
                                <p className="text-[10px] text-dark-text-s uppercase tracking-wider font-semibold opacity-60">{item.targetType} • {formatDate(item.createdAt)}</p>
                                <span className="text-[8px] px-1.5 py-0.5 bg-dark-accent/10 text-dark-accent border border-dark-accent/20 rounded font-bold uppercase tracking-widest">{item.scamType || 'Verified'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="px-2 py-1 bg-dark-accent/10 border border-dark-accent/20 rounded text-[9px] font-bold uppercase text-dark-accent">Verified</div>
                        </div>
                      )) : (
                        <div className="text-dark-text-s text-center py-10 border border-dashed border-white/5 rounded-xl">
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">No Verified Threats</p>
                          <p className="text-[9px] lowercase font-serif italic text-dark-text-s opacity-60">The database node is clean of verified records.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-dark-surface to-[#1e2026] border border-dark-border rounded-2xl flex flex-col">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-dark-text-s mb-8 opacity-60">
                      Live Network Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-6 flex-1">
                      <div className="p-5 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-3xl font-extralight text-white mb-1">{globalStats.totalReports > 999 ? `${(globalStats.totalReports / 1000).toFixed(1)}k` : globalStats.totalReports}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-dark-text-s">Verified Reports</div>
                      </div>
                      <div className="p-5 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-3xl font-extralight text-white mb-1">${globalStats.savedEstimation}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-dark-text-s">Est. Loss Prevented</div>
                      </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-dark-border">
                      <p className="font-serif italic text-lg text-white/90 leading-relaxed">"Global community intelligence is the only effective defense against decentralized threats."</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-8 py-12 max-w-4xl mx-auto"
            >
                <div className="flex flex-col gap-6 mb-12">
                  <div className="flex items-center gap-6 justify-between w-full">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => { setView('home'); setSelectedTypes([]); setSelectedStatuses([]); }}
                        className="p-3 bg-dark-surface border border-dark-border rounded-full hover:bg-dark-accent transition-all group"
                      >
                        <ArrowRight className="rotate-180 group-hover:text-white" size={20} />
                      </button>
                      <div>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-dark-text-s mb-1">Search Results</h2>
                        <p className="text-3xl font-extralight text-white font-sans tracking-tight">"{searchQuery}"</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-dark-text-s opacity-40">Sort By</span>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-dark-surface border border-dark-border text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg outline-none focus:border-dark-accent transition-colors cursor-pointer"
                      >
                        <option value="newest">Newest First</option>
                        <option value="votes">Most Helpful</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-6 bg-dark-surface border border-dark-border rounded-2xl">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-dark-text-s opacity-60 min-w-[80px]">Type Filter</span>
                      <div className="flex flex-wrap gap-2">
                        {(['website', 'phone', 'email', 'handle', 'github', 'other'] as ScamTargetType[]).map(type => (
                          <button
                            key={type}
                            onClick={() => toggleTypeFilter(type)}
                            className={cn(
                              "px-4 py-1.5 rounded-full border text-[9px] uppercase tracking-wider font-bold transition-all",
                              selectedTypes.includes(type)
                                ? "bg-dark-accent text-white border-dark-accent"
                                : "bg-dark-bg text-dark-text-s border-dark-border hover:border-dark-text-s/30"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-dark-text-s opacity-60 min-w-[80px]">Status Filter</span>
                      <div className="flex flex-wrap gap-2">
                        {(['pending', 'verified', 'rejected'] as ReportStatus[]).map(status => (
                          <button
                            key={status}
                            onClick={() => toggleStatusFilter(status)}
                            className={cn(
                              "px-4 py-1.5 rounded-full border text-[9px] uppercase tracking-wider font-bold transition-all",
                              selectedStatuses.includes(status)
                                ? "bg-dark-accent text-white border-dark-accent"
                                : "bg-dark-bg text-dark-text-s border-dark-border hover:border-dark-text-s/30"
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 grayscale opacity-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dark-accent mb-6"></div>
                  <p className="text-xs uppercase tracking-widest font-bold">Scanning Global Records...</p>
                </div>
              ) : filteredAndSortedResults.length > 0 ? (
                <div className="grid gap-8">
                  {filteredAndSortedResults.map((report) => (
                    <div 
                      key={report.id} 
                      onClick={() => { setSelectedReport(report); setView('details'); }}
                      className="bg-dark-surface rounded-2xl border border-dark-border overflow-hidden group hover:border-dark-accent/50 transition-all shadow-2xl cursor-pointer"
                    >
                      <div className="bg-dark-accent/10 px-8 py-4 flex items-center justify-between border-b border-dark-border/50">
                        <div className="flex items-center gap-3 text-dark-accent text-[10px] font-bold uppercase tracking-wider">
                          <div className="w-2 h-2 rounded-full bg-dark-accent animate-pulse" />
                          Verified Community Alert
                        </div>
                        <div className="text-dark-text-s text-[10px] font-bold uppercase tracking-wider">
                          {formatDate(report.createdAt.toDate ? report.createdAt.toDate() : report.createdAt)}
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-3xl font-bold text-white break-all mb-2 tracking-tight group-hover:text-dark-accent transition-colors">
                              {maskData(report.target, report.targetType === 'email' ? 'email' : report.targetType === 'phone' ? 'phone' : 'other')}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-white/5 text-dark-text-s border border-white/10 rounded text-[9px] font-bold uppercase tracking-widest">
                                {report.targetType}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8e8e93] opacity-40">Risk: </span>
                              <span className={cn("text-[10px] font-bold uppercase tracking-widest", calculateRiskScore(report.votesCount, report.status).color)}>
                                {calculateRiskScore(report.votesCount, report.status).label} ({calculateRiskScore(report.votesCount, report.status).score})
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleVote(report.id!); }}
                            className="flex flex-col items-center gap-2 group/vote"
                          >
                            <div className="p-4 rounded-full bg-white/5 group-hover/vote:bg-dark-accent group-hover/vote:text-white transition-all">
                              <TrendingUp size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-dark-text-s uppercase">{report.votesCount} votes</span>
                          </button>
                        </div>
                        <div className="bg-dark-bg p-6 rounded-xl border border-dark-border/50">
                          <p className="text-dark-text-s text-sm leading-relaxed font-sans italic opacity-80">
                            "{report.description}"
                          </p>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-dark-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-dark-text-s">
                            Status: <span className="text-dark-accent">{report.status}</span>
                          </div>
                          <div className="text-[10px] text-dark-text-s/40 font-bold uppercase tracking-wider">REF ID: {report.id!.slice(0, 8)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-dark-surface rounded-3xl p-20 text-center border border-dark-border shadow-2xl">
                  <div className="w-20 h-20 bg-dark-bg border border-dark-border text-dark-text-s/30 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ShieldCheck size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">No exposure found</h3>
                  <p className="text-dark-text-s mb-10 max-w-sm mx-auto text-sm leading-relaxed font-sans">
                    Our current global records show no confirmed phishing or scam activity specifically matching <span className="text-white">"{searchQuery}"</span>. 
                    <br/><br/>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Note: Absence of data is not guaranteed safety.</span>
                  </p>
                  <button 
                    onClick={() => user ? setView('report') : handleLogin()}
                    className="inline-flex items-center gap-2 px-10 py-4 bg-dark-accent text-white rounded-full font-bold uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-dark-accent/20"
                  >
                    Flag as New Risk
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'details' && selectedReport && (
            <DetailsView 
              report={selectedReport} 
              onBack={() => setView('results')} 
              onVote={handleVote}
              onNavigate={(r) => setSelectedReport(r)}
              user={user}
            />
          )}

          {view === 'report' && (
            <ReportView 
              user={user} 
              onComplete={() => setView('home')} 
              onBack={() => setView('home')} 
            />
          )}

          {view === 'profile' && user && (
            <UserProfileView 
              user={user}
              onBack={() => setView('home')}
              onSelectReport={(r) => { setSelectedReport(r); setView('details'); }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-8 right-8 md:hidden">
        <button 
          onClick={() => user ? setView('report') : handleLogin()}
          className="w-16 h-16 bg-dark-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-dark-accent/40"
        >
          <PlusCircle size={28} />
        </button>
      </div>
    </div>
  );
}

function UserProfileView({ user, onBack, onSelectReport }: { user: User, onBack: () => void, onSelectReport: (r: ScamReport) => void }) {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserReports() {
      try {
        const q = query(
          collection(db, 'scamReports'),
          where('reporterId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ScamReport[]);
      } catch (err) {
        console.error("Failed to fetch user reports:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserReports();
  }, [user.uid]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-8 py-12 max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-6 mb-12">
        <button 
          onClick={onBack}
          className="p-3 bg-dark-surface border border-dark-border rounded-full hover:bg-dark-accent transition-all group"
        >
          <ArrowRight className="rotate-180 group-hover:text-white" size={20} />
        </button>
        <div className="flex items-center gap-4">
          <img src={user.photoURL || ''} className="w-16 h-16 rounded-3xl border-2 border-dark-accent" alt="" />
          <div>
            <h2 className="text-3xl font-bold text-white">{user.displayName}</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-dark-text-s opacity-60">Citizen Investigator • {reports.length} Reports</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-dark-text-s flex items-center gap-2">
          <FileText size={14} />
          My Submissions
        </h3>
        
        {loading ? (
          <div className="py-20 text-center animate-pulse text-dark-text-s font-bold uppercase tracking-widest text-xs">Accessing Records...</div>
        ) : reports.length > 0 ? reports.map(r => (
          <div 
            key={r.id}
            onClick={() => onSelectReport(r)}
            className="p-6 bg-dark-surface border border-dark-border rounded-2xl flex items-center justify-between group hover:border-dark-accent/50 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                r.status === 'verified' ? "bg-green-500" : r.status === 'pending' ? "bg-yellow-500" : "bg-red-500"
              )} />
              <div>
                <p className="font-bold text-white group-hover:text-dark-accent transition-colors">{r.target}</p>
                <div className="flex gap-4 mt-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-dark-text-s opacity-60">{r.scamType}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-dark-accent">{r.status}</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-dark-text-s">
              {formatDate(r.createdAt)}
            </div>
          </div>
        )) : (
          <div className="p-20 text-center bg-dark-surface border border-dark-border border-dashed rounded-3xl opacity-40">
            <p className="text-xs font-bold uppercase tracking-widest">No reports filed yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RiskInsight({ report }: { report: ScamReport }) {
  const heuristics = getHeuristicRisk(report);

  if (heuristics.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* DB Heuristics */}
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-500">
        <ShieldX className="text-red-500 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Database Match Detected</p>
          {heuristics.map((h, i) => (
            <p key={i} className="text-xs text-red-100/80 font-medium">This is flagged scam: {h}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function AiAnalysis({ report }: { report: ScamReport }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const isGithub = report.targetType === 'github';
      const prompt = isGithub 
        ? "You are an elite cybersecurity investigator specializing in GitHub repository analysis. Analyze the following report about a suspicious repository. Look for red flags like token harvesting, malware distribution via setup scripts, or social engineering targeting developers. Provide a concise technical assessment and safety advice for researchers. Keep it under 150 words."
        : "You are an elite cybersecurity investigator. Analyze the following scam report and provide a concise risk assessment. Focus on technical red flags, social engineering tactics, and advice for potential victims. Keep it under 150 words.";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: prompt,
        },
        contents: `Scam Target: ${report.target} (${report.targetType})\nDescription: ${report.description}`,
      });
      setAnalysis(response.text || "No analysis generated.");
    } catch (err) {
      console.error("AI Analysis failed:", err);
      setAnalysis("Technical Error: AI node temporarily unavailable. Please ensure your API key is correctly configured in the dashboard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-bg border border-dark-border rounded-2xl p-6 mb-8 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-dark-accent">
          <Sparkles size={18} />
          <h3 className="text-xs font-bold uppercase tracking-widest">AI Threat Intelligence</h3>
        </div>
        {!analysis && !loading && (
          <button 
            onClick={analyze}
            className="text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Launch Deep Scan
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-dark-text-s text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse py-8 justify-center">
          <Zap size={14} className="text-dark-accent animate-bounce" />
          Decrypting Patterns...
        </div>
      )}

      {analysis && (
        <div className="text-xs text-dark-text-s leading-relaxed font-sans border-l-2 border-dark-accent pl-4 py-1 animate-in fade-in duration-700">
          {analysis}
        </div>
      )}
    </div>
  );
}

function DetailsView({ report, onBack, onVote, onNavigate, user }: { report: ScamReport, onBack: () => void, onVote: (id: string) => void, onNavigate: (r: ScamReport) => void, user: User | null }) {
  const [similarReports, setSimilarReports] = useState<ScamReport[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    async function fetchSimilar() {
      if (!report.target) return;
      setLoadingSimilar(true);
      try {
        const prefix = report.target.slice(0, 5).toLowerCase();
        const q = query(
          collection(db, 'scamReports'),
          where('target', '>=', prefix),
          where('target', '<=', prefix + '\uf8ff'),
          limit(5)
        );
        const snap = await getDocs(q);
        const docs = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as ScamReport))
          .filter(r => r.id !== report.id)
          .slice(0, 3);
        setSimilarReports(docs);
      } catch (err) {
        console.error("Failed to fetch similar reports:", err);
      } finally {
        setLoadingSimilar(false);
      }
    }
    fetchSimilar();
  }, [report.id, report.target]);

  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-8 py-12 max-w-5xl mx-auto grid lg:grid-cols-[1fr_350px] gap-8"
    >
      <div className="space-y-8">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-dark-text-s hover:text-white transition-colors group"
        >
          <ArrowRight className="rotate-180" size={14} />
          Back to Results
        </button>

        {/* Hero Info */}
        <div className="bg-dark-surface border border-dark-border p-10 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3 text-dark-accent text-[10px] font-bold uppercase tracking-widest mb-6">
            <ShieldAlert size={14} />
            Confirmatory Threat Data
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tighter break-all">
            {maskData(report.target, report.targetType === 'email' ? 'email' : report.targetType === 'phone' ? 'phone' : 'other')}
          </h1>

          {/* Risk Meter */}
          <div className="mb-10 p-6 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ShieldIcon size={14} className={calculateRiskScore(report.votesCount, report.status).color} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-dark-text-s">Grid Threat Level</span>
              </div>
              <span className={cn("text-lg font-bold", calculateRiskScore(report.votesCount, report.status).color)}>
                {calculateRiskScore(report.votesCount, report.status).label}
              </span>
            </div>
            <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${calculateRiskScore(report.votesCount, report.status).score}%` }}
                className={cn(
                  "h-full transition-all duration-1000",
                  calculateRiskScore(report.votesCount, report.status).color.replace('text-', 'bg-')
                )}
              />
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-[9px] font-bold text-dark-text-s opacity-40 uppercase tracking-tighter">Safe</span>
              <span className="text-[9px] font-bold text-dark-text-s opacity-40 uppercase tracking-tighter">Critical</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
             <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-dark-text-s">
               Type: {report.targetType}
             </span>
             <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-dark-text-s">
               Category: {report.scamType || 'General'}
             </span>
             <span className={cn(
               "px-4 py-1.5 border rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
               report.status === 'verified' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-dark-accent/10 border-dark-accent/20 text-dark-accent"
             )}>
               Status: {report.status}
             </span>
          </div>
        </div>

        {/* GitHub Specific Analysis */}
        {report.targetType === 'github' && (
          <div className="bg-dark-surface border border-dark-border p-10 rounded-3xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Github size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-dark-accent text-[10px] font-bold uppercase tracking-widest mb-6">
                <Github size={14} />
                GitHub Repository Scanner
              </div>
              <h4 className="text-xl font-bold text-white mb-4 tracking-tight">Technical Repository Audit</h4>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-dark-bg rounded-2xl border border-dark-border">
                  <p className="text-[10px] font-bold uppercase text-dark-text-s mb-1 opacity-50">Repo Identity</p>
                  <p className="text-sm font-mono text-white truncate">{report.target.split('/').pop() || report.target}</p>
                </div>
                <div className="p-4 bg-dark-bg rounded-2xl border border-dark-border">
                  <p className="text-[10px] font-bold uppercase text-dark-text-s mb-1 opacity-50">Threat Index</p>
                  <p className={cn("text-sm font-bold", calculateRiskScore(report.votesCount, report.status).color)}>
                    {calculateRiskScore(report.votesCount, report.status).score} / 100
                  </p>
                </div>
                <div className="p-4 bg-dark-bg rounded-2xl border border-dark-border">
                  <p className="text-[10px] font-bold uppercase text-dark-text-s mb-1 opacity-50">Verification Status</p>
                  <p className="text-sm font-bold text-dark-accent capitalize">{report.status}</p>
                </div>
              </div>
              <p className="text-xs text-dark-text-s leading-relaxed mb-6 italic opacity-80">
                Warning: GitHub repositories can be used to host malicious setup scripts or fake 'hack' tools. 
                Always audit the source before execution.
              </p>
              <a 
                href={report.target.startsWith('http') ? report.target : `https://github.com/${report.target}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
              >
                Inspect Original Repo <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}

        {/* Narrative */}
        <div className="bg-dark-surface border border-dark-border p-10 rounded-3xl">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-dark-text-s mb-6 border-b border-dark-border pb-4">Reported Methodology</h3>
          <p className="text-lg text-white/90 leading-relaxed font-sans italic opacity-95">
            "{report.description}"
          </p>
        </div>

        {/* Evidence Section */}
        {report.evidenceUrls && report.evidenceUrls.length > 0 && (
          <div className="bg-dark-surface border border-dark-border p-10 rounded-3xl">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-dark-text-s mb-6 flex items-center gap-2">
              <Camera size={14} />
              Community Evidence
            </h3>
            <div className="grid gap-4">
              {report.evidenceUrls.map((url, i) => (
                <a 
                  key={i} 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-dark-accent/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <LinkIcon size={16} className="text-dark-text-s" />
                    <span className="text-xs text-white/70 truncate max-w-[250px]">{url}</span>
                  </div>
                  <ExternalLink size={14} className="text-dark-text-s opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis Integration */}
        <AiAnalysis report={report} />

        {/* Full Details Table */}
        <div className="bg-dark-surface border border-dark-border rounded-3xl overflow-hidden">
          <div className="px-10 py-6 border-b border-dark-border bg-white/5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Full Record Manifest</h3>
          </div>
          <div className="p-10 grid gap-6">
            {[
              { label: 'Record ID', value: report.id },
              { label: 'First Detected', value: formatDate(report.createdAt.toDate ? report.createdAt.toDate() : report.createdAt) },
              { label: 'Source Integrity', value: report.reporterEmail ? 'Authenticated' : 'Anonymous' },
              { label: 'Reporter ID', value: report.reporterId },
              { label: 'Evidence Count', value: report.evidenceUrls?.length || 0 },
              { label: 'Community Trust Index', value: `${report.votesCount} confirmations` }
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-dark-border last:border-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-dark-text-s">{row.label}</span>
                <span className="text-sm font-mono text-white/80">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Reports Section */}
        <div className="bg-dark-surface border border-dark-border rounded-3xl overflow-hidden">
          <div className="px-10 py-6 border-b border-dark-border bg-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Similar Reports</h3>
            <div className="text-[9px] uppercase tracking-widest text-dark-text-s opacity-50">Contextual Linkage</div>
          </div>
          <div className="p-10">
            {loadingSimilar ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-3 h-3 border-2 border-dark-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] uppercase tracking-widest text-dark-text-s">Mapping Relationships...</span>
              </div>
            ) : similarReports.length > 0 ? (
              <div className="grid gap-4">
                {similarReports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onNavigate(r)}
                    className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-dark-accent/50 hover:bg-white/10 transition-all group w-full text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-dark-bg rounded-lg text-dark-text-s group-hover:text-dark-accent transition-colors">
                        <AlertTriangle size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-dark-accent transition-colors">{r.target}</p>
                        <p className="text-[9px] uppercase tracking-widest text-dark-text-s mt-1 font-bold">{r.targetType}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-dark-bg border border-dark-border rounded text-[9px] font-bold uppercase text-dark-text-s">
                      {r.status}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-dark-text-s italic">No similar threats detected within the current proximity.</p>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Risk Analysis Card */}
        <RiskInsight report={report} />

        {/* Vote Action Card */}
        <div className="p-8 bg-dark-accent rounded-3xl shadow-2xl shadow-dark-accent/20 text-white text-center">
          <TrendingUp size={40} className="mx-auto mb-6 opacity-30" />
          <h3 className="text-xl font-bold mb-2 tracking-tight">Confirm Threat</h3>
          <p className="text-sm text-white/70 mb-8 leading-relaxed">Your verification helps protect thousands of others from this specific entity.</p>
          <button 
            onClick={() => onVote(report.id!)}
            className="w-full h-16 bg-white text-dark-accent rounded-full font-bold uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            Vote Up ({report.votesCount})
          </button>
        </div>

        {/* Share/External Link */}
        <div className="p-8 bg-dark-surface border border-dark-border rounded-3xl space-y-4">
          <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5">
            <ExternalLink size={14} />
            Copy Link
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Report View Sub-component ---

function ReportView({ user, onComplete, onBack }: { user: User | null, onComplete: () => void, onBack: () => void }) {
  const [formData, setFormData] = useState({
    target: '',
    targetType: 'website' as ScamTargetType,
    scamType: 'phishing' as ScamCategory,
    description: '',
  });
  const [evidenceUrlInput, setEvidenceUrlInput] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addEvidenceUrl = () => {
    if (!evidenceUrlInput.trim()) return;
    const urlPattern = /^https?:\/\//i;
    if (!urlPattern.test(evidenceUrlInput.trim())) {
      alert("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setEvidenceUrls(prev => [...prev, evidenceUrlInput.trim()]);
    setEvidenceUrlInput('');
  };

  const removeEvidenceUrl = (index: number) => {
    setEvidenceUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.target || !formData.description) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'scamReports'), {
        ...formData,
        target: formData.target.toLowerCase().trim(),
        reporterId: user.uid,
        reporterEmail: user.email,
        reporterName: user.displayName,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        votesCount: 0,
        evidenceUrls: evidenceUrls
      });
      alert("Report submitted for verification. Thank you for helping the community!");
      onComplete();
    } catch (err) {
      handleFirestoreError(err, 'create', 'scamReports');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      key="report"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="px-8 py-12 max-w-2xl mx-auto"
    >
      <div className="bg-dark-surface rounded-3xl p-10 shadow-2xl border border-dark-border">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-dark-text-s mb-2">Report Submissions</h2>
            <p className="text-3xl font-extralight text-white font-sans tracking-tight">Protect the Grid.</p>
          </div>
          <button onClick={onBack} className="p-3 hover:bg-white/5 rounded-full text-dark-text-s transition-colors">
            <Info size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-dark-text-s uppercase tracking-[0.2em] ml-1 opacity-60">Scam Target</label>
            <input 
              required
              type="text" 
              placeholder="e.g. www.scam-site.com, phone, or wallet..."
              value={formData.target}
              onChange={e => setFormData({ ...formData, target: e.target.value })}
              className="w-full h-16 px-6 rounded-2xl bg-dark-bg border border-dark-border focus:border-dark-accent transition-all outline-none text-white font-sans"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-dark-text-s uppercase tracking-[0.2em] ml-1 opacity-60">Category</label>
              <div className="flex flex-wrap gap-2">
                {(['website', 'phone', 'email', 'handle', 'github', 'other'] as ScamTargetType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, targetType: type })}
                    className={cn(
                      "px-4 py-2 rounded-full border text-[9px] uppercase tracking-widest font-bold transition-all flex items-center gap-2",
                      formData.targetType === type 
                        ? "bg-dark-accent text-white border-dark-accent shadow-lg shadow-dark-accent/20" 
                        : "bg-dark-bg text-dark-text-s border-dark-border hover:border-dark-text-s/30"
                    )}
                  >
                    {type === 'github' && <Github size={10} />}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-dark-text-s uppercase tracking-[0.2em] ml-1 opacity-60">Scam Type</label>
              <select 
                value={formData.scamType}
                onChange={e => setFormData({ ...formData, scamType: e.target.value as ScamCategory })}
                className="w-full bg-dark-bg border border-dark-border text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl outline-none focus:border-dark-accent transition-colors cursor-pointer"
              >
                <option value="phishing">Phishing / Scam Link</option>
                <option value="fraud">Financial Fraud</option>
                <option value="impersonation">Identity Theft</option>
                <option value="recruitment">Job / Hiring Scam</option>
                <option value="extortion">Blackmail / Sextortion</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-dark-text-s uppercase tracking-[0.2em] ml-1 opacity-60">Encounter Details</label>
            <textarea 
              required
              rows={5}
              placeholder="Provide evidence, methods used, or other context..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-6 rounded-2xl bg-dark-bg border border-dark-border focus:border-dark-accent transition-all outline-none resize-none text-white font-sans text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-dark-text-s uppercase tracking-[0.2em] ml-1 opacity-60">Evidence URLs (Optional)</label>
            <div className="flex gap-2">
              <input 
                type="url" 
                placeholder="https://screenshot-link.com/proof"
                value={evidenceUrlInput}
                onChange={e => setEvidenceUrlInput(e.target.value)}
                className="flex-1 h-16 px-6 rounded-2xl bg-dark-bg border border-dark-border focus:border-dark-accent transition-all outline-none text-white font-sans text-sm"
              />
              <button 
                type="button"
                onClick={addEvidenceUrl}
                className="px-6 h-16 bg-dark-surface border border-dark-border rounded-2xl text-white hover:bg-white/5 transition-all"
              >
                <PlusCircle size={20} />
              </button>
            </div>
            {evidenceUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {evidenceUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 bg-dark-bg border border-dark-border px-4 py-2 rounded-xl">
                    <span className="text-[10px] text-dark-text-s truncate max-w-[150px]">{url}</span>
                    <button 
                      type="button" 
                      onClick={() => removeEvidenceUrl(i)}
                      className="text-dark-accent hover:text-red-400"
                    >
                      <PlusCircle size={12} className="rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-[11px] font-medium text-dark-text-s leading-relaxed italic flex gap-4">
            <Info size={16} className="shrink-0 mt-0.5 text-dark-accent" />
            <p>Your report will be processed and indexed into our global threat intelligence database. Authenticated reports carry higher weighting in risk assessment.</p>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              type="button"
              onClick={onBack}
              className="flex-1 h-16 rounded-full border border-dark-border text-dark-text-p font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-[2] h-16 bg-dark-accent text-white rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-dark-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-dark-accent/20 flex items-center justify-center gap-2"
            >
              {submitting ? 'Authenticating...' : (
                <>
                  <ShieldCheck size={16} />
                  Initiate Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
