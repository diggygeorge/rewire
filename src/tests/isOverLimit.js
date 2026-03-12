function timeRemaining(time, day, times) {
    // time: hour and minute parsed into minute index (Ex: 12PM -> 720)
    // day: given as a integer (0 for Sunday, 1 for Monday, etc.)
    // times: block.times

    let acc = 0;
    if (time < times[day].start) {
        acc += times[day].start - time
    } else {
        acc += 1440 - time

        let i = (day + 1) % 7;

        while (i != day && times[i].start == -1) {
            acc += 1440;
            i = (i + 1) % 7;
        }

        acc += times[i].start
    }
    return acc
}

function isOverLimit(currentSite, time, day, blocks) {
    // currentSite: current hovered site
    // time: HH:MM:SS
    // day: given as a integer (0 for Sunday, 1 for Monday, etc.)
    // blocks: list of blocks, see src/timeblock.ts
    if (!blocks) {
      return false
    }
    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i]
        if (block.website?.includes(currentSite)) {
            let block_interval = block.times[day]
            let arr = time.split(":")
            let hour = arr[0]
            let minute = arr[1]
            let minute_index = parseInt(hour) * 60 + parseInt(minute)
            let yesterday = block.times[(day + 6) % 7]
            if (block_interval.start == -1 && minute_index >= yesterday.end) {
                return timeRemaining(minute_index, day, block?.times)
            }
            if (block_interval.start > block_interval.end) {
                if (minute_index >= block_interval.start || minute_index < block_interval.end) {
                    return true
                } else {
                    return timeRemaining(minute_index, day, block?.times)
                }
            } else {
                if (minute_index < yesterday.end) {
                    return true
                } else if (minute_index >= block_interval.start && minute_index < block_interval.end) {
                    return true
                } else {
                    return timeRemaining(minute_index, day, block?.times)
                }
            }
        }
    }

    return false
    
}

module.exports = isOverLimit;