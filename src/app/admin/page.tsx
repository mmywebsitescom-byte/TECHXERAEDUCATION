"use client"

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, FileUp, Shield, List, GraduationCap, Megaphone } from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('results')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-headline font-bold">Admin Console</h1>
              <p className="text-muted-foreground">Manage campus content and student academic data</p>
            </div>
          </div>
          <Button className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="mr-2" size={20} /> Create New Entry
          </Button>
        </div>

        <Tabs defaultValue="results" className="space-y-8" onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-border/50 h-auto grid grid-cols-3 md:w-[600px]">
            <TabsTrigger value="results" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
              <GraduationCap className="mr-2" size={18} /> Results
            </TabsTrigger>
            <TabsTrigger value="notices" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Megaphone className="mr-2" size={18} /> Notices
            </TabsTrigger>
            <TabsTrigger value="resources" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
              <List className="mr-2" size={18} /> Resources
            </TabsTrigger>
          </TabsList>

          <Card className="shadow-xl border-border/50 overflow-hidden">
            <CardHeader className="bg-white border-b border-border/40 p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl font-headline capitalize">{activeTab} Management</CardTitle>
                  <CardDescription>View and edit existing {activeTab} records</CardDescription>
                </div>
                <div className="relative w-full md:w-80">
                  <Input placeholder={`Search ${activeTab}...`} className="bg-muted/30 border-none h-11 pr-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="py-4 px-8 font-bold">ID</TableHead>
                    <TableHead className="py-4 font-bold">Title / Name</TableHead>
                    <TableHead className="py-4 font-bold">Category</TableHead>
                    <TableHead className="py-4 font-bold">Date Modified</TableHead>
                    <TableHead className="py-4 text-right px-8 font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="px-8 font-medium">#{1000 + i}</TableCell>
                      <TableCell>
                        <div className="font-bold">Record Entry {i}</div>
                        <div className="text-xs text-muted-foreground">Updated by Admin 2</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          General
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">Oct 24, 2025</TableCell>
                      <TableCell className="text-right px-8 space-x-2">
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                          <Edit size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 size={18} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs>
      </main>
    </div>
  )
}