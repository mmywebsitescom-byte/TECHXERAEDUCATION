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
import { Plus, Shield, List, GraduationCap, Megaphone, Loader2, UserCheck, Trash2, Users, CheckCircle, XCircle, Search, ClipboardList, CreditCard, Filter } from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase'
import { doc, setDoc, collection, deleteDoc, query, orderBy, updateDoc, getDocs, where } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('results')
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Selected Student for Results
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [viewingExamId, setViewingExamId] = useState<string | null>(null)
  const [examResults, setExamResults] = useState<any[]>([])
  const [isFetchingExamResults, setIsFetchingExamResults] = useState(false)

  // Form States
  const [newNotice, setNewNotice] = useState({ title: '', description: '', isUrgent: false })
  const [newMaterial, setNewMaterial] = useState({ title: '', subject: '', semester: '', fileUrl: '', materialType: 'Notes' })
  const [newResult, setNewResult] = useState({ examId: '', subject: '', semester: '', marks: 0, grade: '', examDate: new Date().toISOString().split('T')[0] })
  const [newExam, setNewExam] = useState({ title: '', semester: '', examDate: new Date().toISOString().split('T')[0], status: 'upcoming' })

  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const adminRef = useMemoFirebase(() => (user && db ? doc(db, 'roles_admin', user.uid) : null), [user, db])
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRef)
  const isAdmin = !!adminDoc

  // Fetch collections only if user is an admin
  const noticesQuery = useMemoFirebase(() => (db && isAdmin) ? query(collection(db, 'notices'), orderBy('publishDate', 'desc')) : null, [db, isAdmin])
  const materialsQuery = useMemoFirebase(() => (db && isAdmin) ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db, isAdmin])
  const studentsQuery = useMemoFirebase(() => (db && isAdmin) ? collection(db, 'students') : null, [db, isAdmin])
  const examsQuery = useMemoFirebase(() => (db && isAdmin) ? query(collection(db, 'exams'), orderBy('examDate', 'desc')) : null, [db, isAdmin])
  
  const { data: notices } = useCollection(noticesQuery)
  const { data: materials } = useCollection(materialsQuery)
  const { data: students } = useCollection(studentsQuery)
  const { data: exams } = useCollection(examsQuery)

  // Results query for selected student
  const resultsQuery = useMemoFirebase(() => (db && selectedStudentId && isAdmin) ? query(collection(db, 'students', selectedStudentId, 'results'), orderBy('examDate', 'desc')) : null, [db, selectedStudentId, isAdmin])
  const { data: selectedStudentResults } = useCollection(resultsQuery)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/admin/login')
    }
  }, [user, isUserLoading, router, mounted])

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
        setNewExam({ title: '', semester: '', examDate: new Date().toISOString().split('T')[0], status: 'upcoming' })
        setIsDialogOpen(false)
      })
      .finally(() => setIsCreating(false))
  }

  const handleAddResult = (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !isAdmin || !selectedStudentId) return
    setIsCreating(true)

    const selectedExam = exams?.find(ex => ex.id === newResult.examId)
    const docRef = doc(collection(db, 'students', selectedStudentId, 'results'))
    const data = {
      ...newResult,
      id: docRef.id,
      studentId: selectedStudentId,
      examTitle: selectedExam?.title || 'General Assessment',
      examDate: new Date(newResult.examDate).toISOString()
    }

    setDoc(docRef, data)
      .then(() => {
        toast({ title: "Result Recorded" })
        setNewResult({ examId: '', subject: '', semester: '', marks: 0, grade: '', examDate: new Date().toISOString().split('T')[0] })
        setIsDialogOpen(false)
      })
      .finally(() => setIsCreating(false))
  }

  const fetchExamResults = async (examId: string) => {
    if (!db || !students) return
    setIsFetchingExamResults(true)
    setViewingExamId(examId)
    
    const results: any[] = []
    
    // Iterate students and check results subcollection for this examId
    // In a production app, we would use a Collection Group query, 
    // but for simplicity here we simulate it or fetch per student
    for (const student of students) {
      const q = query(collection(db, 'students', student.id, 'results'), where('examId', '==', examId))
      const snap = await getDocs(q)
      snap.forEach(doc => {
        results.push({ ...doc.data(), studentName: `${student.firstName} ${student.lastName}`, studentRoll: student.studentId })
      })
    }
    
    setExamResults(results)
    setIsFetchingExamResults(false)
  }

  const selectedStudent = students?.find(s => s.id === selectedStudentId)

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
      
      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-64 pb-20">
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
                <Button disabled={!isAdmin || (activeTab === 'results' && !selectedStudentId)} className="h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 text-white rounded-2xl font-bold">
                  <Plus className="mr-2" size={24} /> Create Record
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline font-bold">
                    {activeTab === 'notices' ? 'Publish Announcement' : 
                     activeTab === 'resources' ? 'Upload Resource' : 
                     activeTab === 'exams' ? 'Schedule Exam' :
                     `Record Result: ${selectedStudent?.firstName || 'Student'}`}
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
                    <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl text-lg font-bold">Establish Exam Cycle</Button>
                  </form>
                ) : (
                  <form onSubmit={handleAddResult} className="space-y-6 pt-6">
                    <div className="space-y-2">
                      <Label>Associated Exam Cycle</Label>
                      <Select value={newResult.examId} onValueChange={(val) => setNewResult({ ...newResult, examId: val })}>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Link to existing session" /></SelectTrigger>
                        <SelectContent>
                          {exams?.map(exam => (
                            <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Subject Code/Name</Label><Input required value={newResult.subject} onChange={e => setNewResult({ ...newResult, subject: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Semester</Label><Input required value={newResult.semester} onChange={e => setNewResult({ ...newResult, semester: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Percentage Marks</Label><Input required type="number" min="0" max="100" value={newResult.marks} onChange={e => setNewResult({ ...newResult, marks: Number(e.target.value) })} /></div>
                      <div className="space-y-2"><Label>Academic Grade</Label><Input required placeholder="O, A+, B..." value={newResult.grade} onChange={e => setNewResult({ ...newResult, grade: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Evaluation Date</Label><Input required type="date" value={newResult.examDate} onChange={e => setNewResult({ ...newResult, examDate: e.target.value })} /></div>
                    <Button type="submit" disabled={isCreating} className="w-full h-12 rounded-xl text-lg font-bold">Finalize Grade</Button>
                  </form>
                )}
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
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Select Student to Manage Academic Records</Label>
                      <select 
                        className="flex h-14 w-full rounded-3xl border-2 border-primary/10 bg-background px-6 py-2 text-lg font-bold outline-none focus:border-primary transition-all"
                        value={selectedStudentId || ''}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                      >
                        <option value="">-- Choose Student Identity --</option>
                        {students && students.length > 0 ? (
                          students.map(student => (
                            <option key={student.id} value={student.id}>
                              {student.firstName} {student.lastName} | ID: {student.studentId || 'UNASSIGNED'} | Status: {student.status?.toUpperCase() || 'PENDING'}
                            </option>
                          ))
                        ) : (
                          <option disabled>Initializing roster...</option>
                        )}
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
                          <TableHead className="px-10">Subject</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Exam Cycle</TableHead>
                          <TableHead className="text-right px-10">Operations</TableHead>
                        </>
                      ) : activeTab === 'exams' ? (
                        <>
                          <TableHead className="px-10">Cycle Title</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Start Date</TableHead>
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
                    {activeTab === 'results' && selectedStudentResults?.map((res) => {
                      const exam = exams?.find(e => e.id === res.examId);
                      return (
                        <TableRow key={res.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                          <TableCell className="px-10 font-bold text-lg">{res.subject}</TableCell>
                          <TableCell>{res.semester}</TableCell>
                          <TableCell className="font-medium">{res.marks}%</TableCell>
                          <TableCell className="font-black text-2xl text-primary">{res.grade}</TableCell>
                          <TableCell className="text-xs font-bold text-muted-foreground uppercase">{exam?.title || res.examTitle || 'General'}</TableCell>
                          <TableCell className="text-right px-10">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete('students', selectedStudentId!, 'results', res.id)} className="text-destructive"><Trash2 size={22} /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {activeTab === 'results' && !selectedStudentId && (
                      <TableRow><TableCell colSpan={6} className="text-center py-32 text-muted-foreground font-bold uppercase tracking-widest text-sm italic opacity-40">Choose a student identity to manage records</TableCell></TableRow>
                    )}
                    {activeTab === 'exams' && exams?.map((exam) => (
                      <TableRow key={exam.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                        <TableCell className="px-10 font-bold text-lg">{exam.title}</TableCell>
                        <TableCell>{exam.semester}</TableCell>
                        <TableCell className="font-medium">{exam.examDate ? format(new Date(exam.examDate), 'MMM d, yyyy') : 'PENDING'}</TableCell>
                        <TableCell>
                          <Badge variant={exam.status === 'active' ? 'default' : exam.status === 'completed' ? 'secondary' : 'outline'} className="uppercase text-[9px] font-black tracking-widest">
                            {exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-10 space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => fetchExamResults(exam.id)}><Filter size={20} /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-[3rem]">
                              <DialogHeader>
                                <DialogTitle className="text-3xl font-headline font-bold">Consolidated Results: {exam.title}</DialogTitle>
                                <DialogDescription>Review performance metrics across the entire cohort for this session.</DialogDescription>
                              </DialogHeader>
                              <div className="pt-8">
                                {isFetchingExamResults ? (
                                  <div className="flex flex-col items-center py-20 gap-4">
                                    <Loader2 className="animate-spin text-primary" size={48} />
                                    <p className="font-bold text-muted-foreground uppercase tracking-widest">Compiling grades...</p>
                                  </div>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted">
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Roll No</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Grade</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {examResults.map((r, i) => (
                                        <TableRow key={i}>
                                          <TableCell className="font-bold">{r.studentName}</TableCell>
                                          <TableCell className="font-black text-primary text-xs">{r.studentRoll}</TableCell>
                                          <TableCell>{r.subject}</TableCell>
                                          <TableCell>{r.marks}%</TableCell>
                                          <TableCell className="font-black text-primary">{r.grade}</TableCell>
                                        </TableRow>
                                      ))}
                                      {examResults.length === 0 && (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-50">No grades recorded for this cycle yet.</TableCell></TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
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
      </main>
    </div>
  )
}
