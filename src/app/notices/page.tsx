
"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle, Info, Megaphone } from 'lucide-react'
import { motion } from 'framer-motion'

const notices = [
  {
    id: 1,
    title: "Final Examination Schedule Released",
    desc: "The final exam schedule for the Winter 2025 semester is now available for all departments. Please check the student portal to verify your exam dates and centers.",
    date: "Oct 24, 2025",
    type: "Urgent",
    category: "Academic"
  },
  {
    id: 2,
    title: "Campus-wide Tech Symposium",
    desc: "Join us for the annual TechXera Symposium featuring guest speakers from major tech companies. Registration starts next Monday.",
    date: "Oct 22, 2025",
    type: "Normal",
    category: "Event"
  },
  {
    id: 3,
    title: "Hostel Fee Payment Deadline",
    desc: "Attention hostel residents: The last date for fee payment without late fine is Oct 30. Payments can be made via the mobile app or web portal.",
    date: "Oct 20, 2025",
    type: "Urgent",
    category: "Admin"
  },
  {
    id: 4,
    title: "New Library Timings",
    desc: "Starting Nov 1, the campus library will be open 24/7 to accommodate students during the exam season.",
    date: "Oct 18, 2025",
    type: "Normal",
    category: "General"
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
}

export default function NoticesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-bold">Notice Board</h1>
            <p className="text-muted-foreground text-lg">Stay updated with the latest campus news and announcements.</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-2xl"
          >
            <Megaphone size={20} />
            <span className="font-bold text-sm">4 New Notices</span>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {notices.map((notice) => (
            <motion.div key={notice.id} variants={item}>
              <Card className={`shadow-sm border-l-4 transition-all hover:translate-x-2 duration-300 ${notice.type === 'Urgent' ? 'border-l-destructive border-border/50 bg-destructive/[0.02]' : 'border-l-primary border-border/50'}`}>
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className={notice.type === 'Urgent' ? 'bg-destructive text-white border-none' : 'bg-primary text-white border-none'}>
                        {notice.type}
                      </Badge>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={12} /> {notice.date}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-muted-foreground border-border/60">
                      {notice.category}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className={`hidden sm:flex shrink-0 w-12 h-12 rounded-full items-center justify-center ${notice.type === 'Urgent' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {notice.type === 'Urgent' ? <AlertCircle size={24} /> : <Info size={24} />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-headline font-bold mb-3">{notice.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-lg">{notice.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
