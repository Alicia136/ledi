import { Link, useLocation } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, X, Bell, BellRing, ChevronDown, User, LayoutDashboard, LogOut, BookOpen, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import LediLogo from "@/components/LediLogo";
import { useListVarsler, useMarkAlleVarslerLest, useMarkVarselLest } from "@workspace/api-client-react";
import { useSpaceSocket, authenticateSocket, type VarselEvent } from "@/lib/useSpaceSocket";
import { motion, AnimatePresence } from "framer-motion";
import AlarmModal from "@/components/AlarmModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/language-context";

interface NavbarProps {
  onOpenRegisterPanel?: () => void;
}

const MORE_LINKS = [
  { href: "/borettslag", label: "Borettslag", emoji: "🏢" },
  { href: "/gavekort",   label: "Gavekort",   emoji: "🎁" },
  { href: "/samarbeid",  label: "Samarbeid",  emoji: "🤝" },
  { href: "/akademi",    label: "Akademi",    emoji: "📚" },
  { href: "/bytt",       label: "Bytt plass", emoji: "🔄" },
];

export default function Navbar({ onOpenRegisterPanel }: NavbarProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [moreOpen, setMoreOpen]   = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const [bellOpen, setBellOpen]   = useState(false);
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);
  const [newVarsler, setNewVarsler] = useState<VarselEvent[]>([]);

  const bellRef = useRef<HTMLButtonElement>(null);
  const bellDropRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const { data: varsler, refetch: refetchVarsler } = useListVarsler(
    { query: { enabled: !!user } as any }
  );
  const markLest     = useMarkVarselLest();
  const markAlleLest = useMarkAlleVarslerLest();

  const ulest = (varsler ?? []).filter(v => !v.lest).length + newVarsler.length;

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("ledi_token");
      if (token) authenticateSocket(token);
    }
  }, [user?.id]);

  const handleVarsel = useCallback((v: VarselEvent) => {
    setNewVarsler(prev => [v, ...prev].slice(0, 5));
    void refetchVarsler();
  }, [refetchVarsler]);

  useSpaceSocket(handleVarsel);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node) &&
          bellDropRef.current && !bellDropRef.current.contains(e.target as Node))
        setBellOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node))
        setMoreOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); setLocation("/"); };
  const handleMarkAll = () => {
    markAlleLest.mutate({} as any, { onSuccess: () => { void refetchVarsler(); setNewVarsler([]); } });
  };
  const handleMarkOne = (id: number) => {
    markLest.mutate({ id } as any, { onSuccess: () => void refetchVarsler() });
  };

  const allVarsler = [...newVarsler, ...(varsler ?? []).filter(
    v => !newVarsler.some(n => n.id === v.id)
  )].slice(0, 8);

  const userDashHref = user?.rolle === "admin" ? "/admin" : user?.rolle === "utleier" ? "/dashboard" : "/mine-bookinger";
  const userDashLabel = user?.rolle === "admin" ? "Admin" : user?.rolle === "utleier" ? "Dashboard" : "Mine bookinger";

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b border-white/8"
        style={{
          background: "rgba(13,27,42,0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">

          {/* ── Logo ── */}
          <Link href="/" className="shrink-0">
            <LediLogo size={26} />
          </Link>

          {/* ── Primary nav links (desktop) ── */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/pendler">
              <span className="text-sm text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/8 transition-all cursor-pointer font-medium">
                Pendler
              </span>
            </Link>
            <Link href="/reise">
              <span className="text-sm text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/8 transition-all cursor-pointer font-medium">
                Reise
              </span>
            </Link>
            <Link href="/business">
              <span className="text-sm text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/8 transition-all cursor-pointer font-medium">
                Business
              </span>
            </Link>

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(v => !v)}
                className="flex items-center gap-1 text-sm text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/8 transition-all font-medium"
              >
                Mer
                <ChevronDown size={14} className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.13 }}
                    className="absolute left-0 top-full mt-1.5 w-48 rounded-2xl shadow-2xl overflow-hidden py-1.5"
                    style={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)", zIndex: 100 }}
                  >
                    {MORE_LINKS.map(({ href, label, emoji }) => (
                      <Link key={href} href={href}>
                        <span
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6 transition-all cursor-pointer"
                          onClick={() => setMoreOpen(false)}
                        >
                          <span>{emoji}</span>
                          {label}
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right side ── */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <LanguageSwitcher />

            {user ? (
              <>
                {/* Bell */}
                <div className="relative">
                  <button
                    ref={bellRef}
                    onClick={() => setBellOpen(v => !v)}
                    className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition-all"
                    data-testid="button-notifications"
                  >
                    {ulest > 0 ? <BellRing size={19} style={{ color: "#00B4D8" }} /> : <Bell size={19} />}
                    {ulest > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: "#00B4D8" }}
                      >
                        {ulest > 9 ? "9+" : ulest}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {bellOpen && (
                      <motion.div
                        ref={bellDropRef}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden"
                        style={{ background: "#0D1B2A", border: "1px solid rgba(0,180,216,0.2)", zIndex: 100 }}
                      >
                        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                          <span className="text-white font-semibold text-sm">Varsler</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setAlarmModalOpen(true); setBellOpen(false); }}
                              className="text-xs px-2 py-1 rounded-lg font-medium transition-all"
                              style={{ color: "#00B4D8", background: "rgba(0,180,216,0.1)" }}
                            >
                              + Ny alarm
                            </button>
                            {ulest > 0 && (
                              <button onClick={handleMarkAll} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                                Merk alle lest
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {allVarsler.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <Bell size={24} className="mx-auto mb-2 text-white/20" />
                              <p className="text-white/40 text-sm">Ingen varsler ennå</p>
                              <button
                                onClick={() => { setAlarmModalOpen(true); setBellOpen(false); }}
                                className="mt-3 text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ color: "#00B4D8", background: "rgba(0,180,216,0.1)" }}
                              >
                                Sett opp Ledi Alarm
                              </button>
                            </div>
                          ) : (
                            allVarsler.map(v => {
                              const isNew = newVarsler.some(n => n.id === v.id);
                              const lest  = !isNew && (varsler?.find(sv => sv.id === v.id)?.lest ?? false);
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => handleMarkOne(v.id)}
                                  className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5 flex gap-3 items-start"
                                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                                >
                                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: lest ? "rgba(255,255,255,0.2)" : "#00B4D8" }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-semibold truncate">{v.tittel}</p>
                                    <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{v.melding}</p>
                                    <p className="text-white/25 text-[10px] mt-1">
                                      {new Date(v.opprettetDato).toLocaleDateString("nb-NO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User menu */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setUserOpen(v => !v)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/8 transition-all"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg,#1B4F8C,#00B4D8)", color: "#fff" }}
                    >
                      {user.navn.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">{user.navn.split(" ")[0]}</span>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${userOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.13 }}
                        className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl shadow-2xl overflow-hidden py-1.5"
                        style={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.1)", zIndex: 100 }}
                      >
                        <div className="px-4 py-2.5 border-b border-white/8">
                          <p className="text-white text-sm font-semibold truncate">{user.navn}</p>
                          <p className="text-white/40 text-xs truncate">{user.epost}</p>
                        </div>
                        <Link href={userDashHref}>
                          <span
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6 transition-all cursor-pointer"
                            onClick={() => setUserOpen(false)}
                          >
                            <LayoutDashboard size={15} /> {userDashLabel}
                          </span>
                        </Link>
                        {user.rolle === "utleier" && (
                          <Link href="/skatterapport">
                            <span
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6 transition-all cursor-pointer"
                              onClick={() => setUserOpen(false)}
                            >
                              <BookOpen size={15} /> Skatterapport
                            </span>
                          </Link>
                        )}
                        <div className="border-t border-white/8 mt-1 pt-1">
                          <button
                            onClick={() => { handleLogout(); setUserOpen(false); }}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/50 hover:text-red-400 hover:bg-red-500/8 transition-all"
                            data-testid="button-logout"
                          >
                            <LogOut size={15} /> Logg ut
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* CTA */}
                {user.rolle === "utleier" && (
                  <button
                    onClick={onOpenRegisterPanel}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                    data-testid="button-register-space"
                  >
                    Lei ut plass
                  </button>
                )}
              </>
            ) : (
              <>
                <Link href="/logg-inn">
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all"
                    data-testid="button-login-nav"
                  >
                    {t("nav_login")}
                  </button>
                </Link>
                <Link href="/bli-utleier">
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                    data-testid="button-register-nav"
                  >
                    {t("nav_list")}
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="md:hidden text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/8 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="button-mobile-menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* ── Mobile dropdown ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="md:hidden overflow-hidden border-t border-white/8"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {[
                  { href: "/pendler",   label: "Pendler" },
                  { href: "/reise",     label: "Reise" },
                  { href: "/business",  label: "Business" },
                  ...MORE_LINKS.map(l => ({ href: l.href, label: `${l.emoji} ${l.label}` })),
                ].map(({ href, label }) => (
                  <Link key={href} href={href}>
                    <span className="block text-white/70 hover:text-white py-2.5 px-3 rounded-xl hover:bg-white/6 transition-all cursor-pointer text-sm" onClick={() => setMenuOpen(false)}>
                      {label}
                    </span>
                  </Link>
                ))}

                <div className="border-t border-white/8 mt-2 pt-3 flex flex-col gap-1">
                  {user ? (
                    <>
                      <Link href={userDashHref}>
                        <span className="block text-white/80 hover:text-white py-2.5 px-3 rounded-xl hover:bg-white/6 transition-all cursor-pointer text-sm" onClick={() => setMenuOpen(false)}>
                          {userDashLabel}
                        </span>
                      </Link>
                      <button
                        onClick={() => { setAlarmModalOpen(true); setMenuOpen(false); }}
                        className="flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-white/6 transition-all text-sm text-left"
                        style={{ color: "#00B4D8" }}
                      >
                        <Bell size={15} />
                        Ledi Alarm {ulest > 0 && `(${ulest} ny)`}
                      </button>
                      <button
                        onClick={() => { handleLogout(); setMenuOpen(false); }}
                        className="flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-red-500/8 transition-all text-sm text-left text-white/50 hover:text-red-400"
                      >
                        <LogOut size={15} /> Logg ut
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/logg-inn">
                        <span className="block text-white/80 py-2.5 px-3 rounded-xl hover:bg-white/6 transition-all cursor-pointer text-sm" onClick={() => setMenuOpen(false)}>
                          {t("nav_login")}
                        </span>
                      </Link>
                      <Link href="/bli-utleier">
                        <span className="block py-2.5 px-3 rounded-xl font-semibold cursor-pointer text-sm" style={{ color: "#00B4D8" }} onClick={() => setMenuOpen(false)}>
                          {t("nav_list")}
                        </span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AlarmModal open={alarmModalOpen} onClose={() => setAlarmModalOpen(false)} />
    </>
  );
}
