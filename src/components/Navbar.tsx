"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from './ui/button'
import { Cpu, LogIn, ClipboardList, BookOpen, Bell, Home } from 'lucide-react'

export default function Navbar() {
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
          <Link href="/login">
            <Button variant="outline" className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10">
              <LogIn size={18} />
              Login
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
