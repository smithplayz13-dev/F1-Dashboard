import type { Driver, Lap, Stint, Interval, PositionEntry } from "../types"

export const DEMO_DRIVERS: Driver[] = [
  { driverNumber: 1, abbreviation: "VER", fullName: "Max Verstappen", firstName:"Max", lastName:"Verstappen", teamName:"Red Bull Racing", teamColor:"#0600EF" },
  { driverNumber: 4, abbreviation: "NOR", fullName: "Lando Norris", firstName:"Lando", lastName:"Norris", teamName:"McLaren", teamColor:"#FF8000" },
  { driverNumber: 81, abbreviation: "PIA", fullName: "Oscar Piastri", firstName:"Oscar", lastName:"Piastri", teamName:"McLaren", teamColor:"#FF8000" },
  { driverNumber: 16, abbreviation: "LEC", fullName: "Charles Leclerc", firstName:"Charles", lastName:"Leclerc", teamName:"Ferrari", teamColor:"#DC0000" },
  { driverNumber: 44, abbreviation: "HAM", fullName: "Lewis Hamilton", firstName:"Lewis", lastName:"Hamilton", teamName:"Ferrari", teamColor:"#DC0000" },
  { driverNumber: 63, abbreviation: "RUS", fullName: "George Russell", firstName:"George", lastName:"Russell", teamName:"Mercedes", teamColor:"#00D2BE" },
  { driverNumber: 12, abbreviation: "ANT", fullName: "Kimi Antonelli", firstName:"Andrea Kimi", lastName:"Antonelli", teamName:"Mercedes", teamColor:"#00D2BE" },
  { driverNumber: 14, abbreviation: "ALO", fullName: "Fernando Alonso", firstName:"Fernando", lastName:"Alonso", teamName:"Aston Martin", teamColor:"#006F62" },
  { driverNumber: 18, abbreviation: "STR", fullName: "Lance Stroll", firstName:"Lance", lastName:"Stroll", teamName:"Aston Martin", teamColor:"#006F62" },
  { driverNumber: 10, abbreviation: "GAS", fullName: "Pierre Gasly", firstName:"Pierre", lastName:"Gasly", teamName:"Alpine", teamColor:"#0090FF" },
  { driverNumber: 43, abbreviation: "COL", fullName: "Franco Colapinto", firstName:"Franco", lastName:"Colapinto", teamName:"Alpine", teamColor:"#0090FF" },
  { driverNumber: 23, abbreviation: "ALB", fullName: "Alex Albon", firstName:"Alex", lastName:"Albon", teamName:"Williams", teamColor:"#005AFF" },
  { driverNumber: 55, abbreviation: "SAI", fullName: "Carlos Sainz", firstName:"Carlos", lastName:"Sainz", teamName:"Williams", teamColor:"#005AFF" },
  { driverNumber: 6, abbreviation: "HAD", fullName: "Isack Hadjar", firstName:"Isack", lastName:"Hadjar", teamName:"Racing Bulls", teamColor:"#6692FF" },
  { driverNumber: 30, abbreviation: "LAW", fullName: "Liam Lawson", firstName:"Liam", lastName:"Lawson", teamName:"Racing Bulls", teamColor:"#6692FF" },
  { driverNumber: 27, abbreviation: "HUL", fullName: "Nico Hulkenberg", firstName:"Nico", lastName:"Hulkenberg", teamName:"Kick Sauber", teamColor:"#52E252" },
  { driverNumber: 5, abbreviation: "BOR", fullName: "Gabriel Bortoleto", firstName:"Gabriel", lastName:"Bortoleto", teamName:"Kick Sauber", teamColor:"#52E252" },
  { driverNumber: 31, abbreviation: "OCO", fullName: "Esteban Ocon", firstName:"Esteban", lastName:"Ocon", teamName:"Haas F1 Team", teamColor:"#B6BABD" },
  { driverNumber: 87, abbreviation: "BEA", fullName: "Oliver Bearman", firstName:"Oliver", lastName:"Bearman", teamName:"Haas F1 Team", teamColor:"#B6BABD" },
  { driverNumber: 22, abbreviation: "TSU", fullName: "Yuki Tsunoda", firstName:"Yuki", lastName:"Tsunoda", teamName:"Red Bull Racing", teamColor:"#0600EF" },
]

function genLaps(): Lap[] {
  const laps: Lap[] = []
  DEMO_DRIVERS.forEach(d => {
    let base = 91.2 + Math.random()*1.5 // ~1:31
    if (d.abbreviation==="NOR") base -= 0.4
    if (d.abbreviation==="VER") base -= 0.2
    for (let i=1;i<=42;i++) {
      const variance = (Math.random()-0.5)*1.2
      const pit = (d.abbreviation==="NOR" && i===15) || (d.abbreviation==="VER" && i===18) ? true : Math.random()<0.02
      const dur = pit ? base + 18 + Math.random()*2 : base + variance
      laps.push({
        driverNumber: d.driverNumber,
        lapNumber: i,
        lapDuration: dur,
        durationSector1: dur*0.32 + (Math.random()-0.5)*0.3,
        durationSector2: dur*0.34 + (Math.random()-0.5)*0.3,
        durationSector3: dur*0.34 + (Math.random()-0.5)*0.3,
        isPitOutLap: pit,
      })
    }
  })
  return laps
}

function genStints(): Stint[] {
  return [
    { driverNumber:4, compound:"MEDIUM", stintNumber:1, lapStart:1, lapEnd:15, tyreAgeAtStart:0 },
    { driverNumber:4, compound:"HARD", stintNumber:2, lapStart:16, lapEnd:38, tyreAgeAtStart:0 },
    { driverNumber:4, compound:"MEDIUM", stintNumber:3, lapStart:39, lapEnd:null, tyreAgeAtStart:0 },
    { driverNumber:1, compound:"MEDIUM", stintNumber:1, lapStart:1, lapEnd:18, tyreAgeAtStart:0 },
    { driverNumber:1, compound:"HARD", stintNumber:2, lapStart:19, lapEnd:null, tyreAgeAtStart:0 },
    ...DEMO_DRIVERS.filter(d=>[4,1].indexOf(d.driverNumber)===-1).flatMap(d=>[
      { driverNumber:d.driverNumber, compound:"MEDIUM" as const, stintNumber:1, lapStart:1, lapEnd: 14+Math.floor(Math.random()*6), tyreAgeAtStart:0 },
      { driverNumber:d.driverNumber, compound: (Math.random()>0.5 ? "HARD":"SOFT") as any, stintNumber:2, lapStart:15, lapEnd:null, tyreAgeAtStart:0 },
    ])
  ]
}

export const DEMO_LAPS = genLaps()
export const DEMO_STINTS = genStints()

export const DEMO_INTERVALS: Interval[] = [
  { driverNumber:4, gapToLeader:"—", interval:"—", date:new Date().toISOString() },
  { driverNumber:81, gapToLeader:"+1.284", interval:"+1.284", date:new Date().toISOString() },
  { driverNumber:1, gapToLeader:"+4.821", interval:"+3.537", date:new Date().toISOString() },
  { driverNumber:16, gapToLeader:"+8.421", interval:"+3.600", date:new Date().toISOString() },
  { driverNumber:44, gapToLeader:"+9.103", interval:"+0.682", date:new Date().toISOString() },
  { driverNumber:63, gapToLeader:"+12.441", interval:"+3.338", date:new Date().toISOString() },
]

export const DEMO_POSITIONS: PositionEntry[] = DEMO_DRIVERS.map((d,i)=>({
  driverNumber: d.driverNumber,
  position: i+1,
  date: new Date().toISOString()
})).sort((a,b)=> {
  // put NOR first demo
  const order = [4,81,1,16,44,63,12,14,10,23,55,6,30,27,5,31,87,18,22,43]
  return order.indexOf(a.driverNumber) - order.indexOf(b.driverNumber)
}).map((p,idx)=>({...p, position: idx+1}))
