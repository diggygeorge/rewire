interface Interval {
    start: number
    end: number
}

export default interface TimeBlock {
    name: string
    website: string[]
    times: {
        sunday: number | Interval
        monday: number | Interval
        tuesday: number | Interval
        wednesday: number | Interval
        thursday: number | Interval
        friday: number | Interval
        saturday: number | Interval
    }
}