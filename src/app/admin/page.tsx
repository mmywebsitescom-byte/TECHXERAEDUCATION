
"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Shield, List, GraduationCap, Megaphone, Database, Loader2 } from 'lucide-react'
import { useFirestore } from '@/firebase'
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('results')
  const [isSeeding, setIsSeeding] = useState(false)
  const db = useFirestore()
  const { toast } = useToast()

  const seedDatabase = async () => {
    setIsSeeding(true)
    try {
      // Seed Notices
      const notices = [
        { title: "Final Examination Schedule Released", description: "The final exam schedule is now available.", publishDate: new Date().toISOString(), isUrgent: true },
        { title: "Campus Tech Symposium", description: "Join us for the annual Symposium.", publishDate: new Date().toISOString(), isUrgent: false }
      ]
      for (const n of notices) {
        await addDoc(collection(db, 'notices'), { ...n, id: crypto.randomUUID() })
      }

      // Seed Study Materials
      const materials = [
        { title: "Advanced Algorithms Notes", subject: "Computer Science", semester: "5th Sem", fileUrl: "https://example.com/file.pdf", materialType: "Notes", uploadDate: new Date().toISOString() },
        { title: "Data Structures - Previous Year", subject: "Computer Science", semester: "3rd Sem", fileUrl: "https://example.com/file.pdf", materialType: "Question Paper", uploadDate: new Date().toISOString() }
      ]
      for (const m of materials) {
        await addDoc(collection(db, 'studyMaterials'), { ...m, id: crypto.randomUUID() })
      }

      toast({
        title: "Database Seeded",
        description: "Initial campus data has been successfully added to Firestore.",
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
    <div className="min-h-screen bg-background">
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
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={seedDatabase} 
              disabled={isSeeding}
              className="h-12 border-primary text-primary"
            >
              {isSeeding ? <Loader2 className="animate-spin mr-2" /> : <Database className="mr-2" size={18} />}
              Seed Database
            </Button>
            <Button className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={20} /> Create New Entry
            </Button>
          </div>
        </div>

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
                      Switch tabs to manage data. Use "Seed Database" to add mock entries.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs>
      </main>
    </div>
  )
}
