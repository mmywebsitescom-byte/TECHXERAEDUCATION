
"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import TechBackground from '@/components/TechBackground'
import Navbar, { TechXeraLogo } from '@/components/Navbar'
import { Lock, User, ArrowRight, Loader2, Info } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { doc } from 'firebase/firestore'

function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  // Dynamic branding fetch
  const settingsRef = useMemoFirebase(() => (db ? doc(db, 'settings', 'site-config') : null), [db])
  const { data: settings } = useDoc(settingsRef)

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/admin')
    }
  }, [user, isUserLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true)
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
        toast({
          title: "Admin Account Created",
          description: "Redirecting to management console. Please grant admin roles next.",
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        toast({
          title: "Admin Access Granted",
          description: "Redirecting to management console.",
        })
      }
      router.push('/admin')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isSignUp ? "Admin Sign Up Failed" : "Authentication Failed",
        description: error.message || "Invalid credentials.",
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
        <CardHeader className="space-y-2 text-center pb-8 border-b border-border/40 bg-primary/5">
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
            {isSignUp ? "Admin Registration" : "Admin Console"}
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Register a new campus administrator" : "Management portal for campus administrators"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label htmlFor="email">Admin ID (Email)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="email" 
                  type="email"
                  placeholder="admin@techxera.edu" 
                  className="pl-10 h-12 bg-background/50" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Security Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-12 bg-background/50" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-xl flex gap-3 text-xs text-muted-foreground border border-border/50">
              <Info className="shrink-0 text-primary" size={16} />
              <p>Admin access is restricted to authorized personnel. You can register with your official campus email.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button 
                type="submit"
                disabled={isLoading} 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? "Verifying..." : (isSignUp ? "Register Admin" : "Enter Portal")} 
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </motion.div>
            
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-medium hover:underline block w-full"
              >
                {isSignUp ? "Already registered? Login" : "New Admin? Register Account"}
              </button>
              <div className="pt-2">
                Are you a student? <Link href="/login" className="text-primary font-medium hover:underline">Student Login</Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}

export default function AdminLoginPage() {
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
          <AdminLoginForm />
        </Suspense>
      </main>
    </div>
  )
}
