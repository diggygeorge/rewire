import { Pie, PieChart } from "recharts"
import { useState, useEffect } from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "./ui/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "./ui/card"
import {
  TabsContent
} from "./ui/tabs"

export default function ScreenTimeChart() {

  function parseTime(seconds: number): string {
    let sec = Math.round(seconds)
    let hours = Math.trunc(sec / 3600)
    sec %= 3600
    let minutes = Math.trunc(sec / 60)
    sec %= 60
    return `${hours !== 0 ? hours + "h " : ""}${minutes !== 0 ? minutes + "m " : ""}${sec}s`
  }

  const [screenTime, setScreenTime] = useState<[string, number][]>([]);
  
  const [activeSession, setActiveSession] = useState<{ site: string, startTime: number } | null>(null);
  
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    (window as any).chrome.storage.local.get(["time"], (result: any) => {
      if (result.time) {
        setScreenTime(result.time)
      };
    });
    console.log("Getting current status from background...");
    (window as any).chrome.runtime.sendMessage({ type: "GET_CURRENT_STATUS" }, (response: any) => {
      if (response && response.site && response.startTime) {
        setActiveSession({ site: response.site, startTime: response.startTime });
      }
    });

  }, []);

  useEffect(() => {
    if (!activeSession) return;

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeSession]);

  const liveChartData = screenTime.map(([site, baseMinutes]) => {
    let totalMinutes = baseMinutes;

    if (activeSession && activeSession.site === site) {
      const elapsedMs = now - activeSession.startTime;
      const elapsedMinutes = elapsedMs / 1000;
      totalMinutes += elapsedMinutes;
    }

    return [site, totalMinutes, parseTime(totalMinutes)] as [string, number, string];
  });

  if (activeSession && !liveChartData.some(([site]) => site === activeSession.site)) {
    const elapsedMs = now - activeSession.startTime;
    liveChartData.push([activeSession.site, elapsedMs / 1000, parseTime(elapsedMs / 1000)]);
    console.log(liveChartData)
  }

  const chartData = liveChartData.map(([site, time, displayMinutes], index) => {
    // rotate through 7 colors instead of 5 now that we have more defined
    const colorIndex = (index % 7) + 1; 
    return {
      site: site,
      time: time,
      display: displayMinutes,
      fill: `var(--chart-${colorIndex})`
    };
  });

  const chartConfig: ChartConfig & { [key: string]: any } = {
    display: {
      label: "",
    },
  };

  chartData.forEach((item) => {
    chartConfig[item.site] = {
      label: item.site,
      color: item.fill,
    };
  });

  return (
    <TabsContent value="dashboard" className="mt-4">
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Today's Usage</CardTitle>
          <CardDescription>Track how much time you've spent on each site today.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          
          {chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No screen time recorded yet today.
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent 
                        nameKey="site" 
                        // The formatter intercepts the value before it renders
                        formatter={(_value, _name, item) => {
                          return (
                            <>
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                style={{ backgroundColor: item.payload.fill }}
                              />
                              <div className="flex w-full items-center justify-between gap-4">
                                <span className="text-muted-foreground">{item.payload.site}</span>
                                <span className="font-mono font-medium text-foreground">
                                  {item.payload.display}
                                </span>
                              </div>
                            </>
                          )
                        }}
                      />
                    }
                  />
                <Pie 
                  data={chartData} 
                  dataKey="time" 
                  nameKey="site"
                  innerRadius={60} 
                  strokeWidth={5}
                  isAnimationActive={false}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="site" />}
                  className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center mt-4"
                />
              </PieChart>
            </ChartContainer>
          )
        }
        {chartData.length > 7 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Other Sites:</h3>
            <ul className="space-y-1 text-sm">
              {chartData.slice(7).map((item) => (
                <li key={item.site} className="flex justify-between">
                  <span className="truncate">{item.site}</span>
                  <span className="font-mono">{item.display}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        </CardContent>
      </Card>
    </TabsContent>
  )
}