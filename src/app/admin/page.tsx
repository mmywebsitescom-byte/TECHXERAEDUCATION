
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Shield, List, GraduationCap, Megaphone, Database, Loader2, UserCheck } from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase'
import { doc, setDoc, collection, addDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('results')
  const [isSeeding, setIsSeeding] = useState(false)
  const [isGranting, setIsGranting] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const adminRef = useMemoFirebase(() => (user && db ? doc(db, 'roles_admin', user.uid) : null), [user, db])
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRef)
  const isAdmin = !!adminDoc

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login?redirect=/admin')
    }
  }, [user, isUserLoading, router, mounted])

  if (!mounted || isUserLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleGrantAdmin = async () => {
    if (!user || !db) return
    setIsGranting(true)
    try {
      await setDoc(doc(db, 'roles_admin', user.uid), {
        email: user.email,
        grantedAt: new Date().toISOString(),
        uid: user.uid
      })
      toast({
        title: "Admin Rights Granted",
        description: "You now have administrative access to the campus portal.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.message,
      })
    } finally {
      setIsGranting(false)
    }
  }

  const seedDatabase = async () => {
    if (!db) return
    setIsSeeding(true)
    try {
      // Seed Notices
      const notices = [
        { title: "Final Examination Schedule Released", description: "The final exam schedule is now available for all departments.", publishDate: new Date().toISOString(), isUrgent: true },
        { title: "Campus Tech Symposium", description: "Join us for the annual Symposium featuring guest speakers from top tech firms.", publishDate: new Date().toISOString(), isUrgent: false }
      ]
      for (const n of notices) {
        await addDoc(collection(db, 'notices'), { ...n, id: crypto.randomUUID() })
      }

      // Seed Study Materials
      const materials = [
        { title: "Advanced Algorithms Notes", subject: "Computer Science", semester: "5th Sem", fileUrl: "https://example.com/algorithms.pdf", materialType: "Notes", uploadDate: new Date().toISOString() },
        { title: "Data Structures - 2023 Paper", subject: "Computer Science", semester: "3rd Sem", fileUrl: "https://example.com/ds-paper.pdf", materialType: "Previous Question", uploadDate: new Date().toISOString() }
      ]
      for (const m of materials) {
        await addDoc(collection(db, 'studyMaterials'), { ...m, id: crypto.randomUUID() })
      }

      // Seed Student Profile (self)
      if (user) {
        await setDoc(doc(db, 'students', user.uid), {
          id: user.uid,
          studentId: "TX-2025-001",
          firstName: user.displayName?.split(' ')[0] || "Alex",
          lastName: user.displayName?.split(' ')[1] || "Johnson",
          email: user.email,
          enrollmentDate: new Date().toISOString(),
          currentSemester: "4th Semester",
          dateOfBirth: "2002-05-15"
        })

        // Seed Results for current user
        const results = [
          { subject: "Data Structures", semester: "Sem 3", marks: 95, grade: "A+", examDate: new Date().toISOString(), studentId: user.uid },
          { subject: "Operating Systems", semester: "Sem 3", marks: 88, grade: "A", examDate: new Date().toISOString(), studentId: user.uid }
        ]
        for (const r of results) {
          await addDoc(collection(db, 'students', user.uid, 'results'), { ...r, id: crypto.randomUUID() })
        }
      }

      toast({
        title: "Database Seeded",
        description: "Initial campus data and student profile have been successfully added.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: error.message,
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-bold">Admin Console</h1>
              <p className="text-muted-foreground">Manage campus content and student academic data</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {!isAdmin && (
              <Button 
                onClick={handleGrantAdmin} 
                disabled={isGranting}
                variant="secondary"
                className="h-12 px-6 shadow-lg shadow-secondary/20"
              >
                {isGranting ? <Loader2 className="animate-spin mr-2" /> : <UserCheck className="mr-2" size={18} />}
                Make Me Admin
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={seedDatabase} 
              disabled={isSeeding || !isAdmin}
              className="h-12 border-primary text-primary"
            >
              {isSeeding ? <Loader2 className="animate-spin mr-2" /> : <Database className="mr-2" size={18} />}
              Seed Database
            </Button>
            <Button disabled={!isAdmin} className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={20} /> Create New Entry
            </Button>
          </div>
        </div>

        {!isAdmin ? (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="max-w-md mx-auto space-y-4">
              <Shield size={64} className="mx-auto text-muted-foreground opacity-20" />
              <h2 className="text-2xl font-headline font-bold">Access Restricted</h2>
              <p className="text-muted-foreground">
                You currently do not have administrative privileges. Use the "Make Me Admin" button above to grant yourself access for development purposes.
              </p>
            </div>
          </Card>
        ) : (
          <Tabs defaultValue="results" className="space-y-8" onValueChange={setActiveTab}>
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-border/50 h-auto grid grid-cols-3 md:w-[600px]">
              <TabsTrigger value="results" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
                <GraduationCap className="mr-2" size={18} /> Results
              </TabsTrigger>
              <TabsTrigger value="notices" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Megaphone className="mr-2" size={18} /> Notices
              </TabsTrigger>
              <TabsTrigger value="resources" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
                <List className="mr-2" size={18} /> Resources
              </TabsTrigger>
            </TabsList>

            <Card className="shadow-xl border-border/50 overflow-hidden">
              <CardHeader className="bg-white border-b border-border/40 p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl font-headline capitalize">{activeTab} Management</CardTitle>
                    <CardDescription>View and edit existing {activeTab} records</CardDescription>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Input placeholder={`Search ${activeTab}...`} className="bg-muted/30 border-none h-11 pr-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="py-4 px-8 font-bold">ID</TableHead>
                      <TableHead className="py-4 font-bold">Title / Name</TableHead>
                      <TableHead className="py-4 font-bold">Category</TableHead>
                      <TableHead className="py-4 font-bold">Date Modified</TableHead>
                      <TableHead className="py-4 text-right px-8 font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No data available. Use "Seed Database" to add mock entries for testing.
                      </TableCell>
                    </TableRow>
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
