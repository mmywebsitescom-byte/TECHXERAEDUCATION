
"use client"

import React from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { GraduationCap, Award, BookOpen, Clock, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

const performanceData = [
  { name: 'Semester 1', score: 85, color: 'hsl(var(--primary))' },
  { name: 'Semester 2', score: 78, color: 'hsl(var(--secondary))' },
  { name: 'Semester 3', score: 92, color: 'hsl(var(--primary))' },
  { name: 'Semester 4', score: 88, color: 'hsl(var(--secondary))' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 }
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">
        {/* Profile Welcome */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
        >
          <div className="flex items-center gap-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              <img 
                src="https://picsum.photos/seed/student-1/200/200" 
                alt="Profile" 
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-1.5 rounded-lg shadow-lg">
                <Award size={16} />
              </div>
            </motion.div>
            <div>
              <h1 className="text-3xl font-headline font-bold">Welcome back, Alex!</h1>
              <p className="text-muted-foreground font-medium">TX-2025-001 • B.Tech Computer Science (3rd Year)</p>
            </div>
          </div>
          <div className="flex gap-4">
            <motion.div whileHover={{ y: -5 }} className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 text-center min-w-[100px]">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Current GPA</p>
              <p className="text-2xl font-headline font-bold text-primary">3.85</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 text-center min-w-[100px]">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Attendance</p>
              <p className="text-2xl font-headline font-bold text-secondary">92%</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          
          {/* Performance Chart */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="shadow-sm border-border/50 overflow-hidden h-full">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />
                    Performance Analytics
                  </CardTitle>
                  <select className="text-sm bg-muted rounded-md px-2 py-1 outline-none border-none">
                    <option>Overall</option>
                    <option>This Year</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="pt-8 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(125, 107, 219, 0.05)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Side Info */}
          <div className="space-y-8">
            {/* Marks Distribution */}
            <motion.div variants={item}>
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Grades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { subject: "Data Structures", grade: "A+", progress: 95 },
                    { subject: "Cloud Computing", grade: "A", progress: 88 },
                    { subject: "Machine Learning", grade: "B+", progress: 76 }
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{item.subject}</span>
                        <span className="text-primary font-bold">{item.grade}</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center p-6 bg-primary text-white rounded-3xl shadow-lg shadow-primary/20 transition-transform"
              >
                <BookOpen size={24} className="mb-2" />
                <span className="text-sm font-bold">Library</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center p-6 bg-secondary text-white rounded-3xl shadow-lg shadow-secondary/20 transition-transform"
              >
                <Clock size={24} className="mb-2" />
                <span className="text-sm font-bold">Timetable</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
