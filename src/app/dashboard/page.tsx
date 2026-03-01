
"use client"

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { GraduationCap, Award, BookOpen, Clock, TrendingUp, Loader2, Sparkles, AlertCircle, ShieldAlert, CreditCard, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" } }
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(studentRef)

  const resultsQuery = useMemoFirebase(() => (user && profile?.isApproved && db ? collection(db, 'students', user.uid, 'results') : null), [user, profile, db])
  const { data: results, isLoading: isResultsLoading } = useCollection(resultsQuery)

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router, mounted])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Roll Number copied to clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5FA]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) return null

  // Approval Check View
  if (profile && !profile.isApproved) {
    return (
      <div className="min-h-screen bg-[#F5F5FA] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 pt-64">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="max-w-xl w-full text-center p-12 glass border-none rounded-[3rem] shadow-2xl">
              <div className="mx-auto w-24 h-24 bg-orange-500/10 text-orange-500 rounded-[2rem] flex items-center justify-center mb-8">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-4xl font-headline font-bold mb-4">Account Pending Approval</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Your registration has been received. A campus administrator must review and approve your account before you can access academic records.
              </p>
              <div className="p-6 bg-muted/50 rounded-2xl flex items-center gap-4 text-left">
                <AlertCircle className="text-primary shrink-0" />
                <p className="text-sm font-medium">Please contact the IT department if this takes longer than 24 hours. Your assigned Roll No is <span className="text-primary font-bold">{profile?.studentId}</span>.</p>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    )
  }

  const chartData = results?.map(r => ({
    name: r.semester,
    score: r.marks,
    color: 'hsl(var(--primary))'
  })) || []

  return (
    <div className="min-h-screen bg-[#F5F5FA]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-10 md:p-20 lg:p-24 space-y-16 pt-64 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between"
        >
          <div className="flex items-center gap-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src={user?.photoURL || `https://picsum.photos/seed/${user.uid}/300/300`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-lg border-2 border-white">
                <Sparkles size={20} />
              </div>
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tighter">
                Hello, {profile?.firstName || 'Student'}!
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black tracking-widest flex items-center gap-2">
                  <CreditCard size={14} /> ROLL NO: {profile?.studentId || 'N/A'}
                  <button onClick={() => copyToClipboard(profile?.studentId || '')} className="hover:text-primary/70 transition-colors">
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="bg-muted text-muted-foreground px-4 py-1.5 rounded-full text-xs font-black tracking-widest flex items-center gap-2">
                  <GraduationCap size={14} /> {profile?.currentSemester || 'SEMESTER 1'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-8 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none bg-white p-8 rounded-[2.5rem] shadow-sm border border-white text-center min-w-[160px]">
              <p className="text-[12px] text-muted-foreground uppercase font-bold tracking-widest mb-2">Rank</p>
              <p className="text-4xl font-headline font-bold text-primary tracking-tighter">#04</p>
            </div>
            <div className="flex-1 lg:flex-none bg-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 text-center min-w-[160px]">
              <p className="text-[12px] text-white/70 uppercase font-bold tracking-widest mb-2">Results</p>
              <p className="text-4xl font-headline font-bold tracking-tighter">{results?.length || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-12"
        >
          <motion.div variants={itemVariant} className="lg:col-span-2">
            <Card className="glass border-none rounded-[3rem] overflow-hidden h-full shadow-lg">
              <CardHeader className="p-12 border-b border-white/40 bg-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-4xl font-headline font-bold tracking-tight">Academic Engine</CardTitle>
                    <p className="text-muted-foreground text-lg font-medium mt-2">Real-time performance analytics</p>
                  </div>
                  <div className="p-5 bg-primary/10 text-primary rounded-2xl">
                    <TrendingUp size={32} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-12 h-[500px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 13, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 13, fontWeight: 700 }} domain={[0, 100]} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(125, 107, 219, 0.05)' }}
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.1)', padding: '24px' }}
                      />
                      <Bar dataKey="score" radius={[15, 15, 0, 0]} barSize={60}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-6">
                    <div className="p-10 bg-muted/50 rounded-full"><Clock size={64} className="opacity-20" /></div>
                    <p className="font-bold uppercase tracking-widest text-sm">No analytical data found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-12">
            <motion.div variants={itemVariant}>
              <Card className="glass border-none rounded-[3rem] shadow-lg">
                <CardHeader className="p-10 pb-0">
                  <CardTitle className="text-3xl font-headline font-bold flex items-center gap-4">
                    <Award className="text-secondary" size={32} /> Recent Grades
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  {results?.slice(0, 3).map((result, i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-bold tracking-tight">{result.subject}</span>
                        <span className="text-primary font-black text-2xl">{result.grade}</span>
                      </div>
                      <Progress value={result.marks} className="h-3 rounded-full bg-muted" />
                    </div>
                  )) || (
                    <div className="py-16 text-center opacity-50 font-bold uppercase text-sm tracking-widest">Awaiting records</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-2 gap-8">
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/resources')}
                className="flex flex-col items-center justify-center p-10 bg-white text-foreground rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border-none"
              >
                <div className="p-5 bg-primary/5 rounded-2xl mb-5 text-primary">
                  <BookOpen size={36} />
                </div>
                <span className="text-[12px] font-black uppercase tracking-widest">Library</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/notices')}
                className="flex flex-col items-center justify-center p-10 bg-secondary text-white rounded-[2.5rem] shadow-xl shadow-secondary/20 transition-all border-none"
              >
                <div className="p-5 bg-white/20 rounded-2xl mb-5">
                  <Clock size={36} />
                </div>
                <span className="text-[12px] font-black uppercase tracking-widest">Updates</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
