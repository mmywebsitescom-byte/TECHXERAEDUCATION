"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, FileText, ChevronRight, BookOpen } from 'lucide-react'

const resources = [
  { id: 1, title: "Advanced Algorithms Notes", subject: "Computer Science", semester: "5th Sem", type: "Note" },
  { id: 2, title: "Digital Marketing Strategy", subject: "Management", semester: "3rd Sem", type: "Question Paper" },
  { id: 3, title: "Quantum Physics Labs", subject: "Physics", semester: "2nd Sem", type: "Lab Manual" },
  { id: 4, title: "Data Structures - Previous Year", subject: "Computer Science", semester: "3rd Sem", type: "Question Paper" },
  { id: 5, title: "Ethics in Engineering", subject: "Common", semester: "8th Sem", type: "Note" },
  { id: 6, title: "Microprocessor Architecture", subject: "Electronics", semester: "4th Sem", type: "Note" },
]

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">
        <div className="space-y-4">
          <h1 className="text-4xl font-headline font-bold">Study Resources</h1>
          <p className="text-muted-foreground text-lg">Access past papers, lecture notes, and study guides.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-border/50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input 
              placeholder="Search by title or subject..." 
              className="pl-10 h-12 bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="h-12 px-6 flex items-center gap-2">
              <Filter size={18} /> Filter
            </Button>
            <Button className="h-12 px-8 bg-primary hover:bg-primary/90">Search</Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/5 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <FileText size={24} />
                    </div>
                    <Badge variant="secondary" className="bg-muted text-muted-foreground border-none uppercase tracking-wider text-[10px]">
                      {item.semester}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mb-6 flex items-center gap-2">
                    <BookOpen size={14} /> {item.subject}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border/40">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{item.type}</span>
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 flex items-center gap-2 font-bold group-hover:translate-x-1 transition-transform">
                      Download <Download size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-border/60">
            <p className="text-xl text-muted-foreground">No resources found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  )
}