"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import TechBackground from '@/components/TechBackground'
import Navbar from '@/components/Navbar'
import { Lock, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = '/dashboard';
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <Card className="glass shadow-2xl border-border/40 overflow-hidden">
            <CardHeader className="space-y-2 text-center pb-8 border-b border-border/40">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
                <Lock size={32} />
              </div>
              <CardTitle className="text-3xl font-headline font-bold">Student Login</CardTitle>
              <CardDescription>Enter your credentials to access your dashboard</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pt-8">
                <div className="space-y-2">
                  <Label htmlFor="id">Student ID</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input id="id" placeholder="e.g. TX-2025-001" className="pl-10 h-12 bg-background/50" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-sm text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-10 h-12 bg-background/50" required />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pb-8">
                <Button className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                  Login <ArrowRight className="ml-2" size={18} />
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  New student? <Link href="#" className="text-primary font-medium hover:underline">Contact Admissions</Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}