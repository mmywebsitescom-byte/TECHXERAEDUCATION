
"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import TechBackground from '@/components/TechBackground'
import Navbar from '@/components/Navbar'
import { Shield, Lock, User, ArrowRight, Loader2, Info } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth, useUser } from '@/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isUserLoading && user) {
      router.push('/admin')
    }
  }, [user, isUserLoading, router, mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Admin Access Granted",
        description: "Redirecting to management console.",
      })
      router.push('/admin')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Invalid credentials.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

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
            className="mx-auto w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-2"
          >
            <Shield size={32} />
          </motion.div>
          <CardTitle className="text-3xl font-headline font-bold">Admin Console</CardTitle>
          <CardDescription>Management portal for campus administrators</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label htmlFor="email">Admin ID</Label>
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
              <p>For development: Admin access is restricted to authorized personnel. Use your provided campus admin credentials.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button disabled={isLoading} className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {isLoading ? "Verifying..." : "Enter Portal"} <ArrowRight className="ml-2" size={18} />
              </Button>
            </motion.div>
            <div className="text-center text-sm text-muted-foreground">
              Are you a student? <Link href="/login" className="text-primary font-medium hover:underline">Student Login</Link>
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
          <AdminLoginForm />
        </Suspense>
      </main>
    </div>
  )
}
