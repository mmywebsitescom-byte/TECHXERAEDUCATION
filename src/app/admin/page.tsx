
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
import { Switch } from '@/components/ui/switch'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, GraduationCap, Users, CheckCircle, 
  Search, ClipboardList, Settings as SettingsIcon, 
  LogOut, Home, ArrowRight, Bell, HelpCircle,
  Plus, LifeBuoy, BookOpen, Camera, Trash2, 
  Loader2, CheckCircle2, AlertCircle, RefreshCw,
  Clock, Calendar as CalendarIcon, FileText, Edit,
  ShieldCheck, Layout, ImageIcon, Globe, Send, XCircle,
  CheckCircle as ConfirmIcon
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors'
import { cn } from '@/lib/utils'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

export default function AdminPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('results')
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedExamCycle, setSelectedExamCycle] = useState<string | null>(null)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [scannedStudent, setScannedStudent] = useState<any | null>(null)
  
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

  // Material Management State
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null)
  const [materialForm, setMaterialForm] = useState({
    title: '',
    subject: '',
    semester: 'Semester 1',
    materialType: 'Notes',
    fileUrl: '',
    thumbnailUrl: ''
  })

  // Notice Management State
  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = useState(false)
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    description: '',
    isUrgent: false
  })

  // Exam Management State
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false)
  const [examForm, setExamForm] = useState({
    title: '',
    semester: 'Semester 1',
    examDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'upcoming' as 'upcoming' | 'active' | 'completed'
  })

  // Grade Management State
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)
  const [selectedStudentForGrade, setSelectedStudentForGrade] = useState<any | null>(null)
  const [gradeForm, setGradeForm] = useState({
    subject: '',
    marks: '',
    grade: ''
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

  const allStudentsQuery = useMemoFirebase(() => (db && isAuthorizedAdmin ? query(collection(db, 'students'), orderBy('enrollmentDate', 'desc')) : null), [db, isAuthorizedAdmin])
  const { data: allStudents } = useCollection(allStudentsQuery)

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

  const handleRejectStudent = async (studentId: string) => {
    if (!db) return
    const docRef = doc(db, 'students', studentId)
    updateDoc(docRef, { isApproved: false, status: 'rejected' })
      .then(() => toast({ title: "Approval Revoked" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { isApproved: false, status: 'rejected' },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!db) return
    if (!confirm("Permanently delete this student record? This action cannot be undone.")) return
    
    const docRef = doc(db, 'students', studentId)
    deleteDoc(docRef)
      .then(() => toast({ title: "Record Deleted" }))
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
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

  const handleEditMaterial = (material: any) => {
    setEditingMaterial(material)
    setMaterialForm({
      title: material.title,
      subject: material.subject,
      semester: material.semester || 'Semester 1',
      materialType: material.materialType || 'Notes',
      fileUrl: material.fileUrl,
      thumbnailUrl: material.thumbnailUrl || ''
    })
    setIsMaterialDialogOpen(true)
  }

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return

    const id = editingMaterial?.id || Math.random().toString(36).substring(2, 9)
    const payload = {
      ...materialForm,
      id,
      uploadDate: editingMaterial?.uploadDate || new Date().toISOString()
    }

    const docRef = doc(db, 'studyMaterials', id)
    setDoc(docRef, payload, { merge: true })
      .then(() => {
        toast({ title: editingMaterial ? "Material Updated" : "Material Added" })
        setIsMaterialDialogOpen(false)
        setEditingMaterial(null)
        setMaterialForm({
          title: '',
          subject: '',
          semester: 'Semester 1',
          materialType: 'Notes',
          fileUrl: '',
          thumbnailUrl: ''
        })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: editingMaterial ? 'update' : 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    const payload = {
      ...noticeForm,
      id,
      publishDate: new Date().toISOString()
    }
    const docRef = doc(db, 'notices', id)
    setDoc(docRef, payload)
      .then(() => {
        toast({ title: "Notice Published" })
        setIsNoticeDialogOpen(false)
        setNoticeForm({ title: '', description: '', isUrgent: false })
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

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    const id = Math.random().toString(36).substring(2, 9)
    const payload = {
      ...examForm,
      id,
      createdAt: new Date().toISOString()
    }
    const docRef = doc(db, 'exams', id)
    setDoc(docRef, payload)
      .then(() => {
        toast({ title: "Exam Scheduled" })
        setIsExamDialogOpen(false)
        setExamForm({ title: '', semester: 'Semester 1', examDate: format(new Date(), 'yyyy-MM-dd'), status: 'upcoming' })
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

  // Grade Management Logic
  const calculateGrade = (marks: number): string => {
    if (marks >= 90) return 'O';
    if (marks >= 80) return 'A+';
    if (marks >= 70) return 'A';
    if (marks >= 60) return 'B+';
    if (marks >= 50) return 'B';
    if (marks >= 40) return 'C';
    if (marks >= 33) return 'P';
    return 'F';
  }

  const handleUpdateGradeClick = (student: any) => {
    const selectedExam = allExams?.find(ex => ex.id === selectedExamCycle)
    setSelectedStudentForGrade(student)
    setGradeForm({ 
      subject: selectedExam?.title || '', 
      marks: '', 
      grade: '' 
    })
    setIsGradeDialogOpen(true)
  }

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !selectedStudentForGrade || !selectedExamCycle) return

    const marksNum = parseInt(gradeForm.marks)
    if (isNaN(marksNum)) {
      toast({ variant: "destructive", title: "Invalid Data", description: "Score must be a valid number." })
      return
    }

    const exam = allExams?.find(ex => ex.id === selectedExamCycle)
    const payload = {
      subject: gradeForm.subject || exam?.title || 'Examination',
      marks: marksNum,
      grade: gradeForm.grade || calculateGrade(marksNum),
      examId: selectedExamCycle,
      examTitle: exam?.title || 'Assessment',
      semester: exam?.semester || selectedStudentForGrade.currentSemester || 'Semester 1',
      examDate: exam?.examDate || new Date().toISOString(),
      timestamp: new Date().toISOString()
    }

    const docRef = doc(db, 'students', selectedStudentForGrade.id, 'results', selectedExamCycle)
    
    setDoc(docRef, payload, { merge: true })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({ 
      title: "Result Archived", 
      description: `Academic record saved for ${selectedStudentForGrade.firstName} ${selectedStudentForGrade.lastName}.` 
    })
    setIsGradeDialogOpen(false)
    setGradeForm({ subject: '', marks: '', grade: '' })
  }

  const handleGlobalCreate = () => {
    if (activeTab === 'repository') {
      setEditingMaterial(null)
      setMaterialForm({ title: '', subject: '', semester: 'Semester 1', materialType: 'Notes', fileUrl: '', thumbnailUrl: '' })
      setIsMaterialDialogOpen(true)
    } else if (activeTab === 'notices') {
      setIsNoticeDialogOpen(true)
    } else if (activeTab === 'exams') {
      setIsExamDialogOpen(true)
    } else if (activeTab === 'attendance') {
      setIsCreateDialogOpen(true)
    }
  }

  const handleConfirmAttendance = async () => {
    if (!db || !selectedSessionId || !scannedStudent) return

    const recordId = `${scannedStudent.uid}_${selectedSessionId}`
    const attendanceRef = doc(db, 'attendance', recordId)
    
    // Safety check for duplication
    const existing = await getDoc(attendanceRef)
    if (existing.exists()) {
      toast({ title: "Already Logged", description: `${scannedStudent.name} has already been verified.` })
      setScannedStudent(null)
      return
    }

    const sessionDoc = await getDoc(doc(db, 'sessions', selectedSessionId));
    const dynamicToken = sessionDoc.exists() ? sessionDoc.data().dynamicToken : '';

    const payload = {
      id: recordId,
      sessionId: selectedSessionId,
      studentUid: scannedStudent.uid,
      studentId: scannedStudent.studentId,
      studentName: scannedStudent.name,
      timestamp: new Date().toISOString(),
      status: 'present',
      tokenUsed: dynamicToken
    };

    setDoc(attendanceRef, payload)
      .then(() => {
        toast({ title: "Presence Verified", description: `Attendance logged for ${scannedStudent.name}.` })
        setScannedStudent(null)
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: attendanceRef.path,
          operation: 'create',
          requestResourceData: payload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  }

  // Scanner Logic - Integrated Verification Flow
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    // Only run scanner if open, session selected, and NO student details being reviewed
    if (isScannerOpen && selectedSessionId && db && !scannedStudent) {
      const initScanner = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop()); 
          setHasCameraPermission(true);

          const timer = setTimeout(() => {
            const element = document.getElementById("admin-attendance-scan-reader");
            if (!element) return;

            scanner = new Html5QrcodeScanner(
              "admin-attendance-scan-reader",
              { fps: 15, qrbox: { width: 250, height: 250 } },
              false
            );

            const onScanSuccess = (decodedText: string) => {
              try {
                const studentData = JSON.parse(decodedText)
                if (studentData.type !== 'techxera-student-id') return
                
                // Pause scanner and show verification UI
                setScannedStudent(studentData);
              } catch (err) {
                console.warn("QR parsing failed:", err)
              }
            }

            scanner.render(onScanSuccess, (err) => {})
            scannerRef.current = scanner
          }, 600);
        } catch (err) {
          console.error("Camera access denied:", err);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Camera permission is required to scan student identity codes."
          });
        }
      }

      initScanner();

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.warn("Scanner cleanup warning:", e))
          scannerRef.current = null
        }
      }
    }
  }, [isScannerOpen, selectedSessionId, db, scannedStudent, toast])

  const activeSession = sessions?.find(s => s.id === selectedSessionId)

  if (!mounted || isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Shield className="animate-pulse text-primary" size={64} /></div>
  if (!user || !isAuthorizedAdmin) return null;

  const showGlobalCreate = ['repository', 'notices', 'exams', 'attendance'].includes(activeTab);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <TechBackground />
      
      <header className="w-full px-4 md:px-12 pt-12 pb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 z-10">
        <div className="flex items-center gap-4 md:gap-6">
          <TechXeraLogo className="w-16 h-16 md:w-20 md:h-20 shadow-2xl shadow-primary/20" customUrl={dbSettings?.logoUrl} />
          <div className="space-y-1">
            <h1 className="text-3xl md:text-5xl font-headline font-bold tracking-tighter">Admin Central</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full w-fit">
              <Shield size={12} className="text-primary" />
              <p className="text-primary font-bold text-[8px] md:text-[10px] uppercase tracking-widest truncate max-w-[150px] md:max-w-none">ROOT: {user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link href="/" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full h-12 md:h-14 px-4 md:px-8 rounded-2xl font-bold bg-white/50 backdrop-blur-md shadow-sm border-2">
              <Home className="mr-2" size={18} /> Portal Home
            </Button>
          </Link>
          {showGlobalCreate && (
            <Button 
              onClick={handleGlobalCreate}
              className="h-12 md:h-14 px-4 md:px-8 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 flex-1 md:flex-none"
            >
              <Plus className="mr-2" size={18} /> 
              <span className="hidden xs:inline">
                {activeTab === 'repository' ? 'New Material' : 
                 activeTab === 'notices' ? 'New Notice' : 
                 activeTab === 'exams' ? 'New Exam' : 'New Session'}
              </span>
              <span className="xs:hidden">Create</span>
            </Button>
          )}
          <Button onClick={handleLogout} variant="ghost" size="icon" className="h-12 w-12 md:h-14 md:w-14 rounded-2xl font-bold text-destructive hover:bg-destructive/10">
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-12 pb-32 space-y-8 z-10 overflow-hidden">
        <Tabs defaultValue="results" className="w-full" onValueChange={setActiveTab}>
          <div className="bg-white/80 dark:bg-card/40 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-3 shadow-xl mb-8 md:mb-12 border border-white/20 overflow-x-auto scrollbar-hide">
            <TabsList className="bg-transparent flex flex-nowrap justify-start lg:justify-center h-auto gap-1 md:gap-2 border-none min-w-max">
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
                  className="data-[state=active]:bg-primary data-[state=active]:text-white h-10 md:h-12 px-4 md:px-8 rounded-[1.2rem] md:rounded-[1.5rem] font-bold uppercase text-[9px] md:text-[10px] tracking-widest gap-2 transition-all hover:bg-primary/5 border-none whitespace-nowrap"
                >
                  {tab.icon} {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Card className="glass border-none rounded-[2rem] md:rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden min-h-[500px] md:min-h-[600px]">
            <CardContent className="p-6 md:p-12">
              
              <TabsContent value="results" className="mt-0 space-y-8 md:space-y-12">
                <div className="space-y-6 md:space-y-8">
                  <div className="max-w-md">
                    <Select onValueChange={setSelectedExamCycle}>
                      <SelectTrigger className="h-12 md:h-14 rounded-2xl bg-background/50 border-2 font-bold text-base md:text-lg shadow-sm">
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

                  <div className="border rounded-[1.5rem] md:rounded-[2.5rem] overflow-x-auto bg-background/30 shadow-inner scrollbar-thin">
                    <Table className="min-w-[600px] md:min-w-full">
                      <TableHeader className="bg-muted/50 border-b">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Student</TableHead>
                          <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-center">Roll No</TableHead>
                          <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-right">Operations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExamCycle ? (
                          allStudents?.map(student => (
                            <TableRow key={student.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                              <TableCell className="px-6 md:px-10 py-4 md:py-6">
                                <div className="flex items-center gap-3 md:gap-4">
                                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs md:text-base">{student.firstName[0]}</div>
                                  <p className="font-bold text-sm md:text-base">{student.firstName} {student.lastName}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-black text-primary/60 text-[10px] md:text-xs">{student.studentId}</TableCell>
                              <TableCell className="px-6 md:px-10 text-right">
                                <Button 
                                  onClick={() => handleUpdateGradeClick(student)}
                                  variant="ghost" 
                                  className="h-8 md:h-10 px-2 md:px-4 rounded-xl font-bold text-[9px] md:text-xs gap-2"
                                >
                                  <Edit size={14} /> Update Grade
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-60 md:h-80 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-40">
                                <ClipboardList size={48} />
                                <p className="text-muted-foreground italic font-medium text-sm">Select an exam cycle above to manage grades</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="mt-0 space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-6 md:space-y-8">
                    <h3 className="text-xl md:text-2xl font-headline font-bold flex items-center gap-3">
                      <Clock className="text-primary" /> Class Registries
                    </h3>
                    <div className="space-y-4 md:space-y-6">
                      {sessionsLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                      ) : sessions?.length === 0 ? (
                        <div className="text-center py-20 md:py-24 border-4 border-dashed rounded-[2rem] md:rounded-[3rem] bg-muted/20">
                          <p className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">No active sessions found.</p>
                        </div>
                      ) : sessions?.map((session) => (
                        <Card 
                          key={session.id} 
                          onClick={() => setSelectedSessionId(session.id)}
                          className={`border-none cursor-pointer hover:shadow-xl transition-all ${selectedSessionId === session.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-background/50 hover:bg-background/80'} rounded-[1.5rem] md:rounded-[2.5rem] shadow-lg`}
                        >
                          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
                            <div className="space-y-1 md:space-y-2">
                              <h4 className="font-bold text-lg md:text-2xl tracking-tight">{session.className}</h4>
                              <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-sm text-muted-foreground font-bold">
                                <span className="flex items-center gap-1.5 md:gap-2"><Clock size={14} className="text-primary" /> {session.startTime}</span>
                                <span className="flex items-center gap-1.5 md:gap-2"><CalendarIcon size={14} className="text-primary" /> {session.date}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedSessionId(session.id)
                                  setIsScannerOpen(true)
                                }}
                                className="flex-1 md:flex-none h-10 md:h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold text-xs"
                              >
                                <Camera className="mr-2" size={16} /> Launch Scanner
                              </Button>
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSession(session.id)
                                }}
                                size="icon" 
                                variant="ghost" 
                                className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 md:space-y-8">
                    <Card className="bg-primary/5 border-none rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 min-h-[350px] md:min-h-[400px]">
                      <h4 className="text-lg md:text-xl font-headline font-bold mb-4 md:mb-6 flex items-center justify-between">
                        Presence Monitor
                        {selectedSessionId && <Badge className="bg-primary text-[10px]">{sessionAttendance?.length || 0} Present</Badge>}
                      </h4>
                      {selectedSessionId ? (
                        <div className="space-y-3 md:space-y-4 max-h-[350px] md:max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                          {sessionAttendance?.map(record => (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={record.id} 
                              className="flex items-center justify-between p-4 md:p-5 bg-white dark:bg-black/20 rounded-2xl border border-white/40 shadow-sm"
                            >
                              <div>
                                <p className="font-bold text-sm md:text-base">{record.studentName}</p>
                                <p className="text-[8px] md:text-[10px] text-primary font-black uppercase tracking-widest">{record.studentId}</p>
                              </div>
                              <p className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase">{format(new Date(record.timestamp), 'h:mm a')}</p>
                            </motion.div>
                          ))}
                          {sessionAttendance?.length === 0 && (
                            <div className="text-center py-16 md:py-20 text-muted-foreground italic text-sm">Waiting for scans...</div>
                          )}
                        </div>
                      ) : (
                        <div className="h-[250px] md:h-[300px] flex flex-col items-center justify-center text-center gap-4 md:gap-6 text-muted-foreground opacity-50">
                          <CheckCircle2 size={64} />
                          <p className="max-w-[180px] md:max-w-[200px] font-medium text-xs md:text-sm">Select a session to view live presence logs.</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="students" className="mt-0 space-y-8">
                <div className="border rounded-[1.5rem] md:rounded-[2.5rem] overflow-x-auto bg-background/30 shadow-inner scrollbar-thin">
                  <Table className="min-w-[700px] md:min-w-full">
                    <TableHeader className="bg-muted/50 border-b">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Student</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Roll No</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-center">Verification</TableHead>
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-right">Operations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStudents && allStudents.length > 0 ? (
                        allStudents.map(student => (
                          <TableRow key={student.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                            <TableCell className="px-6 md:px-10 py-4 md:py-6">
                              <p className="font-bold text-foreground text-sm md:text-base">{student.firstName} {student.lastName}</p>
                            </TableCell>
                            <TableCell className="py-4 md:py-6">
                              <p className="text-muted-foreground font-medium uppercase text-[10px] md:text-xs">{student.studentId}</p>
                            </TableCell>
                            <TableCell className="py-4 md:py-6 text-center">
                              <Badge className="bg-primary hover:bg-primary/90 text-white rounded-full px-3 md:px-4 py-0.5 md:py-1 lowercase font-bold text-[9px] md:text-[10px]">
                                {student.status || (student.isApproved ? 'approved' : 'pending')}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 md:px-10 text-right">
                              <div className="flex justify-end gap-1 md:gap-2">
                                {!student.isApproved ? (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 md:h-10 md:w-10 text-green-500 hover:bg-green-50 rounded-xl"
                                    onClick={() => handleApproveStudent(student.id)}
                                  >
                                    <CheckCircle size={18} />
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 md:h-10 md:w-10 text-orange-500 hover:bg-orange-50 rounded-xl"
                                    onClick={() => handleRejectStudent(student.id)}
                                  >
                                    <XCircle size={18} />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:bg-destructive/5 rounded-xl"
                                  onClick={() => handleDeleteStudent(student.id)}
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-60 md:h-80 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-40">
                              <Users size={48} />
                              <p className="text-muted-foreground italic font-medium text-sm">No registered students found.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="support" className="mt-0 space-y-6 md:space-y-8">
                <h3 className="text-xl md:text-2xl font-headline font-bold">Inquiry Management</h3>
                <div className="grid gap-4">
                  {supportInquiries?.map(inquiry => (
                    <Card key={inquiry.id} className="bg-background/50 rounded-xl md:rounded-2xl border-none p-4 md:p-6 flex flex-col md:flex-row justify-between gap-4 md:gap-6 border border-white/10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={cn(inquiry.status === 'pending' ? 'bg-orange-500' : 'bg-green-500')}>{inquiry.status}</Badge>
                          <h4 className="font-bold text-base md:text-lg truncate max-w-[200px] md:max-w-none">{inquiry.subject}</h4>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{inquiry.message}</p>
                        <p className="text-[8px] md:text-[10px] font-black text-primary/50 uppercase tracking-widest">FROM: {inquiry.name} ({inquiry.email})</p>
                      </div>
                      {inquiry.status === 'pending' && (
                        <Button variant="outline" size="sm" className="h-9 md:h-10 rounded-xl text-xs" onClick={() => handleResolveInquiry(inquiry.id)}>Mark Resolved</Button>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="exams" className="mt-0 space-y-6 md:space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl md:text-2xl font-headline font-bold">Academic Calendar</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {allExams?.map(exam => (
                    <Card key={exam.id} className="p-4 md:p-6 bg-background/50 rounded-xl md:rounded-2xl border border-white/10 space-y-3 md:space-y-4">
                      <div className="flex justify-between">
                        <h4 className="font-bold text-lg md:text-xl truncate">{exam.title}</h4>
                        <Badge variant="outline" className="text-[9px] uppercase">{exam.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] md:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><CalendarIcon size={14} /> {exam.examDate}</span>
                        <span className="flex items-center gap-1.5"><Layout size={14} /> {exam.semester}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notices" className="mt-0 space-y-6 md:space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl md:text-2xl font-headline font-bold">Official Bulletins</h3>
                </div>
                <div className="grid gap-4">
                  {allNotices?.map(notice => (
                    <Card key={notice.id} className="bg-background/50 rounded-xl md:rounded-2xl border-none p-4 md:p-6 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-base md:text-lg truncate max-w-[200px] md:max-w-none">{notice.title}</h4>
                        <Badge variant={notice.isUrgent ? 'destructive' : 'default'} className="text-[8px] md:text-[10px] uppercase">{notice.isUrgent ? 'URGENT' : 'NORMAL'}</Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{notice.description}</p>
                      <p className="text-[8px] md:text-[10px] font-black uppercase text-primary/40 mt-3 md:mt-4">{format(new Date(notice.publishDate), 'PPP')}</p>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="repository" className="mt-0 space-y-8">
                <div className="border rounded-[1.5rem] md:rounded-[2.5rem] overflow-x-auto bg-background/30 shadow-inner scrollbar-thin">
                  <Table className="min-w-[600px] md:min-w-full">
                    <TableHeader className="bg-muted/50 border-b">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Title</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Subject</TableHead>
                        <TableHead className="h-12 md:h-16 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest">Type/Section</TableHead>
                        <TableHead className="h-12 md:h-16 px-6 md:px-10 font-bold text-muted-foreground uppercase text-[9px] md:text-[10px] tracking-widest text-right">Operations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMaterials && allMaterials.length > 0 ? (
                        allMaterials.map(material => (
                          <TableRow key={material.id} className="border-b border-border/10 hover:bg-primary/[0.02] transition-colors">
                            <TableCell className="px-6 md:px-10 py-4 md:py-6">
                              <p className="font-bold text-foreground text-sm md:text-base truncate max-w-[150px] md:max-w-none">{material.title}</p>
                            </TableCell>
                            <TableCell className="py-4 md:py-6">
                              <p className="text-muted-foreground uppercase font-medium text-[10px] md:text-xs">{material.subject}</p>
                            </TableCell>
                            <TableCell className="py-4 md:py-6">
                              <Badge variant="outline" className="rounded-full bg-white dark:bg-black/20 text-[9px] md:text-xs px-2 md:px-4 border-border/40 font-medium whitespace-nowrap">
                                {material.materialType || 'Notes'}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 md:px-10 text-right">
                              <div className="flex justify-end gap-1 md:gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 md:h-10 md:w-10 text-primary hover:bg-primary/5 rounded-xl"
                                  onClick={() => handleEditMaterial(material)}
                                >
                                  <Edit size={18} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 md:h-10 md:w-10 text-destructive hover:bg-destructive/5 rounded-xl"
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
                          <TableCell colSpan={4} className="h-60 md:h-80 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-40">
                              <BookOpen size={48} />
                              <p className="text-muted-foreground italic font-medium text-sm">No materials found.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="branding" className="mt-0">
                <form onSubmit={handleUpdateBranding} className="max-w-4xl space-y-8 md:space-y-10">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Portal Name</Label>
                      <Input 
                        value={brandingForm.siteName} 
                        onChange={e => setBrandingForm({...brandingForm, siteName: e.target.value})}
                        placeholder="e.g. TechXera"
                        className="h-12 md:h-14 rounded-2xl bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary text-base md:text-lg font-bold px-4 md:px-6 shadow-sm" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <ImageIcon size={14} /> Website Logo URL
                        </Label>
                        <Input 
                          value={brandingForm.logoUrl} 
                          onChange={e => setBrandingForm({...brandingForm, logoUrl: e.target.value})}
                          placeholder="https://..."
                          className="h-12 md:h-14 rounded-2xl bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary text-xs md:text-sm font-medium px-4 md:px-6 shadow-sm" 
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Globe size={14} /> Favicon URL
                        </Label>
                        <Input 
                          value={brandingForm.faviconUrl} 
                          onChange={e => setBrandingForm({...brandingForm, faviconUrl: e.target.value})}
                          placeholder="https://..."
                          className="h-12 md:h-14 rounded-2xl bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary text-xs md:text-sm font-medium px-4 md:px-6 shadow-sm" 
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hero Description</Label>
                      <Textarea 
                        value={brandingForm.heroDescription} 
                        onChange={e => setBrandingForm({...brandingForm, heroDescription: e.target.value})}
                        placeholder="A high-performance student portal..."
                        className="min-h-[150px] md:min-h-[180px] rounded-[1.5rem] md:rounded-3xl bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary p-4 md:p-6 text-xs md:text-sm leading-relaxed shadow-sm" 
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full md:w-auto h-12 md:h-14 px-8 md:px-12 bg-primary text-white hover:bg-primary/90 rounded-2xl text-base md:text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    Update Branding <Send className="ml-3" size={18} />
                  </Button>
                </form>
              </TabsContent>

            </CardContent>
          </Card>
        </Tabs>
      </main>

      <Dialog open={isScannerOpen} onOpenChange={(open) => {
        setIsScannerOpen(open);
        if (!open) setScannedStudent(null);
      }}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 overflow-hidden">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl md:text-2xl font-headline font-bold mb-1 md:mb-2 truncate">
              {scannedStudent ? 'Verify Student Details' : `Scanner: ${activeSession?.className}`}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium text-center text-xs md:text-sm">
              {scannedStudent ? 'Review student credentials before logging attendance.' : 'Align student identity QR within the frame'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 md:gap-8 py-4 md:py-6">
            {!scannedStudent ? (
              <>
                {hasCameraPermission === false && (
                  <Alert variant="destructive" className="rounded-xl md:rounded-2xl border-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Camera Required</AlertTitle>
                    <AlertDescription className="text-[10px] md:text-sm">
                      Access denied. Please update browser settings.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="relative w-full">
                  <div id="admin-attendance-scan-reader" className="w-full rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-4 border-primary/20 bg-muted/20 min-h-[250px] md:min-h-[300px]" />
                  {hasCameraPermission === null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm rounded-[1.5rem] md:rounded-[2.5rem] p-6 text-center">
                      <Camera className="animate-pulse text-primary mb-4" size={48} />
                      <p className="font-bold text-[10px] md:text-sm">Requesting Camera Access...</p>
                    </div>
                  )}
                </div>

                <div className="p-4 md:p-5 bg-primary/5 rounded-xl md:rounded-2xl w-full flex items-center gap-3 md:gap-4 text-[9px] md:text-xs text-primary border border-primary/20">
                  <ShieldCheck size={20} className="shrink-0" />
                  <p className="font-medium leading-relaxed">Secure Admin Hub. Instant verification enabled.</p>
                </div>
                <Button onClick={() => setIsScannerOpen(false)} variant="outline" className="w-full h-10 md:h-12 rounded-xl font-bold text-xs">
                  Terminate Scanner
                </Button>
              </>
            ) : (
              <div className="w-full space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Users size={48} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-headline font-bold text-foreground">{scannedStudent.name}</h3>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">Campus Identity Token</p>
                      <p className="text-muted-foreground font-bold text-xs">ROLL NO: {scannedStudent.studentId}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/30 rounded-[2rem] border border-border/40 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Target Session</span>
                    <span className="text-foreground font-black">{activeSession?.className}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Identity Status</span>
                    <Badge className="bg-green-500/10 text-green-600 border-none font-bold">Verified Token</Badge>
                  </div>
                </div>

                <div className="grid gap-4">
                  <Button onClick={handleConfirmAttendance} className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                    <CheckCircle2 className="mr-2" /> Confirm Attendance
                  </Button>
                  <Button onClick={() => setScannedStudent(null)} variant="ghost" className="w-full h-12 rounded-xl font-bold text-muted-foreground">
                    Cancel & Rescan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">Initialize Class</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Module Name</Label>
              <Input required placeholder="e.g. Advanced AI" value={newSession.className} onChange={e => setNewSession({...newSession, className: e.target.value})} className="h-10 md:h-12 rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Date</Label>
                <Input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="h-10 md:h-12 rounded-xl text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Start Time</Label>
                <Input type="time" required value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} className="h-10 md:h-12 rounded-xl text-xs" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-10 md:h-12 rounded-xl font-bold text-base md:text-lg">Initialize Session</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-headline font-bold">
              {editingMaterial ? 'Update Material' : 'New Study Material'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMaterial} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input required placeholder="e.g. Intro to Neural Networks" value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} className="h-10 md:h-12 rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Subject</Label>
                <Input required placeholder="e.g. AI" value={materialForm.subject} onChange={e => setMaterialForm({...materialForm, subject: e.target.value})} className="h-10 md:h-12 rounded-xl text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Select value={materialForm.materialType} onValueChange={val => setMaterialForm({...materialForm, materialType: val})}>
                  <SelectTrigger className="h-10 md:h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Notes">Notes</SelectItem>
                    <SelectItem value="Assignment">Assignment</SelectItem>
                    <SelectItem value="Syllabus">Syllabus</SelectItem>
                    <SelectItem value="Question Bank">Question Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">File URL</Label>
              <Input required placeholder="https://..." value={materialForm.fileUrl} onChange={e => setMaterialForm({...materialForm, fileUrl: e.target.value})} className="h-10 md:h-12 rounded-xl text-xs" />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-10 md:h-12 rounded-xl font-bold text-base md:text-lg">
                {editingMaterial ? 'Update' : 'Publish'} Material
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">Publish Notice</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateNotice} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Title</Label>
              <Input required placeholder="e.g. Assessment Schedule" value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} className="h-10 md:h-12 rounded-xl text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Content</Label>
              <Textarea required placeholder="Details..." value={noticeForm.description} onChange={e => setNoticeForm({...noticeForm, description: e.target.value})} className="min-h-[100px] md:min-h-[120px] rounded-xl text-sm" />
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 bg-muted/20 rounded-xl md:rounded-2xl">
              <Label className="font-bold text-xs md:text-sm">Urgent Priority</Label>
              <Switch checked={noticeForm.isUrgent} onCheckedChange={val => setNoticeForm({...noticeForm, isUrgent: val})} />
            </div>
            <DialogFooter><Button type="submit" className="w-full h-10 md:h-12 rounded-xl font-bold">Publish</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-xl md:text-2xl font-headline font-bold">Schedule Exam</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateExam} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Exam Title</Label>
              <Input required placeholder="e.g. Mid-Term" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className="h-10 md:h-12 rounded-xl text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Semester</Label>
                <Select value={examForm.semester} onValueChange={val => setExamForm({...examForm, semester: val})}>
                  <SelectTrigger className="h-10 md:h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Semester 1">Semester 1</SelectItem>
                    <SelectItem value="Semester 2">Semester 2</SelectItem>
                    <SelectItem value="Semester 3">Semester 3</SelectItem>
                    <SelectItem value="Semester 4">Semester 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Date</Label>
                <Input type="date" required value={examForm.examDate} onChange={e => setExamForm({...examForm, examDate: e.target.value})} className="h-10 md:h-12 rounded-xl text-xs" />
              </div>
            </div>
            <DialogFooter><Button type="submit" className="w-full h-10 md:h-12 rounded-xl font-bold">Create Schedule</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="w-[95vw] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-headline font-bold">Enter Academic Score</DialogTitle>
            <DialogDescription className="text-[10px] md:text-sm">
              Record evaluation for {selectedStudentForGrade?.firstName} {selectedStudentForGrade?.lastName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveGrade} className="space-y-4 md:space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Subject / Paper</Label>
              <Input 
                required 
                placeholder="e.g. Physics" 
                value={gradeForm.subject} 
                onChange={e => setGradeForm({...gradeForm, subject: e.target.value})}
                className="h-10 md:h-12 rounded-xl text-sm" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Marks (%)</Label>
                <Input 
                  required 
                  type="number" 
                  max="100" 
                  min="0"
                  placeholder="85" 
                  value={gradeForm.marks} 
                  onChange={e => {
                    const val = e.target.value;
                    const marksVal = parseInt(val);
                    const grade = isNaN(marksVal) ? '' : calculateGrade(marksVal);
                    setGradeForm({...gradeForm, marks: val, grade: grade});
                  }}
                  className="h-10 md:h-12 rounded-xl text-sm" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Letter Grade</Label>
                <Select value={gradeForm.grade} onValueChange={val => setGradeForm({...gradeForm, grade: val})}>
                  <SelectTrigger className="h-10 md:h-12 rounded-xl text-sm">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'].map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="submit" className="w-full h-10 md:h-12 rounded-xl font-bold">Save Result</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
