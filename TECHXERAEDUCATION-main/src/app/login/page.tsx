
"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import TechBackground from '@/components/TechBackground'
import Navbar, { TechXeraLogo } from '@/components/Navbar'
import { Lock, User, ArrowRight, Loader2, UserPlus, Calendar, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

const AUTHORIZED_ADMIN_EMAIL = 'rraghabbarik@gmail.com'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [signUpRole, setSignUpRole] = useState<'student' | 'teacher'>('student')
  
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const redirectTo = searchParams.get('redirect') || '/'

  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.email === AUTHORIZED_ADMIN_EMAIL) {
        router.push('/admin')
      } else {
        router.push(redirectTo)
      }
    }
  }, [user, isUserLoading, router, redirectTo])

  if (isUserLoading || user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Session...</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      toast({
        variant: "destructive",
        title: "Admin Account Restricted",
        description: "Administrators must use the dedicated Admin Console.",
      })
      router.push('/admin/login')
      return;
    }
    
    setIsLoading(true)
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const newUser = userCredential.user
        
        if (signUpRole === 'teacher') {
          await setDoc(doc(db, 'teachers', newUser.uid), {
            id: newUser.uid,
            employeeId: studentId.trim().toUpperCase(),
            firstName,
            lastName,
            email,
            dateOfBirth,
            enrollmentDate: new Date().toISOString(), // Keep name similar for consistency or use joinDate
            isApproved: false,
            status: 'pending'
          })
        } else {
          await setDoc(doc(db, 'students', newUser.uid), {
            id: newUser.uid,
            studentId: studentId.trim().toUpperCase(),
            firstName,
            lastName,
            email,
            dateOfBirth,
            enrollmentDate: new Date().toISOString(),
            isApproved: false,
            status: 'pending',
            currentSemester: 'Semester 1'
          })
        }

        toast({
          title: "Account Created",
          description: "Your registration is pending administrator approval.",
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        toast({
          title: "Login Successful",
          description: "Welcome back to the Student Portal.",
        })
      }
      router.push(redirectTo)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isSignUp ? "Sign Up Failed" : "Login Failed",
        description: error.message || "Something went wrong.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="w-full max-w-md"
    >
      <Card className="glass shadow-2xl border-border/40 overflow-hidden">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-border/40">
          <motion.div 
            initial={{ rotate: -20 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto flex items-center justify-center mb-2"
          >
            <TechXeraLogo 
              className="w-20 h-20 shadow-xl shadow-primary/20" 
              customUrl={settings?.logoUrl}
            />
          </motion.div>
          <CardTitle className="text-3xl font-headline font-bold">
            {isSignUp ? "Sign Up" : "Student / Teacher Login"}
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Create your account (Subject to admin approval)" : "Enter your credentials to access your dashboard"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            {isSignUp && (
              <>
                <div className="flex gap-4 p-1 bg-background/50 rounded-xl mb-4 border border-border/50">
                  <button 
                    type="button"
                    onClick={() => setSignUpRole('student')}
                    className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${signUpRole === 'student' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-background/80'}`}
                  >
                    Student
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSignUpRole('teacher')}
                    className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${signUpRole === 'teacher' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-background/80'}`}
                  >
                    Teacher
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Alex" 
                      required 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Smith" 
                      required 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">{signUpRole === 'student' ? 'Student ID (Roll Number)' : 'Employee ID'}</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      id="studentId" 
                      placeholder={signUpRole === 'student' ? "TX-2025-001" : "EMP-001"} 
                      className="pl-10 h-11 bg-background/50" 
                      required 
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      id="dob" 
                      type="date"
                      className="pl-10 h-11 bg-background/50" 
                      required 
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="email" 
                  type="email"
                  placeholder="alex@techxera.edu" 
                  className="pl-10 h-11 bg-background/50" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-11 bg-background/50" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button 
                type="submit"
                disabled={isLoading} 
                className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? (isSignUp ? "Creating..." : "Authenticating...") : (isSignUp ? "Sign Up" : "Login")} 
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </motion.div>
            
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-medium hover:underline block w-full"
              >
                {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <TechXeraLogo className="w-16 h-16 opacity-50" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={<TechXeraLogo className="w-16 h-16 animate-pulse opacity-50" />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  )
}
