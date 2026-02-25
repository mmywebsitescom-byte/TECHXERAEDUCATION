
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
import { Plus, Shield, List, GraduationCap, Megaphone, Database, Loader2, UserCheck, Trash2 } from 'lucide-react'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection, errorEmitter, FirestorePermissionError } from '@/firebase'
import { doc, setDoc, collection, deleteDoc, query, orderBy } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('results')
  const [isSeeding, setIsSeeding] = useState(false)
  const [isGranting, setIsGranting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Form State
  const [newNotice, setNewNotice] = useState({ title: '', description: '', isUrgent: false })
  const [newMaterial, setNewMaterial] = useState({ title: '', subject: '', semester: '', fileUrl: '', materialType: 'Notes' })

  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const adminRef = useMemoFirebase(() => (user && db ? doc(db, 'roles_admin', user.uid) : null), [user, db])
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRef)
  const isAdmin = !!adminDoc

  const noticesQuery = useMemoFirebase(() => db ? query(collection(db, 'notices'), orderBy('publishDate', 'desc')) : null, [db])
  const materialsQuery = useMemoFirebase(() => db ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db])
  
  const { data: notices } = useCollection(noticesQuery)
  const { data: materials } = useCollection(materialsQuery)

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
    setIsGranting(true)
    const adminDocRef = doc(db, 'roles_admin', user.uid);
    const data = {
      email: user.email,
      grantedAt: new Date().toISOString(),
      uid: user.uid
    };

    setDoc(adminDocRef, data)
      .then(() => {
        toast({
          title: "Admin Access Granted",
          description: "Updating your administrative status...",
        })
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: adminDocRef.path,
          operation: 'create',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsGranting(false)
      })
  }

  const handleDelete = (coll: string, id: string) => {
    if (!db) return
    const docRef = doc(db, coll, id);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Deleted", description: "The record has been removed." })
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
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
        toast({ title: "Notice Created", description: "Your notice is now live on the board." })
        setNewNotice({ title: '', description: '', isUrgent: false })
        setIsDialogOpen(false)
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'create', requestResourceData: data }))
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
        toast({ title: "Resource Added", description: "The material is now available in the repository." })
        setNewMaterial({ title: '', subject: '', semester: '', fileUrl: '', materialType: 'Notes' })
        setIsDialogOpen(false)
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'create', requestResourceData: data }))
      })
      .finally(() => setIsCreating(false))
  }

  const seedDatabase = () => {
    if (!db) return
    setIsSeeding(true)
    
    const noticesData = [
      { title: "Final Examination Schedule Released", description: "The final exam schedule is now available for all departments.", publishDate: new Date().toISOString(), isUrgent: true },
      { title: "Campus Tech Symposium", description: "Join us for the annual Symposium featuring guest speakers from top tech firms.", publishDate: new Date().toISOString(), isUrgent: false }
    ]
    noticesData.forEach(n => {
      const docRef = doc(collection(db, 'notices'));
      const data = { ...n, id: docRef.id };
      setDoc(docRef, data).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'create', requestResourceData: data }));
      });
    });

    const materialsData = [
      { title: "Advanced Algorithms Notes", subject: "Computer Science", semester: "5th Sem", fileUrl: "https://example.com/algorithms.pdf", materialType: "Notes", uploadDate: new Date().toISOString() },
      { title: "Data Structures - 2023 Paper", subject: "Computer Science", semester: "3rd Sem", fileUrl: "https://example.com/ds-paper.pdf", materialType: "Previous Question", uploadDate: new Date().toISOString() }
    ]
    materialsData.forEach(m => {
      const docRef = doc(collection(db, 'studyMaterials'));
      const data = { ...m, id: docRef.id };
      setDoc(docRef, data).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'create', requestResourceData: data }));
      });
    });

    toast({
      title: "Seeding Started",
      description: "Initial campus data is being added to the database.",
    })
    setIsSeeding(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-32 md:pt-40">
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
              <Button 
                onClick={handleGrantAdmin} 
                disabled={isGranting}
                variant="secondary"
                className="h-12 px-6 shadow-lg shadow-secondary/20 bg-secondary text-white hover:bg-secondary/90"
              >
                {isGranting ? <Loader2 className="animate-spin mr-2" /> : <UserCheck className="mr-2" size={18} />}
                Grant Admin Access
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={seedDatabase} 
              disabled={isSeeding || !isAdmin}
              className="h-12 border-primary text-primary hover:bg-primary/5"
            >
              {isSeeding ? <Loader2 className="animate-spin mr-2" /> : <Database className="mr-2" size={18} />}
              Seed Initial Data
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!isAdmin || activeTab === 'results'} className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white">
                  <Plus className="mr-2" size={20} /> Create New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New {activeTab === 'notices' ? 'Notice' : 'Resource'}</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to publish new content to the student portal.
                  </DialogDescription>
                </DialogHeader>
                
                {activeTab === 'notices' ? (
                  <form onSubmit={handleCreateNotice} className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Notice Title</Label>
                      <Input 
                        id="title" 
                        required 
                        value={newNotice.title} 
                        onChange={e => setNewNotice({ ...newNotice, title: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Content</Label>
                      <Textarea 
                        id="description" 
                        required 
                        className="min-h-[120px]" 
                        value={newNotice.description} 
                        onChange={e => setNewNotice({ ...newNotice, description: e.target.value })} 
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="urgent" 
                        checked={newNotice.isUrgent} 
                        onCheckedChange={checked => setNewNotice({ ...newNotice, isUrgent: checked })} 
                      />
                      <Label htmlFor="urgent">Mark as Urgent</Label>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isCreating} className="w-full">
                        {isCreating ? <Loader2 className="animate-spin mr-2" /> : null}
                        Publish Notice
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <form onSubmit={handleCreateMaterial} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="m-title">Resource Title</Label>
                      <Input 
                        id="m-title" 
                        required 
                        value={newMaterial.title} 
                        onChange={e => setNewMaterial({ ...newMaterial, title: e.target.value })} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                          id="subject" 
                          required 
                          value={newMaterial.subject} 
                          onChange={e => setNewMaterial({ ...newMaterial, subject: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Input 
                          id="semester" 
                          required 
                          placeholder="e.g. 5th Sem" 
                          value={newMaterial.semester} 
                          onChange={e => setNewMaterial({ ...newMaterial, semester: e.target.value })} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fileUrl">File URL / Download Link</Label>
                      <Input 
                        id="fileUrl" 
                        required 
                        type="url" 
                        value={newMaterial.fileUrl} 
                        onChange={e => setNewMaterial({ ...newMaterial, fileUrl: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Material Type</Label>
                      <select 
                        id="type"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newMaterial.materialType}
                        onChange={e => setNewMaterial({ ...newMaterial, materialType: e.target.value })}
                      >
                        <option>Notes</option>
                        <option>Previous Question</option>
                        <option>Book</option>
                        <option>Video Lecture</option>
                      </select>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="submit" disabled={isCreating} className="w-full">
                        {isCreating ? <Loader2 className="animate-spin mr-2" /> : null}
                        Upload Resource
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!isAdmin ? (
          <Card className="p-12 text-center border-dashed border-2 bg-white/50 backdrop-blur-sm">
            <div className="max-w-md mx-auto space-y-4">
              <Shield size={64} className="mx-auto text-muted-foreground opacity-20" />
              <h2 className="text-2xl font-headline font-bold">Restricted Area</h2>
              <p className="text-muted-foreground">
                Please grant yourself administrative privileges using the button above to manage the campus records.
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

            <Card className="shadow-xl border-border/50 overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-white/50 border-b border-border/40 p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl font-headline font-bold capitalize">{activeTab} Management</CardTitle>
                    <CardDescription>View and edit existing campus {activeTab}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="py-4 px-8 font-bold">Identifier</TableHead>
                      <TableHead className="py-4 font-bold">Title / Subject</TableHead>
                      <TableHead className="py-4 font-bold">Details</TableHead>
                      <TableHead className="py-4 font-bold">Date</TableHead>
                      <TableHead className="py-4 text-right px-8 font-bold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTab === 'notices' && notices?.map((notice) => (
                      <TableRow key={notice.id}>
                        <TableCell className="px-8 font-medium">{notice.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-bold">{notice.title}</TableCell>
                        <TableCell>{notice.isUrgent ? 'Urgent' : 'Standard'}</TableCell>
                        <TableCell>{format(new Date(notice.publishDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right px-8">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('notices', notice.id)} className="text-destructive hover:bg-destructive/10"><Trash2 size={18} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeTab === 'resources' && materials?.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="px-8 font-medium">{material.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-bold">{material.title}</TableCell>
                        <TableCell>{material.subject} • {material.materialType}</TableCell>
                        <TableCell>{format(new Date(material.uploadDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right px-8">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete('studyMaterials', material.id)} className="text-destructive hover:bg-destructive/10"><Trash2 size={18} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {activeTab === 'results' && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          Manage student results by viewing individual student profiles in the student management section (Coming Soon).
                        </TableCell>
                      </TableRow>
                    )}
                    {((activeTab === 'notices' && (!notices || notices.length === 0)) || (activeTab === 'resources' && (!materials || materials.length === 0))) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No data available. Use "Seed Initial Data" to populate mock records.
                        </TableCell>
                      </TableRow>
                    )}
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
