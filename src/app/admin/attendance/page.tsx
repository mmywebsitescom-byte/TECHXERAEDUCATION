
"use client"

import React, { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, QrCode, Clock, Calendar, 
  Trash2, Loader2, ShieldCheck, Camera,
  CheckCircle2, AlertCircle, RefreshCw, ArrowLeft
} from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, doc, setDoc, deleteDoc, query, orderBy, where, getDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Html5QrcodeScanner } from 'html5-qrcode'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

export default function AdminAttendancePage() {
  const [mounted, setMounted] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [newSession, setNewSession] = useState({
    className: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    description: ''
  })
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
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

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    try {
      await setDoc(doc(db, 'sessions', id), {
        ...newSession,
        id,
        status: 'active',
        createdAt: new Date().toISOString(),
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

  // Scanner Logic
  useEffect(() => {
    if (!isScannerOpen || !selectedSessionId) return

    const scanner = new Html5QrcodeScanner(
      "admin-qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    const onScanSuccess = async (decodedText: string) => {
      try {
        const studentData = JSON.parse(decodedText)
        if (studentData.type !== 'techxera-student-id') return

        const recordId = `${studentData.uid}_${selectedSessionId}`
        const attendanceRef = doc(db, 'attendance', recordId)
        
        const existing = await getDoc(attendanceRef)
        if (existing.exists()) {
          toast({ title: "Already Marked", description: `${studentData.name} is already present.` })
          return
        }

        await setDoc(attendanceRef, {
          id: recordId,
          sessionId: selectedSessionId,
          studentUid: studentData.uid,
          studentId: studentData.studentId,
          studentName: studentData.name,
          timestamp: new Date().toISOString(),
          status: 'present'
        })

        toast({ title: "Attendance Success", description: `Marked ${studentData.name} as present.` })
      } catch (err) {
        console.error("Scan error:", err)
      }
    }

    scanner.render(onScanSuccess, (err) => {})
    scannerRef.current = scanner

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.warn(e))
        scannerRef.current = null
      }
    }
  }, [isScannerOpen, selectedSessionId, db, toast])

  const activeSession = sessions?.find(s => s.id === selectedSessionId)

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>
  if (user?.email !== AUTHORIZED_ADMIN_EMAIL) return <div className="min-h-screen flex items-center justify-center">Access Denied</div>

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6 pt-32 pb-24 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter text-primary">Attendance Console</h1>
            <p className="text-muted-foreground font-medium">Create sessions and scan student identity codes.</p>
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
              <Calendar className="text-primary" size={24} /> Active Sessions
            </h2>
            <div className="grid gap-4">
              {sessionsLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div>
              ) : sessions?.map((session) => (
                <Card key={session.id} className={`border-none ${selectedSessionId === session.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-white dark:bg-card/40'} rounded-3xl shadow-sm transition-all`}>
                  <CardContent className="p-6 flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl">{session.className}</h3>
                        <Badge variant="secondary">Active</Badge>
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
                          setIsScannerOpen(true)
                        }}
                        className="rounded-xl bg-primary hover:bg-primary/90"
                      >
                        <Camera className="mr-2" size={18} /> Open Scanner
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
                <CardTitle className="text-xl">Presence Monitor</CardTitle>
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
                      <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Successfully Scanned</h4>
                      <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
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
                    Select a class session to begin scanning student identity codes.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Admin Scanner Modal */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-10">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-headline font-bold mb-2">Scanning: {activeSession?.className}</DialogTitle>
            <p className="text-muted-foreground">Scan student's identity QR code to mark present</p>
          </DialogHeader>
          <div className="flex flex-col items-center gap-8 py-6">
            <div id="admin-qr-reader" className="w-full rounded-[2rem] overflow-hidden border-4 border-primary/20 bg-muted/20 min-h-[300px]" />
            <div className="p-4 bg-primary/5 rounded-2xl w-full flex items-center gap-3 text-xs text-primary border border-primary/20">
              <ShieldCheck size={16} />
              <p>Secure Admin Mode. Attendance is recorded instantly upon successful student ID validation.</p>
            </div>
            <Button onClick={() => setIsScannerOpen(false)} variant="outline" className="w-full rounded-xl">
              Close Scanner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
