
"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { Zap, LogIn, ClipboardList, BookOpen, Bell, Home, LogOut, LayoutDashboard, Shield, CalendarDays, LifeBuoy } from 'lucide-react'
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signOut } from 'firebase/auth'
import { doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'

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
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
            <Zap size={24} />
          </div>
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
