function isOverLimit(currentSite, time, day, blocks) {
    // currentSite: current hovered site
    // time: HH:MM:SS
    // day: given as a integer (0 for Sunday, 1 for Monday, etc.)
    // blocks: list of blocks, see src/timeblock.ts
    if (!blocks) {
      return false
    }
    const isOverLimitAnon = (block) => {
        if (block.website?.includes(currentSite)) {
            let block_interval = block.times[day]
            let arr = time.split(":")
            let hour = arr[0]
            let minute = arr[1]
            let minute_index = parseInt(hour) * 60 + parseInt(minute)
            let yesterday = block.times[(day + 6) % 7]

            if (block_interval.start == -1 && minute_index >= yesterday.end) {
                return false
            }
            if (block_interval.start > block_interval.end) {
                if (minute_index >= block_interval.start || minute_index < block_interval.end) {
                    return true
                } else {
                    return false;
                }
            } else {
                if (minute_index < yesterday.end) {
                    return true
                } else if (minute_index >= block_interval.start && minute_index < block_interval.end) {
                    return true
                }
            }
        }
    }
    return blocks.some(isOverLimitAnon); 
}

module.exports = isOverLimit;