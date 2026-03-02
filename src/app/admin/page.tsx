"use client"

import React, { useState, useEffect, useRef } from 'react'
import { TechXeraLogo } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Shield, GraduationCap, Users, CheckCircle, 
  Search, ClipboardList, Settings as SettingsIcon, 
  LogOut, Home, ArrowRight, Bell, HelpCircle,
  Plus, LifeBuoy, BookOpen, Camera, Trash2, 
  Loader2, CheckCircle2, AlertCircle, RefreshCw,
  Clock, Calendar as CalendarIcon, FileText, Edit,
  ShieldCheck, Layout, ImageIcon, Globe, Send
} from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useAuth, useCollection } from '@/firebase'
import { collection, doc, setDoc, deleteDoc, query, orderBy, where, updateDoc, getDoc } from 'firebase/firestore'
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
  const [activeTab, setActiveTab] = useState('results')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedExamCycle, setSelectedExamCycle] = useState<string | null>(null)
  
  // Create Session State
  const [newSession, setNewSession] = useState({
    className: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    description: ''
  })

  // Branding Form State
  const [brandingForm, setBrandingForm] = useState({
    siteName: '',
    logoUrl: '',
    faviconUrl: '',
    heroDescription: ''
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

  useEffect(() => {
    if (dbSettings) {
      setBrandingForm({
        siteName: dbSettings.siteName || '',
        logoUrl: dbSettings.logoUrl || '',
        faviconUrl: dbSettings.faviconUrl || '',
        heroDescription: dbSettings.heroDescription || ''
      })
    }
  }, [dbSettings])

  const sessionsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'sessions'), orderBy('createdAt', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery)

  const attendanceQuery = useMemoFirebase(() => (db && selectedSessionId && isAuthorizedAdmin ? query(collection(db, 'attendance'), where('sessionId', '==', selectedSessionId)) : null), [db, selectedSessionId, isAuthorizedAdmin])
  const { data: sessionAttendance } = useCollection(attendanceQuery)

  const studentsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'students'), orderBy('enrollmentDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allStudents } = useCollection(studentsQuery)

  const examsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'exams'), orderBy('examDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allExams } = useCollection(examsQuery)

  const supportQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'support_inquiries'), orderBy('timestamp', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: supportInquiries } = useCollection(supportQuery)

  const noticesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'notices'), orderBy('publishDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allNotices } = useCollection(noticesQuery)

  const materialsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allMaterials } = useCollection(materialsQuery)

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  }

  // Branding Handler
  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const docRef = doc(db, 'settings', 'site-config')
    setDoc(docRef, brandingForm, { merge: true })
      .then(() => toast({ title: "Branding Updated", description: "Campus identity settings have been synchronized." }))
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: brandingForm,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
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
      dynamicToken: Math.random().toString(36).substring(2, 10).toUpperCase()
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

  const handleApproveStudent = async (studentId: string) => {
    if (!db) return
    const docRef = doc(db, 'students', studentId)
    updateDoc(docRef, { isApproved: true, status: 'approved' })
      .then(() => toast({ title: "Student Approved" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { isApproved: true, status: 'approved' },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleResolveInquiry = async (id: string) => {
    if (!db) return
    const docRef = doc(db, 'support_inquiries', id)
    updateDoc(docRef, { status: 'resolved' })
      .then(() => toast({ title: "Inquiry Resolved" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { status: 'resolved' },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleDeleteMaterial = async (id: string) => {
    if (!db) return
    try {
      await deleteDoc(doc(db, 'studyMaterials', id))
      toast({ title: "Material Removed" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  // Scanner Logic
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isScannerOpen && selectedSessionId && db) {
      const timer = setTimeout(() => {
        const element = document.getElementById("admin-attendance-scan-reader");
        if (!element) return;

        scanner = new Html5QrcodeScanner(
          "admin-attendance-scan-reader",
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
                toast({ title: "Check-in Confirmed", description: `Verified ${studentData.name}` })
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
            console.warn("Scan processing error:", err)
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

      {/* Main Content Area with Tabbed Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 pb-32 space-y-8 z-10">
        <Tabs defaultValue="results" className="w-full" onValueChange={setActiveTab}>
          <div className="bg-white/80 dark:bg-card/40 backdrop-blur-xl rounded-[2.5rem] p-3 shadow-xl mb-12 border border-white/20">
            <TabsList className="bg-transparent flex flex-wrap justify-center h-auto gap-2 border-none">
              {[
                { id: 'results', label: 'Results', icon: <GraduationCap size={16} /> },
                { id: 'students', label: 'Students', icon: <Users size={16} /> },
                { id: 'support', label: 'Support Hub', icon: <LifeBuoy size={16} /> },
                { id: 'attendance', label: 'Attendance', icon: <CheckCircle2 size={16} /> },
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

          <Card className="glass border-none rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden min-h-[600px]">
            <CardContent className="p-12">
              
              {/* Results Tab */}
              <TabsContent value="results" className="mt-0 space-y-12">
                <div className="space-y-8">
                  <div className="max-w-md">
                    <Select onValueChange={setSelectedExamCycle}>
                      <SelectTrigger className="h-14 rounded-2xl bg-background/50 border-2 font-bold text-lg shadow-sm">
                        <SelectValue placeholder="-- Select Exam Cycle --" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {allExams?.map(exam => (
                          <SelectItem key={exam.id} value={exam.id} className="font-medium">{exam.title} - {exam.semester}</SelectItem>
                        ))}
                        {allExams?.length === 0 && <p className="p-4 text-xs italic text-muted-foreground">No active exam sessions found.</p>}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-[2.5rem] overflow-hidden bg-background/30 shadow-inner">
                    <Table>
                      <TableHeader className="bg-muted/50 border-b">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="h-16 px-10 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Student</TableHead>
                          <TableHead className="h-16 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Roll No</TableHead>
                          <TableHead className="h-16 px-10 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-right">Operations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExamCycle ? (
                          allStudents?.map(student => (
                            <TableRow key={student.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                              <TableCell className="px-10 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{student.firstName[0]}</div>
                                  <p className="font-bold">{student.firstName} {student.lastName}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-black text-primary/60 text-xs">{student.studentId}</TableCell>
                              <TableCell className="px-10 text-right">
                                <Button variant="ghost" className="h-10 px-4 rounded-xl font-bold text-xs gap-2">
                                  <Edit size={14} /> Update Grade
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-80 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-40">
                                <ClipboardList size={48} />
                                <p className="text-muted-foreground italic font-medium">Select an exam cycle above to manage grades</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="mt-0 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h3 className="text-2xl font-headline font-bold flex items-center gap-3">
                      <Clock className="text-primary" /> Class Registries
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
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
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

              {/* Students Tab */}
              <TabsContent value="students" className="mt-0 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-headline font-bold">Student Registry</h3>
                  <Badge variant="outline">{allStudents?.length || 0} Records</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allStudents?.map(student => (
                    <Card key={student.id} className="bg-background/50 rounded-3xl border-none shadow-sm p-6 space-y-4 border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold truncate">{student.firstName} {student.lastName}</p>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{student.studentId}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border/10">
                        <Badge variant={student.isApproved ? 'default' : 'secondary'} className={student.isApproved ? 'bg-green-500' : 'bg-orange-500'}>
                          {student.status}
                        </Badge>
                        {!student.isApproved && (
                           <Button size="sm" className="h-9 px-4 rounded-xl font-bold bg-primary" onClick={() => handleApproveStudent(student.id)}>
                             Approve
                           </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="support" className="mt-0 space-y-8">
                <h3 className="text-2xl font-headline font-bold">Inquiry Management</h3>
                <div className="grid gap-4">
                  {supportInquiries?.map(inquiry => (
                    <Card key={inquiry.id} className="bg-background/50 rounded-2xl border-none p-6 flex flex-col md:flex-row justify-between gap-6 border border-white/10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={inquiry.status === 'pending' ? 'bg-orange-500' : 'bg-green-500'}>{inquiry.status}</Badge>
                          <h4 className="font-bold text-lg">{inquiry.subject}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{inquiry.message}</p>
                        <p className="text-[10px] font-black text-primary/50 uppercase tracking-widest">FROM: {inquiry.name} ({inquiry.email})</p>
                      </div>
                      {inquiry.status === 'pending' && (
                        <Button variant="outline" size="sm" className="h-10 rounded-xl" onClick={() => handleResolveInquiry(inquiry.id)}>Mark Resolved</Button>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="exams" className="mt-0 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-headline font-bold">Academic Calendar</h3>
                  <Button size="sm" className="rounded-xl"><Plus className="mr-2" size={16} /> New Exam</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allExams?.map(exam => (
                    <Card key={exam.id} className="p-6 bg-background/50 rounded-2xl border border-white/10 space-y-4">
                      <div className="flex justify-between">
                        <h4 className="font-bold text-xl">{exam.title}</h4>
                        <Badge>{exam.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2"><CalendarIcon size={14} /> {exam.examDate}</span>
                        <span className="flex items-center gap-2"><Layout size={14} /> {exam.semester}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notices" className="mt-0 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-headline font-bold">Official Bulletins</h3>
                  <Button size="sm" className="rounded-xl"><Plus className="mr-2" size={16} /> New Notice</Button>
                </div>
                <div className="grid gap-4">
                  {allNotices?.map(notice => (
                    <Card key={notice.id} className="bg-background/50 rounded-2xl border-none p-6 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg">{notice.title}</h4>
                        <Badge variant={notice.isUrgent ? 'destructive' : 'default'}>{notice.isUrgent ? 'URGENT' : 'NORMAL'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notice.description}</p>
                      <p className="text-[10px] font-black uppercase text-primary/40 mt-4">{format(new Date(notice.publishDate), 'PPP')}</p>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="repository" className="mt-0 space-y-8">
                <div className="border rounded-[2.5rem] overflow-hidden bg-background/30 shadow-inner">
                  <Table>
                    <TableHeader className="bg-muted/50 border-b">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="h-16 px-10 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Title</TableHead>
                        <TableHead className="h-16 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Subject</TableHead>
                        <TableHead className="h-16 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Type/Section</TableHead>
                        <TableHead className="h-16 px-10 font-bold text-muted-foreground uppercase text-[10px] tracking-widest text-right">Operations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMaterials && allMaterials.length > 0 ? (
                        allMaterials.map(material => (
                          <TableRow key={material.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                            <TableCell className="px-10 py-6">
                              <p className="font-bold text-foreground">{material.title}</p>
                            </TableCell>
                            <TableCell className="py-6">
                              <p className="text-muted-foreground uppercase font-medium">{material.subject}</p>
                            </TableCell>
                            <TableCell className="py-6">
                              <Badge variant="outline" className="rounded-full bg-white dark:bg-black/20 text-xs px-4 border-border/40 font-medium">
                                {material.materialType || 'Notes'}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-10 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/5 rounded-xl">
                                  <Edit size={18} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-10 w-10 text-destructive hover:bg-destructive/5 rounded-xl"
                                  onClick={() => handleDeleteMaterial(material.id)}
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-80 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-40">
                              <BookOpen size={48} />
                              <p className="text-muted-foreground italic font-medium">No materials found in the repository.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="branding" className="mt-0">
                <form onSubmit={handleUpdateBranding} className="max-w-4xl space-y-10">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Portal Name</Label>
                      <Input 
                        value={brandingForm.siteName} 
                        onChange={e => setBrandingForm({...brandingForm, siteName: e.target.value})}
                        placeholder="e.g. TechXera"
                        className="h-14 rounded-2xl bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary text-lg font-bold px-6 shadow-sm" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <ImageIcon size={14} /> Website Logo URL
                        </Label>
                        <Input 
                          value={brandingForm.logoUrl} 
                          onChange={e => setBrandingForm({...brandingForm, logoUrl: e.target.value})}
                          placeholder="https://i.postimg.cc/..."
                          className="h-14 rounded-2xl bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary text-sm font-medium px-6 shadow-sm" 
                        />
                        <p className="text-[10px] text-muted-foreground/60 font-medium ml-2">Logo displayed in Navbar and Dashboard</p>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Globe size={14} /> Tab Icon (Favicon) URL
                        </Label>
                        <Input 
                          value={brandingForm.faviconUrl} 
                          onChange={e => setBrandingForm({...brandingForm, faviconUrl: e.target.value})}
                          placeholder="https://i.postimg.cc/..."
                          className="h-14 rounded-2xl bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary text-sm font-medium px-6 shadow-sm" 
                        />
                        <p className="text-[10px] text-muted-foreground/60 font-medium ml-2">Icon displayed in the browser tab</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hero Description</Label>
                      <Textarea 
                        value={brandingForm.heroDescription} 
                        onChange={e => setBrandingForm({...brandingForm, heroDescription: e.target.value})}
                        placeholder="A high-performance student portal engineered for TechXera students."
                        className="min-h-[180px] rounded-3xl bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary p-6 text-sm leading-relaxed shadow-sm" 
                      />
                    </div>
                  </div>

                  <Button type="submit" className="h-14 px-12 bg-primary text-white hover:bg-primary/90 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    Update Branding <Send className="ml-3" size={18} />
                  </Button>
                </form>
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
            <p className="text-muted-foreground font-medium">Position student identity QR within the frame</p>
          </DialogHeader>
          <div className="flex flex-col items-center gap-8 py-6">
            <div id="admin-attendance-scan-reader" className="w-full rounded-[2.5rem] overflow-hidden border-4 border-primary/20 bg-muted/20 min-h-[300px]" />
            <div className="p-5 bg-primary/5 rounded-2xl w-full flex items-center gap-4 text-xs text-primary border border-primary/20">
              <ShieldCheck size={20} className="shrink-0" />
              <p className="font-medium leading-relaxed">Secure Admin Hub. Instant verification against campus records.</p>
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
              <Input required placeholder="e.g. Advanced AI" value={newSession.className} onChange={e => setNewSession({...newSession, className: e.target.value})} className="h-12 rounded-xl" />
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
