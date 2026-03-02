
"use client"

import React, { useState, useEffect } from 'react'
import { TechXeraLogo } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, GraduationCap, Users, CheckCircle, 
  Search, ClipboardList, Settings as SettingsIcon, 
  LogOut, Home, ArrowRight, Bell, HelpCircle
} from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useAuth } from '@/firebase'
import { doc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TechBackground from '@/components/TechBackground'
import { motion } from 'framer-motion'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: dbSettings } = useDoc(settingsRef)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isUserLoading) {
      if (!user) {
        router.push('/admin/login')
      } else if (user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        toast({ variant: "destructive", title: "Access Denied" })
        router.push('/')
      }
    }
  }, [user, isUserLoading, router, mounted, toast])

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  }

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Shield className="animate-pulse text-primary" size={48} /></div>
  if (!user || user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) return null;

  const adminModules = [
    {
      title: "Attendance Console",
      desc: "Manage class sessions and scan student identity codes.",
      icon: <CheckCircle className="text-primary" size={32} />,
      href: "/admin/attendance",
      badge: "Active Scanner"
    },
    {
      title: "Student Directory",
      desc: "Review registrations and manage student approval status.",
      icon: <Users className="text-secondary" size={32} />,
      href: "#", // Add dedicated student management page later if needed
      badge: "Verification"
    },
    {
      title: "Academic Results",
      desc: "Upload transcripts and monitor grade analytics.",
      icon: <GraduationCap className="text-primary" size={32} />,
      href: "/results",
      badge: "Transcripts"
    },
    {
      title: "Notice Center",
      desc: "Publish official bulletins and urgent campus alerts.",
      icon: <Bell className="text-secondary" size={32} />,
      href: "/notices",
      badge: "Broadcast"
    }
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <TechBackground />
      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-16 pb-32">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <TechXeraLogo className="w-20 h-20 shadow-2xl shadow-primary/20" customUrl={dbSettings?.logoUrl} />
            <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tighter">Admin Central</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
                <Shield size={14} className="text-primary" />
                <p className="text-primary font-bold text-[10px] uppercase tracking-widest">Root Console • {user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link href="/" className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-2">
                <Home className="mr-2" /> Portal Home
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="ghost" className="h-14 rounded-2xl font-bold text-destructive hover:bg-destructive/10">
              <LogOut className="mr-2" /> Logout
            </Button>
          </div>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {adminModules.map((module, i) => (
            <motion.div key={i} variants={itemVariant}>
              <Link href={module.href}>
                <Card className="glass border-none h-full rounded-[2.5rem] hover:bg-white/10 transition-all group cursor-pointer shadow-xl">
                  <CardHeader className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-background/50 rounded-2xl text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm">
                        {module.icon}
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none uppercase text-[9px] font-black tracking-widest">
                        {module.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-headline font-bold mb-2 group-hover:text-primary transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium leading-relaxed">
                      {module.desc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <div className="flex items-center text-xs font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Manage Module <ArrowRight className="ml-2" size={14} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <Card className="lg:col-span-2 glass border-none rounded-[3rem] p-10 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <SettingsIcon className="text-primary" size={32} />
              <h3 className="text-2xl font-headline font-bold">System Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Firestore", status: "Operational", color: "text-green-500" },
                { label: "Auth Hub", status: "Secure", color: "text-green-500" },
                { label: "GenAI Core", status: "Available", color: "text-green-500" }
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <p className={`font-bold ${stat.color}`}>{stat.status}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass border-none rounded-[3rem] p-10 flex flex-col justify-center items-center text-center gap-4 shadow-2xl">
            <HelpCircle size={48} className="text-primary/40" />
            <h4 className="text-xl font-headline font-bold">Need Help?</h4>
            <p className="text-sm text-muted-foreground font-medium">Access root documentation or contact campus IT for infrastructure support.</p>
            <Button variant="outline" className="mt-4 rounded-xl font-bold">IT Helpdesk</Button>
          </Card>
        </div>
      </main>
    </div>
  )
}
