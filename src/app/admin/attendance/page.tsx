
"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Navbar, { TechXeraLogo } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, Users, QrCode, Clock, Calendar, 
  Trash2, Play, CheckCircle2, Loader2, Download,
  ArrowRight, ShieldCheck, AlertCircle
} from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, doc, setDoc, deleteDoc, query, orderBy, updateDoc, where } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

export default function AdminAttendancePage() {
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [newSession, setNewSession] = useState({
    className: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    description: ''
  })
  const [dynamicToken, setDynamicToken] = useState('')
  const [countdown, setCountdown] = useState(20)

  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const sessionsQuery = useMemoFirebase(() => (db ? query(collection(db, 'sessions'), orderBy('createdAt', 'desc')) : null), [db])
  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery)

  const attendanceQuery = useMemoFirebase(() => (db && selectedSessionId ? query(collection(db, 'attendance'), where('sessionId', '==', selectedSessionId)) : null), [db, selectedSessionId])
  const { data: attendance } = useCollection(attendanceQuery)

  // Token rotation logic
  useEffect(() => {
    if (!selectedSessionId || !isQRModalOpen) return

    const rotateToken = () => {
      const newToken = Math.random().toString(36).substring(2, 15)
      setDynamicToken(newToken)
      setCountdown(20)
      
      const sessionRef = doc(db, 'sessions', selectedSessionId)
      updateDoc(sessionRef, { dynamicToken: newToken, status: 'active' })
    }

    rotateToken()
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          rotateToken()
          return 20
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [selectedSessionId, isQRModalOpen, db])

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    try {
      await setDoc(doc(db, 'sessions', id), {
        ...newSession,
        id,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
        dynamicToken: ''
      })
      toast({ title: "Session Created", description: "Class session added to registry." })
      setIsDialogOpen(false)
      setNewSession({
        className: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        description: ''
      })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const handleDeleteSession = async (id: string) => {
    if (!db) return
    try {
      await deleteDoc(doc(db, 'sessions', id))
      toast({ title: "Session Removed" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const activeSession = sessions?.find(s => s.id === selectedSessionId)

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>
  if (user?.email !== AUTHORIZED_ADMIN_EMAIL) return <div className="min-h-screen flex items-center justify-center">Access Denied</div>

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 pt-32 pb-24 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter">Attendance Hub</h1>
            <p className="text-muted-foreground font-medium">Manage class sessions and real-time scanning.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 bg-primary rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95">
                <Plus className="mr-2" /> New Class Session
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem]">
              <DialogHeader><DialogTitle>Create Class Session</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateSession} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Class Name</Label>
                  <Input required placeholder="Advanced Web Development" value={newSession.className} onChange={e => setNewSession({...newSession, className: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" required value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Notes for this session..." value={newSession.description} onChange={e => setNewSession({...newSession, description: e.target.value})} />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-12 rounded-xl">Initialize Session</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Calendar className="text-primary" size={24} /> Recent Sessions
            </h2>
            <div className="grid gap-4">
              {sessionsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div>
              ) : sessions?.map((session) => (
                <Card key={session.id} className="border-none bg-white dark:bg-card/40 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                  <CardContent className="p-6 flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl">{session.className}</h3>
                        <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Clock size={14} /> {session.startTime} - {session.endTime}</span>
                        <span className="flex items-center gap-1"><Calendar size={14} /> {session.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={() => {
                          setSelectedSessionId(session.id)
                          setIsQRModalOpen(true)
                        }}
                        size="icon" 
                        variant="ghost" 
                        className="rounded-xl text-primary hover:bg-primary/10"
                      >
                        <QrCode />
                      </Button>
                      <Button 
                        onClick={() => handleDeleteSession(session.id)}
                        size="icon" 
                        variant="ghost" 
                        className="rounded-xl text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <Card className="glass border-none rounded-[2.5rem] shadow-xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b p-8">
                <CardTitle className="text-xl">Live Insights</CardTitle>
                <CardDescription>Stats for selected session</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {selectedSessionId ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-sm">
                        <span>Attendance Count</span>
                        <span className="text-primary">{attendance?.length || 0}</span>
                      </div>
                      <Progress value={((attendance?.length || 0) / 100) * 100} className="h-2" />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Present Students</h4>
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {attendance?.map(record => (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-white/40">
                            <div className="text-sm font-bold">{record.studentName}</div>
                            <div className="text-[10px] text-muted-foreground">{format(new Date(record.timestamp), 'h:mm a')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground italic">
                    Select a session QR to view live stats.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dynamic QR Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-10">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-headline font-bold mb-2">{activeSession?.className}</DialogTitle>
            <p className="text-muted-foreground">Students must scan this code to mark attendance</p>
          </DialogHeader>
          <div className="flex flex-col items-center gap-8 py-6">
            <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl">
              <QRCodeSVG 
                value={JSON.stringify({
                  sessionId: selectedSessionId,
                  token: dynamicToken,
                  type: 'techxera-attendance'
                })}
                size={250}
                level="H"
                includeMargin
              />
              <motion.div 
                key={dynamicToken}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full animate-ping" />
              </motion.div>
            </div>
            
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center px-4">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Token Rotates In</span>
                <span className="text-xl font-black text-primary font-code">{countdown}s</span>
              </div>
              <Progress value={(countdown / 20) * 100} className="h-1.5" />
            </div>

            <div className="p-4 bg-muted/50 rounded-2xl w-full flex items-center gap-3 text-xs text-muted-foreground border">
              <ShieldCheck className="text-primary" size={16} />
              <p>Security protocol active. Codes expire after 20s.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
