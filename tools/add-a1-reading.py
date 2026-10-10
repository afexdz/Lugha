"""Author original A1 microtexts; each answer includes its exact evidence."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
# Four contexts per topic, two questions per context. Correct option comes first.
rows = '''
Hello! My name is Lina. I am fourteen. I am from Algeria.|What is her name?|Lina|Sara|Emma|Nora|How old is Lina?|Fourteen|Thirteen|Fifteen|Eighteen
Tom: Good morning, Mia! Mia: Good morning, Tom! I am fine, thank you.|Who is Tom talking to?|Mia|Lina|Sam|Ben|How does Mia feel?|Fine|Sad|Cold|Hungry
My name is Adam. I live in London. My friend Omar lives in Paris.|Where does Adam live?|London|Paris|Rome|Madrid|Who is Adam's friend?|Omar|Tom|Leo|Ben
Eva: Hi! Are you new here? Max: Yes. My name is Max. Eva: Welcome, Max!|Who is new here?|Max|Eva|Both speakers|Nobody|What does Eva say to welcome Max?|Welcome, Max!|Goodbye, Max!|Good night, Max!|See you tomorrow, Max!
This is my sister, Anna. She is sixteen. My brother, Leo, is twelve.|Who is sixteen?|Anna|Leo|Their mother|Their father|Who is Leo?|The speaker's brother|The speaker's sister|The speaker's mother|The speaker's father
I live with my mother and my grandfather. My grandfather cooks dinner.|Who cooks dinner?|The grandfather|The mother|The speaker|The sister|Who lives with the speaker?|Their mother and grandfather|Their father and grandmother|Their brother and sister|Their aunt and uncle
My aunt has two children, Maya and Ali. They are my cousins.|Who are Maya and Ali?|The speaker's cousins|The speaker's parents|The speaker's grandparents|The speaker's teachers|How many children does the aunt have?|Two|One|Three|Four
Dad is in the kitchen. Mum is in the garden. My little brother is in his bedroom.|Where is Mum?|In the garden|In the kitchen|In the bedroom|At school|Who is in the kitchen?|Dad|Mum|The brother|The sister
For breakfast, I eat bread and an egg. I drink water. I do not drink coffee.|What does the speaker drink?|Water|Coffee|Milk|Tea|What does the speaker eat with bread?|An egg|An apple|A banana|Some rice
Waiter: Would you like rice or pasta? Sara: Pasta, please. And some water.|What does Sara order to eat?|Pasta|Rice|Soup|Bread|What does Sara order to drink?|Water|Juice|Milk|Tea
In my lunch box, there is a cheese sandwich and an apple. My banana is at home.|Which fruit is in the lunch box?|An apple|A banana|An orange|A pear|Where is the banana?|At home|In the lunch box|At the shop|On the bus
We need tomatoes for dinner. We have bread and cheese, but we have no tomatoes.|What do they need to buy?|Tomatoes|Bread|Cheese|Eggs|What do they already have?|Bread and cheese|Tomatoes and eggs|Rice and fish|Apples and milk
Our cat, Snow, is white. Our dog, Rex, is brown. Rex sleeps in the garden.|What colour is Snow?|White|Brown|Black|Grey|Which animal sleeps in the garden?|Rex the dog|Snow the cat|A bird|A rabbit
At the farm, I see three cows and two horses. There are no sheep.|How many horses are there?|Two|Three|Four|Five|Which animals are not at this farm?|Sheep|Cows|Horses|Cows and horses
The duck is in the water. The chicken is next to the tree. The rabbit is under the chair.|Where is the rabbit?|Under the chair|In the water|Next to the tree|On the chair|Which animal is in the water?|The duck|The chicken|The rabbit|The horse
My pet is a small bird. It has yellow feathers. It eats seeds.|What is the speaker's pet?|A bird|A cat|A dog|A fish|What does the pet eat?|Seeds|Cheese|Bread|Grass
I have a red pen and a blue pencil. My notebook is green.|What colour is the pencil?|Blue|Red|Green|Yellow|Which thing is green?|The notebook|The pen|The pencil|The bag
The small box is yellow. The big box is black. Put the ball in the small box.|Which box should hold the ball?|The yellow box|The black box|The white box|The red box|What colour is the big box?|Black|Yellow|Blue|Pink
My school bag is purple. My friend's bag is orange. Both bags are on the table.|What colour is the friend's bag?|Orange|Purple|Blue|Brown|Where are the bags?|On the table|Under the bed|In the cupboard|Next to the door
There are two cups: a white cup and a pink cup. The white cup is clean. The pink cup is dirty.|Which cup is clean?|The white cup|The pink cup|Both cups|Neither cup|How many cups are there?|Two|One|Three|Four
I have six pencils. My friend gives me two more. Now I have eight pencils.|How many pencils does the friend give?|Two|Six|Eight|Four|How many pencils does the speaker have now?|Eight|Six|Two|Ten
Four students are in the room. Three more students come in. Now there are seven students.|How many students are there at first?|Four|Three|Seven|Eight|How many students come in?|Three|Four|Seven|One
The blue bus is number twelve. The red bus is number twenty. We take the blue bus.|Which bus do they take?|Number twelve|Number twenty|Number two|Number ten|What colour is bus number twenty?|Red|Blue|Green|White
There are ten biscuits on the plate. I eat one. Nine biscuits are left.|How many biscuits are on the plate at first?|Ten|Nine|One|Eleven|How many biscuits are left?|Nine|Ten|Eight|One
English starts at nine. Maths starts at ten. My English teacher is Ms Green.|Which lesson starts at nine?|English|Maths|Art|Music|Who teaches English?|Ms Green|Mr Brown|Ms White|Mr Black
Please bring a pencil and a ruler to class. You do not need scissors today.|What should students bring?|A pencil and a ruler|A pen and scissors|A book and glue|A bag and a ball|What is not needed today?|Scissors|A pencil|A ruler|A pencil and a ruler
The library is next to our classroom. We read books there after lunch.|What is next to the classroom?|The library|The gym|The garden|The kitchen|When do they read in the library?|After lunch|Before breakfast|At midnight|Before lunch
Teacher: Open your books to page five. Work with a partner. Write three words.|Which page should students open?|Page five|Page three|Page ten|Page one|How should students work?|With a partner|Alone|With the whole school|With their parents
Our flat has two bedrooms and one kitchen. My bedroom is next to the bathroom.|How many bedrooms are there?|Two|One|Three|Four|What is next to the speaker's bedroom?|The bathroom|The garden|The garage|The kitchen
The keys are on the kitchen table. My phone is on the sofa in the living room.|Where are the keys?|On the kitchen table|On the sofa|Under the bed|In the bathroom|What is on the sofa?|The phone|The keys|The cup|The book
There is a lamp beside my bed. There is a desk under the window.|What is beside the bed?|A lamp|A desk|A window|A sofa|Where is the desk?|Under the window|Beside the sofa|Behind the door|On the bed
Our garden is behind the house. We eat outside in the garden on sunny days.|Where is the garden?|Behind the house|Inside the house|Above the kitchen|In front of the school|When do they eat in the garden?|On sunny days|On rainy days|On snowy days|Every night
I draw a face with two eyes and a big smile. The nose is below the eyes.|How many eyes are in the drawing?|Two|One|Three|Four|What is below the eyes in this face?|A nose|A hand|A knee|A foot
Doctor: What hurts? Ben: My left arm hurts. My right arm is fine.|Which arm hurts?|The left arm|The right arm|Both arms|Neither arm|Who is Ben talking to?|A doctor|A teacher|A waiter|A driver
In the game, touch your head first. Then clap your hands. Finally, stamp your feet.|What do you touch first?|Your head|Your hands|Your feet|Your knees|What do you do last?|Stamp your feet|Clap your hands|Touch your head|Close your eyes
Nora wears glasses to read. She listens to music with her ears.|Why does Nora wear glasses?|To read|To cook|To swim|To run|Which body part does she use to listen?|Her ears|Her nose|Her hands|Her knees
It is cold today. I wear a coat, a scarf and boots. My shorts stay in the cupboard.|Which clothes stay in the cupboard?|The shorts|The coat|The scarf|The boots|Why does the speaker wear a coat?|It is cold|It is hot|They are swimming|They are going to bed
Sam wears a white shirt and black trousers to school. His shoes are brown.|What colour are Sam's trousers?|Black|White|Brown|Blue|What colour are his shoes?|Brown|Black|White|Red
Shop assistant: This T-shirt is small. That one is large. Amy: I need the large one, please.|Which size does Amy want?|Large|Small|Medium|Extra small|What does Amy want to buy?|A T-shirt|A coat|A dress|A scarf
My blue jacket is on the chair. My red jumper is on the bed. My hat is in my bag.|What is on the bed?|The red jumper|The blue jacket|The hat|The bag|Where is the hat?|In the bag|On the chair|On the bed|Under the table
Today it is raining. We take umbrellas and walk to school. Yesterday it was sunny.|What is the weather like today?|Rainy|Sunny|Snowy|Dry|What do they take to school?|Umbrellas|Sunglasses|Swimsuits|Sandals
In summer, our town is hot. In winter, it is cold. I go swimming in summer.|When is the town hot?|In summer|In winter|Every winter night|In both seasons|What does the speaker do in summer?|Go swimming|Go skiing|Make snowballs|Wear winter gloves
The sky is grey and it is windy. We fly a kite in the park.|Where do they fly a kite?|In the park|In the bedroom|In the kitchen|In the library|What helps the kite fly?|The wind|The rain|The snow|The fog
It is snowing outside. We stay at home and drink warm tea. Our dog stays inside too.|Where do they stay?|At home|At the beach|At school|In the park|What do they drink?|Warm tea|Cold juice|Milk|Water
I get up at seven. I eat breakfast at half past seven. I leave home at eight.|What time does the speaker get up?|Seven|Half past seven|Eight|Nine|What happens at eight?|The speaker leaves home|The speaker gets up|The speaker eats breakfast|The speaker goes to bed
On Monday, I play football after school. On Tuesday, I visit my grandmother.|When does the speaker play football?|On Monday|On Tuesday|On Wednesday|On Sunday|Who does the speaker visit on Tuesday?|Their grandmother|Their teacher|Their cousin|Their neighbour
Our class starts at eight thirty. The bus arrives at eight. We have thirty minutes before class.|What time does class start?|Eight thirty|Eight|Nine|Seven thirty|How long is there between the bus and class?|Thirty minutes|Ten minutes|One hour|Two hours
I do my homework before dinner. After dinner, I read a book. I go to bed at ten.|What does the speaker do before dinner?|Homework|Read a book|Go to bed|Eat breakfast|What time does the speaker go to bed?|Ten|Eight|Nine|Eleven
'''
items=[]
for index, row in enumerate(rows.strip().splitlines()):
    passage, *fields = row.split('|')
    assert len(fields)==10
    ui,li=divmod(index,4)
    for k in range(2):
        prompt,*options=fields[k*5:(k+1)*5]
        items.append(dict(id=f'en-a1-u{ui}-reading-{li}-{k}',unitIndex=ui,lessonIndex=li,type='choice',passage=passage,prompt=prompt,choices=options,answer=0,objective='reading-comprehension',explanation=f'Réponse : {options[0]}. Lis le texte : « {passage} »'))
assert len(items)==96
(root/'content/en/A1-reading.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
print(f'Authored {len(items)} original reading questions.')
