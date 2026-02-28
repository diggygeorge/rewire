import { useState, useEffect } from "react"
import {
  Card,
  CardContent
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
  const [timeLimit, setTimeLimit] = useState(0) // e.g. 30 min
  
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
    setTimeLimit(0)
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

      let sec = timeLimit * 60
      newBlock = {
        name,
        website: websiteArray,
        times: [sec, sec, sec, sec, sec, sec, sec]
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

      // Default interval for unselected days
      const noTime: Interval = {
        start: -1,
        end: -1
      }

      newBlock = {
        name,
        website: websiteArray,
        times: 
          [selectedDays.includes('sunday') ? interval : noTime,
          selectedDays.includes('monday') ? interval : noTime,
          selectedDays.includes('tuesday') ? interval : noTime,
          selectedDays.includes('wednesday') ? interval : noTime,
          selectedDays.includes('thursday') ? interval : noTime,
          selectedDays.includes('friday') ? interval : noTime,
          selectedDays.includes('saturday') ? interval : noTime]
        
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

  const renderSchedule = (times: TimeBlock["times"]) => {
  // 1. Handle "Time Limit" format (e.g., "30 min")
  if (typeof times[1] === "string") {
    // If it's a string and not our "0 min" placeholder, it's a daily limit
    const limit = times[1] === "0 min" ? "Inactive" : times[1];
    return (
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Daily Limit:</span> {limit}
      </div>
    );
  }

  // 2. Handle "Time Interval" format (e.g., { start: 540, end: 1020 })
  // Filter out the inactive days
  const activeDays = Object.entries(times).filter(
    ([_, val]) => typeof val !== "number" && val.start !== -1
  );

  if (activeDays.length === 0) {
    return <div className="text-sm text-muted-foreground">Inactive</div>;
  }

  // Grab the interval logic (assuming all selected days share the same interval)
  const interval = activeDays[0][1] as Interval;
  
  // Convert minutes (e.g., 540) to 12-hour format (e.g., "9:00 AM")
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  // Format active days into a clean string (e.g., "Mon, Tue, Wed")
  const formattedDays = activeDays
    .map(([day]) => DAYS_OF_WEEK[parseInt(day)].label.toUpperCase() + DAYS_OF_WEEK[parseInt(day)].id.slice(1, 3))
    .join(", ");

  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      <div>
        <span className="font-medium text-foreground">Active Days:</span> {formattedDays}
      </div>
      <div>
        <span className="font-medium text-foreground">Hours:</span> {formatTime(interval.start)} - {formatTime(interval.end)}
      </div>
    </div>
  );
};

  return (
    <TabsContent value="blocked" className={`${drawerOpen ? 'overflow-hidden' : ''} mt-4`}>
      <Card>
          <div className="text-center font-bold">
            <p className="font-bold">Focus Blocks</p>
            <p className="font-semibold">Manage your time restrictions and schedules.</p>
          </div>
          
          {/* DRAWER TRIGGER */}
          <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
            <DrawerTrigger asChild>
              <Button size="sm" className="fixed bottom-4 right-4 gap-2">
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
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Block Name</Label>
                        <Input placeholder="e.g. Social Media" value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Websites (comma separated)</Label>
                        <Input placeholder="www.instagram.com, www.twitter.com" value={websites} onChange={e => setWebsites(e.target.value)} />
                      </div>
                      <div className="space-y-6 py-4">
                        {/* Header & Large Number Display */}
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                            Daily Limit
                          </Label>
                          <div className="flex items-baseline gap-1.5">
                            <h1 className="text-6xl font-extrabold tracking-tighter text-foreground">
                              {timeLimit}
                            </h1>
                            <span className="text-xl font-semibold text-muted-foreground">min</span>
                          </div>
                        </div>

                        {/* Time Adjustment Controls */}
                        <div className="flex justify-center gap-3">
                          {/* Subtraction Group */}
                          <div className="flex items-center rounded-lg border bg-secondary/30 p-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 text-muted-foreground hover:text-foreground" 
                              onClick={() => setTimeLimit(Math.max(0, timeLimit - 30))}
                            >
                              -30
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 text-muted-foreground hover:text-foreground" 
                              onClick={() => setTimeLimit(Math.max(0, timeLimit - 15))}
                            >
                              -15
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 text-muted-foreground hover:text-foreground" 
                              onClick={() => setTimeLimit(Math.max(0, timeLimit - 5))}
                            >
                              -5
                            </Button>
                          </div>
                          
                          {/* Addition Group */}
                          <div className="flex items-center rounded-lg border bg-secondary/30 p-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 text-muted-foreground hover:text-foreground" 
                              onClick={() => setTimeLimit(timeLimit + 5)}
                            >
                              +5
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 text-muted-foreground hover:text-foreground" 
                              onClick={() => setTimeLimit(timeLimit + 15)}
                            >
                              +15
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 text-muted-foreground hover:text-foreground" 
                              onClick={() => setTimeLimit(timeLimit + 30)}
                            >
                              +30
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2B: TIME INTERVAL */}
                {step === 'interval' && (
                  <>
                    <div className="p-4 space-y-4">
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

                <DrawerFooter className="pt-0">
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
        <CardContent>
          
          {/* ACCORDION LIST */}
          <ScrollArea className="max-h-[450px] pr-4">
            {!blocks || blocks.length === 0 ? (
              <div className="text-center text-muted-foreground mt-10 pl-0">
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
                      <div className="bg-muted/30 rounded-md p-4 space-y-4">
                        
                        {/* Restricted Sites Section */}
                        <div>
                          <div className="text-sm font-semibold mb-2">Restricted Sites:</div>
                          <div className="space-y-1">
                            {block.website.map((w, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">{w}</p>
                            ))}
                          </div>
                        </div>

                        {/* Time Restrictions Section */}
                        <div>
                          <div className="text-sm font-semibold mb-2 border-t pt-3 border-border/50">
                            Schedule & Allowances:
                          </div>
                          {renderSchedule(block.times)}
                        </div>

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