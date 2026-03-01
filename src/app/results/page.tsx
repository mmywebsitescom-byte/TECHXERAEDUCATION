
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ClipboardList, Search, Loader2, Download, AlertCircle, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore } from '@/firebase'
import { collection, query, where, getDocs, orderBy, DocumentData, limit } from 'firebase/firestore'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export default function ResultsLookupPage() {
  const [loading, setLoading] = useState(false)
  const [studentIdInput, setStudentIdInput] = useState('')
  const [dobInput, setDobInput] = useState('')
  const [studentData, setStudentData] = useState<DocumentData | null>(null)
  const [results, setResults] = useState<DocumentData[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const db = useFirestore()
  const { toast } = useToast()

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db) return
    
    const trimmedId = studentIdInput.trim()
    const trimmedDob = dobInput.trim()

    if (!trimmedId || !trimmedDob) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both Student ID and Date of Birth."
      })
      return
    }

    setLoading(true)
    setError(null)
    setStudentData(null)
    setResults([])

    try {
      // 1. Find the student by official Roll Number (studentId)
      // The security rules require a limit of 1 for public student lookups
      const studentsRef = collection(db, 'students')
      const q = query(studentsRef, where('studentId', '==', trimmedId), limit(1))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error("No student record found with this ID. Please verify your Roll Number.")
      }

      const studentDoc = querySnapshot.docs[0]
      const data = studentDoc.data()

      // 2. Verify Date of Birth (format stored: YYYY-MM-DD)
      if (data.dateOfBirth !== trimmedDob) {
        throw new Error("Student ID and Date of Birth do not match our records.")
      }

      // 3. Fetch Academic Results from the student's sub-collection
      const resultsRef = collection(db, 'students', studentDoc.id, 'results')
      const resultsSnapshot = await getDocs(resultsRef)
      
      let fetchedResults = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Sort manually in memory to ensure reliability and avoid index issues
      fetchedResults.sort((a, b) => {
        const dateA = a.examDate ? new Date(a.examDate).getTime() : 0
        const dateB = b.examDate ? new Date(b.examDate).getTime() : 0
        return dateB - dateA
      })

      setStudentData(data)
      setResults(fetchedResults)
      
      toast({
        title: "Record Found",
        description: `Academic transcript retrieved for ${data.firstName} ${data.lastName}.`
      })
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during the lookup.")
      toast({
        variant: "destructive",
        title: "Lookup Failed",
        description: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col items-center justify-center pt-48">
        <AnimatePresence mode="wait">
          {!studentData ? (
            <motion.div 
              key="lookup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg"
            >
              <Card className="glass border-border/40 shadow-2xl overflow-hidden">
                <CardHeader className="text-center pb-8 border-b border-border/40 bg-primary/5">
                  <div className="mx-auto w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                    <ClipboardList size={32} />
                  </div>
                  <CardTitle className="text-3xl font-headline font-bold">Check Results</CardTitle>
                  <CardDescription>Enter your credentials to view your mark sheet</CardDescription>
                </CardHeader>
                <form onSubmit={handleLookup}>
                  <CardContent className="space-y-6 pt-8">
                    {error && (
                      <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3 text-sm font-medium border border-destructive/20">
                        <AlertCircle size={18} /> {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="id">Student ID (Roll Number)</Label>
                      <Input 
                        id="id" 
                        placeholder="e.g. TX-2025-001" 
                        className="h-12 bg-background/50 text-lg font-medium" 
                        required 
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input 
                        id="dob" 
                        type="date" 
                        className="h-12 bg-background/50" 
                        required 
                        value={dobInput}
                        onChange={(e) => setDobInput(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button disabled={loading} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                      {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" size={20} />}
                      {loading ? 'Searching Records...' : 'View Mark Sheet'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="transcript"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full"
            >
              <Card className="glass border-border/40 shadow-2xl overflow-hidden max-w-4xl mx-auto">
                <CardHeader className="bg-primary text-white p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <CardTitle className="text-3xl font-headline font-bold">Academic Transcript</CardTitle>
                      <CardDescription className="text-primary-foreground/80 text-lg font-medium">
                        Official Academic Record • TechXera Campus
                      </CardDescription>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 font-bold h-12 px-6 rounded-xl">
                        <Download className="mr-2" size={18} /> PDF
                      </Button>
                      <Button variant="ghost" className="text-white hover:bg-white/10 font-bold h-12 px-6 rounded-xl" onClick={() => setStudentData(null)}>
                        <RefreshCw className="mr-2" size={18} /> Reset
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-border/40 bg-muted/5">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Student Name</p>
                      <p className="text-xl font-bold">{studentData.firstName} {studentData.lastName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Student ID</p>
                      <p className="text-xl font-bold text-primary">{studentData.studentId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Current Status</p>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <span className="font-bold text-green-600 uppercase text-sm">Enrolled</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 border-b border-border/40">
                        <tr>
                          <th className="p-5 px-8 font-bold text-xs uppercase tracking-widest text-muted-foreground">Subject</th>
                          <th className="p-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Exam Session</th>
                          <th className="p-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Semester</th>
                          <th className="p-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Marks</th>
                          <th className="p-5 px-8 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.length > 0 ? (
                          results.map((res, i) => (
                            <motion.tr 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              key={res.id} 
                              className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                            >
                              <td className="p-5 px-8 font-bold">{res.subject}</td>
                              <td className="p-5 text-sm font-bold text-muted-foreground">{res.examTitle || 'General Assessment'}</td>
                              <td className="p-5 text-sm font-medium">{res.semester}</td>
                              <td className="p-5 text-sm">{res.marks}%</td>
                              <td className="p-5 px-8 text-right font-black text-2xl text-primary">{res.grade}</td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} className="p-20 text-center text-muted-foreground font-medium italic">No results have been recorded for this student yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {results.length > 0 && (
                    <div className="p-10 bg-primary/5 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-border/40">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Subjects Evaluated</p>
                        <p className="text-3xl font-headline font-bold">{results.length}</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1 tracking-widest">Final Status</p>
                        <p className="text-2xl font-bold text-green-600 uppercase tracking-tight">Academic Record Verified</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto leading-relaxed">
                  Disclaimer: This is a digitally generated transcript for reference only. For official academic applications, please request a signed and stamped copy from the campus registrar.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
