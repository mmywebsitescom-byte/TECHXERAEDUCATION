
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
import { Plus, Shield, List, GraduationCap, Megaphone, Loader2, UserCheck, Trash2, Users, CheckCircle, XCircle, Search, ClipboardList, CreditCard, Edit2, ArrowLeft, Target, Award, Settings as SettingsIcon, Image as ImageIcon, Globe, LogOut, Home, Lock, FileText, Download, Calendar, LifeBuoy, MessageSquare, Camera, ShieldCheck, Clock } from 'lucide-react'
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

  // Editing IDs
  const [editingResultId, setEditingResultId] = useState<string | null>(null)
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)

  // Form States
  const [newNotice, setNewNotice] = useState({ title: '', description: '', isUrgent: false })
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', subject: '', semester: '', fileUrl: '', thumbnailUrl: '', materialType: 'Notes' })
  const [newResult, setNewResult] = useState({ subject: '', semester: '', marksObtained: 0, grade: '', examDate: new Date().toISOString().split('T')[0] })
  const [newExam, setNewExam] = useState({ title: '', semester: '', examDate: new Date().toISOString().split('T')[0], status: 'upcoming', totalMarks: 100 })
  const [newSession, setNewSession] = useState({ className: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', description: '' })
  
  // Site Config State
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

  const resultsQuery = useMemoFirebase(() => (db && selectedStudentId && isAuthorizedAdmin) ? query(collection(db, 'students', selectedStudentId, 'results'), orderBy('examDate', 'desc')) : null, [db, selectedStudentId, isAuthorizedAdmin])
  const { data: allStudentResults } = useCollection(resultsQuery)
  
  const selectedStudentExamResults = allStudentResults?.filter(r => r.examId === selectedExamId) || []

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

  // Scanner Logic
  useEffect(() => {
    if (!isScannerOpen || !selectedSessionId || !db) return

    const scanner = new Html5QrcodeScanner(
      "admin-portal-qr-reader",
      { fps: 15, qrbox: { width: 250, height: 250 } },
      false
    )

    const onScanSuccess = async (decodedText: string) => {
      try {
        const studentData = JSON.parse(decodedText)
        if (studentData.type !== 'techxera-student-id') return

        const recordId = `${studentData.uid}_${selectedSessionId}`
        const attendanceRef = doc(db, 'attendance', recordId)
        
        // Optimistic check
        const existing = await getDoc(attendanceRef)
        if (existing.exists()) {
          toast({ title: "Already Recorded", description: `${studentData.name} is already present.` })
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
        }

        setDoc(attendanceRef, payload)
          .then(() => {
            toast({ title: "Check-in Successful", description: `Student: ${studentData.name}` })
          })
          .catch(async (error) => {
            const permissionError = new FirestorePermissionError({
              path: attendanceRef.path,
              operation: 'create',
              requestResourceData: payload,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
          })

      } catch (err) {
        console.warn("QR parsing failed or data invalid:", err)
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

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const handleDelete = async (coll: string, id: string, subColl?: string, subId?: string) => {
    if (!db || !isAuthorizedAdmin) return
    try {
      const docRef = subColl && subId ? doc(db, 'students', id, subColl, subId) : doc(db, coll, id);
      await deleteDoc(docRef)
      toast({ title: "Record Removed" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message })
    }
  }

  const handleMarkResolved = async (id: string) => {
    if (!db || !isAuthorizedAdmin) return
    try {
      await updateDoc(doc(db, 'support_inquiries', id), { status: 'resolved' })
      toast({ title: "Inquiry Resolved" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message })
    }
  }

  const handleApproveStudent = async (uid: string, approved: boolean) => {
    if (!db || !isAuthorizedAdmin) return
    try {
      await updateDoc(doc(db, 'students', uid), { 
        isApproved: approved,
        status: approved ? 'approved' : 'rejected'
      })
      toast({ title: approved ? "Student Approved" : "Student Restricted" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message })
    }
  }

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
        setIsDialogOpen(false)
        setNewSession({ className: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', description: '' })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const resetDialogs = () => {
    setEditingResultId(null)
    setEditingNoticeId(null)
    setEditingMaterialId(null)
    setEditingExamId(null)
    setNewNotice({ title: '', description: '', isUrgent: false })
    setNewMaterial({ title: '', description: '', subject: '', semester: '', fileUrl: '', thumbnailUrl: '', materialType: 'Notes' })
    setNewExam({ title: '', semester: '', examDate: new Date().toISOString().split('T')[0], status: 'upcoming', totalMarks: 100 })
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)
    const docRef = editingNoticeId ? doc(db, 'notices', editingNoticeId) : doc(collection(db, 'notices'))
    const payload = { ...newNotice, id: docRef.id, publishDate: new Date().toISOString() }
    
    setDoc(docRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Notice Published" })
        setIsDialogOpen(false)
        resetDialogs()
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsCreating(false))
  }

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)
    const docRef = editingMaterialId ? doc(db, 'studyMaterials', editingMaterialId) : doc(collection(db, 'studyMaterials'))
    const payload = { ...newMaterial, id: docRef.id, uploadDate: new Date().toISOString() }
    
    setDoc(docRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Material Saved" })
        setIsDialogOpen(false)
        resetDialogs()
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsCreating(false))
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)
    const docRef = editingExamId ? doc(db, 'exams', editingExamId) : doc(collection(db, 'exams'))
    const payload = { ...newExam, id: docRef.id }
    
    setDoc(docRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Exam Cycle Saved" })
        setIsDialogOpen(false)
        resetDialogs()
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsCreating(false))
  }

  const handleUpdateSiteConfig = (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)
    setDoc(doc(db, 'settings', 'site-config'), siteConfig, { merge: true })
      .then(() => toast({ title: "Branding Updated" }))
      .finally(() => setIsCreating(false))
  }

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin || !selectedStudentId || !selectedExamId) return
    setIsCreating(true)
    const totalMarks = selectedExam?.totalMarks || 100
    const percentage = Number(((newResult.marksObtained / totalMarks) * 100).toFixed(2))
    const docRef = editingResultId ? doc(db, 'students', selectedStudentId, 'results', editingResultId) : doc(collection(db, 'students', selectedStudentId, 'results'))
    
    const payload = { 
      ...newResult, 
      id: docRef.id, 
      studentId: selectedStudentId, 
      examId: selectedExamId, 
      examTitle: selectedExam?.title || 'General Assessment', 
      marks: percentage, 
      totalMarks, 
      examDate: new Date(newResult.examDate).toISOString() 
    }

    setDoc(docRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Record Saved" })
        setEditingResultId(null)
        setNewResult({ ...newResult, subject: '', marksObtained: 0, grade: '' })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsCreating(false))
  }

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={48} /></div>
  if (!user || user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) return null

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
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetDialogs(); setIsDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button disabled={['results', 'config', 'students', 'support'].includes(activeTab)} className="flex-1 lg:flex-none h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-white rounded-2xl font-bold transition-all active:scale-95">
                  <Plus className="mr-2" size={24} /> Create New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline font-bold">
                    {editingNoticeId || editingMaterialId || editingExamId ? 'Edit Entry' : 'New Management Entry'}
                  </DialogTitle>
                </DialogHeader>
                {activeTab === 'notices' ? (
                  <form onSubmit={handleCreateNotice} className="space-y-6 pt-6">
                    <div className="space-y-2"><Label>Headline</Label><Input required value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Message Body</Label><Textarea required value={newNotice.description} onChange={e => setNewNotice({ ...newNotice, description: e.target.value })} className="min-h-[150px]" /></div>
                    <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-2xl"><Switch checked={newNotice.isUrgent} onCheckedChange={c => setNewNotice({ ...newNotice, isUrgent: c })} /><Label>Priority Announcement</Label></div>
                    <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl text-lg font-bold">
                      {editingNoticeId ? 'Update Notice' : 'Broadcast Notice'}
                    </Button>
                  </form>
                ) : activeTab === 'resources' ? (
                  <form onSubmit={handleCreateMaterial} className="space-y-6 pt-6">
                    <div className="space-y-2"><Label>Title</Label><Input required value={newMaterial.title} onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Subject</Label><Input required value={newMaterial.subject} onChange={e => setNewMaterial({ ...newMaterial, subject: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Semester</Label><Input required value={newMaterial.semester} onChange={e => setNewMaterial({ ...newMaterial, semester: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Material Type / Section</Label>
                      <Input required placeholder="Notes, PYQ, Syllabus..." value={newMaterial.materialType} onChange={e => setNewMaterial({ ...newMaterial, materialType: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">Resource Icon / Logo URL (Optional)</Label>
                      <Input type="url" placeholder="https://... (SVG/PNG recommended)" value={newMaterial.thumbnailUrl} onChange={e => setNewMaterial({ ...newMaterial, thumbnailUrl: e.target.value })} />
                    </div>
                    <div className="space-y-2"><Label>File URL</Label><Input required type="url" value={newMaterial.fileUrl} onChange={e => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })} /></div>
                    <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl text-lg font-bold">
                      {editingMaterialId ? 'Update Repository' : 'Upload to Repository'}
                    </Button>
                  </form>
                ) : activeTab === 'exams' ? (
                  <form onSubmit={handleCreateExam} className="space-y-6 pt-6">
                    <div className="space-y-2"><Label>Exam Title</Label><Input required value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Semester</Label><Input required value={newExam.semester} onChange={e => setNewExam({ ...newExam, semester: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Date</Label><Input required type="date" value={newExam.examDate} onChange={e => setNewExam({ ...newExam, examDate: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Status</Label><Select value={newExam.status} onValueChange={(val) => setNewExam({ ...newExam, status: val })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Total Marks</Label><Input required type="number" value={newExam.totalMarks} onChange={e => setNewExam({ ...newExam, totalMarks: Number(e.target.value) })} /></div>
                    </div>
                    <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl text-lg font-bold">
                      {editingExamId ? 'Update Cycle' : 'Establish Cycle'}
                    </Button>
                  </form>
                ) : activeTab === 'attendance' ? (
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
            <TabsTrigger value="support" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><LifeBuoy className="mr-2" size={20} /> Support Hub</TabsTrigger>
            <TabsTrigger value="exams" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><ClipboardList className="mr-2" size={20} /> Exams</TabsTrigger>
            <TabsTrigger value="notices" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><Megaphone className="mr-2" size={20} /> Notices</TabsTrigger>
            <TabsTrigger value="resources" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><List className="mr-2" size={20} /> Repository</TabsTrigger>
            <TabsTrigger value="config" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all"><SettingsIcon className="mr-2" size={20} /> Branding</TabsTrigger>
          </TabsList>

          <Card className="shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white/90 dark:bg-card/90 backdrop-blur-md min-h-[400px]">
            <TabsContent value="results" className="p-0 m-0">
              <div className="p-10 border-b border-border/40 bg-muted/20">
                <select className="h-14 w-full max-w-md rounded-2xl bg-background border border-border px-6 font-bold focus:ring-2 focus:ring-primary outline-none transition-all" value={selectedExamId || ''} onChange={e => setSelectedExamId(e.target.value)}>
                  <option value="">-- Select Exam Cycle --</option>
                  {exams?.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="px-10">Student</TableHead><TableHead>Roll No</TableHead><TableHead className="text-right px-10">Operations</TableHead></TableRow></TableHeader>
                <TableBody>
                  {selectedExamId ? students?.map(s => (
                    <TableRow key={s.id} className="hover:bg-primary/[0.02]">
                      <TableCell className="px-10 font-bold text-lg">{s.firstName} {s.lastName}</TableCell>
                      <TableCell className="font-bold text-primary">{s.studentId}</TableCell>
                      <TableCell className="text-right px-10"><Button onClick={() => { setSelectedStudentId(s.id); setIsManageResultsOpen(true); }} variant="outline" className="rounded-xl transition-all active:scale-95">Manage Grades</Button></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-20 italic text-muted-foreground">Select an exam cycle above to manage grades</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

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
                    {(!sessions || sessions.length === 0) && (
                      <div className="py-20 text-center text-muted-foreground italic">No class sessions defined. Create one to begin tracking attendance.</div>
                    )}
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

            <TabsContent value="support" className="p-0 m-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="px-10">Sender</TableHead><TableHead>Subject</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right px-10">Operations</TableHead></TableRow></TableHeader>
                <TableBody>
                  {inquiries?.map(iq => (
                    <TableRow key={iq.id} className="hover:bg-primary/[0.02]">
                      <TableCell className="px-10">
                        <div className="font-bold">{iq.name}</div>
                        <div className="text-xs text-muted-foreground">{iq.email}</div>
                      </TableCell>
                      <TableCell className="font-medium">{iq.subject}</TableCell>
                      <TableCell className="text-xs">{iq.timestamp ? format(new Date(iq.timestamp), 'MMM d, h:mm a') : 'N/A'}</TableCell>
                      <TableCell><Badge variant={iq.status === 'pending' ? 'destructive' : 'default'}>{iq.status}</Badge></TableCell>
                      <TableCell className="text-right px-10 space-x-2">
                        <Dialog>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 transition-all"><Search size={18} /></Button></DialogTrigger>
                          <DialogContent className="rounded-3xl">
                            <DialogHeader><DialogTitle className="font-headline font-bold">Inquiry Details</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="p-4 bg-muted/30 rounded-2xl"><p className="text-sm italic">"{iq.message}"</p></div>
                              <div className="flex gap-4"><Button onClick={() => handleMarkResolved(iq.id)} disabled={iq.status === 'resolved'} className="flex-1 rounded-xl">Resolve Inquiry</Button></div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete('support_inquiries', iq.id)} className="text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={18} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

        {/* Results Modal */}
        <Dialog open={isManageResultsOpen} onOpenChange={setIsManageResultsOpen}>
          <DialogContent className="sm:max-w-[800px] rounded-[3rem]">
            <DialogHeader><DialogTitle className="text-2xl font-bold">Manage Grades for {selectedStudent?.firstName}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
              <form onSubmit={handleSaveResult} className="space-y-6 p-6 bg-muted/20 rounded-[2rem]">
                <div className="space-y-2"><Label>Subject</Label><Input required value={newResult.subject} onChange={e => setNewResult({ ...newResult, subject: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Marks Obtained</Label><Input type="number" required value={newResult.marksObtained} onChange={e => setNewResult({...newResult, marksObtained: Number(e.target.value)})} /></div>
                  <div className="space-y-2"><Label>Grade</Label><Input required placeholder="A+, B..." value={newResult.grade} onChange={e => setNewResult({...newResult, grade: e.target.value})} /></div>
                </div>
                <Button type="submit" disabled={isCreating} className="w-full h-12 bg-primary font-bold rounded-xl">Save Result</Button>
              </form>
              <div className="space-y-4">
                <h3 className="font-bold flex items-center justify-between">Records <Badge variant="secondary">{selectedStudentExamResults.length}</Badge></h3>
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                  {selectedStudentExamResults.map(res => (
                    <div key={res.id} className="p-4 border rounded-2xl flex justify-between items-center bg-white dark:bg-black/20">
                      <div><p className="font-bold">{res.subject}</p><p className="text-xs text-muted-foreground">{res.grade} ({res.marks}%)</p></div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete('students', selectedStudentId!, 'results', res.id)} className="text-destructive"><Trash2 size={16} /></Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
