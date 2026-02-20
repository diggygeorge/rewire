import "./App.css"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog"
import { Field, FieldGroup } from "./components/ui/field"
import { Label } from "./components/ui/label"
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { ScrollArea } from "./components/ui/scroll-area"
import { Separator } from "./components/ui/separator"
import { Sun, Moon, Settings, Edit2 } from "lucide-react"

export default function Rewire() {
  
  const [theme, setTheme] = useState("light")

  // Ex: ["https://www.youtube.com/", "https://www.x.com/", "https://www.instagram.com/", "https://www.reddit.com/"]
  const [blockedSites, setBlockedSites] = useState<string[]>()
  const [noBlockSites, setNoBlockSites] = useState(["google.com", "khanacademy.org"])
  const [newBlocked, setNewBlocked] = useState("")
  const [newNoBlock, setNewNoBlock] = useState("")

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  useEffect(() => {
    (window as any).chrome.storage.local.get(["key"]).then((result: any) => {
      setBlockedSites(result.key);
    });
  }, [])

  useEffect(() => {
    console.log("Block List updating and sending to background...")
  const updateBlockList = async () => {
    try {

      await (window as any).chrome.runtime.sendMessage({
        type: "UPDATE_BLOCKLIST",
        data: blockedSites,
      });
    } catch (e) {
      console.warn("Background not available — retrying...");
      setTimeout(updateBlockList, 500);
    } finally {
      (window as any).chrome.storage.local.set({ key: blockedSites }, () => {
        console.log("Blocked sites stored!");

        (window as any).chrome.storage.local.get(["key"], (result: any) => {
          console.log("Stored Sites:", result.key);
        });
      });
    }
  };

  updateBlockList();
}, [blockedSites])

  return (
    <div
      className={`${
        theme === "dark" ? "dark" : ""
      } w-[600px] h-[800px] p-4 rounded-2xl bg-background text-foreground shadow-xl border`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Rewire</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="blocked">Blocked Sites</TabsTrigger>
          <TabsTrigger value="noblock">No-Block List</TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Usage</CardTitle>
              <CardDescription>
                Track how much time you've spent on each site today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-2">
                {[
                  { site: "youtube.com", time: "1h 45m" },
                  { site: "twitter.com", time: "1h 10m" },
                  { site: "reddit.com", time: "45m" },
                  { site: "medium.com", time: "30m" },
                  { site: "wikipedia.org", time: "25m" },
                  { site: "chat.openai.com", time: "2h 20m" },
                ].map(({ site, time }) => (
                  <div
                    key={site}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <span className="font-medium">{site}</span>
                    <span className="text-muted-foreground">{time}</span>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BLOCKED SITES TAB */}
        <TabsContent value="blocked" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Blocked Websites</CardTitle>
              <CardDescription>
                Manage sites you want to stay away from.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-2">
                {blockedSites?.map((site, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <span>{site}</span>
                    <Dialog>
                      <form>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Edit profile</DialogTitle>
                            <DialogDescription>
                              Make changes to your profile here. Click save when you&apos;re
                              done.
                            </DialogDescription>
                          </DialogHeader>
                          <FieldGroup>
                            <Field>
                              <Label htmlFor="name-1">Name</Label>
                              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
                            </Field>
                            <Field>
                              <Label htmlFor="username-1">Username</Label>
                              <Input id="username-1" name="username" defaultValue="@peduarte" />
                            </Field>
                          </FieldGroup>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Save changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </form>
                    </Dialog>
                  </div>
                ))}
              </ScrollArea>

              <div className="flex items-center gap-2 mt-4">
                <Input
                  placeholder="Add new website"
                  value={newBlocked}
                  onChange={(e) => setNewBlocked(e.target.value)}
                />
                <Button className="cursor-pointer"
                  onClick={() => {
                    let tempSite = newBlocked.trim()
                    let tempDomain = new URL(tempSite).hostname

                    if (tempDomain && !blockedSites?.includes(tempDomain)) {
                      console.log(tempDomain, "added!");
                      setBlockedSites([...(blockedSites || []), tempDomain]);
                      setNewBlocked("");
                    }
                    else {
                      console.log("Failed to add", tempSite)
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NO-BLOCK LIST TAB */}
        <TabsContent value="noblock" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>No-Block List</CardTitle>
              <CardDescription>
                Websites that will never be blocked.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-2">
                {noBlockSites.map((site, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b last:border-b-0"
                  >
                    <span>{site}</span>
                    <Button variant="ghost" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>

              <div className="flex items-center gap-2 mt-4">
                <Input
                  placeholder="Add new website"
                  value={newNoBlock}
                  onChange={(e) => setNewNoBlock(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (newNoBlock.trim()) {
                      setNoBlockSites([...noBlockSites, newNoBlock.trim()])
                      setNewNoBlock("")
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
