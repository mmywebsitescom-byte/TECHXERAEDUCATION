
"use client"

import React, { useState, useEffect } from 'react'
import { TechXeraLogo } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Shield, List, GraduationCap, Megaphone, Loader2, UserCheck, Trash2, Users, CheckCircle, XCircle, Search, ClipboardList, CreditCard, Edit2, ArrowLeft, Target, Award, Settings as SettingsIcon, Image as ImageIcon, Globe, LogOut, Home, Lock, FileText, Download, Calendar, LifeBuoy, MessageSquare } from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError, useAuth } from '@/firebase'
import { doc, setDoc, collection, deleteDoc, query, orderBy, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('results')
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isManageResultsOpen, setIsManageResultsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Selection States
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  
  // Editing IDs
  const [editingResultId, setEditingResultId] = useState<string | null>(null)
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null)
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)

  // Form States
  const [newNotice, setNewNotice] = useState({ title: '', description: '', isUrgent: false })
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', subject: '', semester: '', fileUrl: '', materialType: 'Notes' })
  const [newResult, setNewResult] = useState({ subject: '', semester: '', marksObtained: 0, grade: '', examDate: new Date().toISOString().split('T')[0] })
  const [newExam, setNewExam] = useState({ title: '', semester: '', examDate: new Date().toISOString().split('T')[0], status: 'upcoming', totalMarks: 100 })
  
  // Site Config State
  const [siteConfig, setSiteConfig] = useState({ siteName: 'TechXera', logoUrl: '', heroDescription: 'A high-performance student portal engineered for TechXera students.' })

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
        heroDescription: dbSettings.heroDescription || 'A high-performance student portal engineered for TechXera students.'
      })
    }
  }, [dbSettings])

  const noticesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'notices'), orderBy('publishDate', 'desc')) : null, [db, isAuthorizedAdmin])
  const materialsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db, isAuthorizedAdmin])
  const studentsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? collection(db, 'students') : null, [db, isAuthorizedAdmin])
  const examsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'exams'), orderBy('examDate', 'desc')) : null, [db, isAuthorizedAdmin])
  const inquiriesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'support_inquiries'), orderBy('timestamp', 'desc')) : null, [db, isAuthorizedAdmin])
  
  const { data: notices } = useCollection(noticesQuery)
  const { data: materials } = useCollection(materialsQuery)
  const { data: students } = useCollection(studentsQuery)
  const { data: exams } = useCollection(examsQuery)
  const { data: inquiries } = useCollection(inquiriesQuery)

  const selectedStudent = students?.find(s => s.id === selectedStudentId)
  const selectedExam = exams?.find(e => e.id === selectedExamId)

  const resultsQuery = useMemoFirebase(() => (db && selectedStudentId && isAuthorizedAdmin) ? query(collection(db, 'students', selectedStudentId, 'results'), orderBy('examDate', 'desc')) : null, [db, selectedStudentId, isAuthorizedAdmin])
  const { data: allStudentResults } = useCollection(resultsQuery)
  
  const selectedStudentExamResults = allStudentResults?.filter(r => r.examId === selectedExamId) || []

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

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/admin/login')
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

  const handleApproveStudent = (studentId: string, approve: boolean) => {
    if (!db || !isAuthorizedAdmin) return
    const studentRef = doc(db, 'students', studentId)
    updateDoc(studentRef, { isApproved: approve, status: approve ? 'approved' : 'rejected' })
      .then(() => toast({ title: approve ? "Student Approved" : "Student Rejected" }))
  }

  const handleMarkResolved = (inquiryId: string) => {
    if (!db || !isAuthorizedAdmin) return
    const inquiryRef = doc(db, 'support_inquiries', inquiryId)
    updateDoc(inquiryRef, { status: 'resolved' })
      .then(() => toast({ title: "Marked as Resolved" }))
  }

  const startEditNotice = (notice: any) => {
    setEditingNoticeId(notice.id)
    setNewNotice({ title: notice.title, description: notice.description, isUrgent: notice.isUrgent })
    setIsDialogOpen(true)
  }

  const startEditMaterial = (material: any) => {
    setEditingMaterialId(material.id)
    setNewMaterial({ title: material.title, description: material.description || '', subject: material.subject, semester: material.semester, fileUrl: material.fileUrl, materialType: material.materialType || 'Notes' })
    setIsDialogOpen(true)
  }

  const startEditExam = (exam: any) => {
    setEditingExamId(exam.id)
    setNewExam({ title: exam.title, semester: exam.semester, examDate: exam.examDate ? exam.examDate.split('T')[0] : new Date().toISOString().split('T')[0], status: exam.status, totalMarks: exam.totalMarks || 100 })
    setIsDialogOpen(true)
  }

  const resetDialogs = () => {
    setEditingNoticeId(null)
    setEditingMaterialId(null)
    setEditingExamId(null)
    setNewNotice({ title: '', description: '', isUrgent: false })
    setNewMaterial({ title: '', description: '', subject: '', semester: '', fileUrl: '', materialType: 'Notes' })
    setNewExam({ title: '', semester: '', examDate: new Date().toISOString().split('T')[0], status: 'upcoming', totalMarks: 100 })
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)
    try {
      const docRef = editingNoticeId ? doc(db, 'notices', editingNoticeId) : doc(collection(db, 'notices'))
      await setDoc(docRef, { ...newNotice, id: docRef.id, publishDate: new Date().toISOString() }, { merge: true })
      toast({ title: "Notice Published" })
      setIsDialogOpen(false)
      resetDialogs()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)
    try {
      const docRef = editingMaterialId ? doc(db, 'studyMaterials', editingMaterialId) : doc(collection(db, 'studyMaterials'))
      await setDoc(docRef, { ...newMaterial, id: docRef.id, uploadDate: new Date().toISOString() }, { merge: true })
      toast({ title: "Material Saved" })
      setIsDialogOpen(false)
      resetDialogs()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)
    try {
      const docRef = editingExamId ? doc(db, 'exams', editingExamId) : doc(collection(db, 'exams'))
      await setDoc(docRef, { ...newExam, id: docRef.id }, { merge: true })
      toast({ title: "Exam Cycle Saved" })
      setIsDialogOpen(false)
      resetDialogs()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message })
    } finally {
      setIsCreating(false)
    }
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
    try {
      const totalMarks = selectedExam?.totalMarks || 100
      const percentage = Number(((newResult.marksObtained / totalMarks) * 100).toFixed(2))
      const docRef = editingResultId ? doc(db, 'students', selectedStudentId, 'results', editingResultId) : doc(collection(db, 'students', selectedStudentId, 'results'))
      await setDoc(docRef, { 
        ...newResult, 
        id: docRef.id, 
        studentId: selectedStudentId, 
        examId: selectedExamId, 
        examTitle: selectedExam?.title || 'General Assessment', 
        marks: percentage, 
        totalMarks, 
        examDate: new Date(newResult.examDate).toISOString() 
      }, { merge: true })
      toast({ title: "Record Saved" })
      setEditingResultId(null)
      setNewResult({ ...newResult, subject: '', marksObtained: 0, grade: '' })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message })
    } finally {
      setIsCreating(false)
    }
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
                <Button disabled={['results', 'config', 'students', 'support', 'support'].includes(activeTab)} className="flex-1 lg:flex-none h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-white rounded-2xl font-bold">
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
                ) : null}
              </DialogContent>
            </Dialog>
            <Button onClick={handleLogout} variant="ghost" className="h-14 px-6 text-destructive hover:bg-destructive/10 rounded-2xl font-bold"><LogOut className="mr-2" size={20} /> Logout</Button>
          </div>
        </div>

        <Tabs defaultValue="results" className="space-y-12" onValueChange={setActiveTab}>
          <TabsList className="bg-white p-2 rounded-[2rem] shadow-xl border border-border/40 h-auto flex flex-wrap w-full md:w-fit gap-2">
            <TabsTrigger value="results" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><GraduationCap className="mr-2" size={20} /> Results</TabsTrigger>
            <TabsTrigger value="students" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><Users className="mr-2" size={20} /> Students</TabsTrigger>
            <TabsTrigger value="support" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><LifeBuoy className="mr-2" size={20} /> Support Hub</TabsTrigger>
            <TabsTrigger value="exams" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><ClipboardList className="mr-2" size={20} /> Exams</TabsTrigger>
            <TabsTrigger value="notices" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><Megaphone className="mr-2" size={20} /> Notices</TabsTrigger>
            <TabsTrigger value="resources" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><List className="mr-2" size={20} /> Repository</TabsTrigger>
            <TabsTrigger value="config" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><SettingsIcon className="mr-2" size={20} /> Branding</TabsTrigger>
          </TabsList>

          <Card className="shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white/90 backdrop-blur-md min-h-[400px]">
            <TabsContent value="results" className="p-0 m-0">
              <div className="p-10 border-b border-border/40 bg-muted/20">
                <select className="h-14 w-full max-w-md rounded-2xl bg-background px-6 font-bold" value={selectedExamId || ''} onChange={e => setSelectedExamId(e.target.value)}>
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
                      <TableCell className="text-right px-10"><Button onClick={() => { setSelectedStudentId(s.id); setIsManageResultsOpen(true); }} variant="outline" className="rounded-xl">Manage Grades</Button></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-20 italic text-muted-foreground">Select an exam cycle above to manage grades</TableCell></TableRow>
                  )}
                  {selectedExamId && students?.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center py-20 italic">No students found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="support" className="p-0 m-0">
              <div className="p-10 border-b bg-muted/20 flex items-center gap-4">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl"><MessageSquare size={24} /></div>
                <div><h2 className="text-2xl font-bold font-headline">Inquiry Management</h2><p className="text-sm text-muted-foreground">Address student support tickets</p></div>
              </div>
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
                      <TableCell className="text-xs">
                        {iq.timestamp ? format(new Date(iq.timestamp), 'MMM d, h:mm a') : 'N/A'}
                      </TableCell>
                      <TableCell><Badge variant={iq.status === 'pending' ? 'destructive' : 'default'}>{iq.status}</Badge></TableCell>
                      <TableCell className="text-right px-10 space-x-2">
                        <Dialog>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" className="text-primary"><Search size={18} /></Button></DialogTrigger>
                          <DialogContent className="rounded-3xl">
                            <DialogHeader><DialogTitle className="font-headline font-bold">Inquiry Details</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="p-4 bg-muted/30 rounded-2xl"><p className="text-sm italic">"{iq.message}"</p></div>
                              <div className="flex gap-4"><Button onClick={() => handleMarkResolved(iq.id)} disabled={iq.status === 'resolved'} className="flex-1 rounded-xl">Resolve Inquiry</Button></div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete('support_inquiries', iq.id)} className="text-destructive"><Trash2 size={18} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!inquiries || inquiries.length === 0) && <TableRow><TableCell colSpan={5} className="text-center py-20 opacity-40 italic">No support inquiries found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="students" className="p-0 m-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="px-10">Student</TableHead><TableHead>Roll No</TableHead><TableHead>Verification</TableHead><TableHead className="text-right px-10">Operations</TableHead></TableRow></TableHeader>
                <TableBody>
                  {students?.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="px-10 font-bold">{s.firstName} {s.lastName}</TableCell>
                      <TableCell>{s.studentId}</TableCell>
                      <TableCell><Badge variant={s.isApproved ? 'default' : 'outline'}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right px-10 space-x-2">
                        {s.isApproved ? <Button size="icon" variant="ghost" onClick={() => handleApproveStudent(s.id, false)}><XCircle className="text-orange-500" /></Button> : <Button size="icon" variant="ghost" onClick={() => handleApproveStudent(s.id, true)}><CheckCircle className="text-green-500" /></Button>}
                        <Button size="icon" variant="ghost" onClick={() => handleDelete('students', s.id)} className="text-destructive"><Trash2 /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!students || students.length === 0) && <TableRow><TableCell colSpan={4} className="text-center py-20 italic opacity-40">No student records available</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="exams" className="p-0 m-0">
               <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="px-10">Title</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right px-10">Operations</TableHead></TableRow></TableHeader>
                <TableBody>
                  {exams?.map(ex => (
                    <TableRow key={ex.id}>
                      <TableCell className="px-10 font-bold">{ex.title}</TableCell>
                      <TableCell>{ex.examDate}</TableCell>
                      <TableCell><Badge>{ex.status}</Badge></TableCell>
                      <TableCell className="text-right px-10 space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => startEditExam(ex)} className="text-primary"><Edit2 size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete('exams', ex.id)} className="text-destructive"><Trash2 size={18} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!exams || exams.length === 0) && <TableRow><TableCell colSpan={4} className="text-center py-20 italic opacity-40">No exam cycles defined</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="notices" className="p-0 m-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="px-10">Headline</TableHead><TableHead>Priority</TableHead><TableHead className="text-right px-10">Operations</TableHead></TableRow></TableHeader>
                <TableBody>
                  {notices?.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="px-10 font-bold">{n.title}</TableCell>
                      <TableCell><Badge variant={n.isUrgent ? 'destructive' : 'secondary'}>{n.isUrgent ? 'Urgent' : 'Normal'}</Badge></TableCell>
                      <TableCell className="text-right px-10 space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => startEditNotice(n)} className="text-primary"><Edit2 size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete('notices', n.id)} className="text-destructive"><Trash2 size={18} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!notices || notices.length === 0) && <TableRow><TableCell colSpan={3} className="text-center py-20 italic opacity-40">No notices published</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="resources" className="p-0 m-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="px-10">Title</TableHead><TableHead>Subject</TableHead><TableHead>Type/Section</TableHead><TableHead className="text-right px-10">Operations</TableHead></TableRow></TableHeader>
                <TableBody>
                  {materials?.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="px-10 font-bold">{m.title}</TableCell>
                      <TableCell>{m.subject}</TableCell>
                      <TableCell><Badge variant="outline">{m.materialType}</Badge></TableCell>
                      <TableCell className="text-right px-10 space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => startEditMaterial(m)} className="text-primary"><Edit2 size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete('studyMaterials', m.id)} className="text-destructive"><Trash2 size={18} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!materials || materials.length === 0) && <TableRow><TableCell colSpan={4} className="text-center py-20 italic opacity-40">Repository is empty</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="config" className="p-10">
              <form onSubmit={handleUpdateSiteConfig} className="max-w-2xl space-y-8">
                <div className="space-y-2"><Label>Portal Name</Label><Input value={siteConfig.siteName} onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})} className="h-14 rounded-2xl" /></div>
                <div className="space-y-2"><Label>Logo URL</Label><Input value={siteConfig.logoUrl} onChange={e => setSiteConfig({...siteConfig, logoUrl: e.target.value})} className="h-14 rounded-2xl" /></div>
                <div className="space-y-2"><Label>Hero Description</Label><Textarea value={siteConfig.heroDescription} onChange={e => setSiteConfig({...siteConfig, heroDescription: e.target.value})} className="min-h-[120px] rounded-2xl" /></div>
                <Button type="submit" disabled={isCreating} className="h-14 px-10 rounded-2xl font-bold">Update Branding</Button>
              </form>
            </TabsContent>
          </Card>
        </Tabs>

        {/* Results Modal */}
        <Dialog open={isManageResultsOpen} onOpenChange={setIsManageResultsOpen}>
          <DialogContent className="sm:max-w-[800px] rounded-[3rem]">
            <DialogHeader><DialogTitle className="text-2xl font-bold">Manage Grades for {selectedStudent?.firstName} ({selectedExam?.title})</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
              <form onSubmit={handleSaveResult} className="space-y-6 p-6 bg-muted/20 rounded-[2rem]">
                <div className="space-y-2"><Label>Subject</Label><Input required value={newResult.subject} onChange={e => setNewResult({ ...newResult, subject: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Marks Obtained</Label><Input type="number" required value={newResult.marksObtained} onChange={e => setNewResult({...newResult, marksObtained: Number(e.target.value)})} /></div>
                  <div className="space-y-2"><Label>Grade</Label><Input required placeholder="A+, B, O..." value={newResult.grade} onChange={e => setNewResult({...newResult, grade: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>Assessment Date</Label><Input type="date" required value={newResult.examDate} onChange={e => setNewResult({ ...newResult, examDate: e.target.value })} /></div>
                <Button type="submit" disabled={isCreating} className="w-full h-12 bg-primary font-bold rounded-xl">
                  {editingResultId ? 'Update Record' : 'Save Result'}
                </Button>
              </form>
              <div className="space-y-4">
                <h3 className="font-bold flex items-center justify-between">Existing Records <Badge variant="secondary">{selectedStudentExamResults.length}</Badge></h3>
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                  {selectedStudentExamResults.map(res => (
                    <div key={res.id} className="p-4 border rounded-2xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-bold">{res.subject}</p>
                        <p className="text-xs text-muted-foreground">{res.grade} ({res.marks}%)</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingResultId(res.id);
                          setNewResult({
                            subject: res.subject,
                            semester: res.semester || '',
                            marksObtained: res.marksObtained || 0,
                            grade: res.grade,
                            examDate: res.examDate ? res.examDate.split('T')[0] : new Date().toISOString().split('T')[0]
                          });
                        }} className="text-primary"><Edit2 size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete('students', selectedStudentId!, 'results', res.id)} className="text-destructive"><Trash2 size={16} /></Button>
                      </div>
                    </div>
                  ))}
                  {selectedStudentExamResults.length === 0 && (
                    <div className="py-20 text-center text-muted-foreground opacity-40 italic">No results recorded for this exam cycle</div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
