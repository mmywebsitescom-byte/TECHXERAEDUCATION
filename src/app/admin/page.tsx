
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { TechXeraLogo } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Shield, GraduationCap, Users, CheckCircle, 
  Search, ClipboardList, Settings as SettingsIcon, 
  LogOut, Home, ArrowRight, Bell, HelpCircle,
  Plus, LifeBuoy, BookOpen, Camera, Trash2, 
  Loader2, CheckCircle2, AlertCircle, RefreshCw,
  Clock, Calendar as CalendarIcon
} from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useAuth, useCollection } from '@/firebase'
import { collection, doc, setDoc, deleteDoc, query, orderBy, where, getDocs, updateDoc, getDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TechBackground from '@/components/TechBackground'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('attendance')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  // Create Session State
  const [newSession, setNewSession] = useState({
    className: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    description: ''
  })

  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthorizedAdmin = user?.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()

  useEffect(() => {
    if (mounted && !isUserLoading) {
      if (!user) {
        router.push('/admin/login')
      } else if (!isAuthorizedAdmin) {
        toast({ variant: "destructive", title: "Access Denied" })
        router.push('/')
      }
    }
  }, [user, isUserLoading, router, mounted, isAuthorizedAdmin, toast])

  // Firebase Data Queries
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: dbSettings } = useDoc(settingsRef)

  const sessionsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'sessions'), orderBy('createdAt', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery)

  const attendanceQuery = useMemoFirebase(() => (db && selectedSessionId && isAuthorizedAdmin ? query(collection(db, 'attendance'), where('sessionId', '==', selectedSessionId)) : null), [db, selectedSessionId, isAuthorizedAdmin])
  const { data: sessionAttendance } = useCollection(attendanceQuery)

  const studentsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'students'), orderBy('enrollmentDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allStudents } = useCollection(studentsQuery)

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  }

  // Attendance Handlers
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    const payload = {
      ...newSession,
      id,
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    const docRef = doc(db, 'sessions', id)
    
    setDoc(docRef, payload)
      .then(() => {
        toast({ title: "Session Established" })
        setIsCreateDialogOpen(false)
        setNewSession({
          className: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '09:00',
          endTime: '10:00',
          description: ''
        })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  const handleDeleteSession = async (id: string) => {
    if (!db) return
    try {
      await deleteDoc(doc(db, 'sessions', id))
      toast({ title: "Session Removed" })
      if (selectedSessionId === id) setSelectedSessionId(null)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  // Scanner Logic
  useEffect(() => {
    if (isScannerOpen && selectedSessionId && db) {
      const timer = setTimeout(() => {
        const element = document.getElementById("admin-portal-qr-reader");
        if (!element) return;

        const scanner = new Html5QrcodeScanner(
          "admin-portal-qr-reader",
          { fps: 15, qrbox: { width: 250, height: 250 } },
          false
        );

        const onScanSuccess = async (decodedText: string) => {
          try {
            const studentData = JSON.parse(decodedText)
            if (studentData.type !== 'techxera-student-id') return

            const recordId = `${studentData.uid}_${selectedSessionId}`
            const attendanceRef = doc(db, 'attendance', recordId)
            
            const existing = await getDoc(attendanceRef)
            if (existing.exists()) {
              toast({ title: "Already Logged", description: `${studentData.name} is present.` })
              return
            }

            const payload = {
              id: recordId,
              sessionId: selectedSessionId,
              studentUid: studentData.uid,
              studentId: studentData.studentId,
              studentName: studentData.name,
              timestamp: new Date().toISOString(),
              status: 'present'
            };

            setDoc(attendanceRef, payload)
              .then(() => {
                toast({ title: "Check-in Confirmed", description: `Scanned ${studentData.name}` })
              })
              .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                  path: attendanceRef.path,
                  operation: 'create',
                  requestResourceData: payload,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
              });

          } catch (err) {
            console.warn("Scan error:", err)
          }
        }

        scanner.render(onScanSuccess, (err) => {})
        scannerRef.current = scanner
      }, 500);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.warn(e))
          scannerRef.current = null
        }
      }
    }
  }, [isScannerOpen, selectedSessionId, db, toast])

  const activeSession = sessions?.find(s => s.id === selectedSessionId)

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Shield className="animate-pulse text-primary" size={64} /></div>
  if (!user || !isAuthorizedAdmin) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <TechBackground />
      
      {/* Header Section */}
      <header className="w-full px-6 md:px-12 pt-12 pb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 z-10">
        <div className="flex items-center gap-6">
          <TechXeraLogo className="w-20 h-20 shadow-2xl shadow-primary/20" customUrl={dbSettings?.logoUrl} />
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter">Admin Central</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
              <Shield size={14} className="text-primary" />
              <p className="text-primary font-bold text-[10px] uppercase tracking-widest">ROOT: {user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link href="/">
            <Button variant="outline" className="h-14 px-8 rounded-2xl font-bold bg-white/50 backdrop-blur-md shadow-sm border-2">
              <Home className="mr-2" size={20} /> Portal Home
            </Button>
          </Link>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="h-14 px-8 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 flex-1 md:flex-none"
          >
            <Plus className="mr-2" size={20} /> Create New
          </Button>
          <Button onClick={handleLogout} variant="ghost" className="h-14 px-6 rounded-2xl font-bold text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2" size={20} /> Logout
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 pb-32 space-y-8 z-10">
        <Tabs defaultValue="attendance" className="w-full" onValueChange={setActiveTab}>
          {/* Tabs Navigation */}
          <div className="bg-white/80 dark:bg-card/40 backdrop-blur-xl rounded-[2.5rem] p-3 shadow-xl mb-12 border border-white/20">
            <TabsList className="bg-transparent flex flex-wrap justify-center h-auto gap-2 border-none">
              {[
                { id: 'attendance', label: 'Attendance', icon: <CheckCircle2 size={16} /> },
                { id: 'results', label: 'Results', icon: <GraduationCap size={16} /> },
                { id: 'students', label: 'Students', icon: <Users size={16} /> },
                { id: 'support', label: 'Support Hub', icon: <LifeBuoy size={16} /> },
                { id: 'exams', label: 'Exams', icon: <CalendarIcon size={16} /> },
                { id: 'notices', label: 'Notices', icon: <Bell size={16} /> },
                { id: 'repository', label: 'Repository', icon: <BookOpen size={16} /> },
                { id: 'branding', label: 'Branding', icon: <SettingsIcon size={16} /> },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className="data-[state=active]:bg-primary data-[state=active]:text-white h-12 px-8 rounded-[1.5rem] font-bold uppercase text-[10px] tracking-widest gap-2 transition-all hover:bg-primary/5 border-none"
                >
                  {tab.icon} {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <Card className="glass border-none rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden min-h-[600px]">
            <CardContent className="p-12">
              
              <TabsContent value="attendance" className="mt-0 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h3 className="text-2xl font-headline font-bold flex items-center gap-3">
                      <Clock className="text-primary" /> Active Class Sessions
                    </h3>
                    <div className="space-y-6">
                      {sessionsLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                      ) : sessions?.length === 0 ? (
                        <div className="text-center py-24 border-4 border-dashed rounded-[3rem] bg-muted/20">
                          <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No active sessions found.</p>
                        </div>
                      ) : sessions?.map((session) => (
                        <Card key={session.id} className={`border-none ${selectedSessionId === session.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-background/50'} rounded-[2.5rem] shadow-lg transition-all`}>
                          <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2">
                              <h4 className="font-bold text-2xl tracking-tight">{session.className}</h4>
                              <div className="flex items-center gap-6 text-sm text-muted-foreground font-bold">
                                <span className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {session.startTime}</span>
                                <span className="flex items-center gap-2"><CalendarIcon size={14} className="text-primary" /> {session.date}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                              <Button 
                                onClick={() => {
                                  setSelectedSessionId(session.id)
                                  setIsScannerOpen(true)
                                }}
                                className="flex-1 md:flex-none h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold"
                              >
                                <Camera className="mr-2" size={18} /> Launch Scanner
                              </Button>
                              <Button 
                                onClick={() => handleDeleteSession(session.id)}
                                size="icon" 
                                variant="ghost" 
                                className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 size={20} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <Card className="bg-primary/5 border-none rounded-[3rem] p-10 min-h-[400px]">
                      <h4 className="text-xl font-headline font-bold mb-6 flex items-center justify-between">
                        Presence Monitor
                        {selectedSessionId && <Badge className="bg-primary">{sessionAttendance?.length || 0} Present</Badge>}
                      </h4>
                      {selectedSessionId ? (
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                          {sessionAttendance?.map(record => (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={record.id} 
                              className="flex items-center justify-between p-5 bg-white dark:bg-black/20 rounded-2xl border border-white/40 shadow-sm"
                            >
                              <div>
                                <p className="font-bold">{record.studentName}</p>
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest">{record.studentId}</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase">{format(new Date(record.timestamp), 'h:mm a')}</p>
                            </motion.div>
                          ))}
                          {sessionAttendance?.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground italic">Waiting for student scans...</div>
                          )}
                        </div>
                      ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center gap-6 text-muted-foreground opacity-50">
                          <CheckCircle2 size={64} />
                          <p className="max-w-[200px] font-medium text-sm">Select a session to view real-time presence logs.</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="results" className="mt-0">
                <div className="h-[400px] flex flex-col items-center justify-center gap-8">
                  <GraduationCap size={80} className="text-primary/20" />
                  <div className="text-center space-y-2">
                    <p className="text-2xl font-headline font-bold">Select an exam cycle above to manage grades</p>
                    <p className="text-muted-foreground max-w-sm">Use the "Create New" button to add transcripts for students.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="students" className="mt-0">
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-headline font-bold">Registered Students</h3>
                    <Badge variant="outline">{allStudents?.length || 0} Total Records</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allStudents?.map(student => (
                      <Card key={student.id} className="bg-background/50 rounded-3xl border-none shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-muted-foreground">{student.studentId}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/10">
                          <Badge variant={student.isApproved ? 'default' : 'secondary'} className={student.isApproved ? 'bg-green-500' : ''}>
                            {student.status}
                          </Badge>
                          {!student.isApproved && (
                             <Button size="sm" className="h-8 rounded-lg" onClick={async () => {
                               if (!db) return;
                               await updateDoc(doc(db, 'students', student.id), { isApproved: true, status: 'approved' });
                               toast({ title: "Student Approved" });
                             }}>Approve</Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="support" className="mt-0">
                 <div className="h-[400px] flex flex-col items-center justify-center gap-8">
                  <LifeBuoy size={80} className="text-primary/20" />
                  <p className="text-2xl font-headline font-bold">Support Hub Active</p>
                  <p className="text-muted-foreground">Manage and resolve student technical inquiries in real-time.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="branding" className="mt-0">
                <div className="max-w-xl space-y-8">
                  <h3 className="text-2xl font-headline font-bold">Site Configuration</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Campus Site Name</Label>
                      <Input value={dbSettings?.siteName || ''} readOnly className="bg-muted h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Logo URL</Label>
                      <Input value={dbSettings?.logoUrl || ''} readOnly className="bg-muted h-12 rounded-xl" />
                    </div>
                    <p className="text-xs text-muted-foreground italic">Site configuration is managed via root configuration collection.</p>
                  </div>
                </div>
              </TabsContent>

            </CardContent>
          </Card>
        </Tabs>
      </main>

      {/* Admin Scanner Modal */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-10 overflow-hidden">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-headline font-bold mb-2">Scanner: {activeSession?.className}</DialogTitle>
            <p className="text-muted-foreground font-medium">Position student's identity QR within the frame</p>
          </DialogHeader>
          <div className="flex flex-col items-center gap-8 py-6">
            <div id="admin-portal-qr-reader" className="w-full rounded-[2.5rem] overflow-hidden border-4 border-primary/20 bg-muted/20 min-h-[300px]" />
            <div className="p-5 bg-primary/5 rounded-2xl w-full flex items-center gap-4 text-xs text-primary border border-primary/20">
              <CheckCircle2 size={20} className="shrink-0" />
              <p className="font-medium leading-relaxed">Secure Admin Mode. Instant student verification and database logging.</p>
            </div>
            <Button onClick={() => setIsScannerOpen(false)} variant="outline" className="w-full h-12 rounded-xl font-bold">
              Terminate Scanner
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Session Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-10">
          <DialogHeader><DialogTitle className="text-2xl font-headline font-bold">Initialize Class</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Module Name</Label>
              <Input required placeholder="e.g. Data Structures" value={newSession.className} onChange={e => setNewSession({...newSession, className: e.target.value})} className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" required value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} className="h-12 rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg">Initialize Session</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
