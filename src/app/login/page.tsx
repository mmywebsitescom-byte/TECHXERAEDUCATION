
"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import TechBackground from '@/components/TechBackground'
import Navbar from '@/components/Navbar'
import { Lock, User, ArrowRight, Loader2, GraduationCap, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, useUser } from '@/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const redirectTo = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push(redirectTo)
    }
  }, [user, isUserLoading, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true)
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
        toast({
          title: "Account Created",
          description: "Welcome to TechXera Campus! Redirecting...",
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
        description: error.message || "Something went wrong. Please check your credentials.",
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
        <CardHeader className="space-y-2 text-center pb-8 border-b border-border/40">
          <motion.div 
            initial={{ rotate: -20 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2"
          >
            {isSignUp ? <UserPlus size={32} /> : <GraduationCap size={32} />}
          </motion.div>
          <CardTitle className="text-3xl font-headline font-bold">
            {isSignUp ? "Student Sign Up" : "Student Login"}
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Create your campus portal account" : "Enter your credentials to access your dashboard"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="email" 
                  type="email"
                  placeholder="alex@techxera.edu" 
                  className="pl-10 h-12 bg-background/50" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && <Link href="#" className="text-sm text-primary hover:underline">Forgot password?</Link>}
              </div>
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
              <div className="pt-2">
                Staff or Admin? <Link href="/admin/login" className="text-primary font-medium hover:underline">Admin Login</Link>
              </div>
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
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={<Loader2 className="animate-spin text-primary" size={32} />}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  )
}
