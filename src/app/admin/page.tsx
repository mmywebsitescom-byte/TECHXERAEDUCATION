
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
import { Plus, Shield, List, GraduationCap, Megaphone, Loader2, UserCheck, Trash2, Users, CheckCircle, XCircle, Search, ClipboardList, CreditCard, Edit2, ArrowLeft, Target, Award, Settings as SettingsIcon, Image as ImageIcon, Globe, LogOut, Home, Lock, FileText, Download, Calendar } from 'lucide-react'
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
  
  // Results states
  const [editingResultId, setEditingResultId] = useState<string | null>(null)

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

  // Verify if the current user is the authorized admin
  const isAuthorizedAdmin = user?.email === AUTHORIZED_ADMIN_EMAIL

  // Settings fetch
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

  // Fetch collections - only if authorized
  const noticesQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'notices'), orderBy('publishDate', 'desc')) : null, [db, isAuthorizedAdmin])
  const materialsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db, isAuthorizedAdmin])
  const studentsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? collection(db, 'students') : null, [db, isAuthorizedAdmin])
  const examsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin) ? query(collection(db, 'exams'), orderBy('examDate', 'desc')) : null, [db, isAuthorizedAdmin])
  
  const { data: notices } = useCollection(noticesQuery)
  const { data: materials } = useCollection(materialsQuery)
  const { data: students } = useCollection(studentsQuery)
  const { data: exams } = useCollection(examsQuery)

  const selectedStudent = students?.find(s => s.id === selectedStudentId)
  const selectedExam = exams?.find(e => e.id === selectedExamId)

  // Results for specific student+exam context
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
      } else if (user.email !== AUTHORIZED_ADMIN_EMAIL) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "This portal is restricted to the primary administrator."
        })
        router.push('/')
      }
    }
  }, [user, isUserLoading, router, mounted, toast])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/admin/login')
  }

  const calculateGrade = (percentage: number) => {
    if (percentage >= 90) return 'O'
    if (percentage >= 80) return 'A+'
    if (percentage >= 70) return 'A'
    if (percentage >= 60) return 'B+'
    if (percentage >= 50) return 'B'
    if (percentage >= 40) return 'C'
    return 'F'
  }

  const handleMarksChange = (val: number) => {
    if (!selectedExam) return
    const total = selectedExam.totalMarks || 100
    const percentage = (val / total) * 100
    const grade = calculateGrade(percentage)
    
    setNewResult(prev => ({ 
      ...prev, 
      marksObtained: val,
      grade: grade
    }))
  }

  const handleDelete = (coll: string, id: string, subColl?: string, subId?: string) => {
    if (!db || !isAuthorizedAdmin) return
    const docRef = subColl && subId ? doc(db, 'students', id, subColl, subId) : doc(db, coll, id);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Deleted", description: "The record has been removed." })
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
      })
  }

  const handleApproveStudent = (studentId: string, approve: boolean) => {
    if (!db || !isAuthorizedAdmin) return
    const studentRef = doc(db, 'students', studentId)
    updateDoc(studentRef, {
      isApproved: approve,
      status: approve ? 'approved' : 'rejected'
    })
    .then(() => {
      toast({
        title: approve ? "Student Approved" : "Student Rejected",
        description: `Account has been ${approve ? 'activated' : 'deactivated'}.`
      })
    })
    .catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentRef.path, operation: 'update' }));
    })
  }

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)

    const docRef = doc(collection(db, 'notices'))
    const data = {
      ...newNotice,
      id: docRef.id,
      publishDate: new Date().toISOString()
    }

    setDoc(docRef, data)
      .then(() => {
        toast({ title: "Notice Published" })
        setNewNotice({ title: '', description: '', isUrgent: false })
        setIsDialogOpen(false)
      })
      .finally(() => setIsCreating(false))
  }

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)

    const docRef = doc(collection(db, 'studyMaterials'))
    const data = {
      ...newMaterial,
      id: docRef.id,
      uploadDate: new Date().toISOString()
    }

    setDoc(docRef, data)
      .then(() => {
        toast({ title: "Resource Uploaded" })
        setNewMaterial({ title: '', description: '', subject: '', semester: '', fileUrl: '', materialType: 'Notes' })
        setIsDialogOpen(false)
      })
      .finally(() => setIsCreating(false))
  }

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)

    const docRef = doc(collection(db, 'exams'))
    const data = {
      ...newExam,
      id: docRef.id,
    }

    setDoc(docRef, data)
      .then(() => {
        toast({ title: "Exam Created" })
        setNewExam({ title: '', semester: '', examDate: new Date().toISOString().split('T')[0], status: 'upcoming', totalMarks: 100 })
        setIsDialogOpen(false)
      })
      .finally(() => setIsCreating(false))
  }

  const handleUpdateSiteConfig = (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin) return
    setIsCreating(true)

    const docRef = doc(db, 'settings', 'site-config')
    setDoc(docRef, siteConfig, { merge: true })
      .then(() => {
        toast({ title: "Configuration Saved", description: "Website branding updated successfully." })
      })
      .finally(() => setIsCreating(false))
  }

  const handleEditResult = (res: any) => {
    setEditingResultId(res.id)
    setNewResult({
      subject: res.subject,
      semester: res.semester,
      marksObtained: res.marksObtained || 0,
      grade: res.grade,
      examDate: res.examDate ? res.examDate.split('T')[0] : new Date().toISOString().split('T')[0]
    })
  }

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAuthorizedAdmin || !selectedStudentId || !selectedExamId) return
    setIsCreating(true)

    const selectedExam = exams?.find(ex => ex.id === selectedExamId)
    const totalMarks = selectedExam?.totalMarks || 100
    const percentage = Number(((newResult.marksObtained / totalMarks) * 100).toFixed(2))

    const docRef = editingResultId 
      ? doc(db, 'students', selectedStudentId, 'results', editingResultId)
      : doc(collection(db, 'students', selectedStudentId, 'results'))
    
    const data = {
      ...newResult,
      id: docRef.id,
      studentId: selectedStudentId,
      examId: selectedExamId,
      examTitle: selectedExam?.title || 'General Assessment',
      marks: percentage,
      totalMarks: totalMarks,
      examDate: new Date(newResult.examDate).toISOString()
    }

    setDoc(docRef, data, { merge: true })
      .then(() => {
        toast({ title: editingResultId ? "Result Updated" : "Result Recorded" })
        setNewResult({ subject: '', semester: '', marksObtained: 0, grade: '', examDate: new Date().toISOString().split('T')[0] })
        setEditingResultId(null)
      })
      .finally(() => setIsCreating(false))
  }

  const handleOpenManageResults = (studentId: string) => {
    setSelectedStudentId(studentId)
    setIsManageResultsOpen(true)
    setEditingResultId(null)
    setNewResult({ subject: '', semester: '', marksObtained: 0, grade: '', examDate: new Date().toISOString().split('T')[0] })
  }

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user || user.email !== AUTHORIZED_ADMIN_EMAIL) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-12 pb-20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <TechXeraLogo 
              className="w-20 h-20 shadow-2xl shadow-primary/20 shrink-0" 
              customUrl={siteConfig.logoUrl}
            />
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter leading-tight">Admin Central</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
                <Shield size={14} className="text-primary" />
                <p className="text-primary font-bold text-xs">ROOT ADMINISTRATOR: {user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <Link href="/">
              <Button variant="outline" className="h-14 px-6 rounded-2xl font-bold border-2">
                <Home className="mr-2" size={20} /> Portal Home
              </Button>
            </Link>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={activeTab === 'results' || activeTab === 'config' || activeTab === 'students'} 
                  className="flex-1 lg:flex-none h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-white rounded-2xl font-bold"
                >
                  <Plus className="mr-2" size={24} /> Create New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline font-bold">
                    {activeTab === 'notices' ? 'Publish Announcement' : 
                     activeTab === 'resources' ? 'Upload Resource' : 
                     activeTab === 'exams' ? 'Schedule Exam' : 'New Entry'}
                  </DialogTitle>
                </DialogHeader>
                
                {activeTab === 'notices' ? (
                  <form onSubmit={handleCreateNotice} className="space-y-6 pt-6">
                    <div className="space-y-2"><Label>Headline</Label><Input required value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Message Body</Label><Textarea required value={newNotice.description} onChange={e => setNewNotice({ ...newNotice, description: e.target.value })} className="min-h-[150px]" /></div>
                    <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-2xl"><Switch checked={newNotice.isUrgent} onCheckedChange={c => setNewNotice({ ...newNotice, isUrgent: c })} /><Label>Priority Announcement</Label></div>
                    <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl text-lg font-bold">Broadcast Notice</Button>
                  </form>
                ) : activeTab === 'resources' ? (
                  <form onSubmit={handleCreateMaterial} className="space-y-6 pt-6">
                    <div className="space-y-2"><Label>Resource Title</Label><Input required value={newMaterial.title} onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Academic Subject</Label><Input required value={newMaterial.subject} onChange={e => setNewMaterial({ ...newMaterial, subject: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Term / Semester</Label><Input required value={newMaterial.semester} onChange={e => setNewMaterial({ ...newMaterial, semester: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Resource Description</Label><Textarea placeholder="Briefly describe the content..." value={newMaterial.description} onChange={e => setNewMaterial({ ...newMaterial, description: e.target.value })} className="min-h-[100px]" /></div>
                    <div className="space-y-2"><Label>Source / File URL</Label><Input required type="url" placeholder="https://..." value={newMaterial.fileUrl} onChange={e => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })} /></div>
                    <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl text-lg font-bold">Commit to Repository</Button>
                  </form>
                ) : activeTab === 'exams' ? (
                  <form onSubmit={handleCreateExam} className="space-y-6 pt-6">
                    <div className="space-y-2"><Label>Official Session Title</Label><Input required placeholder="e.g., Autumn Term Finals 2025" value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Target Semester</Label><Input required value={newExam.semester} onChange={e => setNewExam({ ...newExam, semester: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Inauguration Date</Label><Input required type="date" value={newExam.examDate} onChange={e => setNewExam({ ...newExam, examDate: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Session Status</Label>
                        <Select value={newExam.status} onValueChange={(val) => setNewExam({ ...newExam, status: val })}>
                          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Total Possible Marks</Label>
                        <Input required type="number" min="1" value={newExam.totalMarks} onChange={e => setNewExam({ ...newExam, totalMarks: Number(e.target.value) })} />
                      </div>
                    </div>
                    <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl text-lg font-bold">Establish Exam Cycle</Button>
                  </form>
                ) : null}
              </DialogContent>
            </Dialog>

            <Button onClick={handleLogout} variant="ghost" className="h-14 px-6 text-destructive hover:bg-destructive/10 rounded-2xl font-bold">
              <LogOut className="mr-2" size={20} /> Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="results" className="space-y-12" onValueChange={setActiveTab}>
          <TabsList className="bg-white p-2 rounded-[2rem] shadow-xl border border-border/40 h-auto flex flex-wrap w-full md:w-fit gap-2">
            <TabsTrigger value="results" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><GraduationCap className="mr-2" size={20} /> Results Hub</TabsTrigger>
            <TabsTrigger value="students" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><Users className="mr-2" size={20} /> Students</TabsTrigger>
            <TabsTrigger value="exams" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><ClipboardList className="mr-2" size={20} /> Exams</TabsTrigger>
            <TabsTrigger value="notices" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><Megaphone className="mr-2" size={20} /> Notices</TabsTrigger>
            <TabsTrigger value="resources" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><List className="mr-2" size={20} /> Repository</TabsTrigger>
            <TabsTrigger value="config" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><SettingsIcon className="mr-2" size={20} /> Site Config</TabsTrigger>
          </TabsList>

          <Card className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border-none rounded-[3.5rem] overflow-hidden bg-white/90 backdrop-blur-md border border-white">
            <TabsContent value="config" className="p-0 m-0">
              <div className="p-10 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/10 text-primary rounded-2xl"><Globe size={24} /></div>
                  <div>
                    <h2 className="text-2xl font-headline font-bold">Branding & Configuration</h2>
                    <p className="text-sm text-muted-foreground">Manage global identity.</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-10 max-w-2xl">
                <form onSubmit={handleUpdateSiteConfig} className="space-y-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Portal Brand Name</Label>
                    <Input value={siteConfig.siteName} onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})} className="h-14 rounded-2xl bg-background/50 text-lg font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Custom Logo URL</Label>
                    <Input type="url" value={siteConfig.logoUrl} onChange={e => setSiteConfig({...siteConfig, logoUrl: e.target.value})} className="h-14 rounded-2xl bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Hero Section Narrative</Label>
                    <Textarea value={siteConfig.heroDescription} onChange={e => setSiteConfig({...siteConfig, heroDescription: e.target.value})} className="min-h-[120px] rounded-2xl bg-background/50" />
                  </div>
                  <Button type="submit" disabled={isCreating} className="h-14 px-10 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20">
                    {isCreating ? <Loader2 className="animate-spin mr-2" /> : <SettingsIcon className="mr-2" />} Deploy Updates
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            {activeTab !== 'config' && (
              <>
                {activeTab === 'results' && (
                  <div className="p-10 border-b border-border/40 bg-muted/20">
                    <div className="flex flex-col md:flex-row gap-8 items-end">
                      <div className="flex-1 space-y-4">
                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Select Exam Cycle</Label>
                        <select 
                          className="flex h-14 w-full rounded-3xl border-2 border-primary/10 bg-background px-6 py-2 text-lg font-bold" 
                          value={selectedExamId || ''} 
                          onChange={(e) => setSelectedExamId(e.target.value)}
                        >
                          <option value="">-- Choose Exam Session --</option>
                          {exams?.map(exam => (<option key={exam.id} value={exam.id}>{exam.title}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-none h-16">
                        {activeTab === 'students' ? (
                          <>
                            <TableHead className="px-10">Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Roll Number</TableHead>
                            <TableHead>Verification</TableHead>
                            <TableHead className="text-right px-10">Operations</TableHead>
                          </>
                        ) : activeTab === 'results' ? (
                          <>
                            <TableHead className="px-10">Student Name</TableHead>
                            <TableHead>Roll Number</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right px-10">Records</TableHead>
                          </>
                        ) : activeTab === 'exams' ? (
                          <>
                            <TableHead className="px-10">Title</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Max Marks</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right px-10">Operations</TableHead>
                          </>
                        ) : activeTab === 'notices' ? (
                          <>
                            <TableHead className="px-10">Headline</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Published Date</TableHead>
                            <TableHead className="text-right px-10">Operations</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead className="px-10">Resource Title</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Semester</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right px-10">Operations</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTab === 'students' && students?.map((student) => (
                        <TableRow key={student.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                          <TableCell className="px-10 font-bold text-lg">{student.firstName} {student.lastName}</TableCell>
                          <TableCell className="text-muted-foreground">{student.email}</TableCell>
                          <TableCell><span className="font-black text-primary tracking-tighter">{student.studentId}</span></TableCell>
                          <TableCell><Badge variant={student.isApproved ? "default" : "outline"}>{student.status}</Badge></TableCell>
                          <TableCell className="text-right px-10 space-x-2">
                            {!student.isApproved ? (
                              <Button variant="ghost" size="icon" onClick={() => handleApproveStudent(student.id, true)} className="text-green-600"><CheckCircle size={22} /></Button>
                            ) : (
                              <Button variant="ghost" size="icon" onClick={() => handleApproveStudent(student.id, false)} className="text-orange-600"><XCircle size={22} /></Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleDelete('students', student.id)} className="text-destructive"><Trash2 size={22} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {activeTab === 'results' && selectedExamId && students?.map((student) => (
                        <TableRow key={student.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                          <TableCell className="px-10 font-bold text-lg">{student.firstName} {student.lastName}</TableCell>
                          <TableCell className="font-black text-primary tracking-tighter">{student.studentId}</TableCell>
                          <TableCell>
                            <Badge variant={student.isApproved ? "default" : "outline"}>
                              {student.isApproved ? "Approved" : "Pending Approval"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-10">
                            <Button onClick={() => handleOpenManageResults(student.id)} variant="outline" className="rounded-xl font-bold">
                              <Edit2 size={16} className="mr-2" /> Manage Grades
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {activeTab === 'results' && !selectedExamId && (
                        <TableRow><TableCell colSpan={4} className="text-center py-32 italic opacity-40">Choose an exam cycle above to begin managing results</TableCell></TableRow>
                      )}

                      {activeTab === 'exams' && exams?.map((exam) => (
                        <TableRow key={exam.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                          <TableCell className="px-10 font-bold text-lg">{exam.title}</TableCell>
                          <TableCell className="text-muted-foreground">{exam.semester}</TableCell>
                          <TableCell className="font-bold">{exam.totalMarks}</TableCell>
                          <TableCell>
                            <Badge variant={exam.status === 'active' ? 'default' : exam.status === 'upcoming' ? 'secondary' : 'outline'}>
                              {exam.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right px-10">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete('exams', exam.id)} className="text-destructive">
                              <Trash2 size={22} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {activeTab === 'notices' && notices?.map((notice) => (
                        <TableRow key={notice.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                          <TableCell className="px-10 font-bold text-lg">{notice.title}</TableCell>
                          <TableCell>
                            <Badge variant={notice.isUrgent ? 'destructive' : 'secondary'}>
                              {notice.isUrgent ? 'Urgent' : 'Normal'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {notice.publishDate ? format(new Date(notice.publishDate), 'MMM d, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right px-10">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete('notices', notice.id)} className="text-destructive">
                              <Trash2 size={22} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {activeTab === 'resources' && materials?.map((material) => (
                        <TableRow key={material.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                          <TableCell className="px-10 font-bold text-lg">{material.title}</TableCell>
                          <TableCell>{material.subject}</TableCell>
                          <TableCell>{material.semester}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{material.materialType}</Badge>
                          </TableCell>
                          <TableCell className="text-right px-10 space-x-2">
                            <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="text-primary">
                                <Download size={20} />
                              </Button>
                            </a>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete('studyMaterials', material.id)} className="text-destructive">
                              <Trash2 size={20} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </>
            )}
          </Card>
        </Tabs>

        {/* Manage Results Dialog */}
        <Dialog open={isManageResultsOpen} onOpenChange={setIsManageResultsOpen}>
          <DialogContent className="sm:max-w-[800px] rounded-[3rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold">Manage Grades</DialogTitle>
              <DialogDescription>
                Recording results for {selectedStudent?.firstName} {selectedStudent?.lastName} in {selectedExam?.title}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
              <form onSubmit={handleSaveResult} className="space-y-6 p-6 bg-muted/20 rounded-[2rem]">
                <div className="space-y-2">
                  <Label>Subject Name</Label>
                  <Input required value={newResult.subject} onChange={e => setNewResult({ ...newResult, subject: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marks Obtained</Label>
                    <Input type="number" value={newResult.marksObtained} onChange={e => handleMarksChange(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <div className="h-10 flex items-center px-4 bg-primary text-white rounded-md font-bold">{newResult.grade || 'N/A'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assessment Date</Label>
                  <Input type="date" value={newResult.examDate} onChange={e => setNewResult({ ...newResult, examDate: e.target.value })} />
                </div>
                <Button type="submit" disabled={isCreating} className="w-full h-12 bg-primary font-bold rounded-xl shadow-lg">
                  {isCreating ? <Loader2 className="animate-spin mr-2" /> : null}
                  {editingResultId ? "Update Record" : "Save Result"}
                </Button>
              </form>
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ClipboardList size={20} className="text-primary" /> Existing Records
                </h3>
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                  {selectedStudentExamResults.length > 0 ? selectedStudentExamResults.map(res => (
                    <div key={res.id} className="p-4 border rounded-2xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-bold">{res.subject}</p>
                        <p className="text-xs text-muted-foreground">{res.marks}% • Grade: {res.grade}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditResult(res)} className="text-primary">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete('students', selectedStudentId!, 'results', res.id)} className="text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
                      <p className="text-sm text-muted-foreground italic">No grades recorded yet.</p>
                    </div>
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
