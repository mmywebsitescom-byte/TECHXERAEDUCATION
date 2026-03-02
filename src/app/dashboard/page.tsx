
"use client"

import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { GraduationCap, Award, BookOpen, Clock, TrendingUp, Loader2, Sparkles, AlertCircle, ShieldAlert, ShieldCheck, CreditCard, Copy, Check, Camera, LogOut, QrCode } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, useAuth } from '@/firebase'
import { doc, updateDoc, collection, query, where } from 'firebase/firestore'
import { updateProfile, signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import SplitText from '@/components/SplitText'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" } }
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)
  const [newAvatarUrl, setNewAvatarUrl] = useState('')
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)

  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(studentRef)

  const attendanceQuery = useMemoFirebase(() => (user && db ? query(collection(db, 'attendance'), where('studentUid', '==', user.uid)) : null), [user, db])
  const { data: attendanceData } = useCollection(attendanceQuery)

  const resultsQuery = useMemoFirebase(() => (user && profile?.isApproved && db ? collection(db, 'students', user.uid, 'results') : null), [user, profile, db])
  const { data: results, isLoading: isResultsLoading } = useCollection(resultsQuery)

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router, mounted])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Roll Number copied to clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !newAvatarUrl.trim()) return

    setIsUpdatingAvatar(true)
    try {
      await updateProfile(user, { photoURL: newAvatarUrl.trim() })
      const studentDocRef = doc(db, 'students', user.uid)
      await updateDoc(studentDocRef, { photoURL: newAvatarUrl.trim() })

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been changed successfully.",
      })
      setIsAvatarDialogOpen(false)
      setNewAvatarUrl('')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update profile picture.",
      })
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (!user) return null

  if (!profile && !isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 pt-32">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="max-w-xl w-full text-center p-12 glass border-none rounded-[3rem] shadow-2xl">
              <div className="mx-auto w-24 h-24 bg-destructive/10 text-destructive rounded-[2rem] flex items-center justify-center mb-8">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-4xl font-headline font-bold mb-4">Access Restricted</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Your student record could not be found or has been removed from the system. Access to academic records requires an active profile.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={handleLogout} variant="destructive" className="rounded-xl h-12 px-8 font-bold">
                  <LogOut size={18} className="mr-2" /> Log Out
                </Button>
                <Button onClick={() => router.push('/')} variant="outline" className="rounded-xl h-12 px-8 font-bold">
                  Home
                </Button>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    )
  }

  if (profile && !profile.isApproved) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 pt-32">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="max-w-xl w-full text-center p-12 glass border-none rounded-[3rem] shadow-2xl">
              <div className="mx-auto w-24 h-24 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mb-8">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-4xl font-headline font-bold mb-4">Account Pending Approval</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Your registration has been received. A campus administrator must review and approve your account before you can access academic records.
              </p>
              <div className="p-6 bg-muted/50 rounded-2xl flex items-center gap-4 text-left border border-border">
                <AlertCircle className="text-primary shrink-0" />
                <p className="text-sm font-medium">Please contact the IT department if this takes longer than 24 hours. Your assigned Roll No is <span className="text-primary font-bold">{profile?.studentId}</span>.</p>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    )
  }

  const attendancePercentage = attendanceData ? Math.min(100, (attendanceData.length / 50) * 100) : 0; // Assuming 50 classes for demo
  const isBelowThreshold = attendancePercentage < 75;

  const chartData = results?.map(r => ({
    name: r.semester,
    score: r.marks,
    color: 'hsl(var(--primary))'
  })) || []

  const currentPhotoURL = user?.photoURL || profile?.photoURL || `https://picsum.photos/seed/${user.uid}/300/300`

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 pt-32 pb-32 space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between"
        >
          <div className="flex items-center gap-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative group cursor-pointer"
            >
              <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative">
                <img 
                  src={currentPhotoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
                <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={24} className="text-white" />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2rem]">
                    <DialogHeader>
                      <DialogTitle>Update Profile Picture</DialogTitle>
                      <DialogDescription>
                        Enter a URL for your new profile picture.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateAvatar} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="photoUrl">Image URL</Label>
                        <Input 
                          id="photoUrl" 
                          placeholder="https://..." 
                          value={newAvatarUrl}
                          onChange={(e) => setNewAvatarUrl(e.target.value)}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isUpdatingAvatar} className="rounded-xl font-bold">
                          {isUpdatingAvatar ? <Loader2 className="animate-spin mr-2" /> : null}
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-lg border-2 border-white">
                <Sparkles size={20} />
              </div>
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tighter">
                <SplitText 
                  text={`Hello, ${profile?.firstName || 'Student'}!`}
                  tag="span"
                  duration={0.6}
                  delay={30}
                />
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2">
                  <CreditCard size={14} /> ROLL NO: {profile?.studentId || 'N/A'}
                  <button onClick={() => copyToClipboard(profile?.studentId || '')} className="hover:text-primary/70 transition-colors">
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="bg-muted text-muted-foreground px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border border-border">
                  <GraduationCap size={14} /> {profile?.currentSemester || 'SEMESTER 1'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto">
            <Button 
              onClick={() => router.push('/attendance/scan')}
              className="h-16 px-8 bg-primary rounded-[2rem] font-bold shadow-xl shadow-primary/20 flex-1 lg:flex-none text-lg"
            >
              <QrCode className="mr-3" /> Mark Attendance
            </Button>
          </div>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-12"
        >
          <motion.div variants={itemVariant} className="lg:col-span-2">
            <Card className="glass border-none rounded-[3rem] overflow-hidden h-full shadow-lg">
              <CardHeader className="p-8 md:p-12 border-b border-border/40 bg-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl md:text-4xl font-headline font-bold tracking-tight">Academic Engine</CardTitle>
                    <p className="text-muted-foreground text-base md:text-lg font-medium mt-2">Real-time performance analytics</p>
                  </div>
                  <div className="p-4 md:p-5 bg-primary/10 text-primary rounded-2xl">
                    <TrendingUp size={32} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 md:p-12 h-[400px] md:h-[500px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 13, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 13, fontWeight: 700 }} domain={[0, 100]} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(227, 106, 106, 0.05)' }}
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.1)', padding: '24px' }}
                      />
                      <Bar dataKey="score" radius={[15, 15, 0, 0]} barSize={60}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-6">
                    <div className="p-10 bg-muted/50 rounded-full"><Clock size={64} className="opacity-20" /></div>
                    <p className="font-bold uppercase tracking-widest text-sm">No analytical data found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-12">
            <motion.div variants={itemVariant}>
              <Card className={`glass border-none rounded-[3rem] shadow-lg ${isBelowThreshold ? 'ring-2 ring-destructive' : ''}`}>
                <CardHeader className="p-8 md:p-10 pb-4">
                  <CardTitle className="text-2xl md:text-3xl font-headline font-bold flex items-center gap-4">
                    <ShieldCheck className={isBelowThreshold ? 'text-destructive' : 'text-primary'} size={32} /> Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 md:p-10 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-muted-foreground uppercase tracking-widest">Campus Presence</span>
                      <span className={`font-black text-3xl ${isBelowThreshold ? 'text-destructive' : 'text-primary'}`}>{attendancePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={attendancePercentage} className={`h-4 ${isBelowThreshold ? 'bg-destructive/10' : 'bg-muted'}`} />
                  </div>
                  
                  {isBelowThreshold && (
                    <div className="p-6 bg-destructive/10 rounded-[2rem] border border-destructive/20 flex gap-4">
                      <AlertCircle className="text-destructive shrink-0" />
                      <p className="text-sm font-bold leading-tight text-destructive">CRITICAL: Attendance below 75%. You are currently ineligible for final exams.</p>
                    </div>
                  )}

                  <div className="pt-4 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent Scan Log</h4>
                    {attendanceData?.slice(0, 3).map((log, i) => (
                      <div key={i} className="flex justify-between text-sm font-bold p-3 bg-muted/30 rounded-xl">
                        <span>Session {log.sessionId}</span>
                        <span className="text-primary">{format(new Date(log.timestamp), 'MMM d')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-2 gap-8">
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/resources')}
                className="flex flex-col items-center justify-center p-8 md:p-10 bg-white dark:bg-card/40 text-foreground rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all border border-border/50"
              >
                <div className="p-4 md:p-5 bg-primary/5 rounded-2xl mb-5 text-primary">
                  <BookOpen size={36} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Library</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/notices')}
                className="flex flex-col items-center justify-center p-8 md:p-10 bg-primary text-white rounded-[2.5rem] shadow-xl shadow-primary/20 transition-all border-none"
              >
                <div className="p-4 md:p-5 bg-white/20 rounded-2xl mb-5">
                  <Clock size={36} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Updates</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
