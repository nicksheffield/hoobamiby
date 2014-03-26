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
			Support for expansions
			Game closes when there is less than 3 players
			Game cannot be started if there is less than 3 players

		Version 1.5
			Added silly name generator
			Moved card list into external file expansions.js
			Server no longer crashes when all black cards have been used up
			Added chat box
			Added chat box status messages
			Victory screen is now taller
			Restart game button
			Players that leave after a match has ended, and before it has started again will no longer cause infinite loop upon rejoin
			Record of winning answers displayed at winner screen works, but currently hidden because it's ugly
			-There is currently a bug where a restarted game will not automatically close when less than 3 players are present
			-Multi pick cards implemented
			-shuffle server side
			-add kick functionality
			-sometimes card recycle from pick 2's doesn't work I don't think
			-cards seem to be appearing more than once in a round

			-maybe remove symbols. have scores where symbols are now, and a status on the right hand side
			



*/

var
express         = require('express'),
app             = express(),
server          = require('http').createServer(app),
io              = require('socket.io').listen(server, {log: false}),
path            = require('path'),
_               = require('underscore')




server.listen(8004);
console.log('Hoobamiby running');



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
	this.current_black  = [];
	this.current_whites = [];
	this.cards          = [];
	this.blacks         = [];
	this.cardsInUse     = [];
	this.blacksInUse    = [];
	this.symbolsInUse   = [];
	this.winners        = [];
	this.show_password  = true;
	this.started        = false;
	this.chosen	        = false;
	this.current_answer = '________';
	this.expansions     = {
							original: true,
							first:    true,
							second:   true,
							third:    true,
							pax:      true,
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

Expansions = require('./expansions.js'),


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
	'ambulance',
	'lightbulb-o',
	'rocket',
	'puzzle-piece',
	'money',
	'star',
	'thumbs-up',
	'plane',
	'glass',
	'flash',
	'flask',
	'flag-checkered',
	'moon-o',
	'shield',
	'sun-o',
	'tint',
	'leaf',
	'eye'
],

Names = [
	'Reginald',
	'Seaniqua',
	'Seanaynay',
	'Finklestein',
	'Pooptrooper',
	'Floplopolis',
	'Rare Akuma',
	'Duane',
	'Giygas',
	'The Batman',
	'Alf Stewart',
	'Gooby',
	'Dolan',
	'Fronk',
	'Heisenberg',
	'JESSE',
	'Watermelone',
	'Harold',
	'Bernard',
	'Pikachu',
	'Doge'
]





// #########################################################################
// Static Routes

	app.configure(function(){

		app.use(require('stylus').middleware(__dirname + '/public'));

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
		var last_name = '';


		socket.on('browse', function(data){
			for(var i=0;i<connected_players.length;i++){
				if(connected_players[i].name == data.name){
					socket.emit('username_taken');
					return;
				}
			}

			socket.join('browse');
			room = 'browse';

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

			room = gamename;
			debug && console.log('join_game 3');

			// If the room doesn't exist
			if(typeof Games[room] == undefined || !Games[room]){
				console.log('creating game' + room);

				created = true;

				// create it
				Games[room] = new Game();
				// name it
				Games[room].name = room;
			}

			debug && console.log('join_game 4');

			mygame = Games[room];

			// join the room for this game
			socket.join(room);

			socket.leave('browse');

			debug && console.log('join_game 5');

			// create them
			var player = new Player();
			player.name = data.player.name.substr(0, 20); // limit the name to only 20 char's
			player.socket_id = socket.id;

			// send message to the game
			socket.broadcast.to(room).emit('message_received', {title: player.name+" joined "+mygame.name, message: '', class: "join fa fa-arrow-right"});
			socket.emit('message_received', {title: "You "+(created ? "created" : "joined")+" "+mygame.name, message: '', class: "join fa fa-plus"});

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

			// leave the socket room
			socket.leave(data.name);
			socket.join('browse');
			room = 'browse';

			debug && console.log('leave_game 2');

			//release_hand(socket.id);

			debug && console.log('leave_game 3');

			var thisgame = Games[data.name];

			debug && console.log('leave_game 4');

			// look through all the players in this game
			var _player = _.findWhere(thisgame.players, {socket_id: socket.id});

			// send message to the room
			io.sockets.in(data.name).emit('message_received', {title: _player.name+" left "+thisgame.name, message: '', class: "leave fa fa-arrow-left"});
			socket.emit('message_received', {title: "You left "+thisgame.name, message: '', class: "leave fa fa-times"});

			// free up this users symbol
			thisgame.symbolsInUse.splice(thisgame.symbolsInUse.indexOf(_player.symbol), 1);

			// remove him from the player list.
			thisgame.players = _.reject(thisgame.players, function(player){
				return player.socket_id == _player.socket_id;
			})

			// go through all the cards that have been played
			thisgame.current_whites = _.reject(thisgame.current_whites, function(white){
				return white.socket_id == _player.socket_id;
			})


			var n = 0,
				a = 0;

			// count how many cards are owned by players
			_.each(thisgame.players, function(player, i){
				_.each(thisgame.current_whites, function(white, i){
					if(white.socket_id == player.socket_id) n++;
				})

				if(player.active) a++;
			})


			// if n == players.length then every player has played a card, so reveal.
			thisgame.reveal = n == a - 1;

			// emit that the user left

			// to everyone in the room
			io.sockets.in(data.name).emit('player_left', {socket_id: socket.id, game: thisgame});
			// to everyone
			io.sockets.emit('game_players_updated', {room: Games[data.name]});
			// to you
			socket.emit('left_game');

			mygame = false;

			debug && console.log('leave_game 5');

			// check if the players list is empty
			if(thisgame.players.length < 3 && thisgame.started || thisgame.players.length == 0){
				// if so, close this game.
				delete Games[data.name];

				io.sockets.in(data.name).emit('message_received', {title: thisgame.name+' closed because there was not enough players.', message: '', class: "leave fa fa-warning"});

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
				var thisgame = Games[game];

				_.each(thisgame.players, function(player, i){
					if(player.socket_id == socket.id){
						player.hand = merge(thisgame.players[i].hand, cards);
					}
				})
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

			debug && console.log('request_black 2');

			var card;

			if(mygame.blacksInUse.length != mygame.blacks.length){

				do{
					card = mygame.blacks[parseInt(Math.random() * mygame.blacks.length)];
				}while(mygame.blacksInUse.indexOf(card) != -1);
				
				debug && console.log('request_black 3');

			}else{
				mygame.blacksInUse = [];
				card = mygame.blacks[parseInt(Math.random() * mygame.blacks.length)];
				
				debug && console.log('request_black 4');
			}

			debug && console.log('request_black 5');

			mygame.blacksInUse.push(card);
			mygame.current_black = [];
			mygame.current_black.push(card);

			debug && console.log('request_black 6');

			_.each(mygame.players, function(player){
				player.active = true;
			})

			debug && console.log('request_black 7');

			io.sockets.in(room).emit('deal_black', {card: card});
			
			debug && console.log('request_black /');
			debug && console.log('');
			
			return;

		})



		socket.on('game_started', function(data){
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

			if(mygame.players.length < 3){
				//socket.emit('not_enough_players');
				socket.emit('message_received', {title: 'You must have more than 3 players to start.', message: '', class: 'leave fa fa-warning'})
				debug && console.log('not_enough_players /');
				debug && console.log('');
				return;
			}

			mygame.score_limit = parseInt(mygame.score_limit);

			mygame.started = true;

			mygame.expansions = data.game.expansions;

			// clear the cards before we add them all in from expansions
			mygame.cards = [];

			// create the list of cards available from all the expansions
			for(expansion in mygame.expansions){
				var exp = Expansions[expansion];

				if(mygame.expansions[expansion]){
					mygame.cards = mygame.cards.concat(exp.white);
					mygame.blacks = mygame.blacks.concat(exp.black);
				}
				
			}

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


		socket.on('reset_game', function(data){

			debug && console.log('reset_game 1');

			mygame.current_black = [];
			mygame.current_whites = [];
			mygame.cardsInUse = [];
			mygame.blacksInUse = [];
			mygame.symbolsInUse = [];
			mygame.started = false;
			mygame.chosen = false;
			mygame.current_answer = '________';

			debug && console.log('reset_game 2');

			for(var i=0;i<mygame.players.length;i++){
				mygame.players[i].score = 0;
				mygame.players[i].czar = false;
			}

			debug && console.log('reset_game 3');

			//Games[room] = newgame;

			// to all in room
			io.sockets.in(room).emit('game_reset', {game: mygame});

			debug && console.log('reset_game /');
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

			var n = 0,
				a = 0

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

			mygame.winners.push({
				black: mygame.current_black,
				white: data.card
			});

			debug && console.log('choose_white 3');

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

								io.sockets.in(room).emit('winner', {player: mygame.players[j], winners: mygame.winners});
								io.sockets.in(data.name).emit('message_received', {title: mygame.players[j].name+" wins the whole game", class: "point fa fa-trophy"});
							}else{
								io.sockets.in(data.name).emit('message_received', {title: mygame.players[j].name+" won a round", class: "point fa fa-star"});
							}

							break;
						}
					}

					break;
				}
			}

			debug && console.log('choose_white 4');

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

			debug && console.log('choose_white 5');

			mygame.reveal = false;

			// clear the list of white cards that were played
			mygame.current_whites = [];

			debug && console.log('choose_white 6');

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



		socket.on('request_name', function(){
			var name = '';

			do{
				name = Names[parseInt(Math.random()*Names.length)]
			}while(name == last_name);

			last_name = name;

			socket.emit('name_given', {name: name});

			return;
		})


		socket.on('to_browse', function(){
			socket.leave(room);
			room = 'browse';
			socket.join(room);
		})





		socket.on('message_sent', function(data){
			io.sockets.in(room).emit('message_received', data);
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
				if(thisgame.players.length < 3 && thisgame.started || thisgame.players.length == 0){
					// if so, close this game.
					delete Games[game];

					io.sockets.in(data.name).emit('message_received', {title: thisgame.name+' closed because there was not enough players.', message: '', class: "leave fa fa-warning"});

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
