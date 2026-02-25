
"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Download, FileText, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const db = useFirestore()
  const resourcesQuery = useMemoFirebase(() => db ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db])
  const { data: resources, isLoading } = useCollection(resourcesQuery)

  const filtered = resources?.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-16 pt-32 pb-20">
        <div className="space-y-6">
          <h1 className="text-5xl font-headline font-bold">Campus Repository</h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium">
            Access the technical library for TechXera students. Download notes, previous questions, and guides.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-border/50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={20} />
            <input 
              placeholder="Search resources..." 
              className="w-full pl-14 h-14 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground/30 text-lg outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="h-14 px-10 bg-primary text-white hover:bg-primary/90 rounded-2xl font-bold transition-transform active:scale-95">
            Search Library
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin text-primary mx-auto" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="bg-white border-border/40 hover:bg-primary/[0.02] transition-all duration-500 rounded-[2.5rem] overflow-hidden group shadow-sm hover:shadow-xl">
                    <CardContent className="p-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className="p-4 bg-primary/5 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                          <FileText size={32} />
                        </div>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-none uppercase text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full">
                          {item.semester}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-headline font-bold mb-4">{item.title}</h3>
                      <p className="text-muted-foreground/60 text-sm font-bold uppercase tracking-widest mb-10">{item.subject}</p>
                      <div className="flex items-center justify-between pt-8 border-t border-border/40">
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">{item.materialType}</span>
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" className="text-primary hover:bg-primary/5 px-4 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                            Download <Download size={16} />
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground/40 border-2 border-dashed border-border/50 rounded-[2.5rem]">
            <p className="font-medium">No repository matches found.</p>
          </div>
        )}
      </main>
    </div>
  )
}
