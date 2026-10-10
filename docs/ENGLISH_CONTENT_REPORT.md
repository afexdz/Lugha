# Lugha English: source analysis and curriculum

10 October 2026. The bank is a curriculum draft, not a complete or certified A1-C2 programme.

## The five books, analysed individually

1. **Play English Kids**, Corina Taranu / Sinapsis, 2017. Supplied as `477056931-Play-English-Level-KIDS.pdf`; 68 PDF pages. Contents on PDF pages 6-7 cover eight units: greetings, school, home, body, animals, food/drink, seasons and holidays. Teacher-led listening, pictures, matching and games support initial oral learning. Contents and samples were checked visually because some extracted font encoding is damaged. Use its topics and activity concepts for beginner lessons, adapting the contexts for teenagers. Pre-A1/early A1 is my pedagogical estimate, not a level certification supplied by the book.

2. **Picture Grammar for Children 2**, David Vale / Macmillan Heinemann. Supplied as `313284890-248443707-English-Grammar-Kids-pdf.pdf`; 68 scanned pages with no extractable text. Cover, contents, sample pages and the vocabulary summary were inspected visually. PDF page 3 lists word order, have/has got, present continuous, can/cannot, present simple, time prepositions, wh-questions, articles and quantities, plus reviews and a grammar summary. The number 2 is a book number, not a CEFR level. Map selected objectives to A1-A2; do not call it a complete A2 course. Visual sampling supports the topic map, not a claim that every exercise has been transcribed or evaluated.

3. **My First English Book**, Integrate Ireland Language and Training, 2005/2006. Supplied as `first_englishbook.pdf`; 48 pages. Teacher notes on PDF page 3 explicitly target preschool/infant classes. Page 4 maps self, family, school, colours/shapes, clothes, animals, food and seasons. Oral naming, counting and colouring dominate. The classroom and clothing activities support pre-A1 visual scaffolding. Replace infant contexts with age-appropriate tasks rather than importing them unchanged for 13-18+ learners.

4. **English Grammar in Use, Fifth Edition**, Raymond Murphy / Cambridge, 2019. Supplied as `MUCLecture_2022_5217521.pdf`; 392 pages. Contents on PDF pages 5-8 list 145 units covering tenses, modals, conditionals, passive, reported speech, verb patterns, relative clauses, determiners, connectors and prepositions. Student/teacher notes explicitly target intermediate learners and exclude elementary learners. The teacher note on PDF page 12 was checked visually. Units are grouped by grammar, not ordered by difficulty. Use it mainly to organise B1-B2 grammar, with selected advanced review. It is not a complete advanced vocabulary, listening, reading, speaking or writing programme.

5. **Pre A1 Starters Word List Picture Book**, Cambridge English. Supplied as `starters-word-list-picture-book.pdf`; 36 pages. The cover explicitly says pre-A1. Topics include body, zoo, clothes, birthday, food, home, school, beach, street and games, followed by an A-Z list. The introduction and zoo scene were checked alongside extracted vocabulary sections. Use the word categories and visual comprehension approach. The chart showing other Cambridge exams does not make this book an A1-C2 course.

## Original content and provenance

New questions, reading passages and SVG drawings are original AI-assisted work. The PDFs inform topics and teaching concepts; no textbook exercises, scans or illustrations were reproduced in the repository. Existing A1 material is inherited from the repository and has no documented external provenance.

Question references point to pedagogical source introductions/contents, not to an identical exercise in a book. Original C1-C2 drafts use an additional reference, the Council of Europe CEFR global scale:

https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-%20cefr-3.3-common-reference-levels-global-scale

Independent English/French linguistic review remains necessary. The supplied PDFs were not committed.

## Composed learning progression

| Stage | Communicative objectives | Teaching formats |
|---|---|---|
| Pre-A1 foundation within A1 | Recognise objects, count, greet and identify oneself | Pictures, recognition, matching, spelling |
| A1 | Ask basic questions and describe immediate surroundings | Vocabulary, concrete grammar, pictures, sentence ordering |
| A2 | Handle everyday exchanges, directions, purchases and plans | Short texts, past events, comparisons, polite requests |
| B1 | Narrate experiences, explain choices and cooperate | Perfect/past contrasts, advice, conditionals, reading for purpose |
| B2 | Evaluate arguments and explain processes | Deduction, concession, evidence, passive and reported speech |
| C1 | Interpret implicit meaning, synthesise and control register | Hedging, cohesion, inferential reading and synthesis |
| C2 | Preserve fine distinctions and reconstruct discourse | Pragmatic nuance, rhetoric, faithful reformulation and multi-source synthesis |

CEFR attainment concerns capabilities across skills. Neither vocabulary counts nor closed-answer grammar exercises establish a level. The current activities do not adequately assess spontaneous speaking, extended writing or sustained interaction.

## Implemented content

| Level | Units | Lessons | Vocabulary entries | Scheduled activities |
|---|---:|---:|---:|---:|
| A1 | 12 | 48 | 480 | 646 |
| A2 | 2 | 8 | 40 | 80 |
| B1 | 2 | 8 | 40 | 80 |
| B2 | 2 | 8 | 40 | 80 |
| C1 | 2 | 8 | 40 | 80 |
| C2 | 2 | 8 | 40 | 80 |
| Total | 22 | 88 | 680 | 1,046 |

There are 232 sentence-building phrases. Vocabulary entries include contextual duplicates; they are not 680 distinct English headwords. Every scheduled single-word target occurs once across new lessons. Some A1 vocabulary remains guide-only.

Four original SVG scenes depict a room, classroom, picnic and street. Ten A1 picture questions currently use the first three; the street asset is available for extension. Other activities include French-to-English selection, meanings, listening recognition, sentence assembly, matching, grammar/context choices, reading and dictation/spelling.

Stable question IDs replace the former small random target pool. Options shuffle; the scheduled targets do not. Completed-lesson replay and mistake retries remain intentional repetition. Matching revisits vocabulary through a distinct activity. The guarantee concerns distinct fresh scheduled questions, not infinite never-repeating practice.

## Implementation and compatibility

- Active bank: `content/en/course.json`; editable A1 base: `content/en/A1.json`.
- `python3 tools/compose-english-course.py` reproducibly assembles the authored bank without reading PDFs.
- Legacy engine API names are retained for compatibility.
- English guides, parent report word lookup and all map popovers use the active bank.
- The course map waits for loading instead of showing the legacy five-unit fallback.
- Choice answer IDs survive retry shuffling; skipping reveals the answer and explanation.
- Silent devices receive written alternatives.
- A1 completion indexes are preserved. Progress remains browser-local; existing learners must replay completed steps to see changed content.

## Verification

Content validation, duplicate checks, source/page bounds, image references, JavaScript syntax and whitespace checks passed. Engine consistency tests passed with seeds 42 and 2026, each covering the complete 1,046-question schedule and 2,000 lesson constructions.

In the in-app browser: a picture answer was accepted; skipping grammar showed its answer and explanation; the correct shuffled retry was accepted; a C2 reading interpretation was accepted at 420x860; all matching pairs completed; silent dictation became a written spelling exercise and accepted its answer. No browser errors were recorded during these checks. An earlier A1 test completed a whole lesson with a deliberate error and successful retry.

The standalone Playwright suite could not launch Chromium because of the macOS sandbox Mach-port restriction. Full new-course browser completion, network-retry/Spanish regression and real iOS/Android acceptance testing remain outstanding. Mechanical tests do not certify linguistic quality or CEFR calibration.

## Work still needed for complete user-ready levels

Expand A2-C2 beyond two pilot units per level, against a full communication/vocabulary specification. Add authentic or suitably licensed listening, speaking tasks, extended writing and feedback rubrics. Obtain independent language review, including alternative sentence orders and advanced difficulty. Add placement/level-entry paths, mastery/review scheduling and cross-device progress. Complete mobile acceptance tests.

This release provides a testable foundation. It must not be advertised as a complete A1-C2 English course merely because every level contains activities.
