
"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Download, FileText, Loader2, BookOpen, ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, orderBy, doc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import SplitText from '@/components/SplitText'
import { TechXeraLogo } from '@/components/Navbar'

export default function ResourcesPage() {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const db = useFirestore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch student profile for approval check
  const studentRef = useMemoFirebase(() => (user && db ? doc(db, 'students', user.uid) : null), [user, db])
  const { data: profile, isLoading: isProfileLoading } = useDoc(studentRef)

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login?redirect=/resources')
    }
    // Redirect to dashboard if not approved
    if (mounted && !isUserLoading && !isProfileLoading && user && profile && !profile.isApproved) {
      router.push('/dashboard')
    }
  }, [user, isUserLoading, isProfileLoading, profile, router, mounted])

  const resourcesQuery = useMemoFirebase(() => db ? query(collection(db, 'studyMaterials'), orderBy('uploadDate', 'desc')) : null, [db])
  const { data: resources, isLoading: isResourcesLoading } = useCollection(resourcesQuery)

  const filtered = resources?.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.materialType.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <TechXeraLogo className="w-16 h-16 opacity-50" />
        </motion.div>
      </div>
    )
  }

  if (!user || !profile?.isApproved) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-12 pt-48 pb-32">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <BookOpen size={16} /> Repository
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter">
            <SplitText 
              text="Campus Repository"
              tag="span"
              duration={0.6}
              delay={30}
            />
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
            Access the technical library for TechXera students. Explore a curated collection of lecture notes, research papers, and coding guides.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl shadow-sm border border-border/40">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={20} />
            <input 
              placeholder="Search resources..." 
              className="w-full pl-14 h-12 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground/30 text-lg outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button className="w-full md:w-auto h-12 px-10 bg-primary text-white hover:bg-primary/90 rounded-2xl font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-primary/20">
            Search
          </Button>
        </div>

        {isResourcesLoading ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Accessing Archives...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, idx) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="bg-white border-none hover:bg-primary/[0.01] transition-all duration-300 rounded-[2rem] overflow-hidden group shadow-sm hover:shadow-md h-full flex flex-col border border-border/20">
                    <CardContent className="p-0 flex-1 flex flex-col">
                      {/* Thumbnail Header */}
                      <div className="h-40 w-full overflow-hidden bg-muted relative">
                        {item.thumbnailUrl ? (
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary/20">
                            <ImageIcon size={64} />
                          </div>
                        )}
                        <Badge variant="secondary" className="absolute top-4 right-4 bg-white/80 backdrop-blur-md text-muted-foreground border-none uppercase text-[10px] font-bold tracking-widest px-4 py-1 rounded-full">
                          {item.semester}
                        </Badge>
                      </div>

                      <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-primary/5 text-primary rounded-xl group-hover:scale-105 transition-transform duration-300">
                            <FileText size={24} />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-headline font-bold mb-4 tracking-tight line-clamp-2">{item.title}</h3>
                          <div className="space-y-1 mb-6">
                            <p className="text-primary text-xs font-bold uppercase tracking-widest">{item.subject}</p>
                            <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest">{item.materialType}</p>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-border/40 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                            {item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : 'N/A'}
                          </span>
                          <a 
                            href={item.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <Button variant="ghost" className="text-primary hover:bg-primary/5 px-4 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest h-10">
                              Access <Download size={16} />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {filtered.length === 0 && !isResourcesLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-muted-foreground/40 border-2 border-dashed border-border rounded-[2rem] bg-white/50"
          >
            <div className="p-6 bg-muted/20 w-fit mx-auto rounded-full mb-4">
              <Search size={32} className="opacity-20" />
            </div>
            <p className="font-bold uppercase tracking-widest text-sm">No repository matches found.</p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
