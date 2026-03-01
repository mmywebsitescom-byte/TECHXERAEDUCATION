
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
  <div className={cn("relative flex items-center justify-center bg-black rounded-xl overflow-hidden shadow-2xl", className)}>
    <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" />
        </linearGradient>
      </defs>
      {/* Hexagon Background */}
      <path d="M50 5 L90 27.5 V72.5 L50 95 L10 72.5 V27.5 L50 5Z" fill="url(#logo-grad)" fillOpacity="0.15" stroke="url(#logo-grad)" strokeWidth="2" />
      {/* Central X */}
      <path d="M35 35 L65 65 M65 35 L35 65" stroke="url(#logo-grad)" strokeWidth="8" strokeLinecap="round" />
      {/* Pulse Dots */}
      <circle cx="50" cy="50" r="5" fill="white" className="animate-pulse" />
      <circle cx="35" cy="35" r="3" fill="hsl(var(--secondary))" />
      <circle cx="65" cy="65" r="3" fill="hsl(var(--primary))" />
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
