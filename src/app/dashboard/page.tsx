
"use client"

import React, { useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { GraduationCap, Award, BookOpen, Clock, TrendingUp, Loader2 } from 'lucide-react'
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
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 }
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  // Stabilize document and collection references
  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const resultsQuery = useMemoFirebase(() => (user && db ? collection(db, 'students', user.uid, 'results') : null), [user, db])

  const { data: profile, isLoading: isProfileLoading } = useDoc(studentRef)
  const { data: results, isLoading: isResultsLoading } = useCollection(resultsQuery)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const chartData = results?.map(r => ({
    name: r.semester,
    score: r.marks,
    color: 'hsl(var(--primary))'
  })) || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">
        {/* Profile Welcome */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
        >
          <div className="flex items-center gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <img 
                src={user?.photoURL || "https://picsum.photos/seed/student-1/200/200"} 
                alt="Profile" 
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-1.5 rounded-lg shadow-lg">
                <Award size={16} />
              </div>
            </motion.div>
            <div>
              <h1 className="text-3xl font-headline font-bold">Welcome back, {profile?.firstName || user?.displayName || 'Alex'}!</h1>
              <p className="text-muted-foreground font-medium">
                {profile?.studentId || 'N/A'} • {profile?.currentSemester || 'Semester X'}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <motion.div whileHover={{ y: -5 }} className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 text-center min-w-[100px]">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Results</p>
              <p className="text-2xl font-headline font-bold text-primary">{results?.length || 0}</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 text-center min-w-[100px]">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Status</p>
              <p className="text-2xl font-headline font-bold text-secondary">Active</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          
          {/* Performance Chart */}
          <motion.div variants={itemVariant} className="lg:col-span-2">
            <Card className="shadow-sm border-border/50 overflow-hidden h-full">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />
                    Performance Analytics
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-8 h-[350px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(125, 107, 219, 0.05)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No academic data available yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Side Info */}
          <div className="space-y-8">
            {/* Recent Grades */}
            <motion.div variants={itemVariant}>
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Grades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {results?.slice(0, 3).map((result, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{result.subject}</span>
                        <span className="text-primary font-bold">{result.grade}</span>
                      </div>
                      <Progress value={result.marks} className="h-2" />
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No grades recorded.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/resources')}
                className="flex flex-col items-center justify-center p-6 bg-primary text-white rounded-3xl shadow-lg shadow-primary/20 transition-transform"
              >
                <BookOpen size={24} className="mb-2" />
                <span className="text-sm font-bold">Resources</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/notices')}
                className="flex flex-col items-center justify-center p-6 bg-secondary text-white rounded-3xl shadow-lg shadow-secondary/20 transition-transform"
              >
                <Clock size={24} className="mb-2" />
                <span className="text-sm font-bold">Notices</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
