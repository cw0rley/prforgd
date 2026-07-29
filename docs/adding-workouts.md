# Adding Workouts to PRForgd

This is the exact data and format needed to add a workout (WOD). Give me the
content in any of the formats below and I'll load it into both the Supabase
`workouts` table (the live source) and the app's built-in `src/data/heroWods.ts`
fallback. You do **not** need to touch the database or code yourself.

---

## Fields

| Field | Required | Values / format | Notes |
|-------|----------|-----------------|-------|
| **name** | ✅ | Free text | e.g. `Fran`, `Murph` |
| **group** | ✅ | `hero` \| `girl` \| `benchmark` | Which section it shows under |
| **type** | ✅ | `for-time` \| `amrap` \| `rounds-for-time` \| `chipper` \| `emom` | How it's scored/run |
| **workout** | ✅ | Multi-line text | The full prescription exactly as it should display, including weights (e.g. `95/65 lb`). Line breaks are preserved. |
| **movements** | ✅ | Comma-separated list | Must match the movement library (see below) so video demos link |
| **category** | ✅ | `army` \| `navy` \| `marines` \| `air-force` \| `firefighter` \| `leo` \| `benchmark` | Branch badge. Use `benchmark` for Girl WODs and benchmarks. |
| **totalRounds** | if `rounds-for-time` | Integer | e.g. `5` (used by the timer for round tracking) |
| **timeCap** | if `amrap` | Integer (minutes) | e.g. `20` |
| **hero** | hero WODs only | Free text | The person honored, e.g. `Lt. Michael Murphy, USN` |
| **description** | hero WODs only | Free text | The tribute / backstory |
| **id** | auto | — | I generate it from the name (a lowercase slug) — you don't provide it |

---

## Movement names must match the library

Each entry in **movements** should match a movement already in the app's
movement library so its video demo and equipment mapping link up. If a workout
uses a movement that's **new** to the app, flag it and include:

- **Movement name** (e.g. `Devil Press`)
- **YouTube demo URL** (e.g. `https://www.youtube.com/watch?v=...`)
- **Category** — `Barbell` \| `Gymnastic` \| `KB/DB` \| `Bodyweight` \| `Cardio`
- **Equipment** it needs (e.g. `Dumbbells`)

I'll add the movement, then reference it in the workout.

---

## Formats you can send me

### 1. Plain text blocks (easiest)

One block per workout, blank line between them:

```
Name: Fran
Group: girl
Type: for-time
Category: benchmark
Workout:
21-15-9 reps for time:
Thrusters (95/65 lb)
Pull-ups
Movements: Thruster, Pull-Up
```

### 2. With the extra fields (hero / rounds / amrap)

```
Name: DT
Group: hero
Type: rounds-for-time
TotalRounds: 5
Category: air-force
Hero: SSgt Timothy P. Davis, USAF
Description: In honor of USAF SSgt Timothy P. Davis, 28, killed Feb 20, 2009…
Workout:
5 Rounds For Time:
12 Deadlifts (155/105 lb)
9 Hang Power Cleans (155/105 lb)
6 Push Jerks (155/105 lb)
Movements: Deadlift, Hang Power Clean, Push Jerk
```

```
Name: Cindy
Group: girl
Type: amrap
TimeCap: 20
Category: benchmark
Workout:
20 min AMRAP:
5 Pull-ups
10 Push-ups
15 Air Squats
Movements: Pull-Up, Push-Up, Air Squat
```

### 3. CSV / spreadsheet

Columns: `name, group, type, category, totalRounds, timeCap, hero, description, workout, movements`
(leave unused cells blank; use a newline or `\n` inside the `workout` cell for line breaks).

---

## Quick reference — enum values

- **group:** `hero`, `girl`, `benchmark`
- **type:** `for-time`, `amrap`, `rounds-for-time`, `chipper`, `emom`
- **category:** `army`, `navy`, `marines`, `air-force`, `firefighter`, `leo`, `benchmark`

Send me one workout or a batch — whatever's easiest — and I'll format and load them.
