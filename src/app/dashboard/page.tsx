
"use client"

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { GraduationCap, Award, BookOpen, Clock, TrendingUp, Loader2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

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
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const resultsQuery = useMemoFirebase(() => (user && db ? collection(db, 'students', user.uid, 'results') : null), [user, db])

  const { data: profile, isLoading: isProfileLoading } = useDoc(studentRef)
  const { data: results, isLoading: isResultsLoading } = useCollection(resultsQuery)

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router, mounted])

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5FA]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) return null

  const chartData = results?.map(r => ({
    name: r.semester,
    score: r.marks,
    color: 'hsl(var(--primary))'
  })) || []

  return (
    <div className="min-h-screen bg-[#F5F5FA]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 pt-20">
        {/* Profile Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between"
        >
          <div className="flex items-center gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shadow-xl border-4 border-white">
                <img 
                  src={user?.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-lg shadow-lg border-2 border-white">
                <Sparkles size={12} />
              </div>
            </motion.div>
            <div className="space-y-0.5">
              <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tighter">
                Hello, {profile?.firstName || 'Student'}!
              </h1>
              <p className="text-muted-foreground/80 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                <GraduationCap size={14} /> {profile?.studentId || 'STUDENT'} • {profile?.currentSemester || 'SEMESTER'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none bg-white p-4 rounded-[1.5rem] shadow-sm border border-white text-center min-w-[120px]">
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Rank</p>
              <p className="text-2xl font-headline font-bold text-primary tracking-tighter">#04</p>
            </div>
            <div className="flex-1 lg:flex-none bg-primary text-white p-4 rounded-[1.5rem] shadow-xl shadow-primary/20 text-center min-w-[120px]">
              <p className="text-[9px] text-white/70 uppercase font-bold tracking-widest mb-0.5">Results</p>
              <p className="text-2xl font-headline font-bold tracking-tighter">{results?.length || 0}</p>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Content */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          
          {/* Main Analytics Card */}
          <motion.div variants={itemVariant} className="lg:col-span-2">
            <Card className="glass border-none rounded-[2rem] overflow-hidden h-full shadow-lg">
              <CardHeader className="p-8 border-b border-white/40 bg-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-headline font-bold tracking-tight">Academic Engine</CardTitle>
                    <p className="text-muted-foreground text-xs font-medium mt-0.5">Real-time performance analytics</p>
                  </div>
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 h-[350px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }} domain={[0, 100]} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(125, 107, 219, 0.05)' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                      />
                      <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <div className="p-4 bg-muted/50 rounded-full"><Clock size={32} className="opacity-20" /></div>
                    <p className="font-bold uppercase tracking-widest text-[10px]">No analytical data found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar Stats */}
          <div className="space-y-8">
            {/* Grades Card */}
            <motion.div variants={itemVariant}>
              <Card className="glass border-none rounded-[2rem] shadow-lg">
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-xl font-headline font-bold flex items-center gap-2">
                    <Award className="text-secondary" size={20} /> Recent Grades
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {results?.slice(0, 3).map((result, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold tracking-tight">{result.subject}</span>
                        <span className="text-primary font-black text-base">{result.grade}</span>
                      </div>
                      <Progress value={result.marks} className="h-2 rounded-full bg-muted" />
                    </div>
                  )) || (
                    <div className="py-6 text-center opacity-50 font-bold uppercase text-[9px] tracking-widest">Awaiting records</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Interactive Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/resources')}
                className="flex flex-col items-center justify-center p-6 bg-white text-foreground rounded-[1.5rem] shadow-sm hover:shadow-lg transition-all border-none"
              >
                <div className="p-3 bg-primary/5 rounded-xl mb-3 text-primary">
                  <BookOpen size={24} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Library</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/notices')}
                className="flex flex-col items-center justify-center p-6 bg-secondary text-white rounded-[1.5rem] shadow-xl shadow-secondary/20 transition-all border-none"
              >
                <div className="p-3 bg-white/20 rounded-xl mb-3">
                  <Clock size={24} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Updates</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
