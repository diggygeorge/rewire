interface Interval {
    start: number
    end: number
}

export default interface TimeBlock {
    name: string
    type: string
    website: string[]
    times: (number | Interval)[]
}