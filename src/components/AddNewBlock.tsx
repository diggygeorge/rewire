import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  TabsContent,
} from "./ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer"
import { ScrollArea } from "./ui/scroll-area"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Trash2, Clock, CalendarDays, Plus } from "lucide-react"

import type TimeBlock from "../timeblock"

interface Interval {
  start: number
  end: number
}

const DAYS_OF_WEEK = [
  { id: 'sunday', label: 'S' },
  { id: 'monday', label: 'M' },
  { id: 'tuesday', label: 'T' },
  { id: 'wednesday', label: 'W' },
  { id: 'thursday', label: 'T' },
  { id: 'friday', label: 'F' },
  { id: 'saturday', label: 'S' },
] as const

type CreationStep = 'choose' | 'limit' | 'interval'

export default function AddNewBlock() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  
  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [step, setStep] = useState<CreationStep>('choose')

  // Form State
  const [name, setName] = useState("")
  const [websites, setWebsites] = useState("") // comma separated for easy entry
  
  // Limit Specific State
  const [timeLimit, setTimeLimit] = useState("") // e.g. "30 min"
  
  // Interval Specific State
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedDays, setSelectedDays] = useState<string[]>([])

    useEffect(() => {
      console.log("Blocks:", blocks)
    }, [blocks])

    useEffect(() => {
      (window as any).chrome.storage.local.get(["key"]).then((result: any) => {
        setBlocks(result.key);
      });
    }, [])
  
    useEffect(() => {
      console.log("Block List updating and sending to background...")
    const updateBlockList = async () => {
      try {
  
        await (window as any).chrome.runtime.sendMessage({
          type: "UPDATE_BLOCKLIST",
          data: blocks,
        });
      } catch (e) {
        console.warn("Background not available — retrying...");
        setTimeout(updateBlockList, 500);
      } finally {
        (window as any).chrome.storage.local.set({ key: blocks }, () => {
          console.log("Blocked sites stored!");
  
          (window as any).chrome.storage.local.get(["key"], (result: any) => {
            console.log("Stored Sites:", result.key);
          });
        });
      }
    };
  
    updateBlockList();
  }, [blocks])

  const resetForm = () => {
    setStep('choose')
    setName("")
    setWebsites("")
    setTimeLimit("")
    setStartTime("")
    setEndTime("")
    setSelectedDays([])
  }

  const handleOpenChange = (open: boolean) => {
    setDrawerOpen(open)
    if (!open) {
      // Small timeout to allow drawer close animation to finish before resetting state
      setTimeout(resetForm, 300) 
    }
  }

  const handleAddBlock = () => {
    const websiteArray = websites.split(',').map(s => s.trim()).filter(Boolean)
    
    let newBlock: TimeBlock

    if (step === 'limit') {
      // Helper to convert min to src (number)
      const minToSec = (t: string) => {
        if (!t) return 0
        const [m, _] = t.split(' min')
        return 60 * parseInt(m)
      }

      let sec = minToSec(timeLimit)
      newBlock = {
        name,
        website: websiteArray,
        times: {
          sunday: sec, monday: sec, tuesday: sec,
          wednesday: sec, thursday: sec, friday: sec, saturday: sec
        }
      }
    } else {
      // Helper to convert HH:MM to minutes (number) for your Interval interface
      const timeToNum = (t: string) => {
        if (!t) return 0
        const [h, m] = t.split(':')
        return parseInt(h) * 60 + parseInt(m)
      }

      const interval: Interval = {
        start: timeToNum(startTime),
        end: timeToNum(endTime)
      }

      // Default string for unselected days
      const noTime = 0

      newBlock = {
        name,
        website: websiteArray,
        times: {
          sunday: selectedDays.includes('sunday') ? interval : noTime,
          monday: selectedDays.includes('monday') ? interval : noTime,
          tuesday: selectedDays.includes('tuesday') ? interval : noTime,
          wednesday: selectedDays.includes('wednesday') ? interval : noTime,
          thursday: selectedDays.includes('thursday') ? interval : noTime,
          friday: selectedDays.includes('friday') ? interval : noTime,
          saturday: selectedDays.includes('saturday') ? interval : noTime,
        }
      }
    }

    setBlocks([...blocks, newBlock])
    setDrawerOpen(false)
    setTimeout(resetForm, 300)
  }

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    )
  }

  return (
    <TabsContent value="blocked" className={`${drawerOpen ? 'overflow-hidden' : ''} mt-4`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Focus Blocks</CardTitle>
            <CardDescription>
              Manage your restricted sites and schedules.
            </CardDescription>
          </div>
          
          {/* DRAWER TRIGGER */}
          <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
            <DrawerTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Block
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                
                {/* STEP 1: CHOOSE TYPE */}
                {step === 'choose' && (
                  <>
                    <DrawerHeader>
                      <DrawerTitle>Create New Block</DrawerTitle>
                      <DrawerDescription>How do you want to restrict these sites?</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-0 flex gap-4">
                      <Card className="flex-1 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStep('limit')}>
                        <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                          <Clock className="h-8 w-8 text-primary" />
                          <div className="font-semibold">Time Limit</div>
                          <div className="text-xs text-muted-foreground text-center">Set a daily allowance (e.g. 30 mins)</div>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStep('interval')}>
                        <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                          <CalendarDays className="h-8 w-8 text-primary" />
                          <div className="font-semibold">Time Interval</div>
                          <div className="text-xs text-muted-foreground text-center">Block during specific hours</div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

                {/* STEP 2A: TIME LIMIT */}
                {step === 'limit' && (
                  <>
                    <DrawerHeader>
                      <DrawerTitle>Set Time Limit</DrawerTitle>
                      <DrawerDescription>Allow a specific amount of time for these sites.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-0 space-y-4">
                      <div className="space-y-2">
                        <Label>Block Name</Label>
                        <Input placeholder="e.g. Social Media" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Websites (comma separated)</Label>
                        <Input placeholder="instagram.com, twitter.com" value={websites} onChange={e => setWebsites(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Daily Limit</Label>
                        <Input placeholder="e.g. 30 min" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2B: TIME INTERVAL */}
                {step === 'interval' && (
                  <>
                    <DrawerHeader>
                      <DrawerTitle>Set Time Interval</DrawerTitle>
                      <DrawerDescription>Block access during specific hours and days.</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 pb-0 space-y-4">
                      <div className="space-y-2">
                        <Label>Block Name</Label>
                        <Input placeholder="e.g. Deep Work" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Websites (comma separated)</Label>
                        <Input placeholder="youtube.com, reddit.com" value={websites} onChange={e => setWebsites(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2 pt-2">
                        <Label>Active Days</Label>
                        <div className="flex justify-between">
                          {DAYS_OF_WEEK.map(day => (
                            <Button
                              key={day.id}
                              type="button"
                              variant={selectedDays.includes(day.id) ? "default" : "outline"}
                              className="w-10 h-10 p-0 rounded-full"
                              onClick={() => toggleDay(day.id)}
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <DrawerFooter>
                  {step !== 'choose' && (
                    <Button onClick={handleAddBlock} disabled={!name || !websites}>
                      Add Block
                    </Button>
                  )}
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>

        </CardHeader>
        <CardContent>
          
          {/* ACCORDION LIST */}
          <ScrollArea className="h-[450px] pr-4">
            {!blocks || blocks.length === 0 ? (
              <div className="text-center text-muted-foreground mt-10">
                No blocks configured. Add one to get started.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {blocks.map((block, i) => (
                  <AccordionItem value={`item-${i}`} key={i} className="group border-b">
                    <div className="flex items-center justify-between pr-2">
                      <AccordionTrigger className="hover:no-underline flex-1 py-4">
                        <span className="font-medium text-left">{block.name}</span>
                      </AccordionTrigger>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent accordion toggle when clicking delete
                          setBlocks(blocks.filter(s => s !== block));
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <AccordionContent>
                      <div className="bg-muted/30 rounded-md p-3">
                        <div className="text-sm font-semibold mb-2">Restricted Sites:</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {block.website.map((w, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">{w}</li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </TabsContent>
  )
}