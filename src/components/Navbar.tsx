
"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { LogIn, ClipboardList, BookOpen, Bell, Home, LogOut, LayoutDashboard, Shield, CalendarDays, LifeBuoy } from 'lucide-react'
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signOut } from 'firebase/auth'
import { doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'

export const TechXeraLogo = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center bg-black rounded-full overflow-hidden shadow-2xl ring-1 ring-white/10", className)}>
    <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="100%" stopColor="#4facfe" />
        </linearGradient>
      </defs>
      
      {/* Intricate Circular Tech Border */}
      <circle cx="50" cy="50" r="47" stroke="white" strokeWidth="0.5" strokeDasharray="1 2" opacity="0.3" />
      <circle cx="50" cy="50" r="44" stroke="white" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      
      {/* Decorative Top Icon (Gear-like) */}
      <circle cx="50" cy="14" r="3.5" stroke="white" strokeWidth="1" />
      <path d="M50 11 V17 M47 14 H53" stroke="white" strokeWidth="0.5" />
      <path d="M48 12 L52 16 M52 12 L48 16" stroke="white" strokeWidth="0.5" />

      {/* Side Tech Patterns */}
      <path d="M8 50 H12 M88 50 H92 M50 88 V92" stroke="white" strokeWidth="1" strokeLinecap="round" />
      <path d="M15 40 Q12 50 15 60" stroke="white" strokeWidth="0.5" opacity="0.4" />
      <path d="M85 40 Q88 50 85 60" stroke="white" strokeWidth="0.5" opacity="0.4" />
      
      {/* The Central Monitor */}
      <rect x="25" y="32" width="50" height="34" rx="3" stroke="white" strokeWidth="3" />
      <rect x="28" y="35" width="44" height="28" rx="1.5" fill="#0a0a0a" />
      
      {/* Stand */}
      <path d="M46 66 L43 74 H57 L54 66 Z" fill="white" />
      <rect x="36" y="74" width="28" height="2" rx="1" fill="white" />

      {/* Code characters inside the monitor - simplified recreations of the C/Bracket shapes */}
      <g transform="translate(32, 40)">
        {/* Row 1 */}
        <path d="M0 0 Q3 0 3 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 0 Q9 0 9 3" stroke="url(#cyan-grad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 0 Q15 0 15 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 3 Q18 0 21 0" stroke="url(#cyan-grad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 0 Q27 0 27 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
        
        {/* Row 2 */}
        <path d="M1 8 L4 5 L1 2" stroke="white" strokeWidth="1.5" />
        <path d="M8 2 L12 5 L8 8" stroke="url(#cyan-grad)" strokeWidth="1.5" />
        <path d="M17 8 L21 5 L17 2" stroke="white" strokeWidth="1.5" />
        <path d="M24 2 L28 5 L24 8" stroke="url(#cyan-grad)" strokeWidth="1.5" />
        
        {/* Row 3 */}
        <path d="M0 18 Q3 18 3 15" stroke="url(#cyan-grad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 18 Q9 18 9 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18 Q15 18 15 15" stroke="url(#cyan-grad)" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 15 Q18 18 21 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 18 Q27 18 27 15" stroke="url(#cyan-grad)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  </div>
)

export default function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const adminRef = useMemoFirebase(() => (user && db ? doc(db, 'roles_admin', user.uid) : null), [user, db])
  const { data: adminDoc } = useDoc(adminRef)
  const isAdmin = !!adminDoc

  const handleLogout = () => {
    signOut(auth)
  }

  return (
    <nav className={cn(
      "fixed top-0 z-50 w-full px-6 py-4 transition-all duration-300",
      scrolled ? "bg-white/70 backdrop-blur-xl border-b border-white/20 py-3 shadow-sm" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 group">
          <TechXeraLogo className="w-12 h-12 group-hover:scale-110 transition-transform duration-500" />
          <span className="font-headline text-2xl font-bold tracking-tighter text-foreground">
            TECH<span className="text-primary">XERA</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8 font-bold text-[10px] uppercase tracking-[0.2em]">
          <Link href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <Home size={14} /> Home
          </Link>
          <Link href="/resources" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <BookOpen size={14} /> Resources
          </Link>
          <Link href="/exams" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <CalendarDays size={14} /> Exams
          </Link>
          <Link href="/notices" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <Bell size={14} /> Notices
          </Link>
          <Link href="/results" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <ClipboardList size={14} /> Results
          </Link>
          <Link href="/support" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
            <LifeBuoy size={14} /> Support
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {mounted && user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" className="hidden sm:flex items-center gap-2 text-secondary font-bold hover:bg-secondary/10 px-4 rounded-xl h-10">
                    <Shield size={18} /> ADMIN
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 px-6 rounded-xl font-bold h-10">
                  <LayoutDashboard size={18} /> DASHBOARD
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl w-10 h-10">
                <LogOut size={20} />
              </Button>
            </div>
          ) : mounted ? (
            <Link href="/login">
              <Button variant="outline" className="flex items-center gap-2 border-primary/20 bg-white/50 backdrop-blur-sm text-primary hover:bg-primary hover:text-white transition-all px-8 rounded-xl font-bold h-10">
                <LogIn size={18} /> LOGIN
              </Button>
            </Link>
          ) : (
            <div className="w-20 h-10" />
          )}
        </div>
      </div>
    </nav>
  )
}
