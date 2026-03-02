
"use client"

import React, { useState, useEffect, useRef } from 'react'
import { TechXeraLogo } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, Shield, List, GraduationCap, Megaphone, Loader2, 
  Trash2, Users, CheckCircle, XCircle, Search, ClipboardList, 
  Settings as SettingsIcon, LogOut, Home, Clock, Camera, ShieldCheck 
} from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, useAuth } from '@/firebase'
import { doc, setDoc, collection, deleteDoc, query, orderBy, updateDoc, getDoc, where } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('results')
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isManageResultsOpen, setIsManageResultsOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Selection States
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  
  // Scanner Ref
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // Form States
  const [newNotice, setNewNotice] = useState({ title: '', description: '', isUrgent: false })
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', subject: '', semester: '', fileUrl: '', thumbnailUrl: '', materialType: 'Notes' })
  const [newResult, setNewResult] = useState({ subject: '', semester: '', marksObtained: 0, grade: '', examDate: new Date().toISOString().split('T')[0] })
  const [newExam, setNewExam] = useState({ title: '', semester: '', examDate: new Date().toISOString().split('T')[0], status: 'upcoming', totalMarks: 100 })
  const [newSession, setNewSession] = useState({ className: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', description: '' })
  
  const [siteConfig, setSiteConfig] = useState({ 
    siteName: 'TechXera', 
    logoUrl: '', 
    faviconUrl: '',
    heroDescription: 'A high-performance student portal engineered for TechXera students.' 
  })

  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const isAuthorizedAdmin = !!user && user.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()

  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: dbSettings } = useDoc(settingsRef)

  useEffect(() => {
    if (dbSettings) {
      setSiteConfig({
        siteName: dbSettings.siteName || 'TechXera',
        logoUrl: dbSettings.logoUrl || '',
        faviconUrl: dbSettings.faviconUrl || '',
        heroDescription: dbSettings.heroDescription || 'A high-performance student portal engineered for TechXera students.'
      })
    }
  }, [dbSettings])

  // Queries
  const noticesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'notices'), orderBy('publishDate', 'desc')) : null, [db, isAuthorizedAdmin])
  const materialsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db, isAuthorizedAdmin])
  const studentsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? collection(db, 'students') : null, [db, isAuthorizedAdmin])
  const examsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'exams'), orderBy('examDate', 'desc')) : null, [db, isAuthorizedAdmin])
  const inquiriesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'support_inquiries'), orderBy('timestamp', 'desc')) : null, [db, isAuthorizedAdmin])
  const sessionsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'sessions'), orderBy('createdAt', 'desc')) : null, [db, isAuthorizedAdmin])
  
  const { data: notices } = useCollection(noticesQuery)
  const { data: materials } = useCollection(materialsQuery)
  const { data: students } = useCollection(studentsQuery)
  const { data: exams } = useCollection(examsQuery)
  const { data: inquiries } = useCollection(inquiriesQuery)
  const { data: sessions } = useCollection(sessionsQuery)

  const selectedStudent = students?.find(s => s.id === selectedStudentId)
  const selectedExam = exams?.find(e => e.id === selectedExamId)
  const activeSession = sessions?.find(s => s.id === selectedSessionId)

  // Attendance for presence monitor
  const attendanceQuery = useMemoFirebase(() => (db && selectedSessionId && isAuthorizedAdmin ? query(collection(db, 'attendance'), where('sessionId', '==', selectedSessionId)) : null), [db, selectedSessionId, isAuthorizedAdmin])
  const { data: sessionAttendance } = useCollection(attendanceQuery)

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

  // Scanner Logic - Safe Initialization
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isScannerOpen && selectedSessionId && db) {
      // Use a timeout to ensure the DOM element is rendered inside the Dialog
      const timer = setTimeout(() => {
        const element = document.getElementById("admin-portal-qr-reader");
        if (!element) {
          console.warn("Scanner element not found in DOM yet.");
          return;
        }

        scanner = new Html5QrcodeScanner(
          "admin-portal-qr-reader",
          { fps: 15, qrbox: { width: 250, height: 250 } },
          false
        );

        const onScanSuccess = async (decodedText: string) => {
          try {
            const studentData = JSON.parse(decodedText);
            if (studentData.type !== 'techxera-student-id') return;

            const recordId = `${studentData.uid}_${selectedSessionId}`;
            const attendanceRef = doc(db, 'attendance', recordId);
            
            const existing = await getDoc(attendanceRef);
            if (existing.exists()) {
              toast({ title: "Already Recorded", description: `${studentData.name} is already marked present.` });
              return;
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
                toast({ title: "Check-in Successful", description: `Student: ${studentData.name}` });
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
            console.warn("QR parsing failed:", err);
          }
        };

        scanner.render(onScanSuccess, (err) => {});
        scannerRef.current = scanner;
      }, 300); // 300ms delay for dialog animation

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.warn("Scanner cleanup warning:", e));
          scannerRef.current = null;
        }
      };
    }
  }, [isScannerOpen, selectedSessionId, db, toast]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  }

  const handleDelete = async (coll: string, id: string) => {
    if (!db || !isAuthorizedAdmin) return;
    try {
      await deleteDoc(doc(db, coll, id));
      toast({ title: "Record Removed" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  }

  const handleApproveStudent = async (uid: string, approved: boolean) => {
    if (!db || !isAuthorizedAdmin) return;
    try {
      await updateDoc(doc(db, 'students', uid), { 
        isApproved: approved,
        status: approved ? 'approved' : 'rejected'
      });
      toast({ title: approved ? "Student Approved" : "Student Restricted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    const id = Math.random().toString(36).substring(2, 9);
    const payload = {
      ...newSession,
      id,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    const docRef = doc(db, 'sessions', id);
    
    setDoc(docRef, payload)
      .then(() => {
        toast({ title: "Session Established" });
        setIsDialogOpen(false);
        setNewSession({ className: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', description: '' });
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

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={48} /></div>
  if (!user || user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-12 pb-20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <TechXeraLogo className="w-20 h-20 shadow-2xl shadow-primary/20 shrink-0" customUrl={siteConfig.logoUrl} />
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter leading-tight">Admin Central</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
                <Shield size={14} className="text-primary" />
                <p className="text-primary font-bold text-xs">ROOT: {user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <Link href="/"><Button variant="outline" className="h-14 px-6 rounded-2xl font-bold border-2"><Home className="mr-2" size={20} /> Portal Home</Button></Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={['results', 'config', 'students', 'support'].includes(activeTab)} className="flex-1 lg:flex-none h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-white rounded-2xl font-bold transition-all active:scale-95">
                  <Plus className="mr-2" size={24} /> Create New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline font-bold">New Entry</DialogTitle>
                </DialogHeader>
                {activeTab === 'attendance' ? (
                  <form onSubmit={handleCreateSession} className="space-y-6 pt-6">
                    <div className="space-y-2"><Label>Class Name</Label><Input required value={newSession.className} onChange={e => setNewSession({...newSession, className: e.target.value})} placeholder="e.g. Computer Networks" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Date</Label><Input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Start Time</Label><Input type="time" required value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} /></div>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold">Initialize Session</Button>
                  </form>
                ) : null}
              </DialogContent>
            </Dialog>
            <Button onClick={handleLogout} variant="ghost" className="h-14 px-6 text-destructive hover:bg-destructive/10 rounded-2xl font-bold"><LogOut className="mr-2" size={20} /> Logout</Button>
          </div>
        </div>

        <Tabs defaultValue="results" className="space-y-12" onValueChange={setActiveTab}>
          <TabsList className="bg-white/50 dark:bg-black/20 p-2 rounded-[2rem] shadow-xl border border-border/40 h-auto flex flex-wrap w-full md:w-fit gap-2 backdrop-blur-md">
            <TabsTrigger value="results" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><GraduationCap className="mr-2" size={20} /> Results</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><CheckCircle className="mr-2" size={20} /> Attendance</TabsTrigger>
            <TabsTrigger value="students" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><Users className="mr-2" size={20} /> Students</TabsTrigger>
          </TabsList>

          <Card className="shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white/90 dark:bg-card/90 backdrop-blur-md min-h-[400px]">
            <TabsContent value="attendance" className="p-0 m-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-x border-border/40">
                <div className="lg:col-span-2 p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="text-primary" /> Recent Sessions</h3>
                  <div className="grid gap-4">
                    {sessions?.map(session => (
                      <div key={session.id} className={cn("p-6 rounded-[2rem] border transition-all flex items-center justify-between", selectedSessionId === session.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border/40 bg-muted/10")}>
                        <div className="space-y-1">
                          <p className="font-bold text-lg">{session.className}</p>
                          <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">{session.date} • {session.startTime}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => { setSelectedSessionId(session.id); setIsScannerOpen(true); }} size="sm" className="rounded-xl font-bold bg-primary hover:bg-primary/90">
                            <Camera className="mr-2" size={16} /> Open Scanner
                          </Button>
                          <Button onClick={() => handleDelete('sessions', session.id)} size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 rounded-xl">
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-8 bg-muted/5">
                  <h3 className="text-xl font-bold mb-6">Presence Log</h3>
                  {selectedSessionId ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex justify-between text-sm font-bold mb-2"><span>Capacity Marked</span><span>{sessionAttendance?.length || 0}</span></div>
                        <Progress value={((sessionAttendance?.length || 0) / 60) * 100} className="h-2" />
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {sessionAttendance?.map(rec => (
                          <div key={rec.id} className="p-3 bg-white dark:bg-black/20 rounded-xl border border-border/40 flex justify-between items-center text-sm">
                            <span className="font-bold">{rec.studentName}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(rec.timestamp), 'h:mm a')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-muted-foreground text-sm font-medium">Select a session to view real-time logs.</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="students" className="p-0 m-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="px-10">Student</TableHead><TableHead>Roll No</TableHead><TableHead>Verification</TableHead><TableHead className="text-right px-10">Operations</TableHead></TableRow></TableHeader>
                <TableBody>
                  {students?.map(s => (
                    <TableRow key={s.id} className="hover:bg-primary/[0.02]">
                      <TableCell className="px-10 font-bold">{s.firstName} {s.lastName}</TableCell>
                      <TableCell>{s.studentId}</TableCell>
                      <TableCell><Badge variant={s.isApproved ? 'default' : 'outline'}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right px-10 space-x-2">
                        {s.isApproved ? <Button size="icon" variant="ghost" className="hover:bg-orange-50" onClick={() => handleApproveStudent(s.id, false)}><XCircle className="text-orange-500" /></Button> : <Button size="icon" variant="ghost" className="hover:bg-green-50" onClick={() => handleApproveStudent(s.id, true)}><CheckCircle className="text-green-500" /></Button>}
                        <Button size="icon" variant="ghost" onClick={() => handleDelete('students', s.id)} className="text-destructive hover:bg-destructive/10"><Trash2 /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Card>
        </Tabs>

        {/* Admin Scanner Modal */}
        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogContent className="sm:max-w-md rounded-[3rem] p-10">
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-headline font-bold mb-2">Scanning: {activeSession?.className}</DialogTitle>
              <p className="text-muted-foreground">Scan student's ID QR code</p>
            </DialogHeader>
            <div className="flex flex-col items-center gap-8 py-6">
              <div id="admin-portal-qr-reader" className="w-full rounded-[2rem] overflow-hidden border-4 border-primary/20 bg-muted/20 min-h-[300px]" />
              <div className="p-4 bg-primary/5 rounded-2xl w-full flex items-center gap-3 text-xs text-primary border border-primary/20">
                <ShieldCheck size={16} />
                <p>Secure Admin Mode. Attendance recorded instantly on ID validation.</p>
              </div>
              <Button onClick={() => setIsScannerOpen(false)} variant="outline" className="w-full rounded-xl">Close Scanner</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
