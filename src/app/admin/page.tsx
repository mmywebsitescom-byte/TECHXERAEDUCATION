
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
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
import { Plus, Shield, List, GraduationCap, Megaphone, Loader2, UserCheck, Trash2, Users, CheckCircle, XCircle, Search, ClipboardList, CreditCard, Filter, Edit2, ArrowLeft, Target, Award } from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase'
import { doc, setDoc, collection, deleteDoc, query, orderBy, updateDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

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
  const [newMaterial, setNewMaterial] = useState({ title: '', subject: '', semester: '', fileUrl: '', materialType: 'Notes' })
  const [newResult, setNewResult] = useState({ subject: '', semester: '', marksObtained: 0, grade: '', examDate: new Date().toISOString().split('T')[0] })
  const [newExam, setNewExam] = useState({ title: '', semester: '', examDate: new Date().toISOString().split('T')[0], status: 'upcoming', totalMarks: 100 })

  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const adminRef = useMemoFirebase(() => (user && db ? doc(db, 'roles_admin', user.uid) : null), [user, db])
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRef)
  const isAdmin = !!adminDoc

  // Fetch collections
  const noticesQuery = useMemoFirebase(() => (db && isAdmin) ? query(collection(db, 'notices'), orderBy('publishDate', 'desc')) : null, [db, isAdmin])
  const materialsQuery = useMemoFirebase(() => (db && isAdmin) ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db, isAdmin])
  const studentsQuery = useMemoFirebase(() => (db && isAdmin) ? collection(db, 'students') : null, [db, isAdmin])
  const examsQuery = useMemoFirebase(() => (db && isAdmin) ? query(collection(db, 'exams'), orderBy('examDate', 'desc')) : null, [db, isAdmin])
  
  const { data: notices } = useCollection(noticesQuery)
  const { data: materials } = useCollection(materialsQuery)
  const { data: students } = useCollection(studentsQuery)
  const { data: exams } = useCollection(examsQuery)

  const selectedStudent = students?.find(s => s.id === selectedStudentId)
  const selectedExam = exams?.find(e => e.id === selectedExamId)

  // Results for specific student+exam context
  const resultsQuery = useMemoFirebase(() => (db && selectedStudentId && isAdmin) ? query(collection(db, 'students', selectedStudentId, 'results'), orderBy('examDate', 'desc')) : null, [db, selectedStudentId, isAdmin])
  const { data: allStudentResults } = useCollection(resultsQuery)
  
  // Filtered results for the selected exam
  const selectedStudentExamResults = allStudentResults?.filter(r => r.examId === selectedExamId) || []

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/admin/login')
    }
  }, [user, isUserLoading, router, mounted])

  // Grade Calculation Logic
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

  const handleGrantAdmin = () => {
    if (!user || !db) return
    const adminDocRef = doc(db, 'roles_admin', user.uid);
    const data = {
      email: user.email,
      grantedAt: new Date().toISOString(),
      uid: user.uid
    };

    setDoc(adminDocRef, data)
      .then(() => {
        toast({ title: "Admin Access Granted", description: "Updating your administrative status..." })
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: adminDocRef.path, operation: 'create', requestResourceData: data }));
      })
  }

  const handleDelete = (coll: string, id: string, subColl?: string, subId?: string) => {
    if (!db) return
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
    if (!db) return
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
    if (!db || !isAdmin) return
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
    if (!db || !isAdmin) return
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
        setNewMaterial({ title: '', subject: '', semester: '', fileUrl: '', materialType: 'Notes' })
        setIsDialogOpen(false)
      })
      .finally(() => setIsCreating(false))
  }

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAdmin) return
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
    if (!db || !isAdmin || !selectedStudentId || !selectedExamId) return
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
      marks: percentage, // This is the percentage
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

  // Calculate percentage for display in form
  const currentPercentage = selectedExam 
    ? ((newResult.marksObtained / selectedExam.totalMarks) * 100).toFixed(2) 
    : "0.00"

  if (!mounted || isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-48 pb-20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-primary text-white rounded-[2rem] shadow-2xl shadow-primary/20">
              <Shield size={36} />
            </div>
            <div>
              <h1 className="text-5xl font-headline font-bold tracking-tighter">Admin Central</h1>
              <p className="text-muted-foreground font-medium">Identity: <span className="text-primary">{user.email}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {!isAdmin && (
              <Button onClick={handleGrantAdmin} variant="secondary" className="h-14 px-8 shadow-xl shadow-secondary/20 bg-secondary text-white hover:bg-secondary/90 rounded-2xl font-bold">
                <UserCheck className="mr-2" size={20} /> Elevate Privileges
              </Button>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!isAdmin || activeTab === 'results'} 
                  className="h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-white rounded-2xl font-bold"
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
                  <DialogDescription>
                    Fill in the details below to update the campus ecosystem.
                  </DialogDescription>
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
          </div>
        </div>

        {!isAdmin ? (
          <Card className="p-20 text-center border-dashed border-4 rounded-[4rem] bg-muted/20">
            <h2 className="text-3xl font-headline font-bold mb-4">Awaiting Administrative Authorization</h2>
            <p className="text-muted-foreground text-lg mb-8">Your account does not currently hold management credentials. Use the elevation button to register as an administrator.</p>
            <div className="flex justify-center"><Shield size={64} className="text-muted-foreground/30 animate-pulse" /></div>
          </Card>
        ) : (
          <Tabs defaultValue="results" className="space-y-12" onValueChange={setActiveTab}>
            <TabsList className="bg-white p-2 rounded-[2rem] shadow-xl border border-border/40 h-auto grid grid-cols-3 md:flex w-full md:w-fit gap-2">
              <TabsTrigger value="results" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><GraduationCap className="mr-2" size={20} /> Results Hub</TabsTrigger>
              <TabsTrigger value="students" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><Users className="mr-2" size={20} /> Student Roster</TabsTrigger>
              <TabsTrigger value="exams" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><ClipboardList className="mr-2" size={20} /> Exam Cycles</TabsTrigger>
              <TabsTrigger value="notices" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><Megaphone className="mr-2" size={20} /> Notice Board</TabsTrigger>
              <TabsTrigger value="resources" className="rounded-2xl py-4 px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold"><List className="mr-2" size={20} /> Repository</TabsTrigger>
            </TabsList>

            <Card className="shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border-none rounded-[3.5rem] overflow-hidden bg-white/90 backdrop-blur-md border border-white">
              {activeTab === 'results' && (
                <div className="p-10 border-b border-border/40 bg-muted/20">
                  <div className="flex flex-col md:flex-row gap-8 items-end">
                    <div className="flex-1 space-y-4">
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Step 1: Select Exam Cycle to Manage Results</Label>
                      <select 
                        className="flex h-14 w-full rounded-3xl border-2 border-primary/10 bg-background px-6 py-2 text-lg font-bold outline-none focus:border-primary transition-all"
                        value={selectedExamId || ''}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                      >
                        <option value="">-- Choose Exam Session --</option>
                        {exams?.map(exam => (
                          <option key={exam.id} value={exam.id}>{exam.title} ({exam.semester}) - Max Marks: {exam.totalMarks || 100}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-none h-16">
                      {activeTab === 'students' ? (
                        <>
                          <TableHead className="px-10">Name</TableHead>
                          <TableHead>Email Profile</TableHead>
                          <TableHead>Roll Number</TableHead>
                          <TableHead>Verification</TableHead>
                          <TableHead className="text-right px-10">Operations</TableHead>
                        </>
                      ) : activeTab === 'results' ? (
                        <>
                          <TableHead className="px-10">Student Name</TableHead>
                          <TableHead>Roll Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right px-10">Manage Academic Records</TableHead>
                        </>
                      ) : activeTab === 'exams' ? (
                        <>
                          <TableHead className="px-10">Cycle Title</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Max Marks</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right px-10">Operations</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="px-10">System ID</TableHead>
                          <TableHead>Display Title</TableHead>
                          <TableHead>Category/Priority</TableHead>
                          <TableHead>Timestamp</TableHead>
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
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <CreditCard size={18} className="text-primary" />
                            <span className="font-black text-primary tracking-tighter">{student.studentId || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.isApproved ? "default" : "outline"} className="px-4 py-1 rounded-full uppercase text-[9px] font-black tracking-widest">
                            {student.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-10 space-x-2">
                          <Button variant="ghost" size="icon" title="Inspect Academic Data" onClick={() => { setSelectedStudentId(student.id); setActiveTab('results'); }}><Search size={22} /></Button>
                          {!student.isApproved ? (
                            <Button variant="ghost" size="icon" title="Grant Approval" onClick={() => handleApproveStudent(student.id, true)} className="text-green-600"><CheckCircle size={22} /></Button>
                          ) : (
                            <Button variant="ghost" size="icon" title="Revoke Approval" onClick={() => handleApproveStudent(student.id, false)} className="text-orange-600"><XCircle size={22} /></Button>
                          )}
                          <Button variant="ghost" size="icon" title="Wipe Data" onClick={() => handleDelete('students', student.id)} className="text-destructive"><Trash2 size={22} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {activeTab === 'results' && selectedExamId && students?.map((student) => (
                      <TableRow key={student.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                        <TableCell className="px-10 font-bold text-lg">{student.firstName} {student.lastName}</TableCell>
                        <TableCell className="font-black text-primary tracking-tighter">{student.studentId}</TableCell>
                        <TableCell>
                          <Badge variant={student.isApproved ? "default" : "secondary"} className="uppercase text-[9px] font-black tracking-widest">
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-10">
                          <Button onClick={() => handleOpenManageResults(student.id)} className="rounded-xl font-bold bg-primary hover:bg-primary/90">
                            Manage Marks
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {activeTab === 'results' && !selectedExamId && (
                      <TableRow><TableCell colSpan={4} className="text-center py-32 text-muted-foreground font-bold uppercase tracking-widest text-sm italic opacity-40">Choose an exam cycle to begin grade entry</TableCell></TableRow>
                    )}

                    {activeTab === 'exams' && exams?.map((exam) => (
                      <TableRow key={exam.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                        <TableCell className="px-10 font-bold text-lg">{exam.title}</TableCell>
                        <TableCell>{exam.semester}</TableCell>
                        <TableCell className="font-bold text-primary">{exam.totalMarks || 100}</TableCell>
                        <TableCell>
                          <Badge variant={exam.status === 'active' ? 'default' : exam.status === 'completed' ? 'secondary' : 'outline'} className="uppercase text-[9px] font-black tracking-widest">
                            {exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-10">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('exams', exam.id)} className="text-destructive"><Trash2 size={22} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeTab === 'notices' && notices?.map((notice) => (
                      <TableRow key={notice.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                        <TableCell className="px-10 font-medium text-xs text-muted-foreground">{notice.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-bold text-lg">{notice.title}</TableCell>
                        <TableCell>{notice.isUrgent ? <Badge variant="destructive" className="uppercase text-[9px] font-black tracking-widest">Priority</Badge> : <span className="text-xs uppercase font-bold tracking-widest opacity-40">Standard</span>}</TableCell>
                        <TableCell className="font-medium text-muted-foreground">{notice.publishDate ? format(new Date(notice.publishDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                        <TableCell className="text-right px-10">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('notices', notice.id)} className="text-destructive"><Trash2 size={22} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeTab === 'resources' && materials?.map((material) => (
                      <TableRow key={material.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                        <TableCell className="px-10 font-medium text-xs text-muted-foreground">{material.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-bold text-lg">{material.title}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-bold text-primary text-xs uppercase tracking-widest">{material.subject}</p>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">{material.materialType}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-muted-foreground">{material.uploadDate ? format(new Date(material.uploadDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                        <TableCell className="text-right px-10">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('studyMaterials', material.id)} className="text-destructive"><Trash2 size={22} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Tabs>
        )}

        {/* Specialized Manage Results Dialog */}
        <Dialog open={isManageResultsOpen} onOpenChange={setIsManageResultsOpen}>
          <DialogContent className="sm:max-w-[800px] rounded-[3rem] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-headline font-bold">Manage Grades</DialogTitle>
                  <DialogDescription>
                    Student: <span className="text-primary font-bold">{selectedStudent?.firstName} {selectedStudent?.lastName}</span> | 
                    Exam: <span className="text-primary font-bold">{selectedExam?.title}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
              {/* Form Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><Plus size={18} /> {editingResultId ? 'Edit Result' : 'Add New Subject'}</h3>
                <form onSubmit={handleSaveResult} className="space-y-6 p-6 bg-muted/20 rounded-[2rem] border border-border/40">
                  <div className="space-y-2"><Label>Subject Code / Name</Label><Input required value={newResult.subject} onChange={e => setNewResult({ ...newResult, subject: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Semester</Label><Input required value={newResult.semester} onChange={e => setNewResult({ ...newResult, semester: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">Grade (Auto) <Award size={14} className="text-primary" /></Label>
                      <div className="h-10 flex items-center px-4 bg-primary text-white font-black rounded-md border border-primary shadow-inner">
                        {newResult.grade || 'F'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Marks Obtained</Label>
                      <Input 
                        required 
                        type="number" 
                        min="0" 
                        max={selectedExam?.totalMarks} 
                        value={newResult.marksObtained} 
                        onChange={e => handleMarksChange(Number(e.target.value))} 
                        className="font-bold text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Calculated Percentage (%)</Label>
                      <div className="h-10 flex items-center px-4 bg-primary/10 text-primary font-black rounded-md border border-primary/20">
                        {currentPercentage}%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Evaluation Date</Label><Input required type="date" value={newResult.examDate} onChange={e => setNewResult({ ...newResult, examDate: e.target.value })} /></div>
                  <div className="p-4 bg-primary/5 rounded-xl flex items-center gap-3 text-xs font-bold text-primary">
                    <Target size={16} /> Base Total Marks for this Exam: {selectedExam?.totalMarks || 100}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isCreating} className="flex-1 h-12 rounded-xl font-bold bg-primary shadow-lg shadow-primary/20">
                      {editingResultId ? "Update Entry" : "Commit Result"}
                    </Button>
                    {editingResultId && (
                      <Button type="button" variant="outline" onClick={() => { setEditingResultId(null); setNewResult({ subject: '', semester: '', marksObtained: 0, grade: '', examDate: new Date().toISOString().split('T')[0] }); }} className="rounded-xl">Cancel</Button>
                    )}
                  </div>
                </form>
              </div>

              {/* Records Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><List size={18} /> Existing Records</h3>
                <div className="space-y-4">
                  {selectedStudentExamResults.length > 0 ? selectedStudentExamResults.map(res => (
                    <div key={res.id} className="p-5 bg-white border border-border/40 rounded-[1.5rem] shadow-sm flex items-center justify-between group">
                      <div className="space-y-1">
                        <p className="font-bold text-lg">{res.subject}</p>
                        <div className="flex gap-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                          <span>{res.marksObtained} / {res.totalMarks}</span>
                          <span className="text-primary font-black">{res.marks}%</span>
                          <span className="text-secondary font-black">{res.grade}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEditResult(res)} className="text-primary"><Edit2 size={18} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete('students', selectedStudentId!, 'results', res.id)} className="text-destructive"><Trash2 size={18} /></Button>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center border-2 border-dashed rounded-[2rem] text-muted-foreground italic text-sm">
                      No results found for this exam cycle.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="pt-10">
               <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsManageResultsOpen(false)}><ArrowLeft className="mr-2" size={18} /> Back to Roster</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
