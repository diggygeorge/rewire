function isOverTimeLimit(currentSite, limits, currentDay, screenTimes) {
    // currentSite: current hovered site
    // limits: list of time limits, see src/timeblock.ts

    if (!limits) {
      return false
    }
    console.log(currentSite, limits, currentDay, screenTimes)
    for (let i = 0; i < limits.length; i++) {
      let limit = limits[i]
      if (limit.type == "LIMIT" && limit.website?.includes(currentSite) && screenTimes.get(currentSite) >= limit.times[currentDay]) {
        return true
      }
    }

    return false
}
module.exports = isOverTimeLimit;