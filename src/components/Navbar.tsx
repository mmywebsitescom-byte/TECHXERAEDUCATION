
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
  X,
  CheckCircle2
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

/**
 * TechXeraLogo - Displays the campus logo. 
 * Completely dynamic: shows the image if customUrl is provided,
 * otherwise shows a generic blank placeholder.
 */
export const TechXeraLogo = ({ className, customUrl }: { className?: string; customUrl?: string | null }) => (
  <div className={cn("relative flex items-center justify-center bg-muted/20 rounded-full overflow-hidden ring-1 ring-border/10", className)}>
    {customUrl ? (
      <img src={customUrl} alt="Campus Logo" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 font-headline font-bold text-xs uppercase tracking-widest">
        {/* Placeholder - Empty until Admin adds logo */}
      </div>
    )}
  </div>
)

const NavLinks = ({ className, onItemClick }: { className?: string; onItemClick?: () => void }) => (
  <div className={cn("flex items-center gap-8 font-bold text-[10px] uppercase tracking-[0.2em]", className)}>
    <Link href="/" onClick={onItemClick} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 py-2">
      <Home size={14} /> Home
    </Link>
    <Link href="/attendance" onClick={onItemClick} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 py-2">
      <CheckCircle2 size={14} /> Attendance
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

  const isAdmin = user?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()

  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  const siteName = settings?.siteName || 'CAMPUS PORTAL'
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
                <Link href="/attendance" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 transition-colors">
                  <CheckCircle2 size={20} className="text-primary" /> Attendance
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
              <Link href={isAdmin ? "/admin" : "/dashboard"}>
                <Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 px-4 md:px-6 rounded-xl font-bold h-10 text-xs md:text-sm">
                  <LayoutDashboard size={18} className="hidden xs:block" /> {isAdmin ? 'ADMIN PANEL' : 'DASHBOARD'}
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
