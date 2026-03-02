
"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { QrCode, ShieldCheck, AlertCircle, Clock, Calendar, CheckCircle2, Loader2, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase'
import { doc, collection, query, where } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import SplitText from '@/components/SplitText'

export default function AttendancePage() {
  const [mounted, setMounted] = useState(false)
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(studentRef)

  // Removed orderBy from query to avoid composite index requirement
  const attendanceQuery = useMemoFirebase(() => (user && db ? query(collection(db, 'attendance'), where('studentUid', '==', user.uid)) : null), [user, db])
  const { data: attendance, isLoading: isAttendanceLoading } = useCollection(attendanceQuery)

  // Handle sorting client-side
  const sortedAttendance = useMemo(() => {
    if (!attendance) return [];
    return [...attendance].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    });
  }, [attendance]);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login?redirect=/attendance')
    }
  }, [user, isUserLoading, router, mounted])

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) return null

  // If student is not approved, show pending state
  if (profile && !profile.isApproved) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 pt-32">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="max-w-xl w-full text-center p-12 glass border-none rounded-[3rem] shadow-2xl">
              <div className="mx-auto w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mb-8">
                <AlertCircle size={48} />
              </div>
              <h2 className="text-4xl font-headline font-bold mb-4">Verification Required</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Your profile is currently under review. Attendance tracking and scanning will be available once your registration is approved by the campus administrator.
              </p>
              <Button onClick={() => router.push('/')} variant="outline" className="rounded-xl h-12 px-8 font-bold">
                Back to Home
              </Button>
            </Card>
          </motion.div>
        </main>
      </div>
    )
  }

  const attendancePercentage = attendance ? Math.min(100, (attendance.length / 50) * 100) : 0;
  const isBelowThreshold = attendancePercentage < 75;

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 pt-32 pb-32">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={16} /> Identity Verified
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter">
              <SplitText 
                text="Attendance Hub"
                tag="span"
                duration={0.6}
                delay={30}
              />
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
              Track your campus presence and verify session participation in real-time.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/attendance/scan')}
            className="h-16 px-10 bg-primary text-white hover:bg-primary/90 rounded-[2rem] text-lg font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <QrCode className="mr-3" /> Mark Presence Now
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Stats Overview */}
          <div className="space-y-8">
            <Card className="glass border-none rounded-[3rem] shadow-xl overflow-hidden">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                  <TrendingUp className="text-primary" /> Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Attendance</span>
                    <span className={`font-black text-4xl ${isBelowThreshold ? 'text-destructive' : 'text-primary'}`}>
                      {attendancePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={attendancePercentage} className={`h-4 ${isBelowThreshold ? 'bg-destructive/10' : 'bg-muted'}`} />
                </div>

                {isBelowThreshold && (
                  <div className="p-6 bg-destructive/10 rounded-[2rem] border border-destructive/20 flex gap-4">
                    <AlertCircle className="text-destructive shrink-0" />
                    <p className="text-sm font-bold leading-tight text-destructive">
                      WARNING: You are below the 75% threshold. Regular attendance is required for exam eligibility.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-6 bg-muted/30 rounded-3xl border border-white/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Total Scans</p>
                    <p className="text-2xl font-black text-foreground">{attendance?.length || 0}</p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-white/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Status</p>
                    <p className={`text-sm font-black uppercase ${isBelowThreshold ? 'text-destructive' : 'text-green-500'}`}>
                      {isBelowThreshold ? 'Critical' : 'Good Standing'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-8 bg-primary/5 rounded-[3rem] border border-primary/10 flex items-start gap-4">
              <CheckCircle2 className="text-primary shrink-0 mt-1" size={20} />
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Verified Presence</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your attendance is digitally signed and verified using rotating security tokens during class sessions.
                </p>
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="lg:col-span-2">
            <Card className="glass border-none rounded-[3.5rem] shadow-xl overflow-hidden min-h-[500px]">
              <CardHeader className="p-10 border-b border-border/20 bg-white/30">
                <CardTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                  <Clock className="text-primary" /> Session History
                </CardTitle>
                <CardDescription>Records of your successfully scanned attendance sessions</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isAttendanceLoading ? (
                  <div className="py-32 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Retrieving logs...</p>
                  </div>
                ) : sortedAttendance && sortedAttendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20 border-b border-border/10">
                          <TableHead className="px-10 py-6 font-black text-[10px] uppercase tracking-widest">Class Session</TableHead>
                          <TableHead className="py-6 font-black text-[10px] uppercase tracking-widest">Date</TableHead>
                          <TableHead className="py-6 font-black text-[10px] uppercase tracking-widest">Time</TableHead>
                          <TableHead className="px-10 py-6 text-right font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedAttendance.map((record, i) => (
                          <motion.tr 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={record.id} 
                            className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors"
                          >
                            <td className="px-10 py-6 font-bold text-lg">Session {record.sessionId}</td>
                            <td className="py-6 text-sm font-medium text-muted-foreground">
                              {record.timestamp ? format(new Date(record.timestamp), 'MMM d, yyyy') : 'N/A'}
                            </td>
                            <td className="py-6 text-sm font-medium text-muted-foreground">
                              {record.timestamp ? format(new Date(record.timestamp), 'h:mm a') : 'N/A'}
                            </td>
                            <td className="px-10 py-6 text-right">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={12} /> Present
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-32 flex flex-col items-center justify-center text-center px-10">
                    <div className="p-6 bg-muted/20 rounded-full mb-6">
                      <Calendar size={48} className="text-muted-foreground/30" />
                    </div>
                    <h3 className="text-xl font-headline font-bold text-muted-foreground mb-2">No Attendance Records</h3>
                    <p className="text-muted-foreground max-w-sm font-medium text-sm leading-relaxed">
                      You haven't scanned any session QR codes yet. Head to your classroom to mark your attendance!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
