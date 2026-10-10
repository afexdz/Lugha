# English question selection

English lessons draw from their current topic unit only. A1 has 151–153 activities
per unit and selects 12 per session. Pilot units A2–C2 have 40 activities and
select eight per session; their content still needs expansion and review.

The additional A1 bank adds 480 English vocabulary clues, 120 reading questions
from 60 original short texts, and 480 distinct four-pair matching rounds. Matching
rounds review the existing vocabulary; they are not new vocabulary entries. Each
word occurs four times across the forty added rounds for its unit. Selection
includes an unseen reading activity when available and up to three unseen matching
rounds before filling from other formats. This avoids a disproportionate share
of matching activities while there is enough other unseen content.

The new clues, key alignment and distractors were checked during authoring,
including exclusions for interchangeable greetings, overlapping family terms,
room names, clothing names and singular/plural body parts. This is an internal
content check, not independent teacher review or CEFR certification.

The latest four started English sessions are excluded, including practice
replays. The complete selection is reserved and saved when a lesson starts,
so quitting and reloading cannot immediately repeat that selection. Retrying a
wrong answer inside the same lesson remains intentional feedback.

Unused questions have priority. If eligible older questions exist alongside
enough unused questions, A1 includes one review question out of twelve (8.3%).
When unused content runs out, older questions fill the lesson, preferring those
used least often. The four-session exclusion still applies. A permanent 5–10%
repeat limit requires continued content expansion; a finite pool cannot deliver
new questions forever.

Selection reads the profile without modifying it. `recordLessonSelection` writes
`profile.courses.en.questionHistory`, then the lesson calls the existing local
save function. Recent history is limited to four sessions; usage counts are per
question. History is local to the browser and profile, not synchronized across
devices. Resetting the English course removes that course's history.

Validation: `node tools/test-engine.js` exercises 100 persisted sessions per
unit, cooldown after exhaustion, complete pool coverage, profile isolation,
and the existing exercise/answer invariants. `node tools/validate-content.js`
checks all authored content and references.
