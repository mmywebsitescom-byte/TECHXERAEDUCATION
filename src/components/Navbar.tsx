
"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { Cpu, LogIn, ClipboardList, BookOpen, Bell, Home, LogOut, LayoutDashboard, Shield } from 'lucide-react'
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signOut } from 'firebase/auth'
import { doc } from 'firebase/firestore'

export default function Navbar() {
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()

  // Check if current user is an admin
  const adminRef = useMemoFirebase(() => (user && db ? doc(db, 'roles_admin', user.uid) : null), [user, db])
  const { data: adminDoc } = useDoc(adminRef)
  const isAdmin = !!adminDoc

  const handleLogout = () => {
    signOut(auth)
  }

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-border/40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-lg text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-300">
            <Cpu size={24} />
          </div>
          <span className="font-headline text-2xl font-bold tracking-tight text-foreground">
            TechXera <span className="text-primary">Campus</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-medium">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Home size={18} />
            Home
          </Link>
          <Link href="/resources" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <BookOpen size={18} />
            Resources
          </Link>
          <Link href="/notices" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Bell size={18} />
            Notices
          </Link>
          <Link href="/results" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ClipboardList size={18} />
            Results
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" className="flex items-center gap-2 text-secondary">
                    <Shield size={18} />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="ghost" className="flex items-center gap-2 text-primary">
                  <LayoutDashboard size={18} />
                  Dashboard
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 border-destructive text-destructive hover:bg-destructive/10">
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10">
                <LogIn size={18} />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
