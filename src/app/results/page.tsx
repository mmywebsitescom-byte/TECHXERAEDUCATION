"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import TechBackground from '@/components/TechBackground'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ClipboardList, Search, Loader2 } from 'lucide-react'

export default function ResultsLookupPage() {
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setShowResults(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <TechBackground />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col items-center justify-center">
        {!showResults ? (
          <div className="w-full max-w-lg animate-in zoom-in-95 duration-500">
            <Card className="glass border-border/40 shadow-2xl">
              <CardHeader className="text-center pb-8 border-b border-border/40">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                  <ClipboardList size={32} />
                </div>
                <CardTitle className="text-3xl font-headline font-bold">Check Results</CardTitle>
                <CardDescription>Enter your student details to view your mark sheet</CardDescription>
              </CardHeader>
              <form onSubmit={handleLookup}>
                <CardContent className="space-y-6 pt-8">
                  <div className="space-y-2">
                    <Label htmlFor="id">Student ID</Label>
                    <Input id="id" placeholder="e.g. TX-2025-001" className="h-12 bg-background/50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" className="h-12 bg-background/50" required />
                  </div>
                </CardContent>
                <div className="p-6 pt-0 flex flex-col gap-4">
                  <Button disabled={loading} className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
                    {loading ? 'Searching Records...' : 'View Mark Sheet'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        ) : (
          <div className="w-full animate-in slide-in-from-bottom-10 duration-700">
            <Card className="glass border-border/40 shadow-2xl overflow-hidden max-w-4xl mx-auto">
              <CardHeader className="bg-primary text-white p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-3xl font-headline font-bold">Academic Transcript</CardTitle>
                    <CardDescription className="text-primary-foreground/80 text-lg">Semester 4 • Academic Year 2024-25</CardDescription>
                  </div>
                  <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    Download PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-border/40">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Student Name</p>
                    <p className="text-xl font-bold">Alex Johnson</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Enrollment No.</p>
                    <p className="text-xl font-bold">TX-2025-001</p>
                  </div>
                </div>
                <div className="p-0">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b border-border/40">
                      <tr>
                        <th className="p-4 px-8 font-bold">Subject Code</th>
                        <th className="p-4 font-bold">Subject Name</th>
                        <th className="p-4 font-bold">Grade</th>
                        <th className="p-4 px-8 text-right font-bold">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { code: "CS401", name: "Data Structures", grade: "A+", points: "10.0" },
                        { code: "CS402", name: "Operating Systems", grade: "A", points: "9.0" },
                        { code: "CS403", name: "Database Systems", grade: "A-", points: "8.0" },
                        { code: "CS404", name: "Software Engineering", grade: "B+", points: "7.0" }
                      ].map((item, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-muted/20">
                          <td className="p-4 px-8 font-medium">{item.code}</td>
                          <td className="p-4">{item.name}</td>
                          <td className="p-4 font-bold text-primary">{item.grade}</td>
                          <td className="p-4 px-8 text-right">{item.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-8 bg-muted/30 flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Total Credits</p>
                    <p className="text-2xl font-headline font-bold">24.0</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">SGPA</p>
                    <p className="text-3xl font-headline font-bold text-primary">8.50</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Result Status</p>
                    <p className="text-lg font-bold text-green-600">PASSED</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="mt-8 text-center">
              <Button variant="link" onClick={() => setShowResults(false)} className="text-primary font-bold">
                Check another result
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}