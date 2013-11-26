/*

	dP                         dP                           oo dP                
	88                         88                              88                
	88d888b. .d8888b. .d8888b. 88d888b. .d8888b. 88d8b.d8b. dP 88d888b. dP    dP 
	88'  `88 88'  `88 88'  `88 88'  `88 88'  `88 88'`88'`88 88 88'  `88 88    88 
	88    88 88.  .88 88.  .88 88.  .88 88.  .88 88  88  88 88 88.  .88 88.  .88 
	dP    dP `88888P' `88888P' 88Y8888' `88888P8 dP  dP  dP dP 88Y8888' `8888P88 
	                                                                         .88 
	                                                                     d8888P 

	By Nick Sheffield - numbereft@gmail.com
	http://hoobamiby.com
	
	Change log

		Version 1.1
			Players can't play cards between the round ending and the next round starting
			Cards no longer have double full stops
			Game no longer hands when a new player joins a game in progress
			Late players are not accidentally selected as Czar
			New cards are no longer overwriting the left card in players hand
			Czar no longer gets dealt a card after the round end

		Version 1.2
			Czar can no longer pick more than one winner
			When a non czar player leaves, the judging is updated to reflect that
			Cards played by players who leave now vanish with their owner
			When the server restarts, every currently connected client refreshes automatically

		Version 1.3
			The winner of each round gets lit up in the players panel before the next round
			Players can actually win when they reach the score limit
			When a winner is chosen their answer goes into the black card and stays there until the next round
			Servers no longer crash when a 12th player tries to join

		Version 1.4
			Score limit is now forced to be a number, and an alert will display if anything else is tried
			Name saved in localStorage
			Name games after the user that made them
			No more than one player with the same name allowed to be connected
			Delay on winner screen
			Improved styles
			When czar leaves and the cards are revealed, everything no longer bugs out
			Late joining players can see cards, but not make a move until the next round
			Proper grammar put in white cards. Sentence injection be damned
			Support for expansions (server side)

			-Multi pick cards implemented
			-Record of winning answers displayed at winner screen
			-Add random name chooser or generator



*/

var
express         = require('express'),
app             = express(),
server          = require('http').createServer(app),
io              = require('socket.io').listen(server, {log: false}),
path            = require('path'),
lessMiddleware  = require('less-middleware')




server.listen(8003);
console.log('Server running');



// #########################################################################
// Error handler



process.on('uncaughtException', function (exception) {
	// handle or ignore error
	console.log(exception);
});




// #########################################################################
// Game

var

Games                   = {},
connected_players       = [],
debug                   = true,


Game = function() {
	this.name           = '';
	this.password       = '';
	this.score_limit    = 8;
	this.player_limit   = 11;
	this.players        = [];
	this.house_rules    = [];
	this.current_black  = [];
	this.current_whites = [];
	this.cards          = [];
	this.blacks         = [];
	this.cardsInUse     = [];
	this.blacksInUse    = [];
	this.symbolsInUse   = [];
	this.show_password  = true;
	this.started        = false;
	this.chosen	        = false;
	this.current_answer = '________';
	this.expansions     = {
							original: true,
							first:    true,
							second:   true,
							third:    true,
							nigrahs:  true
						};

	return this;
},


Player = function() {
	this.name           = '';
	this.symbol         = '';
	this.socket_id      = '';
	this.score          = 0;
	this.played_card    = [];
	this.hand           = [];
	this.czar           = false;
	this.winner         = false;
	this.active         = false;

	return this;
},

// the \\ denotes a <br>
Expansions = {
	original: {
		white: [
			'50,000 volts straight to the nipples',
			'72 virgins',
			'8 oz. of sweet Mexican black-tar heroin',
			'A bag of magic beans',
			'A balanced breakfast',
			'A bitch slap',
			'A bleached asshole',
			// 'A Bop It™',
			'A brain tumor',
			'A bucket of fish heads',
			'A can of whoop-ass',
			'A cooler full of organs',
			'A death ray',
			'A defective condom',
			'A disappointing birthday party',
			'A falcon with a cap on its head',
			'A fetus',
			'A foul mouth',
			'A gassy antelope',
			'A gentle caress of the inner thigh',
			'A good sniff',
			'A homoerotic volleyball montage',
			'A hot mess',
			'A lifetime of sadness',
			'A live studio audience',
			'A mating display',
			'A micropenis',
			'A micropig wearing a tiny raincoat and booties',
			'A middle-aged man on roller skates',
			'A mime having a stroke',
			'A monkey smoking a cigar',
			'A mopey zoo lion',
			'A murder most foul',
			'A pyramid of severed heads',
			'A really cool hat',
			'A robust mongoloid',
			'A sad handjob',
			'A salty surprise',
			'A sassy black woman',
			'A sausage festival',
			'A sea of troubles',
			'A snapping turtle biting the tip of your penis',
			'A spastic nerd',
			'A stray pube',
			'A subscription to Men\'s Fitness',
			'A Super Soaker™ full of cat pee',
			'A thermonuclear detonation',
			'A time travel paradox',
			'A tiny horse',
			'A tribe of warrior women',
			'A windmill full of corpses',
			'A zesty breakfast burrito',
			// 'Aaron Burr',
			'Active listening',
			'Actually taking candy from a baby',
			// 'Adderall™',
			'Advice from a wise, old black man',
			'African children',
			'Agriculture',
			'AIDS',
			'Alcoholism',
			'All-you-can-eat shrimp for $4.99',
			'Altar boys',
			'Amputees',
			'An asymmetric boob job',
			'An erection that lasts longer than four hours',
			'An icepick lobotomy',
			'An M. Night Shyamalan plot twist',
			'An M16 assault rifle',
			// 'An Oedipus complex',
			'An oversized lollipop',
			'An ugly face',
			'An uppercut',
			'Anal beads',
			'Another goddamn vampire movie',
			'Arnold Schwarzenegger',
			'Asians who aren\'t good at math',
			'Assless chaps',
			'Attitude',
			'Auschwitz',
			'Authentic Mexican cuisine',
			'Autocannibalism',
			'AXE Body Spray',
			'Balls',
			'Barack Obama',
			'BATMAN!!!',
			'Battlefield amputations',
			'Bees?',
			'Being a dick to children',
			'Being a motherfucking sorcerer',
			'Being fabulous',
			'Being fat and stupid',
			'Being marginalized',
			'Being on fire',
			'Being rich',
			'Bill Nye the Science Guy',
			'Bingeing and purging',
			'Bitches',
			'Black people',
			'Bling',
			'Boogers',
			'Breaking out into song and dance',
			'Britney Spears at 55',
			'Brown people',
			// 'Capturing Newt Gingrich and forcing him to dance in a monkey suit',
			'Cards Against Humanity',
			'Catapults',
			'Centaurs',
			'Chainsaws for hands',
			'Cheating in the Special Olympics',
			'Child beauty pageants',
			'Children on leashes',
			'Christopher Walken',
			'Chunks of dead prostitute',
			'Civilian casualties',
			'Classist undertones',
			'Coat hanger abortions',
			'Concealing a boner',
			'Consensual sex',
			'Copping a feel',
			'Count Chocula',
			'Crippling debt',
			'Crucifixion',
			'Crystal meth',
			'Cuddling',
			'Cybernetic enhancements',
			'Daddy issues',
			'Darth Vader',
			'Dead babies',
			'Dead parents',
			'Dental dams',
			'Destroying the evidence',
			'Dick Cheney',
			'Dick fingers',
			'Doin\' it in the butt',
			'Doing the right thing',
			// 'Domino\'s™ Oreo™ Dessert Pizza',
			'Drinking alone',
			'Dropping a chandelier on your enemies and riding the rope up',
			'Dry heaving',
			'Dying of dysentery',
			'Dying',
			'Eating all of the cookies before the AIDS bake-sale',
			'Eating the last known bison',
			'Edible underpants',
			'Elderly Japanese men',
			'Embryonic stem cells',
			'Emotions',
			'Erectile dysfunction',
			'Estrogen',
			'Ethnic cleansing',
			'Eugenics',
			'Exactly what you\'d expect',
			'Expecting a burp and vomiting on the floor',
			'Explosions',
			'Extremely tight pants',
			'Famine',
			// 'Fancy Feast®',
			'Farting and walking away',
			'Fear itself',
			// 'Feeding Rosie O\'Donnell',
			'Fiery poops',
			'Figgy pudding',
			'Finger painting',
			'Fingering',
			'Firing a rifle into the air while balls deep in a squealing hog',
			// 'Five-Dollar Footlongs™',
			'Flesh-eating bacteria',
			'Flightless birds',
			'Flying sex snakes',
			'Foreskin',
			'Former President George W. Bush',
			'Free samples',
			'Friction',
			'Friendly fire',
			'Friends with benefits',
			'Frolicking',
			'Full frontal nudity',
			'Funky fresh rhymes',
			'Gandhi',
			'Geese',
			'Genghis Khan',
			'Genital piercings',
			'German dungeon porn',
			'Getting drunk on mouthwash',
			'Getting married, having a few kids, buying some stuff, retiring to Florida, and dying',
			'Getting naked and watching Nickelodeon',
			'Getting really high',
			'Getting so angry that you pop a boner',
			'Ghosts',
			'Giving 110%',
			'Gloryholes',
			'Goblins',
			'God',
			// 'GoGurt®',
			'Golden showers',
			'Grandma',
			'Grave robbing',
			'Growing a pair',
			'Guys who don\'t call',
			'Half-assed foreplay',
			'Harry Potter erotica',
			'Heartwarming orphans',
			'Helplessly giggling at the mention of Hutus and Tutsis',
			'Her Majesty, Queen Elizabeth II',
			'Heteronormativity',
			'Historically black colleges',
			'Home video of Oprah sobbing into a Lean Cuisine®',
			'Homeless people',
			'Hope',
			'Hormone injections',
			'Horrifying laser hair removal accidents',
			'Horse meat',
			'Hospice care',
			'Hot cheese',
			'Hot people',
			'Hot Pockets®',
			'Hulk Hogan',
			'Hurricane Katrina',
			'Inappropriate yodeling',
			'Incest',
			'Italians',
			'Jerking off into a pool of children\'s tears',
			'Jewish fraternities',
			'John Wilkes Booth',
			'Judge Judy',
			'Justin Bieber',
			'Kamikaze pilots',
			'Kanye West',
			'Keanu Reeves',
			'Kids with ass cancer',
			'Lactation',
			'Lady Gaga',
			// 'Lance Armstrong\'s missing testicle',
			'Land mines',
			'Laying an egg',
			'Leaving an awkward voicemail',
			'Leprosy',
			'Licking things to claim them as your own',
			'Lockjaw',
			'Lumberjack fantasies',
			// 'Lunchables™',
			'Making a pouty face',
			'Man meat',
			'Masturbation',
			'Me time',
			'MechaHitler',
			'Men',
			'Menstrual rage',
			'Michael Jackson',
			'Michelle Obama\'s arms',
			'Morgan Freeman\'s voice',
			'Mouth herpes',
			// 'Mr. Clean, right behind you',
			'Muhammed (Praise Be Unto Him)',
			'Multiple stab wounds',
			'Mutually-assured destruction',
			'My collection of high-tech sex toys',
			'My genitals',
			'My humps',
			'My inner demons',
			'My relationship status',
			'My sex life',
			'My soul',
			'My vagina',
			'Natalie Portman',
			'Natural male enhancement',
			'Natural selection',
			'Nazis',
			'Necrophilia',
			'New Age music',
			'Nickelback',
			'Nicolas Cage',
			'Nipple blades',
			'Not giving a shit about the Third World',
			'Not reciprocating oral sex',
			'Not wearing pants',
			'Obesity',
			'Object permanence',
			'Old-people smell',
			'One trillion dollars',
			'Oompa-Loompas',
			'Opposable thumbs',
			'Overcompensation',
			// 'Pabst Blue Ribbon',
			'Pac-Man uncontrollably guzzling cum',
			'Panda sex',
			'Parting the Red Sea',
			'Passable transvestites',
			'Passing a kidney stone',
			'Passive-aggressive Post-it notes',
			'Passive-agression',
			'Pedophiles',
			'Peeing a little bit',
			'Penis envy',
			'Picking up girls at the abortion clinic',
			'Pictures of boobs',
			'Pixelated bukkake',
			'Police brutality',
			'Pooping back and forth. Forever',
			'Poopy diapers',
			'Poor life choices',
			'Poor people',
			'Poorly-timed Holocaust jokes',
			'Porn stars',
			'Powerful thighs',
			'Prancing',
			'Praying the gay away',
			'Preteens',
			'Pretending to care',
			'Puberty',
			'Public ridicule',
			'Pulling out',
			'Puppies!',
			'Queefing',
			// 'Racially-biased SAT questions',
			'Racism',
			'Raptor attacks',
			'Rehab',
			'Repression',
			'Republicans',
			'Riding off into the sunset',
			'Road head',
			'Robert Downey, Jr',
			'RoboCop',
			'Ronald Reagan',
			'Roofies',
			// 'Rush Limbaugh\'s soft, shitty body',
			'Same-sex ice dancing',
			'Sarah Palin',
			'Saxophone solos',
			'Scalping',
			'Science',
			'Scientology',
			'Scrubbing under the folds',
			'Sean Connery',
			'Sean Penn',
			'Self-loathing',
			// 'Seppuku',
			// 'Serfdom',
			'Sexting',
			'Sexual tension',
			'Sexy pillow fights',
			'Shapeshifters',
			'Shaquille O\'Neal\'s acting career',
			'Sharing needles',
			'Shiny objects',
			'Silence',
			'Skeletor',
			'Smallpox blankets',
			'Smegma',
			'Sniffing glue',
			'Some god-damn peace and quiet',
			'Soup that is too hot',
			'Spectacular abs',
			'Sperm whales',
			'Spontaneous human combustion',
			'Stalin',
			'Stephen Hawking talking dirty',
			'Stormtroopers',
			'Stranger danger',
			'Sunshine and rainbows',
			'Surprise sex!',
			'Sweet, sweet vengeance',
			// 'Switching to Geico®',
			'Swooping',
			'Synergistic management solutions',
			'Take-backsies',
			'Taking off your shirt',
			'Tangled Slinkys',
			'Tasteful sideboob',
			'Teaching a robot to love',
			'Teenage pregnancy',
			'Tentacle porn',
			'Testicular torsion',
			'That thing that electrocutes your abs',
			'The American Dream',
			'The Amish',
			'The art of seduction',
			'The Big Bang',
			'The Blood of Christ',
			'The Boy Scouts of America',
			'The Care Bear Stare',
			'The Chinese gymnastics team',
			'The chronic',
			'The clitoris',
			'The Dance of the Sugar Plum Fairy',
			'The Devil himself',
			'The entire Mormon Tabernacle Choir',
			'The female orgasm',
			'The folly of man',
			'The Force',
			'The gays',
			'The glass ceiling',
			'The Great Depression',
			'The Hamburglar',
			'The hardworking Mexican',
			'The heart of a child',
			'The Holy Bible',
			'The homosexual agenda',
			'The Hustle',
			'The inevitable heat death of the universe',
			'The invisible hand',
			'The Jews',
			'The KKK',
			'The Kool-Aid Man',
			'The light of a billion suns',
			'The Little Engine That Could',
			'The Make-A-Wish® Foundation',
			'The milk man',
			'The miracle of childbirth',
			// 'The penny whistle solo from "My Heart Will Go On."',
			'The placenta',
			'The Pope',
			'The profoundly handicapped',
			'The Rapture',
			'The Rev. Dr. Martin Luther King, Jr',
			'The South',
			'The taint; the grundle; the fleshy fun-bridge',
			// 'The Tempur-Pedic® Swedish Sleep System™',
			'The terrorists',
			'The Three-Fifths compromise',
			'The token minority',
			'The Trail of Tears',
			'The true meaning of Christmas',
			'The Underground Railroad',
			'The violation of our most basic human rights',
			'The Virginia Tech Massacre',
			'The World of Warcraft',
			'The Übermensch',
			'Third base',
			'Throwing a virgin into a volcano',
			// 'Tickling Sean Hannity, even after he tells you to stop',
			'Tom Cruise',
			// 'Toni Morrison\'s vagina',
			'Two midgets shitting into a bucket',
			'Unfathomable stupidity',
			'Used panties',
			'Vehicular manslaughter',
			'Viagra®',
			'Vigilante justice',
			'Vigorous jazz hands',
			'Vikings',
			'Waiting \'til marriage',
			'Waking up half-naked in a Denny\'s parking lot',
			'Wearing underwear inside-out to avoid doing laundry',
			'Wet dreams',
			'When you fart and a little bit comes out',
			'Whipping it out',
			'White people',
			'White privilege',
			'Wifely duties',
			'William Shatner',
			'Winking at old people',
			'Wiping her butt',
			'Women in yogurt commercials',
			'Women\'s suffrage',
			'World peace',
			'Yeast',
			'YOU MUST CONSTRUCT ADDITIONAL PYLONS'
		],

		black: [
			{text: "How did I lose my virginity? %s", pick: 1},
			{text: "Why can't I sleep at night? %s", pick: 1},
			{text: "What's that smell? %s", pick: 1},
			{text: "I got 99 problems but %s ain't one.", pick: 1},
			{text: "Maybe she's born with it. Maybe it's %s.", pick: 1},
			{text: "What's the next Happy Meal toy? %s", pick: 1},
			{text: "Here is the church,\\Here is the steeple,\\Open the doors and there is %s.", pick: 1},
			{text: "It's a pity that kids these days are all involved with %s.", pick: 1},
			{text: "During his childhood, Salvador Dali produced hundreds of paintings of %s.", pick: 1},
			{text: "Alternative medicine is now embracing the curative powers of %s.", pick: 1},
			{text: "And the Academy Award for %s goes to %s2.", pick: 2},
			{text: "What's that sound? %s", pick: 1},
			{text: "What ended my last relationship? %s", pick: 1},
			{text: "MTV's new reality show features eight washed-up celebrities living with %s.", pick: 1},
			{text: "I drink to forget %s.", pick: 1},
			{text: "I'm sorry professor, but I couldn't complete my homework because of %s.", pick: 1},
			{text: "What is Batman's guilty pleasure? %s", pick: 1},
			{text: "This is the way the world ends\\This is the way the world ends\\Not with a bang but with %s.", pick: 1},
			{text: "What's a girls best friend? %s", pick: 1},
			{text: "TSA guidelines now prohibit %s on airplanes.", pick: 1},

			{text: "%s. That's how I want to die.", pick: 1},
			{text: "For my next trick, I will pull %s out of %s2.", pick: 2},
			{text: "In the new Disney Channel Original Movie, Hannah Montana struggles with %s for the first time.", pick: 1},
			{text: "%s is a slippery slope that leads to %s2.", pick: 2},
			{text: "What does Dick Cheney prefer?  %s", pick: 1},
			{text: "Dear Abby, I'm having some trouble with %s and would like your advice.", pick: 1},
			{text: "Instead of coal, santa now gives the bad children %s.", pick: 1},
			{text: "What's the most emo? %s", pick: 1},
			{text: "In 1,000 years, when paper money is a distant memory, how will we pay for goods and services? %s", pick: 1},
			{text: "What's the next superhero/sidekick duo? %s and %s2", pick: 2},
			{text: "In M. Night Shyamalan's new movie, Bruce Willis discoveries that %s had really been %s2 all along.", pick: 2},
			{text: "A romantic, candlelit dinner would be incomplete without %s.", pick: 1},
			{text: "%s. Betcha can't just have one!", pick: 1},
			{text: "White people like %s.", pick: 1},
			{text: "%s. High five, bro.", pick: 1},
			{text: "Next from J.K. Rowling: Harry Potter and the Chamber of %s.", pick: 1},
			{text: "BILLY MAYS HERE FOR %s.", pick: 1},
			{text: "In a world ravaged by %s our only solace is %s2.", pick: 2},
			{text: "War! What is it good for? %s", pick: 1},
			{text: "During sex, I like to think about %s.", pick: 1},

			{text: "What are my parents hiding from me? %s", pick: 1},
			{text: "What will always get you laid? %s", pick: 1},
			{text: "in L.A. County Jail, word is you can trade 200 cigarettes for %s.", pick: 1},
			{text: "What did I bring back from Mexico? %s", pick: 1},
			{text: "What don't you want to find in your Kung Pao chicken? %s", pick: 1},
			{text: "What will I bring back in time to convince people that I am a powerful wizard? %s", pick: 1},
			{text: "How am I maintaining my relationship status? %s", pick: 1},
			{text: "%s. It's a trap!", pick: 1},
			{text: "Coming to Broadway this season, %s: The Musical.", pick: 1},
			{text: "While the United States raced the Soviet Union to the moon, the Mexican government funneled millions of pesos into research on %s.", pick: 1},
			{text: "After the earthquake, Sean Penn brought %s to the people of Haiti.", pick: 1},
			{text: "Next on ESPN2, the World Series of %s.", pick: 1},
			{text: "Step 1: %s.\\Step 2: %s2.\\Step 3: Profit", pick: 2},
			{text: "Rumor has it that Vladimir Putin's favorite delicacy is %s stuffed with %s2.", pick: 2},
			{text: "Before I kill you, Mr Bond, I must show you %s.", pick: 1},
			{text: "What gives me uncontrollable gas? %s", pick: 1},
			{text: "What do old people smell like? %s", pick: 1},
			{text: "The class field trip was completely ruined by %s.", pick: 1},
			{text: "When Pharoh remained unmoved, Moses called down a plague of %s.", pick: 1},
			{text: "What's my secret power? %s", pick: 1},
			
			{text: "What's there a ton of in heaven? %s", pick: 1},
			{text: "What would grandma find disturbing, yet oddly charming? %s", pick: 1},
			{text: "I never truly understood %s until I encountered %s2.", pick: 2},
			{text: "What did the U.S. airdrop to the children of Afghanistan? %s", pick: 1},
			{text: "What helps Obama unwind? %s", pick: 1},
			{text: "What did Vin Diesel eat for diner? %s", pick: 1},
			{text: "%s: good to the last drop.", pick: 1},
			{text: "Why am I sticky? %s", pick: 1},
			{text: "What gets better with age? %s", pick: 1},
			{text: "%s: kid-tested, mother-approved.", pick: 1},
			{text: "Daddy, why is mommy crying? %s", pick: 1},
			// {text: "What's Teach for America using to inspire inner city students to succeed? %s", pick: 1},
			{text: "Studies show that lab rats navigate mazes 50% faster after being exposed to %s.", pick: 1},
			{text: "Life for American Indians was forever changed when the White Man introduced them to %s.", pick: 1},
			{text: "I do not know what weapons World War III will be fought with, but World War IV will be fought with %s.", pick: 1},
			{text: "Why do I hurt all over? %s", pick: 1},
			{text: "What am I giving up for Lent? %s", pick: 1},
			{text: "In Michael Jackson's final moments, he thought about %s.", pick: 1},
			{text: "The Smithsonian Museum of Natural History has just opened an interactive exhibit on %s.", pick: 1},
			{text: "When I am the President of the United States, I will create the Department of %s.", pick: 1},
			{text: "Lifetime presents %s, the story of %s2.", pick: 2},
			{text: "When I am a billionaire, I shall erect a 50-foot statue to commemorate %s.", pick: 1},
			{text: "When I was tripping on acid, %s turned into %s2.", pick: 2},
			{text: "that's right, I killed %s. How, you ask? %s2", pick: 2},
			{text: "What's my anti-drug? %s", pick: 1},
			{text: "%s + %s2 = %s3", pick: 3, draw: 2},
			{text: "What never fails to liven up the party? %s", pick: 1},
			{text: "What's the new fad diet? %s", pick: 1},
			{text: "Major League Baseball has banned %s for giving players an unfair advantage.", pick: 1},
			
		]
	},

	first: {
		white: [
			'A beached whale',
			'A big black dick',
			'A bloody pacifier',
			'A crappy little hand',
			'A low standard of living',
			'A nuanced critique',
			'A passionate Latino lover',
			'A rival dojo',
			'A web of lies',
			'A woman scorned',
			'Apologizing',
			'Appreciative snapping',
			'Beating your wives',
			'Being a busy adult with many important things to do',
			'Being a dinosaur',
			'Bosnian chicken farmers',
			'Carnies',
			'Clams',
			'Coughing into a vagina',
			'Dancing with a broom',
			'Deflowering the princess',
			'Dorito breath',
			'Eating an albino',
			'Enormous Scandinavian women',
			'Fabricating statistics',
			'Finding a skeleton',
			'Gandalf',
			'Genetically engineered super-soldiers',
			'George Clooney\'s musk',
			'Getting abducted by Peter Pan',
			'Getting in her pants, politely',
			'Gladiatorial combat',
			'Good grammar',
			'Hipsters',
			'Historical revisionism',
			'Insatiable bloodlust',
			'Jafar',
			'Jean-Claude Van Damme',
			'Just the tip',
			'Leveling up',
			'Literally eating shit',
			'Mad hacky-sack skills',
			'Making the penises kiss',
			'Media coverage',
			'Medieval Times® Dinner & Tournament',
			'Moral ambiguity',
			'My machete',
			'Neil Patrick Harris',
			'Nubile slave boys',
			'Ominous background music',
			'One thousand Slim Jims',
			'Overpowering your father',
			'Panty raids',
			'Pistol-whipping a hostage',
			'Quiche',
			'Quivering jowls',
			'Revenge fucking',
			'Ripping into a man\'s chest and pulling out his still-beating heart',
			'Ryan Gosling riding in on a white horse',
			'Santa Claus',
			'Scrotum tickling',
			'Sexual humiliation',
			'Sexy Siamese twins',
			'Shaft',
			'Slow motion',
			'Space muffins',
			'Statistically validated stereotypes',
			'Sudden Poop Explosion Disease',
			'Suicidal thoughts',
			'The boners of the elderly',
			'The economy',
			'The Fanta® girls',
			'The four arms of Vishnu',
			'The Gulags',
			'The harsh light of day',
			'The hiccups',
			'The shambling corpse of Larry King',
			'Tripping balls',
			'Words, words, words',
			'Zeus\'s sexual appetites'
		],
		black: [
			{text: "An international tribunal has found %s guilty of %s2.", pick: 2},
			{text: "And I would have gotten away with it, too, if it hadn't been for %s!", pick: 1},
			{text: "Dear Sir or Madam, We regret to inform you that the Office of %s has denied your request for %s2.", pick: 2},
			{text: "He who controls %s controls the world.", pick: 1},
			{text: "I learned the hard way that you can't cheer up a grieving friend with %s.", pick: 1},
			{text: "In a pinch, %s can be a suitable substitute for %s2.", pick: 2},
			{text: "In his new self-produced album, Kanye West raps over the sounds of %s.", pick: 1},
			{text: "In its new tourism campaign, Detroit proudly proclaims that it has finally eliminated %s.", pick: 1},
			{text: "In Rome, there are whisperings that the Vatican has a secret room devoted to %s.", pick: 1},
			{text: "In the distant future, historians will agree that %s marked the beginning of America's decline.", pick: 1},
			{text: "Michael Bay's new three-hour action epic pits %s against %s2.", pick: 2},
			{text: "Science will never explain the origin of %s.", pick: 1},
			{text: "The CIA now interrogates enemy agents by repeatedly subjecting them to %s.", pick: 1},
			{text: "The socialist governments of Scandinavia have declared that access to %s is a basic human right.", pick: 1},
			{text: "This season on Man vs. Wild, Bear Grylls must survive in the depths of the Amazon with only %s and his wits.", pick: 1},
			{text: "What brought the orgy to a grinding halt? %s", pick: 1},
			{text: "What has been making life difficult at the nudist colony? %s", pick: 1},
			{text: "What's the gift that keeps on giving? %s", pick: 1},
			{text: "When all else fails, I can always masturbate to %s.", pick: 1},
			{text: "When I pooped, what came out of my butt? %s", pick: 1},
		]
	},
	second: {
		white: [
			'A 55-gallon drum of lube',
			'A bigger, blacker dick',
			'A Burmese tiger pit',
			'A dollop of sour cream',
			'A magic hippie love cloud',
			'A man in yoga pants with a ponytail and feather earrings',
			'A piñata full of scorpions',
			'A sad fat dragon with no friends',
			'A slightly shittier parallel universe',
			'A soulful rendition of "Ol\' Man River."',
			'A squadron of moles wearing aviator goggles',
			'A sweaty, panting leather daddy',
			'A sweet spaceship',
			'All of this blood',
			'An army of skeletons',
			'An ether-soaked rag',
			'An unhinged ferris wheel rolling toward the sea',
			'Another shot of morphine',
			'Basic human decency',
			'Beefin\' over turf',
			'Being awesome at sex',
			'Boris the Soviet Love Hammer',
			'Bullshit',
			'Catastrophic urethral trauma',
			'Daddy\'s belt',
			'Death by Steven Seagal',
			'Dining with cardboard cutouts of the cast of \"Friends.\"',
			'Double penetration',
			'Existing',
			'Fetal alcohol syndrome',
			'Finding Waldo',
			'Fuck Mountain',
			'Getting hilariously gang-banged by the Blue Man Group',
			'Grandpa\'s ashes',
			'Graphic violence, adult language, and some sexual content',
			'Hillary Clinton\'s death stare',
			'Intimacy problems',
			'Jeff Goldblum',
			'Living in a trashcan',
			'Loki, the trickster god',
			'Making a friend',
			'Me',
			'Mild autism',
			'Mooing',
			'My first kill',
			'Nunchuck moves',
			'Oncoming traffic',
			'One Ring to rule them all',
			'Power',
			'Pretty Pretty Princess Dress-Up Board Game®',
			'Pumping out a baby every nine months',
			'Rising from the grave',
			'Scrotal frostbite',
			'Some really fucked-up shit',
			'Special musical guest, Cher',
			'Spring break!',
			'Subduing a grizzly bear and making her your wife',
			'Survivor\'s guilt',
			'Swiftly achieving orgasm',
			'Taking a man\'s eyes and balls out and putting his eyes where his balls go and then his balls in the eye holes',
			'The corporations',
			'The day the birds attacked',
			'The Google',
			'The grey nutrient broth that sustains Mitt Romney',
			'The human body',
			// 'The mere concept of Applebee\'s®',
			'The mixing of the races',
			'The new Radiohead album',
			'Tiny nipples',
			'Tongue',
			'Upgrading homeless people to mobile hotspots',
			'Weapons-grade plutonium',
			'Wearing an octopus for a hat',
			'Whining like a little bitch',
			'Whipping a disobedient slave'
		],
		black: [
			{text: "%s would be woefully incomplete without %s2.", pick: 2},
			{text: "After months of debate, the Occupy Wall Street General Assembly could only agree on \"More %s!\"", pick: 1},
			{text: "Before %s, all we had was %s2.", pick: 2},
			{text: "Before I run for president, I must destroy all evidence of my involvement with %s.", pick: 1},
			{text: "Charades was ruined for me forever when my mom had to act out %s.", pick: 1},
			{text: "During his midlife crisis, my dad got really into %s.", pick: 1},
			{text: "Everyone down on the ground! We don't want to hurt anyone. We're just here for %s.", pick: 1},
			{text: "I spent my whole life working toward %s, only to have it ruined by %s2.", pick: 2},
			{text: "I went from %s to %s2, all thanks to %s3.", pick: 3, draw: 2},
			{text: "If God didn't want us to enjoy %s, he wouldn't have given us %s2.", pick: 2},
			{text: "In his newest and most difficult stunt, David Blaine must escape from %s.", pick: 1},
			{text: "Little Miss Muffet Sat on a tuffet, Eating her curds and %s.", pick: 1},
			{text: "Members of New York's social elite are paying thousands of dollars just to experience %s.", pick: 1},
			{text: "My country, 'tis of thee, sweet land of %s.", pick: 1},
			{text: "My mom freaked out when she looked at my browser history and found %s.com/%s2.", pick: 2},
			{text: "My new favorite porn star is Joey \"%s\" McGee.", pick: 1},
			{text: "Next time on Dr. Phil: How to talk to your child about %s.", pick: 1},
			{text: "Only two things in life are certain: death and %s.", pick: 1},
			{text: "The Five Stages of Grief: denial, anger, bargaining, %s, acceptance.", pick: 1},
			{text: "The healing process began when I joined a support group for victims of %s.", pick: 1},
			{text: "The votes are in, and the new high school mascot is %s.", pick: 1},
			{text: "This is your captain speaking. Fasten your seatbelts and prepare for %s.", pick: 1},
			{text: "This month's Cosmo: \"Spice up your sex life by bringing %s into the bedroom.\"", pick: 1},
			{text: "Tonight on 20/20: What you don't know about %s could kill you.", pick: 1},
			{text: "You haven't truly lived until you've experienced %s and %s2 at the same time.", pick: 2}
		]
	},
	third: {
		white: [
			'That ass',
			'Nothing',
			'Shutting the fuck up',
			'The primal, ball-slapping sex your parents are having right now',
			'A cat video so cute that your eyes roll back and your spine slides out of your anus',
			'Cock',
			'A cop who is also a dog',
			'Dying alone and in pain',
			'Gay aliens',
			'The way white people is',
			'Reverse cowgirl',
			'The Quesadilla Explosion Salad from Chili’s',
			'Actually getting shot, for real',
			'Not having sex',
			'Vietnam flashbacks',
			'Running naked through a mall, pissing and shitting everywhere',
			'Warm, velvety muppet sex',
			'Self-flagellation',
			'The systematic destruction of an entire people and their way of life',
			'Samuel L. Jackson',
			'A boo-boo',
			'Going around punching people',
			'The entire Internet',
			'Some kind of bird-man',
			'Chugging a lava lamp',
			'Having sex on top of a pizza',
			'Indescribable loneliness',
			'An ass disaster',
			'All my friends dying',
			'Putting an entire peanut buter and jelly sandwich into the VCR',
			'Spending lots of money',
			'Some douche with an acoustic guitar',
			'Flying robots that kill people',
			'A greased-up Matthew McConaughey',
			'An unstoppable wave of fire ants',
			'Not contributing to society in any meaningful way',
			'An all-midget production of Shakespeare’s Richard III',
			'Screaming like a maniac',
			'The moist, demanding chasm of his mouth',
			'Filling every orifice with butterscotch pudding',
			'Unlimited soup, salad, and breadsticks',
			'Crying into the pages of Sylvia Plath',
			'Velcro',
			'A PowerPoint presentation',
			'A surprising amount of hair',
			'Eating Tom Selleck’s mustache to gain his powers',
			'Roland the Farter, flatulist to the king',
			'A pile of squirming bodies',
			'Buying the right pants to be cool',
			'Blood farts',
			'Three months in the hole',
			'A botched circumcision',
			'The Land of Chocolate',
			'Slapping a racist old lady',
			'A lamprey swimming up the toilet and latching onto your taint',
			'Jumping out at people',
			'A black male in his early 20s, last seen wearing a hoodie',
			'Mufasa’s death scene',
			'Bill Clinton, naked on a bearskin rug with a saxophone',
			'Demonic possession',
			'The Harlem Globetrotters',
			'Vomiting mid-blowjob',
			'My manservant, Claude',
			'Having shotguns for legs',
			'Letting everyone down',
			'A spontaneous conga line',
			'A vagina that leads to another dimension',
			'Disco fever',
			'Getting your dick stuck in a Chinese finger trap with another dick',
			'Fisting',
			'The thin veneer of situational causality that underlies porn',
			'Girls that always be textin’',
			'Blowing some dudes in an alley',
			'Drinking ten 5-hour ENERGYs to get fifty continuous hours of energy',
			'Sneezing, farting, and coming at the same time'
		],
		black: [
			{text: "In the seventh circle of Hell, sinners must endure %s for all eternity.", pick: 1},
			{text: "A successful job interview begins with a firm handshake and ends with %s.", pick: 1},
			{text: "Lovin’ you is easy ’cause you’re %s.", pick: 1},
			{text: "My life is ruled by a vicious cycle of %s and %s2.", pick: 2},
			{text: "The blind date was going horribly until we discovered our shared interest in %s.", pick: 1},
			{text: "%s. Awesome in theory, kind of a mess in practice.", pick: 1},
			{text: "I’m not like the rest of you. I’m too rich and busy for %s.", pick: 1},
			{text: "%s: Hours of fun. Easy to use. Perfect for %s2!", pick: 2},
			{text: "What left this stain on my couch? %s", pick: 1},
			{text: "Call the law offices of Goldstein & Goldstein, because no one should have to tolerate %s in the workplace.", pick: 1},
			{text: "When you get right down to it, %s is just %s2.", pick: 2},
			{text: "Turns out that %s-Man was neither the hero we needed nor wanted.", pick: 1},
			{text: "As part of his daily regimen, Anderson Cooper sets aside 15 minutes for %s.", pick: 1},
			{text: "Money can’t buy me love, but it can buy me %s.", pick: 1},
			{text: "With enough time and pressure, %s will turn into %s2.", pick: 2},
			{text: "And what did you bring for show and tell? %s", pick: 1},
			{text: "During high school I never really fit in until I found %s club.", pick: 1},
			{text: "Hey baby, come back to my place and I’ll show you %s.", pick: 1},
			{text: "After months of practice with %s, I think I’m finally ready for %s2.", pick: 2},
			{text: "To prepare for his upcoming role, Daniel Day-Lewis immersed himself in the world of %s.", pick: 1},
			{text: "Finally! A service that delivers %s right to your door.", pick: 1},
			{text: "My gym teacher got fired for adding %s to the obstacle course.", pick: 1},
			{text: "Having problems with %s? Try %s2!", pick: 2},
			{text: "As part of his contract, Prince won’t perform without %s in his dressing room.", pick: 1},
			{text: "Listen, son. If you want to get involved with %s, I won’t stop you. Just steer clear of %s2.", pick: 2}
		]
	},
	pax: {
		white: [
			'An immediately regrettable $9 hot dog from the Boston Convention Center',
			'Running out of stamina',
			'Casting Magic Missle at a bully',
			'Getting bitch slapped by Dhalsim',
			'Firefly: Season 2',
			'Rotating shapes in mid-air so that they fit into other shapes when they fall',
			'Jiggle physics',
			'Paying the iron price',
			'Loading from a previous save',
			'Sharpening a foam broadsword on a foam whetstone',
			'The rocket launcher',
			'The depression that ensues after catching ‘em all',
			'Violating the First Law of Robotics',
			'Getting inside the Horadric Cube with a hot babe and pressing the transmute button',
			'Punching a tree to gather wood',
			'Spending the year’s insulin budget on Warhammer 40k figurines',
			'Achieving 500 actions per minute',
			'Forgetting to eat, and consequently dying',
			'Wil Wheaton crashing an actual spaceship',
			'The Klobb',
			'Charging up all the way',
			'Vespene gas',
			'Judging elves by the color of their skin and not by the content of their character',
			'Smashing all the pottery in a Pottery Barn in search of rupees'
		],
		black: [
			{text: "I have an idea even better than Kickstarter, and it’s called %sstarter.", pack: 1},
			{text: "You have been waylaid by %s and must defend yourself.", pack: 1},
			{text: "Action Stations! Action Stations! Set condition one throughout the fleet and brace for %s!", pack: 1},
			{text: "In the final round of this year’s Omegathon, Omeganauts must face off in a game of %s.", pack: 1},
			{text: "Press (down)(down)(back)(forward)(B) to unleash %s.", pack: 1},
			{text: "I don’t know exactly how I got the PAX plague, but I suspect it had something to do with %s.", pack: 1}
		]
	},
	nigrahs: {
		white: [
			'A face like a bucket of smashed crabs'
		],
		black: [
			{text: "%s? Ten-outta-ten!", pick: 1},
			{text: "AND YOU THINK THAT OF ME?\\I AM THE ONE WHO IS %s", pick: 1},
			{text: "Yeah! %s bitch!", pick: 1},
			{text: "WHERE IS HE? %s", pick: 1}
		]
	}
},


Symbols = [
	'fighter-jet',
	'gamepad',
	'umbrella',
	'wheelchair',
	'beer',
	'bug',
	'cutlery',
	'magic',
	'crosshairs',
	'coffee',
	'ambulance'
]





// #########################################################################
// Static Routes

	app.configure(function(){

		// Process less files
		app.use(lessMiddleware({
			src : __dirname + "/public",
			compress : true
		}))

		// allow direct access to files in the public directory
		app.use(express.static(__dirname + '/public'));

		return;

	})



// #########################################################################
// Routes

	app.get('/', function(req, res){
		res.sendfile(__dirname + '/public/index.html');

		return;
	})



// #########################################################################
// Sockets

	io.sockets.on('connection', function(socket){

		console.log('Connection: ' + socket.id);
		console.log('');

		socket.emit('connected', {games: Games});

		var room = '';
		var mygame;
		var myplayer;


		socket.on('browse', function(data){
			for(var i=0;i<connected_players.length;i++){
				if(connected_players[i].name == data.name){
					socket.emit('username_taken');
					return;
				}
			}


			connected_players.push({
				name: data.name,
				socket_id: socket.id
			})

			socket.emit('browsing');
			return;
		})



		socket.on('join_game', function(data){

			debug && console.log('join_game 1');

			var gamename;

			// if no game name was provided
			if(typeof data.name == 'undefined'){

				debug && console.log('join_game n1');

				// create a game based off the users name
				gamename = data.player.name;

				if(data.player.name[data.player.name.length-1] == 's'){

					debug && console.log('join_game n2');
					gamename += '\' game';

				}else{

					debug && console.log('join_game n3');
					gamename += '\'s game';

				}		

			// if the game name was provided
			}else{
						
				debug && console.log('join_game n4');
				
				// connect to that game
				gamename = data.name;
			}

			
			debug && console.log('join_game 2');

			if(Games[gamename] && Games[gamename].players.length == Games[gamename].player_limit){
				socket.emit('full_game');
				return;
			}

			// a flag that tells me if the game was newly created or not
			var created = false;

			if(room == '') room = gamename;
			debug && console.log('join_game 3');

			// If the room doesn't exist
			if(typeof Games[room] == undefined || !Games[room]){

				created = true;

				// create it
				Games[room] = new Game();
				// name it
				Games[room].name = room;

				// create the list of cards available from all the expansions
				for(expansion in Games[room].expansions){
					var exp = Expansions[expansion];

					if(Games[room].expansions[expansion]){
						Games[room].cards = Games[room].cards.concat(exp.white);
						Games[room].blacks = Games[room].blacks.concat(exp.black);
					}
					
				}
			}

			debug && console.log('join_game 4');

			mygame = Games[room];

			console.log(mygame.blacks);

			// join the room for this game
			socket.join(room);

			debug && console.log('join_game 5');

			// ???
			//data.player.socket_id = socket.id;

			// create them
			var player = new Player();
			player.name = process_player_name(Games[room], data.player.name.substr(0,15));
			player.socket_id = socket.id;

			debug && console.log('join_game 6');

			myplayer = player;

			// choose a symbol for the player
			// keep choosing until we're sure we get one that isn't already taken
			do{
				player.symbol = Symbols[parseInt(Math.random() * Symbols.length)];
			}while(mygame.symbolsInUse.indexOf(player.symbol) != -1);
			
			debug && console.log('join_game 7');

			// once we've found one that hasn't been used, record that we're using it now
			mygame.symbolsInUse.push(player.symbol);
			
			debug && console.log('join_game 8');

			// add them to it.
			Games[room].players.push(player);
			
			debug && console.log('join_game 9');

			// to you
			socket.emit('game_joined', {socket: socket.id, room: Games[room], player: player});
			
			debug && console.log('join_game 10');

			// to room
			socket.broadcast.to(room).emit('player_joined', {player: player});
			
			debug && console.log('join_game 11');

			// to all
			if(created) io.sockets.emit('game_created', {room: Games[room]});
			else io.sockets.emit('game_players_updated', {room: Games[room]});
			
			debug && console.log('join_game 12');


			function process_player_name(game, player_name){
				var arr = [];

				for(var i=0;i<game.players.length;i++){
					arr.push(game.players[i].name);
				}

				if(arr.indexOf(player_name) != -1){
					var n = 2;
					var fin = false;

					while(!fin){
						if(arr.indexOf(player_name+' ('+n+')') == -1){
							return player_name + ' ('+n+')';
						}else{
							n += 1;
						}
					}
				}else{
					return player_name;
				}
			}
			debug && console.log('join_game 13/');
			debug && console.log('');

			return;

		})

		

		socket.on('leave_game', function(data){

			debug && console.log('leave_game 1');

			if(!mygame){
				debug && console.log('reset /');
				debug && console.log('');
				socket.emit('reset');
				return;
			}

			// if the player leaving is the czar
			if(myplayer.czar){
				// then end the round
				Games[data.name].current_whites = [];
				io.sockets.in(room).emit('czar_left');
			}

			room = '';

			// leave the socket room
			socket.leave(data.name);

			debug && console.log('leave_game 2');

			//release_hand(socket.id);

			debug && console.log('leave_game 3');

			var thisgame = Games[data.name];

			debug && console.log('leave_game 4');

			// look through all the players in this game
			for(var i=0;i<thisgame.players.length;i++){

				// if any of the players have the same socket id as the one that just disconnected
				if(thisgame.players[i].socket_id == socket.id){

					// free up this users symbol
					thisgame.symbolsInUse.splice(thisgame.symbolsInUse.indexOf(thisgame.players[i].symbol), 1);

					// remove him from the player list.
					thisgame.players.splice(i, 1);

					// go through all the cards that have been played
					for(var j=0;j<thisgame.current_whites.length;j++){
						// and if we find his
						if(thisgame.current_whites[j].player.socket_id == socket.id){
							// remove it.
							thisgame.current_whites.splice(j, 1);
						}
					}


					var n = 0;

					// loop through all players again
					for(var j=0;j<thisgame.players.length;j++){
						// and check if this player has a card in the current_whites
						for(var k=0;k<thisgame.current_whites.length;k++){
							// if they do
							if(thisgame.current_whites[k].player.socket_id == thisgame.players[j].socket_id){
								// increase n by one
								n++;
							}
						}
					}

					var a = 0;

					for(var j=0;j<thisgame.players.length;j++){
						if(thisgame.players[j].active){
							a++;
						}
					}

					// if n == players.length then every player has played a card, so reveal.
					thisgame.reveal = n == a - 1;
					//console.log('thisgame.current_whites.length: '+thisgame.current_whites.length);
					//console.log('thisgame.players.length: '+(thisgame.players.length-1));

					// emit that the user left

					// to everyone in the room
					io.sockets.in(data.name).emit('player_left', {socket_id: socket.id, game: thisgame});
					// to everyone
					io.sockets.emit('game_players_updated', {room: Games[data.name]});
					// to you
					socket.emit('left_game');
				}
			}

			mygame = false;

			debug && console.log('leave_game 5');

			// check if the players list is empty
			if(thisgame.players.length == 0){
				// if so, close this game.
				delete Games[data.name];

				io.sockets.emit('game_closed', {name: data.name});
			}

			debug && console.log('leave_game /');
			debug && console.log('');

			return;

		})




		socket.on('change_setting', function(data){
			
			debug && console.log('change_setting 1');

			if(!mygame){
				debug && console.log('reset /');
				debug && console.log('');
				socket.emit('reset');
				return;
			}

			if(typeof Games[data.game] == undefined) return;

			debug && console.log('change_setting 2');

			Games[data.game] = merge(Games[data.game], data.settings);

			debug && console.log('change_setting 3');

			socket.broadcast.to(room).emit('game_updated', data);

			debug && console.log('change_setting/');
			debug && console.log('');

			return;

		})





		socket.on('request_card', function(data){

			debug && console.log('request_card 1');

			if(!mygame){
				debug && console.log('reset /');
				debug && console.log('');
				socket.emit('reset');
				return;
			}

			var cards = [];

			for(var i=0;i<data.count;i++){
				var card;

				debug && console.log('request_card 2');

				do{
					card = mygame.cards[parseInt(Math.random() * mygame.cards.length)];
				}while(mygame.cardsInUse.indexOf(card) != -1);


				debug && console.log('request_card 3');

				mygame.cardsInUse.push(card);
				cards.push(card);

			}

			debug && console.log('request_card 4');

			for(game in Games){
				// loop through all players in this game
				for(var i=0;i<Games[game].players.length;i++){
					// if this player is the one with the socket_id
					if(Games[game].players[i].socket_id == socket.id){

						Games[game].players[i].hand = merge(Games[game].players[i].hand, cards);
					}
				}
			}

			debug && console.log('request_card 5');

			socket.emit('deal_card', {cards: cards});

			debug && console.log('request_card /');
			debug && console.log('');
			
			return;

		})



		socket.on('request_black', function(){

			debug && console.log('request_black 1');

			if(!mygame){
				debug && console.log('reset /');
				debug && console.log('');
				socket.emit('reset');
				return;
			}

			var card;

			do{
				card = mygame.blacks[parseInt(Math.random() * mygame.blacks.length)];
			}while(mygame.blacksInUse.indexOf(card) != -1);

			debug && console.log('request_black 2');

			mygame.blacksInUse.push(card);
			mygame.current_black = [];
			mygame.current_black.push(card);

			debug && console.log('request_black 3');

			for(var i=0;i<mygame.players.length;i++){
				mygame.players[i].active = true;
			}

			io.sockets.in(room).emit('deal_black', {card: card});
			
			debug && console.log('request_black /');
			debug && console.log('');
			
			return;

		})



		socket.on('game_started', function(){
			debug && console.log('game_started 1');

			if(!mygame){
				debug && console.log('reset /');
				debug && console.log('');
				socket.emit('reset');
				return;
			}

			if(parseInt(mygame.score_limit) <= 1 || isNaN(parseInt(mygame.score_limit)) || mygame.player_limit > 11){
				socket.emit('bad_setting');
				debug && console.log('bad_setting /');
				debug && console.log('');
				return;
			}

			mygame.score_limit = parseInt(mygame.score_limit);

			mygame.started = true;

			// choose the czar
			var theczar = mygame.players[parseInt(Math.random() * mygame.players.length)];
			
			debug && console.log('game_started 2');

			theczar.czar = true;

			debug && console.log('game_started 3');

			// to all in room
			io.sockets.in(room).emit('start_game', {czar: theczar});

			debug && console.log('game_started /');
			debug && console.log('');

			return;

		})



		socket.on('play_card', function(data){
			debug && console.log('play_card 1');

			if(!mygame){
				debug && console.log('reset /');
				debug && console.log('');
				socket.emit('reset');
				return;
			}

			mygame.current_whites.push(data.card);

			debug && console.log('play_card 2');

			var n = 0;

			// loop through all players again
			for(var j=0;j<mygame.players.length;j++){
				// and check if this player has a card in the current_whites
				for(var k=0;k<mygame.current_whites.length;k++){
					// if they do
					if(mygame.current_whites[k].player.socket_id == mygame.players[j].socket_id){
						// increase n by one
						n++;
					}
				}
			}

			var a = 0;

			for(var j=0;j<mygame.players.length;j++){
				if(mygame.players[j].active){
					a++;
				}
			}

			// if n == players.length then every player has played a card, so reveal.
			mygame.reveal = n == a - 1;

			//mygame.reveal = mygame.current_whites.length == mygame.players.length -1;
			data.reveal = mygame.reveal;

			debug && console.log('play_card 3');

			// to everyone else in room
			//socket.broadcast.to(room).emit('card_played', data);

			// to everyone in room
			io.sockets.in(room).emit('card_played', data);

			debug && console.log('play_card /');
			debug && console.log('');

			return;

		})




		socket.on('choose_white', function(data){
			debug && console.log('choose_white 1');

			if(!mygame){
				debug && console.log('reset /');
				debug && console.log('');
				socket.emit('reset');
				return;
			}

			var card = data.card;
			var player = data.card.player;
			
			debug && console.log('choose_white 2');

			// award points

			// look through all the white cards
			for(var i=0;i<mygame.current_whites.length;i++){
				debug && console.log('choose_white loop 1');
				// once we find the one that got chosen
				if(mygame.current_whites[i].text == card.text){
					debug && console.log('choose_white loop 2');

					// look for the person that played it
					for(var j=0;j<mygame.players.length;j++){
						debug && console.log('choose_white loop 3');
						// when we find them
						if(mygame.players[j].socket_id == player.socket_id){
							debug && console.log('choose_white loop 4');
							// award that player a point
							mygame.players[j].score += 1;
							console.log(mygame.players[j].name+' score: '+mygame.players[j].score);
							console.log('game limit: '+mygame.score_limit);

							if(mygame.players[j].score == mygame.score_limit){

								debug && console.log('choose_white loop 5');

								io.sockets.in(room).emit('winner', {player: mygame.players[j]});
							}

							break;
						}
					}

					break;
				}
			}

			debug && console.log('choose_white 3');

			// remove cards

			// look through all of the played cards
			for(var i=0;i<mygame.current_whites.length;i++){
				
				// look through all of the players in the game
				for(var j=0;j<mygame.players.length;j++){
					
					// look through all of the players cards
					for(var k=0;k<mygame.players[j].hand.length;k++){
						
						// once we find the one that was in the players hand, and in the played cards
						if(mygame.players[j].hand[k] == mygame.current_whites[i].text){

							// and remove it from the players hand
							mygame.players[j].hand.splice(k, 1);

							// and remove it from the cards in use so that it can be dealt again
							mygame.cardsInUse.splice(mygame.cardsInUse.indexOf(mygame.current_whites[i].text), 1);
						}
					}
				}
			}

			debug && console.log('choose_white 4');

			mygame.reveal = false;

			// clear the list of white cards that were played
			mygame.current_whites = [];

			debug && console.log('choose_white 5');

			// to all in room
			io.sockets.in(room).emit('white_chosen', data);

			debug && console.log('choose_white /');
			debug && console.log('');

			return;
		})


		socket.on('wipe', function(){

			debug && console.log('wipe 1');

			if(!mygame){
				debug && console.log('wipe stop /');
				debug && console.log('');
				return;
			}

			// choose the next czar
			// loop through all the players until we find the czar
			var czar = 0;

			for(var i=0;i<mygame.players.length;i++){
				// if the current player is the czar
				if(mygame.players[i].czar){
					// remember their number
					czar = i;
					break;
				}
			}
			
			debug && console.log('wipe 2');

			// now that we know who the czar was, use their index to make the next player czar
			if(czar == mygame.players.length - 1){
				czar = 0;
			}else{
				czar += 1;
			}
			debug && console.log('wipe 3');
			// make all the users not czar
			for(var i=0;i<mygame.players.length;i++){
				mygame.players[i].czar = false;
			}
			debug && console.log('wipe 4');

			// make the correct user czar
			debug && console.log('wipe 5');
			if(mygame.players.length != 0) mygame.players[czar].czar = true;
			
			debug && console.log('wipe 6');
			// to everyone in room
			io.sockets.in(room).emit('wiped', {czar: mygame.players[czar]});
			
			debug && console.log('wipe /');
			debug && console.log('');

			return;
		})





















		socket.on('dev_reset', function(){
			// emit to all
			//io.sockets.emit('reset');

			return;
		})


		socket.on('disconnect', function(){

			//release_hand(socket.id);

			debug && console.log('disconnect 1');

			for(var i=0;i<connected_players.length;i++){
				if(connected_players[i].socket_id == socket.id){
					connected_players.splice(i, 1);
				}
			}

			debug && console.log('disconnect 2');

			for(game in Games){
				var thisgame = Games[game];

				// look through all the players in this game
				for(var i=0;i<thisgame.players.length;i++){
					var n = 0;

					for(var j=0;j<thisgame.current_whites.length;j++){
						// if they do
						if(thisgame.current_whites[j].player.socket_id == thisgame.players[i].socket_id){
							// increase n by one
							n++;
						}
					}

					// if any of the players have the same socket id as the one that just disconnected
					if(thisgame.players[i].socket_id == socket.id){
						// remove him from the player list.
						thisgame.players.splice(i, 1);

						var a = 0;
						for(var j=0;j<thisgame.players.length;j++){
							if(thisgame.players[j].active){
								a++;
							}
						}

						// if n == players.length then every player has played a card, so reveal.
						thisgame.reveal = n == a;

						io.sockets.emit('player_left', {socket_id: socket.id, game: thisgame});
					}
				}

				mygame = false;

				debug && console.log('disconnect 3');

				// check if the players list is empty
				if(thisgame.players.length == 0){
					// if so, close this game.
					delete Games[game];

					io.sockets.emit('game_closed', {name: game});
				}
			}

			debug && console.log('disconnect /');
			debug && console.log('');

			return;

		})




		return;

	})






/* doesn't work yet */
function release_hand(socket_id){
	// loop through all games
	for(game in Games){
		// loop through all players in this game
		for(var i=0;i<Games[game].players.length;i++){
			// if this player is the one with the socket_id
			if(Games[game].players[i].socket_id == socket_id){
				// loop through their hand
				for(var j=0;j<Games[game].players[i].hand.length;j++){
					// find the index of this card
					var index = Games[game].cardsInUse.indexOf(Games[game].players[i].hand[j]);
					
					// and remove that card
					Games[game].cardsInUse.splice(index, 1);
				}
			}
		}
	}
}






function merge(original, updates){
	for(var key in updates){
		if(updates[key] instanceof Object && !(updates[key] instanceof Array)){
			if(!original[key]) original[key] = {};
			original[key] = merge (original[key], updates[key]);
		}else{
			original[key] = updates[key];
		}
	}
	return original;
}