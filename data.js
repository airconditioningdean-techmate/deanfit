// All nutrition values are typical estimates per serving. Check labels for exact numbers.
const DEFAULTS = {kcal:2850, protein:160, carbs:370, fat:80, water:3000, startWeight:76.0, goalLo:80, goalHi:82, startDate:"2026-11-02", heightCm:171, age:47};

const DAYS = [
 {id:1, name:"Chest & Shoulders", short:"Push", ex:[
  ["Incline dumbbell press (30°)",4,"6-10"],["Flat machine or dumbbell press",3,"8-12"],["Seated dumbbell shoulder press",3,"8-12"],
  ["Cable or pec-deck fly",3,"12-15"],["Cable lateral raise",3,"12-20"],["Rope triceps pushdown",3,"10-15"]]},
 {id:2, name:"Back & Abs", short:"Pull", ex:[
  ["Lat pulldown or assisted chin-up",4,"6-10"],["Chest-supported row",3,"8-12"],["Single-arm cable row",3,"10-12 each"],
  ["Face pull",3,"12-15"],["Incline dumbbell curl",3,"10-12"],["Cable crunch",3,"10-15"],["Hanging knee raise",3,"10-15"]]},
 {id:3, name:"Legs & Core", short:"Legs", ex:[
  ["Goblet squat or leg press",3,"8-12"],["Romanian deadlift (dumbbell)",3,"8-10"],["Walking lunge or split squat",2,"10 each"],
  ["Lying leg curl",2,"10-15"],["Standing calf raise",3,"10-15"],["Plank or dead bug",3,"30-45 s"]]},
 {id:4, name:"Upper Pump, Arms & Abs", short:"Arms", ex:[
  ["Low-incline machine press",3,"8-12"],["Neutral-grip pulldown",3,"8-12"],["Dumbbell lateral raise",4,"12-20"],["Rear-delt fly",3,"12-15"],
  ["EZ-bar curl",3,"10-12"],["Overhead cable extension",3,"10-12"],["Hammer curl",2,"10-12"],["Ab wheel or cable woodchop",3,"8-12"]]}
];
// Mon=1 ... Sun=7 -> training day id or text
const WEEK_SCHEDULE = {1:1, 2:2, 3:"Zone 2 cardio, 30 min", 4:3, 5:4, 6:"Optional intervals, 20 min", 7:"Rest + easy walk"};
const PHASES = [
 {w:[1,2], t:"Settle in", d:"Learn the lifts, nail calories and protein. Target 76-77 kg."},
 {w:[3,5], t:"Build", d:"Push progression on upper body. Target 77-78 kg."},
 {w:[6,6], t:"Deload", d:"Same exercises, about half the sets, lighter weights."},
 {w:[7,11], t:"Push on", d:"Keep progressing, swap a few exercises for variety. Target 78.5-80 kg."},
 {w:[12,12], t:"Deload + review", d:"Photos, measurements, review. Target 80 kg+."},
 {w:[13,99], t:"Legs focus", d:"Two leg days, upper body on maintenance-plus while easing towards 82 kg."}
];
// name, serving, kcal, protein, carbs, fat, aliases
const FOODS = [
 ["Post-workout shake (Dean's)","1 shake",850,72,79,29,"shake"],
 ["ON Gold Standard whey","1 scoop (30 g)",120,24,3,1.5,"whey,scoop,protein powder"],
 ["Creatine monohydrate","5 g",0,0,0,0,"creatine"],
 ["Full-cream milk","250 ml",165,8.5,12,9.5,"milk"],
 ["Skim milk","250 ml",90,9,13,0.3,"skim"],
 ["Protein milk","500 ml bottle",300,32,30,6,"protein milk"],
 ["Rolled oats","1/2 cup (40 g)",150,5,24,3.5,"oats,porridge"],
 ["Weet-Bix","2 biscuits",135,4.5,25,0.6,"weetbix,weet-bix"],
 ["Muesli","1/2 cup (45 g)",180,4.5,28,5,"muesli"],
 ["Banana","1 medium",105,1.3,27,0.4,"banana"],
 ["Apple","1 medium",80,0.4,21,0.3,"apple"],
 ["Orange","1 medium",65,1.2,15,0.2,"orange"],
 ["Mixed berries (frozen)","1 cup (150 g)",60,1,13,0.4,"berries"],
 ["Orange juice","250 ml",110,1.5,25,0.3,"juice,oj"],
 ["Peanut butter","1 tbsp (16 g)",95,4,3,8,"pb,peanut butter"],
 ["Greek yoghurt (plain)","200 g",190,18,8,10,"yoghurt,yogurt"],
 ["Egg","1 large",75,6.5,0.4,5,"egg,eggs"],
 ["Egg whites","100 g",50,11,0.7,0.2,"egg white"],
 ["Chicken breast (cooked)","150 g",250,46,0,5.5,"chicken,chicken breast"],
 ["Chicken thigh (cooked)","150 g",315,39,0,17,"thigh"],
 ["BBQ chicken (supermarket)","1/4 chook",330,38,1,19,"bbq chicken,chook"],
 ["Lean beef mince (cooked)","150 g",330,40,0,19,"mince,beef"],
 ["Beef steak (rump, cooked)","200 g",380,58,0,16,"steak"],
 ["Turkey mince (cooked)","150 g",285,40,0,13,"turkey"],
 ["Kangaroo (cooked)","150 g",210,44,0,3,"kangaroo,roo"],
 ["Pork loin (cooked)","150 g",270,42,0,11,"pork"],
 ["Salmon (cooked)","150 g",310,33,0,19,"salmon"],
 ["Barramundi (cooked)","150 g",180,36,0,3,"barramundi,fish"],
 ["Tuna in springwater","95 g tin",100,23,0,1,"tuna"],
 ["Ham (shaved)","50 g",55,9,1,1.5,"ham"],
 ["Cottage cheese","100 g",100,12,4,4,"cottage cheese"],
 ["Cheddar cheese","20 g slice",80,5,0,6.6,"cheese"],
 ["Feta","30 g",80,5,0.5,6.5,"feta"],
 ["White rice (cooked)","1 cup (190 g)",245,4.5,53,0.5,"rice"],
 ["Brown rice (cooked)","1 cup (190 g)",235,5,49,1.8,"brown rice"],
 ["Microwave rice pouch","250 g pouch",380,8,78,4,"rice pouch"],
 ["Pasta (cooked)","1 cup (150 g)",220,8,43,1.3,"pasta"],
 ["Potato (boiled)","250 g",190,5,42,0.3,"potato,potatoes"],
 ["Sweet potato (baked)","200 g",180,4,41,0.3,"sweet potato"],
 ["Wholegrain bread","1 slice (40 g)",100,4.5,16,1.5,"toast,bread"],
 ["Sourdough","1 slice (50 g)",130,5,25,1,"sourdough"],
 ["Wholemeal wrap","1 wrap (60 g)",175,5.5,28,4,"wrap"],
 ["English muffin","1 muffin",130,5,25,1,"muffin"],
 ["Rice cakes","2 cakes",55,1.2,12,0.4,"rice cake"],
 ["Avocado","1/2 medium (75 g)",120,1.5,6,11,"avo,avocado"],
 ["Mixed nuts","30 g handful",185,6,5,16,"nuts"],
 ["Almonds","30 g",175,6,2,15,"almonds"],
 ["Olive oil","1 tsp (5 ml)",40,0,0,4.5,"oil,olive oil"],
 ["Butter","1 tsp (5 g)",36,0,0,4,"butter"],
 ["Honey","1 tbsp (21 g)",65,0,17,0,"honey"],
 ["Vegemite","1 tsp",10,1.3,0.5,0,"vegemite"],
 ["Baked beans","1/2 tin (210 g)",160,9,26,0.8,"beans"],
 ["Mixed veg (frozen)","1 cup (150 g)",80,4,12,0.5,"veg,vegetables"],
 ["Broccoli","1 cup (90 g)",30,2.5,6,0.3,"broccoli"],
 ["Salad mix","2 cups",20,1.5,3,0.2,"salad"],
 ["Tomato","1 medium",20,1,4,0.2,"tomato"],
 ["Hummus","2 tbsp (40 g)",110,3,5,9,"hummus"],
 ["Dark chocolate","20 g",115,1.5,9,8,"chocolate"],
 ["Protein bar","1 bar (60 g)",220,20,22,7,"protein bar,bar"],
 ["Black coffee","1 cup",2,0.3,0,0,"coffee"],
 ["Flat white (full cream)","1 regular",120,6.5,9,6.5,"flat white,latte,cappuccino"],
 ["Beer (full strength)","375 ml",150,1.5,12,0,"beer"]
];
// recipe: name, serves, macros per serve [kcal,p,c,f], ingredients, method
const RECIPES = [
 {n:"Dean's post-workout shake",k:850,p:72,c:79,f:29,ing:["2 scoops ON Gold Standard whey","400 ml full-cream milk","1/2 cup rolled oats","1 banana","1 tbsp peanut butter","3-5 g creatine","Ice"],m:["Blend oats first for 10 seconds.","Add everything else and blend until smooth.","Drink within 30 minutes of training."]},
 {n:"Lighter shake",k:650,p:62,c:72,f:13,ing:["1.5 scoops whey","400 ml skim milk","1/2 cup oats","1 banana","Creatine"],m:["Blend and drink."]},
 {n:"Chicken, rice & veg bowl",k:650,p:52,c:75,f:12,ing:["150 g chicken breast","1.5 cups cooked rice","1 cup broccoli or mixed veg","1 tsp olive oil","Soy or sweet chilli sauce"],m:["Season and pan-fry or air-fry chicken 12-15 min.","Microwave rice pouch and veg.","Slice chicken over rice, drizzle sauce."]},
 {n:"Beef burrito bowl",k:720,p:48,c:80,f:20,ing:["150 g lean beef mince","1 cup cooked rice","1/2 tin black or kidney beans","Salsa","1/4 avocado","Taco seasoning"],m:["Brown mince with taco seasoning.","Warm beans.","Layer rice, beans, mince, salsa, avocado."]},
 {n:"Salmon, potato & greens",k:650,p:38,c:46,f:32,ing:["150 g salmon fillet","250 g baby potatoes","Green beans or broccoli","Lemon"],m:["Boil potatoes 15 min.","Bake salmon 200°C for 12-15 min.","Steam greens, squeeze lemon over."]},
 {n:"Spag bol (meal prep, 4 serves)",k:680,p:45,c:78,f:18,ing:["600 g lean beef mince","1 onion, 2 garlic cloves","2 grated carrots","700 g passata","400 g dry spaghetti"],m:["Brown mince with onion and garlic.","Add carrot and passata, simmer 20 min.","Cook pasta, serve 1/4 each; freeze extras."]},
 {n:"Chicken & avo wrap",k:520,p:42,c:40,f:20,ing:["1 wholemeal wrap","120 g BBQ or grilled chicken","1/4 avocado","Salad mix, tomato","Light mayo"],m:["Spread avo on wrap.","Add chicken and salad, roll tight."]},
 {n:"Tuna rice cakes snack",k:280,p:28,c:28,f:6,ing:["1 tin tuna","4 rice cakes","Tomato slices","Pepper"],m:["Top rice cakes with tuna and tomato."]},
 {n:"Greek yoghurt bowl",k:400,p:24,c:46,f:13,ing:["200 g Greek yoghurt","1/2 cup muesli","1/2 cup berries","Drizzle honey"],m:["Layer in a bowl."]},
 {n:"Eggs on sourdough",k:520,p:30,c:52,f:20,ing:["3 eggs","2 slices sourdough","1/2 avocado or butter","Spinach"],m:["Scramble or poach eggs.","Toast bread, top with avo and eggs."]},
 {n:"Kangaroo stir-fry",k:600,p:50,c:70,f:10,ing:["150 g kangaroo strips","Stir-fry veg pack","1 cup cooked rice or noodles","Soy, garlic, ginger"],m:["Sear roo on high heat 2-3 min, set aside.","Stir-fry veg, add sauce and roo back in.","Serve over rice."]},
 {n:"Steak & sweet potato",k:700,p:60,c:50,f:24,ing:["200 g rump steak","200 g sweet potato","Salad","1 tsp olive oil"],m:["Bake sweet potato wedges 200°C 30 min.","Pan-sear steak 3-4 min each side, rest 5 min.","Serve with salad."]},
 {n:"Cottage cheese toast",k:330,p:22,c:36,f:9,ing:["2 slices wholegrain bread","100 g cottage cheese","Tomato, pepper"],m:["Toast bread, top with cottage cheese and tomato."]},
 {n:"Weet-Bix bedtime bowl",k:300,p:13,c:38,f:10,ing:["2 Weet-Bix","250 ml full-cream milk","Sliced banana (optional)"],m:["Pour milk over Weet-Bix."]}
];
// Meal plans: [time, meal, item, kcal, protein]
const MEAL_PLANS = [
 {n:"Day A: Chicken & rice", items:[["5:30","Pre (optional)","Black coffee or nothing",2,0],["7:15","Post-workout","Dean's post-workout shake",850,72],["10:00","Morning snack","Greek yoghurt bowl",400,24],["12:30","Lunch","Chicken, rice & veg bowl",650,52],["15:30","Afternoon snack","Tuna rice cakes snack",280,28],["18:30","Dinner","Spag bol",680,45]]},
 {n:"Day B: Wrap & salmon", items:[["5:30","Pre (optional)","Small banana",105,1],["7:15","Post-workout","Dean's post-workout shake",850,72],["10:00","Morning snack","Cottage cheese toast",330,22],["12:30","Lunch","Chicken & avo wrap",520,42],["15:30","Afternoon snack","Mixed nuts + apple",265,6],["18:30","Dinner","Salmon, potato & greens",650,38],["20:30","Evening","Weet-Bix bedtime bowl",300,13]]},
 {n:"Day C: Burrito & steak", items:[["5:30","Pre (optional)","Black coffee",2,0],["7:15","Post-workout","Dean's post-workout shake",850,72],["10:00","Morning snack","Protein milk",300,32],["12:30","Lunch","Beef burrito bowl",720,48],["15:30","Afternoon snack","Greek yoghurt + berries",250,19],["18:30","Dinner","Steak & sweet potato",700,60]]}
];
