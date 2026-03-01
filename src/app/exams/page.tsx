
"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, MapPin, GraduationCap, Loader2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { format } from 'date-fns'

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
  show: { opacity: 1, scale: 1, transition: { type: "spring" } }
}

export default function ExamsPage() {
  const db = useFirestore()
  const examsQuery = useMemoFirebase(() => query(collection(db, 'exams'), orderBy('examDate', 'asc')), [db])
  const { data: exams, isLoading } = useCollection(examsQuery)

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-10 md:p-24 pt-80 pb-32 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mb-20"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 text-primary rounded-full text-xs font-black tracking-[0.2em] uppercase">
            <Sparkles size={16} /> Campus Calendar
          </div>
          <h1 className="text-6xl md:text-8xl font-headline font-bold tracking-tighter">Exam Schedule</h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl font-medium leading-relaxed">
            Official examination dates and sessions for TechXera students. Please ensure you arrive 30 minutes before the scheduled start time.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <Loader2 className="animate-spin text-primary" size={64} />
            <p className="font-bold text-muted-foreground uppercase tracking-widest">Accessing schedule...</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
            {exams?.map((exam) => (
              <motion.div key={exam.id} variants={itemVariant}>
                <Card className="glass border-none rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group">
                  <div className={`h-3 w-full ${exam.status === 'active' ? 'bg-green-500' : exam.status === 'upcoming' ? 'bg-primary' : 'bg-muted'}`} />
                  <CardContent className="p-12">
                    <div className="flex justify-between items-start mb-8">
                      <div className="space-y-1">
                        <Badge variant={exam.status === 'active' ? 'default' : exam.status === 'upcoming' ? 'secondary' : 'outline'} className="uppercase text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full mb-4">
                          {exam.status}
                        </Badge>
                        <h3 className="text-3xl font-headline font-bold tracking-tight group-hover:text-primary transition-colors">{exam.title}</h3>
                      </div>
                      <div className="p-6 bg-muted/50 rounded-3xl text-muted-foreground">
                        <CalendarDays size={32} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/5 text-primary rounded-2xl"><GraduationCap size={20} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Semester</p>
                          <p className="font-bold">{exam.semester}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/5 text-primary rounded-2xl"><Clock size={20} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Start Date</p>
                          <p className="font-bold">{exam.examDate ? format(new Date(exam.examDate), 'MMMM d, yyyy') : 'TBD'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-6 bg-muted/30 rounded-[2rem] text-sm text-muted-foreground border border-white/40">
                      <MapPin size={18} className="text-primary shrink-0" />
                      <p>Check your registered email for specific lab and hall allocations.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {exams?.length === 0 && (
              <div className="col-span-full py-40 text-center border-4 border-dashed border-muted rounded-[4rem] bg-white/30 backdrop-blur-sm">
                <CalendarDays size={80} className="mx-auto text-muted-foreground/20 mb-8" />
                <h2 className="text-2xl font-headline font-bold text-muted-foreground">No Examination Sessions Scheduled</h2>
                <p className="text-muted-foreground mt-2 uppercase text-xs font-bold tracking-widest">Updates will appear here shortly</p>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
