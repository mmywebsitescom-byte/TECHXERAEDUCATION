
"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { 
  LogIn, 
  ClipboardList, 
  BookOpen, 
  Bell, 
  Home, 
  LogOut, 
  LayoutDashboard, 
  Shield, 
  CalendarDays, 
  LifeBuoy,
  Menu,
  X
} from 'lucide-react'
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signOut } from 'firebase/auth'
import { doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

export const TechXeraLogo = ({ className, customUrl }: { className?: string; customUrl?: string }) => (
  <div className={cn("relative flex items-center justify-center bg-primary rounded-full overflow-hidden shadow-2xl ring-1 ring-white/10", className)}>
    {customUrl ? (
      <img src={customUrl} alt="Logo" className="w-full h-full object-cover" />
    ) : (
      <svg viewBox="0 0 100 100" className="w-full h-full p-1" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="primary-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B87C4C" />
            <stop offset="100%" stopColor="#A8BBA3" />
          </linearGradient>
        </defs>
        
        <circle cx="50" cy="50" r="47" stroke="white" strokeWidth="0.5" strokeDasharray="1 2" opacity="0.3" />
        <circle cx="50" cy="50" r="44" stroke="white" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
        
        <g transform="translate(46, 10)">
          <circle cx="4" cy="4" r="3" stroke="white" strokeWidth="1" />
          <path d="M4 0 V2 M4 6 V8 M0 4 H2 M6 4 H8 M1 1 L2.5 2.5 M5.5 5.5 L7 7 M7 1 L5.5 2.5 M2.5 5.5 L1 7" stroke="white" strokeWidth="0.5" />
        </g>

        <path d="M8 50 H12 M88 50 H92 M50 88 V92" stroke="white" strokeWidth="1" strokeLinecap="round" />
        <path d="M15 40 Q12 50 15 60" stroke="white" strokeWidth="0.5" opacity="0.4" />
        <path d="M85 40 Q88 50 85 60" stroke="white" strokeWidth="0.5" opacity="0.4" />
        
        <rect x="25" y="32" width="50" height="34" rx="3" stroke="white" strokeWidth="3" />
        <rect x="28" y="35" width="44" height="28" rx="1.5" fill="rgba(0,0,0,0.2)" />
        
        <path d="M46 66 L43 74 H57 L54 66 Z" fill="white" />
        <rect x="36" y="74" width="28" height="2" rx="1" fill="white" />

        <g transform="translate(32, 40)">
          <path d="M0 0 Q3 0 3 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 0 Q9 0 9 3" stroke="url(#primary-glow)" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 0 Q15 0 15 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 3 Q18 0 21 0" stroke="url(#primary-glow)" strokeWidth="2" strokeLinecap="round" />
          <path d="M24 0 Q27 0 27 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
          
          <path d="M1 8 L4 5 L1 2" stroke="white" strokeWidth="1.5" />
          <path d="M8 2 L12 5 L8 8" stroke="url(#primary-glow)" strokeWidth="1.5" />
          <path d="M17 8 L21 5 L17 2" stroke="white" strokeWidth="1.5" />
          <path d="M24 2 L28 5 L24 8" stroke="url(#primary-glow)" strokeWidth="1.5" />
          
          <path d="M0 18 Q3 18 3 15" stroke="url(#primary-glow)" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 18 Q9 18 9 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 18 Q15 18 15 15" stroke="url(#primary-glow)" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 15 Q18 18 21 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M24 18 Q27 18 27 15" stroke="url(#primary-glow)" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    )}
  </div>
)

const NavLinks = ({ className, onItemClick }: { className?: string; onItemClick?: () => void }) => (
  <div className={cn("flex items-center gap-8 font-bold text-[10px] uppercase tracking-[0.2em]", className)}>
    <Link href="/" onClick={onItemClick} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 py-2">
      <Home size={14} /> Home
    </Link>
    <Link href="/resources" onClick={onItemClick} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 py-2">
      <BookOpen size={14} /> Resources
    </Link>
    <Link href="/exams" onClick={onItemClick} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 py-2">
      <CalendarDays size={14} /> Exams
    </Link>
    <Link href="/notices" onClick={onItemClick} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 py-2">
      <Bell size={14} /> Notices
    </Link>
    <Link href="/results" onClick={onItemClick} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 py-2">
      <ClipboardList size={14} /> Results
    </Link>
    <Link href="/support" onClick={onItemClick} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 py-2">
      <LifeBuoy size={14} /> Support
    </Link>
  </div>
)

export default function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isAdmin = user?.email === AUTHORIZED_ADMIN_EMAIL

  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  const siteName = settings?.siteName || 'TECHXERA'
  const customLogoUrl = settings?.logoUrl || null

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  return (
    <nav className={cn(
      "fixed top-0 z-50 w-full px-4 md:px-6 py-4 transition-all duration-300",
      scrolled ? "bg-white/80 dark:bg-background/80 backdrop-blur-xl border-b border-primary/10 py-3 shadow-md" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-primary">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] rounded-r-3xl">
              <SheetHeader className="mb-8">
                <SheetTitle className="flex items-center gap-4">
                  <TechXeraLogo className="w-10 h-10" customUrl={customLogoUrl} />
                  <span className="font-headline font-bold text-primary">{siteName}</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 font-bold text-sm uppercase tracking-widest mt-10">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 transition-colors">
                  <Home size={20} className="text-primary" /> Home
                </Link>
                <Link href="/resources" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 transition-colors">
                  <BookOpen size={20} className="text-primary" /> Resources
                </Link>
                <Link href="/exams" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 transition-colors">
                  <CalendarDays size={20} className="text-primary" /> Exams
                </Link>
                <Link href="/notices" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 transition-colors">
                  <Bell size={20} className="text-primary" /> Notices
                </Link>
                <Link href="/results" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 transition-colors">
                  <ClipboardList size={20} className="text-primary" /> Results
                </Link>
                <Link href="/support" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 transition-colors">
                  <LifeBuoy size={20} className="text-primary" /> Support
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/10 text-secondary transition-colors">
                    <Shield size={20} /> Admin Panel
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-4 group">
            <TechXeraLogo 
              className="w-10 h-10 md:w-12 md:h-12 group-hover:scale-110 transition-transform duration-500" 
              customUrl={customLogoUrl} 
            />
            <span className="font-headline text-lg md:text-2xl font-bold tracking-tighter text-primary uppercase hidden sm:block">
              {siteName.includes(' ') ? (
                <>
                  {siteName.split(' ')[0]}
                  <span className="text-secondary dark:text-white/60 ml-1">{siteName.split(' ').slice(1).join(' ')}</span>
                </>
              ) : siteName}
            </span>
          </Link>
        </div>

        <NavLinks className="hidden lg:flex" />

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          {mounted && user ? (
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/dashboard">
                <Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 px-4 md:px-6 rounded-xl font-bold h-10 text-xs md:text-sm">
                  <LayoutDashboard size={18} className="hidden xs:block" /> DASHBOARD
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-xl w-10 h-10">
                <LogOut size={20} />
              </Button>
            </div>
          ) : mounted ? (
            <Link href="/login">
              <Button variant="outline" className="flex items-center gap-2 border-primary/20 bg-white/50 dark:bg-background/50 backdrop-blur-sm text-primary hover:bg-primary hover:text-white transition-all px-4 md:px-8 rounded-xl font-bold h-10 text-xs md:text-sm">
                <LogIn size={18} className="hidden xs:block" /> LOGIN
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
