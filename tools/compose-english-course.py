"""Build original activities from a documented topic/grammar map, never PDF exercises."""
import json,re,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
d=json.loads((root/'content/en/A1.json').read_text())
def tokens(s):return re.findall(r"[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|[^\w\s]",s)
def choices(rows,source):
    result=[]
    for row in rows.strip().splitlines():
        prompt,correct,a,b,c,note=row.split('|')
        result.append(dict(type='choice',prompt=prompt,choices=[correct,a,b,c],answer=0,explanation=note,objective='grammar-in-context',sourceRefs=[source]))
    return result
a1=[
'''Lina ___ fourteen years old.|is|are|am|be|Avec un sujet singulier, on emploie is.
I ___ from Oran.|am|is|are|be|Avec I, on emploie am.
You meet a friend at 8 a.m. What do you say?|Good morning!|Good night!|Goodbye!|See you later!|Le matin, on salue avec Good morning.
Your friend says Thank you. Choose a reply.|You're welcome.|I'm fourteen.|Good night.|I am from Oran.|You're welcome répond à un remerciement.''',
'''My sister and I ___ at home.|are|is|am|be|Deux personnes forment un sujet pluriel : are.
This is Sami. ___ is my brother.|He|She|They|We|He reprend Sami, un frère.
These are my cousins. ___ live near us.|They|He|She|It|They reprend plusieurs cousins.
Nora has a brother. ___ brother is ten.|Her|His|Their|Our|Her indique le frère de Nora.''',
'''I would like ___ apple, please.|an|a|two|many|On emploie an devant le son voyelle de apple.
There is ___ milk in the cup.|some|an|many|a|Milk est indénombrable : some milk.
How ___ eggs do we need?|many|much|a|an|On peut compter les œufs : How many eggs?
I am thirsty. Can I have some ___?|water|bread|rice|cheese|Thirsty signifie avoir soif : on demande à boire.''',
'''A bird ___ fly.|can|is|has|does|Can est suivi du verbe sans to.
There are two ___ in the field.|sheep|sheeps|sheepes|sheeping|Le pluriel de sheep est sheep.
The cat is sleeping now. It ___ running.|isn't|aren't|don't|doesn't|Avec It et un verbe en -ing : isn't.
I have one mouse. My friend has three ___.|mice|mouses|mouse|mices|Le pluriel de mouse est mice.''',
'''A red pen and a blue pen are two ___.|colours|animals|meals|days|Red et blue désignent des couleurs.
Choose the usual word order.|a green bag|a bag green|green a bag|bag a green|L'adjectif de couleur précède le nom.
___ colour is your notebook?|What|Who|When|How many|What colour demande la couleur.
I like this drawing. ___ is beautiful.|It|He|They|We|It reprend une chose au singulier.''',
'''Nina has 10 pens and gets 3 more. How many pens does she have?|thirteen|twelve|fourteen|thirty|Ten plus three equals thirteen.
Choose the sentence about age.|I am fifteen years old.|I have fifteen years old.|I is fifteen years old.|I are fifteen years old.|En anglais, on exprime l'âge avec be.
There ___ twenty students in the room.|are|is|am|be|Twenty students est pluriel : there are.
Which number comes after nineteen?|twenty|eighteen|thirty|twelve|Twenty suit nineteen.''',
'''Our teacher ___ English every day.|teaches|teach|teaching|are teach|Au présent simple, troisième personne : teaches.
Please ___ your books.|open|opens|opening|opened|Une consigne commence par le verbe à la base.
___ you understand this question?|Do|Does|Is|Are|Au présent simple avec you, la question commence par Do.
I do not ___ my phone in class.|use|uses|using|used|Après do not, le verbe garde sa forme de base.''',
'''There ___ a lamp beside the bed.|is|are|am|be|A lamp est singulier : there is.
There ___ two windows in this room.|are|is|am|be|Two windows est pluriel : there are.
___ is the kitchen? It is downstairs.|Where|Who|When|How many|Where demande un lieu.
This is my room. ___ door is white.|Its|It's|Their|They|Its est possessif. It's signifie it is.''',
'''I have two ___.|feet|foots|foot|feets|Le pluriel de foot est feet.
___ your hands before lunch.|Wash|Washes|Washing|Washed|À l'impératif, on emploie Wash.
She ___ tired today.|is|are|am|be|Avec she, on emploie is.
My brother has brown ___.|hair|hairses|a hairs|an hair|Pour la chevelure, hair est indénombrable.''',
'''These shoes ___ new.|are|is|am|be|Shoes est pluriel : are.
I ___ a blue shirt today.|am wearing|wears|is wearing|are wearing|Avec I et une action en cours : am wearing.
This coat belongs to me. It is ___.|mine|my|me|I|Mine signifie le mien sans répéter coat.
Can I try ___ this jacket?|on|under|behind|between|Try on signifie essayer un vêtement.''',
'''It ___ raining now.|is|are|am|be|Avec it, le présent continu utilise is.
In winter, the weather is often ___.|cold|hungry|thirsty|young|Cold décrit une température basse.
Take an umbrella because it is ___.|rainy|delicious|tired|old|Un parapluie convient à un temps pluvieux.
We ___ snow in summer in this hot city.|never see|see never|never sees|sees never|Never se place avant le verbe principal.''',
'''The lesson starts ___ nine o'clock.|at|on|in|under|On emploie at pour une heure précise.
We play basketball ___ Saturday.|on|at|in|under|On emploie on devant un jour.
I study ___ the evening.|in|on|at|behind|On dit in the evening.
It is 7:30. Choose the time.|half past seven|quarter past seven|quarter to seven|half past eight|Half past seven signifie sept heures et demie.'''
]
scene_rows={
2:[('picnic','How many apples are in the basket?','Three','Two','Four','One'),('picnic','How many cups are on the blanket?','Two','Three','One','Four')],
4:[('room','What colour is the ball?','Blue','Red','Green','Yellow')],
5:[('classroom','How many books are in the pile?','Three','Two','Four','Five')],
6:[('classroom','Which object is between the books and the pencil cup?','A laptop','A ball','A bed','A bicycle'),('classroom','Where is the board?','On the wall','Under the desk','On the floor','Inside the bag')],
7:[('room','Where is the ball?','Under the chair','On the bed','Behind the window','On the lamp'),('room','Where is the lamp?','Beside the bed','Under the chair','Inside the window','On the book')],
10:[('picnic','Which description fits the sky?','It is sunny.','It is snowing.','It is raining.','It is foggy.')],
11:[('classroom','What time does the clock show?','Nine o’clock','Twelve o’clock','Three o’clock','Six o’clock')]
}
# Page numbers below are PDF positions, not the printed page numbers.
# References document topic inspiration; original questions are not textbook copies.
a1_topic_sources = [
    [('play-english',[8,9,10,11]),('first-english',[5,6,7]),('starters',[7])],
    [('play-english',[12]),('first-english',[6,9]),('starters',[12,13,29])],
    [('play-english',[41,42,43,44]),('picture-grammar',[50,51,52,53,54,55,58]),('first-english',[21,22,23,24]),('starters',[14,15])],
    [('play-english',[32,33,34,35,36,37,38,39,40]),('picture-grammar',[16,17,18,19,20,21]),('starters',[8,9,28])],
    [('play-english',[49,50]),('picture-grammar',[4,5,6,7,8,9]),('first-english',[26,27,28,29,30,31,32,33,34]),('starters',[10,11])],
    [('play-english',[10,11,54]),('picture-grammar',[56,57,58,59,60,61]),('starters',[25,31])],
    [('play-english',[14,15,16,17]),('picture-grammar',[24,25,26,27,28,29]),('first-english',[10,11,12,13,14]),('starters',[18,19])],
    [('play-english',[18,19,20]),('picture-grammar',[52,55]),('first-english',[31]),('starters',[16,17,26,29])],
    [('play-english',[25,26,27,28]),('first-english',[5]),('starters',[7,28])],
    [('play-english',[29]),('picture-grammar',[4,5,6,7,8,9,10,11,12,13,14,15]),('first-english',[15,16,17,18,19,20]),('starters',[10,11,29])],
    [('play-english',[45,46,47,48]),('picture-grammar',[30,31,32,33,34,35]),('first-english',[35,36,37,38,39])],
    [('play-english',[41,42,55,58]),('picture-grammar',[30,31,32,33,34,35]),('starters',[20,21,22,23])]
]
def topic_refs(ui):
    return [dict(sourceId=source,pdfPages=pages) for source,pages in a1_topic_sources[ui]]

for ui,u in enumerate(d['units']):
    u['level']='A1';u['status']='review-required'
    u['sourceRefs']=topic_refs(ui)
    u['sourceRefUse']='topic-inspiration; original activities require independent review'
    for li,q in enumerate(choices(a1[ui],dict(sourceId='picture-grammar',pdfPages=[3]))):
        q['sourceRefs']=topic_refs(ui)
        q['id']=f'en-a1-u{ui}-grammar-{li}';u['lessons'][li]['questions'].insert(5,q)
    # A matching round is distinct from a vocabulary question, and is labelled review.
    u['lessons'][3]['questions'].append(dict(id=f'en-a1-u{ui}-match',type='match',pairIds=[w['id'] for w in u['words'][:4]],objective='vocabulary-review',sourceRefs=topic_refs(ui)))
    for li,(scene,prompt,*opts) in enumerate(scene_rows.get(ui,[])):
        u['lessons'][li]['questions'].append(dict(id=f'en-a1-u{ui}-picture-{li}',type='choice',prompt=prompt,choices=opts,answer=0,image=f'assets/english/{scene}.svg',imageAlt=f'Illustration originale : {scene}',objective='picture-comprehension',explanation='Observe les objets, leur nombre et leur position dans le dessin.',sourceRefs=topic_refs(ui)))

# Each extension unit has four compact lessons. These are reviewed-course candidates,
# not a claim that forty questions establish CEFR proficiency.
extension=[
('A2','Voyages et déplacements','🧭','Past simple, directions, questions',
'''journey|trajet;ticket|billet;station|gare;airport|aéroport;passenger|passager;platform|quai;arrive|arriver;leave|partir;return|revenir;turn|tourner;straight ahead|tout droit;opposite|en face de;map|carte;cross|traverser;traffic|circulation;travel|voyager;miss|rater;catch|attraper / prendre;delay|retard;luggage|bagages''',
'''Yesterday, we ___ to the station.|walked|walk|walking|walks|Yesterday situe l'action au passé : walked.
___ you take the bus yesterday?|Did|Do|Does|Are|Une question au passé simple commence par Did.
We did not ___ the last train.|miss|missed|missing|misses|Après did not, le verbe est à la base.
The train ___ at six yesterday.|left|leave|leaves|leaving|Le passé de leave est left.
The station is on the other side of the road, ___ the café.|opposite|inside|under|upstairs|Opposite signifie en face de.
How ___ was your ticket? It cost five pounds.|much|many|often|long|How much demande un prix.
I went to the airport ___ bus.|by|on|at|into|On dit by bus pour le moyen de transport.
___ is the nearest bus stop? It is beside the library.|Where|Who|When|Whose|Where demande un lieu.''',
'''We bought our tickets at the station.|Nous avons acheté nos billets à la gare.
Did you catch the morning train?|As-tu pris le train du matin ?
The passengers waited on the platform.|Les passagers ont attendu sur le quai.
Turn left after the bookshop.|Tourne à gauche après la librairie.''',
'''The train leaves at 10:00. Sami reaches the platform at 10:05. The train has already left.|Why does Sami need another train?|He arrived too late.|He arrived early.|He bought no luggage.|He walked too slowly yesterday.
Nora asks for a return ticket. She plans to go to the city and come back today.|Which ticket does Nora need?|A ticket for both journeys.|A ticket only to the city.|A ticket for tomorrow only.|A ticket for another passenger.
The museum is opposite the station. A café is beside the museum.|Where is the museum?|Across from the station.|Inside the station.|Behind the airport.|Under the café.
The bus is delayed by ten minutes. It usually arrives at 8:20.|When is the bus expected today?|At 8:30.|At 8:10.|At 8:20.|At 9:20.'''),
('A2','Achats et projets','🛒','Comparatives, quantities, plans, polite requests',
'''cheap|bon marché;expensive|cher;receipt|reçu;cash|espèces;change|monnaie rendue;customer|client;shop assistant|vendeur;discount|réduction;pay|payer;cost|coûter;order|commander;menu|menu;snack|encas;enough|assez;too much|trop (quantité);better|meilleur;cheaper|moins cher;plan|prévoir;invite|inviter;appointment|rendez-vous''',
'''This bag costs ten pounds. That bag costs twenty. This bag is ___.|cheaper|more expensive|the most expensive|as expensive|Cheaper est le comparatif de cheap.
I am going to ___ a new notebook tomorrow.|buy|bought|buying|buys|Going to est suivi du verbe à la base.
There aren't ___ apples left.|any|an|much|a|Dans une négation au pluriel, on utilise any.
How ___ bread would you like?|much|many|a|an|Bread est indénombrable : How much?
This soup is ___ hot to eat.|too|enough|many|any|Too hot signifie trop chaud.
We have ___ money for two tickets, so we can buy them.|enough|too|many|an|Enough money signifie assez d'argent.
___ I have the menu, please?|Could|Mustn't|Did|Was|Could I... est une demande polie.
This meal is ___ than yesterday's meal.|better|good|best|well|Le comparatif de good est better.''',
'''Could I pay by card, please?|Puis-je payer par carte, s'il vous plaît ?
We are going to invite our neighbours.|Nous allons inviter nos voisins.
This jacket is cheaper than that coat.|Cette veste est moins chère que ce manteau.
There is enough rice for everyone.|Il y a assez de riz pour tout le monde.''',
'''A notebook costs four pounds. Lina gives the assistant five pounds.|How much change should Lina receive?|One pound.|Four pounds.|Five pounds.|Nine pounds.
Nora wants a cold snack. The menu offers soup, ice cream, tea and hot chocolate.|Which item matches her request?|Ice cream.|Soup.|Tea.|Hot chocolate.
Sam can spend twelve pounds. The blue shirt costs ten and the red shirt costs fifteen.|Which shirt can Sam afford?|The blue shirt.|Only the red shirt.|Both shirts together.|Neither shirt.
The shop closes at 18:00. Aya plans to arrive at 17:30 and shop for ten minutes.|Will she finish before closing time?|Yes, at 17:40.|No, at 18:10.|No, at 18:30.|Yes, at 16:40.'''),
('B1','Expériences et récits','📖','Present perfect, past continuous, past sequencing',
'''experience|expérience;achieve|réussir à atteindre;challenge|défi;discover|découvrir;improve|améliorer;develop|développer;journey abroad|voyage à l'étranger;opportunity|occasion;recently|récemment;already|déjà;yet|encore (négation);since|depuis (point de départ);for years|depuis des années;used to|avait l'habitude de;memory|souvenir;unexpected|inattendu;suddenly|soudain;meanwhile|pendant ce temps;eventually|finalement;fortunately|heureusement''',
'''I have lived here ___ 2021.|since|for|during|ago|Since est suivi du point de départ.
She has studied English ___ three years.|for|since|ago|at|For est suivi d'une durée.
Have you finished your project ___?|yet|yesterday|ago|last week|Yet s'emploie souvent dans les questions au present perfect.
At eight last night, I ___ a story.|was reading|read every day|am reading|have read tomorrow|Une action en cours à un moment passé utilise le past continuous.
While we were walking home, it ___ to rain.|started|starts|has start|starting|L'événement qui interrompt se met au past simple.
When I was younger, I ___ play chess every evening.|used to|use to|am used|using to|Used to exprime une habitude passée.
I ___ this film twice in my life.|have seen|saw yesterday|am see|was see|Une expérience de vie non datée utilise le present perfect.
We visited the museum ___.|last Saturday|since Saturday|yet|for Saturday|Une date passée terminée convient au past simple.''',
'''I have never travelled abroad.|Je n'ai jamais voyagé à l'étranger.
We were studying when the lights went out.|Nous étudiions quand les lumières se sont éteintes.
She has already finished the report.|Elle a déjà terminé le rapport.
I used to walk to school every day.|J'avais l'habitude d'aller à l'école à pied tous les jours.''',
'''Lina started learning English in 2022 and still studies it today. She took a short Spanish course last summer and stopped afterwards.|Which activity continues now?|Learning English.|Taking the Spanish course.|Studying neither language.|Starting school in 2022.
We were preparing dinner when the power went off. We found a torch and ate sandwiches instead.|What changed their dinner plans?|A power cut.|A broken torch.|A late visitor.|A shopping trip.
Adam had never spoken to visitors in English before. Yesterday, he gave directions to two tourists and felt proud.|Why was this experience important to Adam?|He used English in a new real situation.|He visited two countries.|He passed a driving test.|He learned no new skill.
Aya missed the first bus but caught the next one. Fortunately, she reached the interview five minutes before it began.|What was the outcome?|She arrived in time.|She missed the interview.|She took the first bus.|She cancelled her plans.'''),
('B1','Choix et coopération','🤝','Advice, first and second conditionals, relative clauses',
'''decision|décision;choice|choix;suggest|suggérer;recommend|recommander;agree|être d'accord;disagree|ne pas être d'accord;support|soutenir;volunteer|bénévole;organise|organiser;prepare|préparer;purpose|but;result|résultat;responsibility|responsabilité;teamwork|travail d'équipe;solution|solution;instead|à la place;unless|à moins que;although|bien que;available|disponible;reliable|fiable''',
'''If it rains tomorrow, we ___ indoors.|will stay|stayed|would stayed|staying|Premier conditionnel : if + présent, will + verbe.
If I had more free time, I ___ join the club.|would|will|am|did|Une situation hypothétique utilise would.
You look exhausted. You ___ take a break.|should|mustn't|can't|did|Should permet de donner un conseil.
This is the volunteer ___ organised the event.|who|where|when|whose|Who reprend une personne comme sujet.
We won't start ___ everyone arrives.|until|during|for|despite|Until indique la limite d'attente.
___ it was raining, they finished the outdoor game.|Although|Because of|Despite|Unless|Although introduit une proposition avec sujet et verbe.
I enjoy ___ with other students.|working|to working|work|worked|Enjoy est suivi d'un verbe en -ing.
She suggested ___ the meeting earlier.|starting|to start|start|started|Suggest est suivi d'un verbe en -ing.''',
'''If we work together, we will finish sooner.|Si nous travaillons ensemble, nous finirons plus tôt.
You should check the information first.|Tu devrais d'abord vérifier les informations.
The student who organised the event is here.|L'élève qui a organisé l'événement est ici.
Although it was difficult, we found a solution.|Bien que cela ait été difficile, nous avons trouvé une solution.''',
'''The club needs a reliable person to open the room at 9:00. Sami often arrives at 9:20. Nora has arrived before 8:50 every week.|Who is the stronger choice for this task?|Nora, because she is consistently early.|Sami, because he arrives later.|Both, because arrival time is irrelevant.|Neither, because they live nearby.
The team has three days to finish. Lina suggests dividing the work so that each person has a clear responsibility.|What is the purpose of her suggestion?|To make the work easier to organise.|To remove the deadline.|To let one person do everything.|To cancel the project.
Omar disagrees with the first plan, but he offers a practical alternative and listens to the others.|How does Omar contribute?|He disagrees constructively.|He refuses all discussion.|He accepts the first plan silently.|He avoids proposing a solution.
The library room is available on Monday but not Tuesday. The team can meet on either day.|Which plan fits the information?|Meet in the library on Monday.|Meet in the library on Tuesday.|Assume the room is always open.|Cancel without checking Monday.'''),
('B2','Arguments et preuves','🔎','Concession, deduction, hypothetical outcomes, nuance',
'''evidence|éléments de preuve;claim|affirmation;assumption|hypothèse;bias|parti pris;perspective|point de vue;convincing|convaincant;misleading|trompeur;accurate|exact;relevant|pertinent;consequence|conséquence;drawback|inconvénient;benefit|avantage;whereas|tandis que;nevertheless|néanmoins;moreover|de plus;otherwise|sinon;evaluate|évaluer;justify|justifier;assess|évaluer méthodiquement;conclude|conclure''',
'''___ the high cost, the committee approved the plan.|Despite|Although|Even though|Because|Despite est suivi ici d'un groupe nominal.
The lights are off and the door is locked. They ___ have left.|must|mustn't|ought|are|Must have + participe exprime une déduction sur le passé.
If they had checked the timetable, they ___ missed the train.|wouldn't have|won't have|didn't have|aren't|Troisième conditionnel : would have + participe.
The first report is detailed, ___ the second gives only a summary.|whereas|despite|otherwise|unless|Whereas marque un contraste entre deux propositions.
The result was disappointing. ___, the team learned a great deal.|Nevertheless|Because|Unless|During|Nevertheless exprime une concession.
The evidence is too limited ___ a firm conclusion.|to support|supporting|support|supported|Too + adjectif + to + verbe indique une limite.
She is used to ___ different viewpoints.|considering|consider|considered|considers|Be used to est suivi d'un nom ou d'un verbe en -ing.
We need more data; ___, our conclusion may be unreliable.|otherwise|moreover|despite|whereas|Otherwise décrit ce qui se passe si l'on ne le fait pas.''',
'''Despite the delay, the project was completed.|Malgré le retard, le projet a été terminé.
They must have misunderstood the instructions.|Ils ont dû mal comprendre les consignes.
If we had checked, we would have noticed the error.|Si nous avions vérifié, nous aurions remarqué l'erreur.
The evidence does not support that conclusion.|Les éléments de preuve n'étayent pas cette conclusion.''',
'''A school survey found that 18 of 20 students in one music club preferred evening lessons. The report concludes that all students prefer evening lessons.|What is the main weakness of the conclusion?|It generalises from a small, specific group.|It includes too many schools.|It proves every student agrees.|It compares morning and evening fairly.
One review calls an app easy to use but gives no examples. Another describes completing three tasks and explains where users became confused.|Which review offers stronger supporting detail?|The review with task examples.|The review with no examples.|Both contain identical evidence.|Neither describes user experience.
The proposal could reduce travel time, but it would also increase ticket prices. The writer discusses both outcomes before recommending a trial.|How is the argument developed?|By weighing a benefit against a drawback.|By ignoring every cost.|By presenting an unrelated story.|By proving that a trial has already succeeded.
Two surveys report different results. One questioned adults online; the other interviewed teenagers at school.|What should be checked before comparing them?|Whether the participant groups and methods differ.|Only which title is shorter.|Whether both use the same font.|Only the date of the next school holiday.'''),
('B2','Rapports et organisation','📝','Passive, reported speech, relative clauses, causatives',
'''procedure|procédure;deadline|date limite;requirement|exigence;proposal|proposition;approach|approche;outcome|résultat final;priority|priorité;resource|ressource;efficient|efficace (sans gaspillage);feasible|réalisable;implement|mettre en œuvre;revise|réviser / modifier;monitor|suivre / surveiller;allocate|attribuer;participate|participer;negotiate|négocier;clarify|clarifier;confirm|confirmer;maintain|maintenir;resolve|résoudre''',
'''The final report ___ by two reviewers before publication.|was checked|checked|was checking|has checking|Le passif au passé utilise was + participe.
Sam said, I am busy today. Later, I reported that Sam ___ busy that day.|was|is tomorrow|were|be|Le discours indirect au passé utilise ici was.
The manager asked where the files ___.|were stored|did store|are storing yesterday|storing|Dans une question indirecte, on garde l'ordre sujet-verbe.
The researcher, ___ report we discussed, will join us.|whose|who|which|where|Whose exprime la possession.
We had the damaged screen ___ yesterday.|replaced|replace|replacing|to replace|Have something done décrit un service effectué pour nous.
The proposal ___ at the moment, so no decision has been made.|is being reviewed|reviews|has reviewing|reviewed tomorrow|Le passif en cours utilise is being + participe.
By noon yesterday, the team ___ the first draft.|had completed|has completed|will complete|completes|Le past perfect situe l'action avant un autre moment passé.
She asked me ___ the revised schedule.|to confirm|confirming|confirm|confirmed|Ask someone est suivi de to + verbe.''',
'''The results were checked before publication.|Les résultats ont été vérifiés avant la publication.
She asked where the documents were stored.|Elle a demandé où les documents étaient conservés.
We had the computer repaired last week.|Nous avons fait réparer l'ordinateur la semaine dernière.
The team had completed the draft by noon.|L'équipe avait terminé le brouillon avant midi.''',
'''A team has a fixed budget. It buys equipment before checking what is already available and then discovers several duplicates.|Which action would have reduced waste?|Checking existing resources before purchasing.|Buying more duplicates.|Removing the budget limit.|Ignoring the equipment list.
The report states that a procedure is being reviewed. It does not say the new procedure has been approved.|Which statement is supported?|The review is still in progress.|Approval has already been granted.|The procedure was never examined.|Implementation is complete.
Lina writes: Please confirm whether Friday is feasible. If not, suggest another date. She wants a reply before allocating tasks.|What does she need first?|Confirmation of a workable date.|A completed final report.|Proof that all tasks are finished.|A list of unrelated meetings.
The team completed its draft at 11:00. A reviewer arrived at noon and suggested revisions. The team submitted the revised version at 15:00.|What happened before the reviewer arrived?|The first draft was completed.|The revised version was submitted.|The reviewer suggested changes.|The final deadline was cancelled.''')
]
extension += [
('C1','Nuance et registre','💬','Hedging, emphasis, formal register, implicit meaning',
'''tentative|provisoire / prudent;plausible|plausible;subtle|subtil;implicit|implicite;explicit|explicite;ambiguity|ambiguïté;qualify a claim|nuancer une affirmation;hedge|exprimer une réserve;convey|transmettre un sens;infer|déduire du contexte;stance|position adoptée;reservation|réserve;notwithstanding|malgré;arguably|on peut soutenir que;presumably|vraisemblablement;albeit|bien que;underlying|sous-jacent;compelling|très convaincant;coherent|cohérent;articulate|exprimer clairement''',
'''Which wording makes a cautious claim?|The findings appear to suggest a link.|The findings prove everything.|The findings remove all doubt.|The findings are unquestionably final.|Appear to suggest exprime une réserve sur la force de la conclusion.
Not only ___ the error, but she also proposed a solution.|did she identify|she identified|she did identify|identified she|Après Not only en tête, on inverse auxiliaire et sujet.
The explanation is plausible, ___ incomplete.|albeit|despite|unless|whereas|Albeit peut précéder un adjectif et signifie bien que.
Choose the most formal request.|I would appreciate clarification of this point.|Tell me what you mean, okay?|What's that supposed to mean?|Come on, explain it.|I would appreciate... convient à une demande formelle et polie.
Rarely ___ such a carefully qualified conclusion.|have I read|I have read|I read have|read I have|Rarely en tête entraîne une inversion.
Which sentence distinguishes possibility from certainty?|This may reflect a change in priorities.|This definitely reflects a change in priorities.|This must reflect a change in priorities.|This unquestionably reflects a change in priorities.|May présente une possibilité plutôt qu'une certitude.
The report is coherent, ___ some of its assumptions remain untested.|although|despite|notwithstanding|because of|Although introduit une proposition complète.
Choose the sentence with the strongest explicit reservation.|The proposal is promising, but its costs remain unclear.|The proposal is promising and fully costed.|The proposal is promising without any drawback.|The proposal is promising in every respect.|But introduit ici une réserve précise sur les coûts.''',
'''The findings appear to support a cautious conclusion.|Les résultats semblent étayer une conclusion prudente.
Not only did she identify the issue, but she also resolved it.|Elle a non seulement identifié le problème, mais elle l'a aussi résolu.
The argument is coherent, albeit incomplete.|L'argument est cohérent, bien qu'incomplet.
I would appreciate clarification of the underlying assumptions.|Je vous serais reconnaissant de clarifier les hypothèses sous-jacentes.''',
'''In a review, Mara writes: The proposal offers a coherent account of the problem, and its central recommendation is plausible. However, the available data concern only one region, and the author has not explained whether the same conditions apply elsewhere. A broader trial would therefore be useful before implementation.|What is Mara's overall stance?|Cautious support with a specific evidential reservation.|Unqualified approval of immediate implementation.|Rejection of the proposal as incoherent.|Indifference to the scope of the data.
The chair says: We could perhaps revisit the timetable once the resource estimates are clearer. No one has yet approved the extra staffing. The secretary records this as a suggestion to reconsider the timetable, rather than as an instruction to change it immediately.|Why is the secretary's wording appropriate?|The chair's language is tentative and conditional.|The chair issued an unconditional command.|The staffing increase was already approved.|The timetable was explicitly cancelled.
An email begins: I appreciate the considerable work that has gone into the draft. Before we circulate it more widely, it would be helpful to distinguish verified results from preliminary observations. The sender then identifies two paragraphs that mix the two categories.|What is the main communicative purpose?|To request a specific revision while acknowledging the work.|To praise the draft without requesting changes.|To accuse the team of deliberate deception.|To announce that the draft has already been published.
One contributor calls the findings compelling. Another replies: They are certainly interesting, although the sample is rather narrow. The second contributor does not dispute the observations themselves, but questions how far the conclusions can extend.|What is implied by the reply?|The evidence may not justify broad generalisation.|The observations have been proven false.|The sample includes every relevant population.|The conclusions should be strengthened without further study.'''),
('C1','Synthèse et raisonnement','🧩','Cohesion, synthesis, concession, academic precision',
'''synthesis|synthèse;consensus|consensus;discrepancy|écart entre éléments;correlation|corrélation;causation|relation de cause à effet;scope|portée;limitation|limite;methodology|méthodologie;robust|solide / robuste;provisional|provisoire;contradict|contredire;reconcile|concilier;substantiate|étayer par des preuves;distinguish|distinguer;conversely|à l'inverse;nonetheless|néanmoins;insofar as|dans la mesure où;to some extent|dans une certaine mesure;on balance|tout bien considéré;in light of|à la lumière de''',
'''Which connector introduces an opposite relationship?|Conversely|Furthermore|Similarly|For instance|Conversely annonce une relation inverse.
___ the limited sample, the conclusion should remain provisional.|In light of|In spite|Although|Unless|In light of signifie à la lumière de et précède un groupe nominal.
The two measures are correlated; this does not necessarily establish ___.|causation|a shared pattern|an association|co-variation|Une corrélation ne prouve pas un lien de cause à effet.
Which sentence accurately limits a conclusion?|The result applies to the participants studied.|The result applies to everyone everywhere.|The result establishes a universal law.|The result proves all alternatives false.|La portée est limitée aux participants effectivement étudiés.
Only after the methods were compared ___ the discrepancy.|did we understand|we understood|understood we|we did understood|Only after en tête entraîne l'inversion dans la proposition principale.
The account is useful ___ it explains the observed differences.|insofar as|unless|whereas|despite|Insofar as indique dans quelle mesure l'affirmation s'applique.
Choose a synthesis rather than a list.|Both reports favour a trial, but differ over its duration.|Report A has five pages. Report B has seven pages.|Report A has a cover. Report B has a contents page.|There are two reports on the table.|La synthèse met en relation les positions des deux textes.
Which phrase signals an overall judgement after weighing factors?|On balance|For example|In the meantime|Once upon a time|On balance annonce un jugement tenant compte de plusieurs facteurs.''',
'''The discrepancy can be explained by differences in methodology.|L'écart peut s'expliquer par des différences de méthodologie.
On balance, the evidence favours a limited trial.|Tout bien considéré, les éléments disponibles favorisent un essai limité.
Only after comparing the reports did we understand the difference.|Ce n'est qu'après avoir comparé les rapports que nous avons compris la différence.
The conclusion remains provisional in light of these limitations.|La conclusion reste provisoire à la lumière de ces limites.''',
'''Report A recommends a six-week trial because the team needs rapid feedback. Report B also supports a trial but proposes twelve weeks so that seasonal differences can be observed. Neither report recommends immediate permanent adoption. The disagreement concerns duration, rather than whether testing is needed.|Which synthesis preserves both agreement and disagreement?|Both favour testing, but differ on the time needed.|One supports testing and the other rejects it.|Both recommend immediate permanent adoption.|Both propose exactly the same schedule.
Two studies found higher attendance after a new timetable was introduced. In the first, transport was unchanged. In the second, additional buses began operating at the same time. A reviewer argues that the studies cannot establish the timetable's effect with equal confidence.|Why does the reviewer distinguish the studies?|The second includes another change that could influence attendance.|The second contains no attendance data.|The first also introduced additional buses.|Both isolate the timetable's effect equally well.
An evaluation reports that participants found the tool helpful, but some withdrew before completing the survey. The author notes that the responses may therefore underrepresent dissatisfied users and describes the positive findings as provisional.|What does the limitation concern?|Whether the respondents represent all participants.|Whether any participants used the tool.|Whether the survey contained a title.|Whether positive responses are impossible.
An editor asks a writer to combine three accounts into one briefing. The writer removes repeated details, retains conflicting explanations and identifies which claims are independently supported. The briefing avoids suggesting that agreement exists where the accounts differ.|Which feature best demonstrates effective synthesis?|Integrating information while preserving meaningful disagreements.|Copying the accounts in their original order.|Removing every conflicting claim.|Treating repeated claims as automatically proven.'''),
('C2','Précision du sens','🎯','Fine distinctions, pragmatic implication, idiomatic restraint',
'''equivocal|équivoque;unequivocal|sans équivoque;inadvertent|involontaire;deliberate|délibéré;ostensible|apparent / affiché;tacit|tacite;grudging|réticent;wholehearted|sans réserve;circumspect|circonspect;unwarranted|injustifié;tenable|défendable;misconstrue|mal interpréter;disavow|désavouer;concede|concéder;downplay|minimiser;overstate|exagérer la portée;by implication|implicitement;for all that|malgré cela;on the face of it|à première vue;with hindsight|avec le recul''',
'''Which phrase indicates reluctant rather than enthusiastic approval?|grudging acceptance|wholehearted endorsement|unqualified support|eager agreement|Grudging signale une acceptation réticente.
Which word describes a mistake made without intention?|inadvertent|deliberate|calculated|premeditated|Inadvertent signifie involontaire.
Choose the most precise description of an unclear response.|The response was equivocal.|The response was unequivocal.|The response was unambiguous.|The response was categorically clear.|Equivocal décrit une réponse qui admet plusieurs interprétations.
The author concedes that the trial was limited. What does concedes imply here?|Acknowledges a point that weakens the argument.|Denies that a trial occurred.|Proves the trial was unlimited.|Withdraws every claim in the article.|Concede peut marquer la reconnaissance d'un point défavorable.
Which sentence explicitly separates appearance from established fact?|On the face of it, the explanation seems plausible.|The explanation is conclusively proven.|The explanation is indisputably correct.|The explanation leaves no room for doubt.|On the face of it limite le jugement à l'apparence initiale.
Which phrase introduces a judgement made using knowledge gained later?|with hindsight|in advance|beforehand|at first sight|With hindsight signifie avec le recul.
For all that the report is detailed, its central claim remains unsupported. Choose the closest meaning.|Although detailed, the report does not substantiate its main claim.|Because detailed, the report proves its main claim.|The report is neither detailed nor relevant.|The report's detail makes evidence unnecessary.|For all that introduit ici une concession.
Which action would overstate the evidence?|Calling a tentative association a proven cause.|Describing an association as tentative.|Stating the sample size accurately.|Listing the study's limitations.|Overstate signifie présenter une portée ou une force excessive.''',
'''The response was deliberately cautious rather than merely vague.|La réponse était délibérément prudente plutôt que simplement vague.
With hindsight, the warning deserved closer attention.|Avec le recul, l'avertissement méritait davantage d'attention.
The author concedes the limitation without abandoning the central argument.|L'auteur concède la limite sans abandonner l'argument central.
On the face of it, the accounts appear consistent.|À première vue, les récits semblent cohérents.''',
'''After a lengthy discussion, the reviewer writes: I can live with the revised wording, provided we retain the qualification in the final sentence. The reviewer had previously objected to the broader claim. No additional evidence has been submitted, and the revision narrows the claim rather than strengthening its support.|Which interpretation is most defensible?|Conditional, reluctant acceptance of a narrower claim.|Enthusiastic endorsement of the original broad claim.|Confirmation that new evidence proves the original claim.|An unconditional instruction to remove the qualification.
The spokesperson says that the team did not intend to mislead readers, while acknowledging that the summary omitted an important limitation. A critic responds that intention and effect should not be conflated. The critic does not claim to know what individual team members believed.|What distinction is the critic drawing?|An omission can mislead regardless of whether deception was intended.|Every omission proves deliberate deception.|An absence of intent guarantees accurate interpretation.|The summary contained all relevant qualifications.
In a retrospective account, the writer describes the decision as understandable at the time but difficult to defend with hindsight. The information that later exposed its weaknesses was unavailable when the decision was made. The writer therefore resists calling the original decision either plainly irrational or ultimately sound.|Which paraphrase preserves the nuance?|The decision had a contemporary rationale but looks weaker in light of later knowledge.|The decision was irrational according to information everyone already had.|Later evidence conclusively vindicated the decision.|The writer refuses to assess the decision in any way.
An observer characterises the board's silence as tacit approval. The minutes, however, record that the board postponed discussion pending legal advice. A second observer cautions that silence under those circumstances need not imply endorsement. No vote was taken, and no member stated an opinion.|Which conclusion is warranted?|The available record does not establish approval.|The silence proves unanimous endorsement.|The postponement demonstrates unanimous rejection.|The absence of a vote makes the first observer's claim certain.'''),
('C2','Discours et reformulation','🗣️','Faithful reformulation, rhetoric, multi-source synthesis',
'''rhetoric|rhétorique;irony|ironie;understatement|atténuation volontaire;overstatement|exagération;implication|implication de sens;presupposition|présupposé;proviso|condition / réserve;caveat|mise en garde / réserve;proportional|proportionné;disparate|disparate;reconstruct|reconstituer;encapsulate|résumer en peu de mots;recast|reformuler;distort|déformer;foreground|mettre au premier plan;contextualise|mettre en contexte;corroborate|corroborer;contention|thèse défendue;rebuttal|réfutation;convergence|convergence''',
'''Which reformulation preserves a necessary caveat?|The estimate is useful, provided its uncertainty is acknowledged.|The estimate is useful and entirely certain.|The estimate is useless because all estimates are uncertain.|The estimate proves the outcome will occur.|Provided conserve la condition attachée au jugement.
Which sentence presupposes that an error has occurred?|When did you correct the error?|Did an error occur?|Could there have been an error?|Is the result free from errors?|When did you correct... suppose déjà l'existence d'une erreur corrigée.
Which is an understatement of a serious failure?|The system had a few difficulties, after a complete collapse.|The system collapsed completely.|Every service failed.|The failure affected all users.|A few difficulties atténue fortement un effondrement total.
Which paraphrase faithfully preserves some rather than all?|Several participants agreed.|Every participant agreed.|No participant disagreed.|Agreement was unanimous.|Several ne transforme pas une partie du groupe en totalité.
The report was not without merit. Choose the closest meaning.|The report had some merit.|The report had no merit.|The report was flawless.|The report proved every claim.|Not without merit reconnaît un mérite sans affirmer la perfection.
Which response addresses the claim rather than attacking its author?|The conclusion overlooks the smaller comparison group.|The author is an unpleasant person.|The author has a boring speaking style.|The author's clothes are unfashionable.|La critique porte sur le raisonnement et ses données.
Had the qualification been retained, the summary ___ more faithful.|would have been|would be tomorrow|will have been|is being|Une hypothèse passée utilise would have + participe.
Which sentence distinguishes corroboration from repetition?|Two independent records support the account.|Two copies repeat the same unsupported statement.|One statement is printed twice.|A claim appears in a larger font.|La corroboration apporte un appui indépendant.''',
'''The summary retains the original claim and its qualification.|Le résumé conserve l'affirmation originale et sa réserve.
Independent records corroborate the account.|Des documents indépendants corroborent le récit.
Had the context been retained, the quotation would have been less misleading.|Si le contexte avait été conservé, la citation aurait été moins trompeuse.
The rebuttal addresses the evidence rather than the speaker.|La réfutation porte sur les éléments de preuve plutôt que sur l'orateur.''',
'''Account A says that the pilot reduced delays at two sites, although staffing also increased. Account B reports no measurable change at a third site where staffing stayed constant. Account C recommends collecting comparable staffing and delay data before extending the pilot. A summary claims that all three accounts prove the pilot itself reduced delays everywhere.|Which revision most faithfully reconstructs the evidence?|Results vary across sites, and staffing differences prevent a simple causal conclusion.|All sites showed the same improvement caused solely by the pilot.|The pilot failed at every site and should immediately end.|The staffing information is irrelevant because three accounts exist.
An editorial calls a decision brave, then notes that those making it would bear none of the financial risk and had ignored repeated warnings. The positive adjective sits beside details that undermine its ordinary approving sense. The editorial provides no direct statement that the decision was wise.|What reading best fits the rhetorical context?|Brave is likely used ironically to criticise the decision.|Brave necessarily expresses unqualified praise.|The editorial avoids any evaluation of the decision.|The financial risk is offered as evidence of personal sacrifice.
The original report states that the intervention may benefit some participants under closely supervised conditions. A promotional summary states that the intervention benefits participants. The summary omits both the uncertainty marker and the conditions, while retaining the favourable core of the statement.|How has the meaning changed?|A qualified possibility has become a broader assertion.|A universal certainty has become a cautious possibility.|The conditions have been made more explicit.|The summary preserves every limitation accurately.
Two documents make identical claims and use the same wording. Later inspection shows that both copied a single unverified memorandum. A third document independently records events that support only part of the claim. A careful reconstruction separates the copied assertion from the independently supported portion.|Which principle should guide the synthesis?|Distinguish independent corroboration from duplicated assertions.|Count every copy as a separate confirming source.|Ignore the independently recorded events.|Present the entire claim as verified because it appears twice.''')
]
for level,name,emoji,objective,lex,grammar,phrases,readings in extension:
    ui=len(d['units']); uid=f'en-{level.lower()}-u{sum(u.get('level')==level for u in d['units'])}'
    source = dict(sourceId='cefr',section='Global scale: '+level) if level in ['C1','C2'] else dict(sourceId='murphy',pdfPages=[5,6,7,8,12])
    u=dict(id=uid,nom=name,emoji=emoji,level=level,status='pilot-review-required',objectives=[objective],words=[],phrases=[],lessons=[],sourceRefs=[source])
    for wi,row in enumerate(lex.split(';')):
        en,fr=row.split('|');u['words'].append(dict(id=f'{uid}-w{wi}',t=en,fr=fr,e=emoji,type='expression' if ' ' in en else 'word',unite=ui))
    for pi,row in enumerate(phrases.splitlines()):
        en,fr=row.split('|');u['phrases'].append(dict(id=f'{uid}-p{pi}',tokens=tokens(en),fr=fr,unite=ui))
    gs=choices(grammar,source)
    rs=[]
    for row in readings.splitlines():
        passage,prompt,*opts=row.split('|');rs.append(dict(type='choice',passage=passage,prompt=prompt,choices=opts,answer=0,objective='reading-comprehension',explanation='La réponse doit être justifiée par les informations du texte.',sourceRefs=[source]))
    for li in range(4):
        ws=u['words'][li*5:li*5+5]
        qs=[dict(type=['frToEn','meaning','listen','frToEn'][k],wordId=w['id'],objective='vocabulary') for k,w in enumerate(ws[:4])]
        qs+= [gs[li*2],dict(type='build',phraseId=u['phrases'][li]['id'],objective='sentence-order'),rs[li],gs[li*2+1],dict(type='match',pairIds=[w['id'] for w in ws[:4]],objective='vocabulary-review'),dict(type='dictation',wordId=ws[4]['id'],objective='spelling-listening')]
        for k,q in enumerate(qs):q['id']=f'{uid}-l{li}-q{k}'
        u['lessons'].append(dict(id=f'{uid}-l{li}',questions=qs))
    d['units'].append(u)
d['edition']='2026-10-10'
d['level']='A1-C2-draft'
d['courseStatus']='review-required-not-cefr-certified'
d['levels']=[dict(id='A1',title='Fondations',status='review-required'),dict(id='A2',title='Communication quotidienne',status='pilot-review-required'),dict(id='B1',title='Récits et coopération',status='pilot-review-required'),dict(id='B2',title='Arguments et rapports',status='pilot-review-required'),dict(id='C1',title='Nuance, synthèse et registre',status='original-draft-source-gap'),dict(id='C2',title='Précision et maîtrise du discours',status='original-draft-source-gap')]
d['sources']=[dict(id='play-english',title='Play English Kids',pages=68,role='Beginner topics and activity formats'),dict(id='picture-grammar',title='Picture Grammar for Children 2',pages=68,role='Basic grammar topics; scanned pages'),dict(id='first-english',title='My First English Book',pages=48,role='Pre-A1 oral learning and visual tasks'),dict(id='murphy',title='English Grammar in Use, Fifth Edition',pages=392,role='Intermediate grammar reference; not a complete skills curriculum'),dict(id='starters',title='Pre A1 Starters Word List Picture Book',pages=36,role='Pre-A1 vocabulary topics and visual comprehension')]
d['authorship']='Original AI-assisted exercises and original SVG scenes. Source books inform topic selection only. No textbook questions or illustrations reproduced. Independent linguistic review pending.'
d['sources'].append(dict(id='cefr',title='Council of Europe CEFR global scale',url='https://www.coe.int/en/web/common-european-framework-reference-languages/table-1-%20cefr-3.3-common-reference-levels-global-scale',role='Advanced draft objectives; not textbook source content or certification'))
(root/'content/en/course.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(len(d['units']),'units',sum(len(u['words']) for u in d['units']),'entries',sum(len(l['questions']) for u in d['units'] for l in u['lessons']),'questions')
