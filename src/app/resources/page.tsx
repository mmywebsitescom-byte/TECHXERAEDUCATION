
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Download, FileText, Loader2, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'

export default function ResourcesPage() {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const db = useFirestore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const resourcesQuery = useMemoFirebase(() => db ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db])
  const { data: resources, isLoading } = useCollection(resourcesQuery)

  const filtered = resources?.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.materialType.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F5F5FA]">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5FA] text-foreground">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-16 pt-32 pb-20">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <BookOpen size={14} /> Repository
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tighter">Campus Repository</h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium leading-relaxed">
            Access the technical library for TechXera students. Explore a curated collection of lecture notes, research papers, and coding guides uploaded by faculty.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-center bg-white p-4 md:p-6 rounded-[2.5rem] shadow-sm border border-white">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={20} />
            <input 
              placeholder="Search resources, subjects, or types..." 
              className="w-full pl-14 h-14 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground/30 text-lg outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button className="w-full md:w-auto h-14 px-10 bg-primary text-white hover:bg-primary/90 rounded-2xl font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20">
            Search Library
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Accessing Archives...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, idx) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="bg-white border-none hover:bg-primary/[0.01] transition-all duration-500 rounded-[2.5rem] overflow-hidden group shadow-sm hover:shadow-2xl h-full flex flex-col">
                    <CardContent className="p-10 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-8">
                        <div className="p-4 bg-primary/5 text-primary rounded-2xl group-hover:scale-110 transition-transform duration-500">
                          <FileText size={32} />
                        </div>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-none uppercase text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full">
                          {item.semester}
                        </Badge>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-2xl font-headline font-bold mb-4 tracking-tight line-clamp-2">{item.title}</h3>
                        <div className="space-y-1 mb-8">
                          <p className="text-primary text-sm font-bold uppercase tracking-widest">{item.subject}</p>
                          <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest">{item.materialType}</p>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-border/40 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                          {new Date(item.uploadDate).toLocaleDateString()}
                        </span>
                        <a 
                          href={item.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Button variant="ghost" className="text-primary hover:bg-primary/5 px-4 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                            Access <Download size={16} />
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 text-muted-foreground/40 border-2 border-dashed border-border/50 rounded-[2.5rem] bg-white/50"
          >
            <div className="p-6 bg-muted/20 w-fit mx-auto rounded-full mb-4">
              <Search size={48} className="opacity-20" />
            </div>
            <p className="font-bold uppercase tracking-widest text-sm">No repository matches found.</p>
            <p className="text-xs mt-2 font-medium">Try adjusting your filters or search terms.</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
