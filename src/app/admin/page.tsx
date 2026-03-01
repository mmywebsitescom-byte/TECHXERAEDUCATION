
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Shield, List, GraduationCap, Megaphone, Loader2, UserCheck, Trash2, Users, CheckCircle, XCircle, Search, ClipboardList } from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase'
import { doc, setDoc, collection, deleteDoc, query, orderBy, updateDoc } from 'firebase/firestore'
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

  // Fetch collections only if user is an admin to prevent permission errors on page load
  const noticesQuery = useMemoFirebase(() => (db && isAdmin) ? query(collection(db, 'notices'), orderBy('publishDate', 'desc')) : null, [db, isAdmin])
  const materialsQuery = useMemoFirebase(() => (db && isAdmin) ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db, isAdmin])
  const studentsQuery = useMemoFirebase(() => (db && isAdmin) ? query(collection(db, 'students'), orderBy('enrollmentDate', 'desc')) : null, [db, isAdmin])
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

  if (!mounted || isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) return null

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

  const selectedStudent = students?.find(s => s.id === selectedStudentId)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-48 pb-20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Logged in as: {user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {!isAdmin && (
              <Button onClick={handleGrantAdmin} variant="secondary" className="h-12 px-6 shadow-lg shadow-secondary/20 bg-secondary text-white hover:bg-secondary/90">
                <UserCheck className="mr-2" size={18} /> Grant Admin Access
              </Button>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!isAdmin || (activeTab === 'results' && !selectedStudentId)} className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white">
                  <Plus className="mr-2" size={20} /> Create New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {activeTab === 'notices' ? 'Publish Notice' : 
                     activeTab === 'resources' ? 'Add Study Material' : 
                     activeTab === 'exams' ? 'Create Exam' :
                     `Add Result for ${selectedStudent?.firstName}`}
                  </DialogTitle>
                </DialogHeader>
                
                {activeTab === 'notices' ? (
                  <form onSubmit={handleCreateNotice} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Title</Label><Input required value={newNotice.title} onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Content</Label><Textarea required value={newNotice.description} onChange={e => setNewNotice({ ...newNotice, description: e.target.value })} /></div>
                    <div className="flex items-center space-x-2"><Switch checked={newNotice.isUrgent} onCheckedChange={c => setNewNotice({ ...newNotice, isUrgent: c })} /><Label>Urgent</Label></div>
                    <Button type="submit" disabled={isCreating} className="w-full">Publish</Button>
                  </form>
                ) : activeTab === 'resources' ? (
                  <form onSubmit={handleCreateMaterial} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Title</Label><Input required value={newMaterial.title} onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Subject</Label><Input required value={newMaterial.subject} onChange={e => setNewMaterial({ ...newMaterial, subject: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Semester</Label><Input required value={newMaterial.semester} onChange={e => setNewMaterial({ ...newMaterial, semester: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>File URL</Label><Input required type="url" value={newMaterial.fileUrl} onChange={e => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })} /></div>
                    <Button type="submit" disabled={isCreating} className="w-full">Upload</Button>
                  </form>
                ) : activeTab === 'exams' ? (
                  <form onSubmit={handleCreateExam} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Exam Title</Label><Input required placeholder="e.g., Spring Finals 2025" value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Semester</Label><Input required value={newExam.semester} onChange={e => setNewExam({ ...newExam, semester: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Start Date</Label><Input required type="date" value={newExam.examDate} onChange={e => setNewExam({ ...newExam, examDate: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={newExam.status} onValueChange={(val) => setNewExam({ ...newExam, status: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={isCreating} className="w-full">Create Exam Session</Button>
                  </form>
                ) : (
                  <form onSubmit={handleAddResult} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Link to Exam Session</Label>
                      <Select value={newResult.examId} onValueChange={(val) => setNewResult({ ...newResult, examId: val })}>
                        <SelectTrigger><SelectValue placeholder="Select Exam (Optional)" /></SelectTrigger>
                        <SelectContent>
                          {exams?.map(exam => (
                            <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Subject</Label><Input required value={newResult.subject} onChange={e => setNewResult({ ...newResult, subject: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Semester</Label><Input required value={newResult.semester} onChange={e => setNewResult({ ...newResult, semester: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Marks (%)</Label><Input required type="number" value={newResult.marks} onChange={e => setNewResult({ ...newResult, marks: Number(e.target.value) })} /></div>
                      <div className="space-y-2"><Label>Grade</Label><Input required placeholder="A+" value={newResult.grade} onChange={e => setNewResult({ ...newResult, grade: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Exam Date</Label><Input required type="date" value={newResult.examDate} onChange={e => setNewResult({ ...newResult, examDate: e.target.value })} /></div>
                    <Button type="submit" disabled={isCreating} className="w-full">Save Result</Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!isAdmin ? (
          <Card className="p-12 text-center border-dashed border-2">
            <h2 className="text-2xl font-bold">Admin Privileges Required</h2>
            <p className="text-muted-foreground mt-2">Please grant yourself admin access using the button above.</p>
          </Card>
        ) : (
          <Tabs defaultValue="results" className="space-y-8" onValueChange={setActiveTab}>
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-border/50 h-auto grid grid-cols-3 md:grid-cols-5 w-full md:w-[1000px]">
              <TabsTrigger value="results" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white"><GraduationCap className="mr-2" size={18} /> Results</TabsTrigger>
              <TabsTrigger value="students" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white"><Users className="mr-2" size={18} /> Students</TabsTrigger>
              <TabsTrigger value="exams" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white"><ClipboardList className="mr-2" size={18} /> Exams</TabsTrigger>
              <TabsTrigger value="notices" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white"><Megaphone className="mr-2" size={18} /> Notices</TabsTrigger>
              <TabsTrigger value="resources" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white"><List className="mr-2" size={18} /> Resources</TabsTrigger>
            </TabsList>

            <Card className="shadow-xl border-border/50 overflow-hidden bg-white/80 backdrop-blur-sm">
              {activeTab === 'results' && (
                <div className="p-8 border-b border-border/40 bg-muted/20">
                  <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Select Student to Manage Results</Label>
                      <select 
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedStudentId || ''}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                      >
                        <option value="">-- Select Student --</option>
                        {students?.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} ({student.studentId}) {!student.isApproved ? `[${student.status.toUpperCase()}]` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {activeTab === 'students' ? (
                        <>
                          <TableHead className="px-8">Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right px-8">Actions</TableHead>
                        </>
                      ) : activeTab === 'results' ? (
                        <>
                          <TableHead className="px-8">Subject</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Session</TableHead>
                          <TableHead className="text-right px-8">Actions</TableHead>
                        </>
                      ) : activeTab === 'exams' ? (
                        <>
                          <TableHead className="px-8">Exam Title</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right px-8">Actions</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="px-8">Identifier</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right px-8">Actions</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTab === 'students' && students?.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="px-8 font-bold">{student.firstName} {student.lastName}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell className="font-medium text-xs">{student.studentId}</TableCell>
                        <TableCell><Badge variant={student.isApproved ? "default" : "secondary"}>{student.status}</Badge></TableCell>
                        <TableCell className="text-right px-8 space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedStudentId(student.id); setActiveTab('results'); }}><Search size={18} /></Button>
                          {!student.isApproved ? (
                            <Button variant="ghost" size="icon" onClick={() => handleApproveStudent(student.id, true)} className="text-green-600"><CheckCircle size={18} /></Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => handleApproveStudent(student.id, false)} className="text-orange-600"><XCircle size={18} /></Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('students', student.id)} className="text-destructive"><Trash2 size={18} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeTab === 'results' && selectedStudentResults?.map((res) => {
                      const exam = exams?.find(e => e.id === res.examId);
                      return (
                        <TableRow key={res.id}>
                          <TableCell className="px-8 font-bold">{res.subject}</TableCell>
                          <TableCell>{res.semester}</TableCell>
                          <TableCell>{res.marks}%</TableCell>
                          <TableCell className="font-bold text-primary">{res.grade}</TableCell>
                          <TableCell className="text-xs">{exam?.title || res.examTitle || 'General'}</TableCell>
                          <TableCell className="text-right px-8">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete('students', selectedStudentId!, 'results', res.id)} className="text-destructive"><Trash2 size={18} /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {activeTab === 'results' && !selectedStudentId && (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium">Select a student from the dropdown to manage results.</TableCell></TableRow>
                    )}
                    {activeTab === 'exams' && exams?.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="px-8 font-bold">{exam.title}</TableCell>
                        <TableCell>{exam.semester}</TableCell>
                        <TableCell>{format(new Date(exam.examDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell><Badge variant={exam.status === 'completed' ? 'secondary' : 'default'}>{exam.status}</Badge></TableCell>
                        <TableCell className="text-right px-8">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('exams', exam.id)} className="text-destructive"><Trash2 size={18} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeTab === 'notices' && notices?.map((notice) => (
                      <TableRow key={notice.id}>
                        <TableCell className="px-8 font-medium">{notice.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-bold">{notice.title}</TableCell>
                        <TableCell>{notice.isUrgent ? <Badge variant="destructive">Urgent</Badge> : 'Standard'}</TableCell>
                        <TableCell>{format(new Date(notice.publishDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right px-8">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('notices', notice.id)} className="text-destructive"><Trash2 size={18} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeTab === 'resources' && materials?.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="px-8 font-medium">{material.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-bold">{material.title}</TableCell>
                        <TableCell>{material.subject} • {material.materialType}</TableCell>
                        <TableCell>{format(new Date(material.uploadDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right px-8">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('studyMaterials', material.id)} className="text-destructive"><Trash2 size={18} /></Button>
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
