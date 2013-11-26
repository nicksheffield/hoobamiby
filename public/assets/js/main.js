var app = angular.module('app', [])

app.factory('socket', function ($rootScope) {
	var socket = io.connect('http://192.241.191.126:8003');
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	}
})


app.controller('cardsCtrl', function ($scope, socket) {

	$scope.blank_answer = '________';
	$scope.stage = 'intro'; // intro -> browse_games -> setup -> game
	$scope.games = [];
	$scope.connected = false;
	$scope.joining = false;

	$scope.game = {
		name: '',
		score_limit: 8,
		player_limit: 6,
		password: '',
		show_password: true,
		current_answer: '________',
		reveal: false,
		chosen: false,
		end: false,

		players: [],
		current_whites: [],
		current_black: [],
		expansions: {},
		winner: {},

		house_rules: {
			happy_ending: false,
			rebooting: false,
			packing: false,
			rando: false,
			survival: false,
			business: false,
			neverever: false
		}
	}

	$scope.player = {
		name: localStorage.playername ? localStorage.playername : '',
		symbol: '',
		score: 0,
		czar: false,
		played_card: false,
		hand: [],
		host: false,
		socket_id: '',
		winner: false,
		active: false
	}

	$scope.$watch('player.name', function(new_val, old_val){

		localStorage.playername = new_val;

	})

	$scope.browse = function(){
		if($scope.player.name.trim() == ''){
			return;
		}

		socket.emit('browse', {name: $scope.player.name.trim()});
	}
	

	$scope.start = function(){
		socket.emit('game_started');
		socket.emit('request_black');
	}

	$scope.displayAnswer = function(answer){
		$scope.$apply(function(){
			if(!$scope.game.chosen){
				$scope.game.current_answer = answer;
			}
		});
	}

	$scope.playCard = function(elCard){
		$scope.$apply(function(){
			if(!$scope.player.played_card && !$scope.player.czar && !$scope.game.reveal && !$scope.game.end && $scope.player.active){
				//$scope.game.current_whites.push({text: elCard.text(), player: $scope.player});
				elCard.addClass('chosen');

				$scope.game.current_whites = shuffle($scope.game.current_whites);

				$scope.player.played_card = elCard.text();
				socket.emit('play_card', {card: {text: elCard.text(), player: $scope.player}});
			}
		})
	}


	$scope.createGame = function(){
		$scope.joining = true;

		// create a new game
		socket.emit('join_game', {player: $scope.player});
	}


	$scope.joinGame = function(){

		if(typeof this.game == 'undefined' || $scope.joining){
			return;
		}

		$scope.joining = true;

		socket.emit('join_game', {name: this.game.name, player: $scope.player});
	}

	$scope.leaveGame = function(){

		socket.emit('leave_game', {name: $scope.game.name});
		$scope.player.active = false;

		clearTimeout($scope.timer);

	}


	$scope.changeSetting = function(setting){
		if(!$scope.player.host) return;
		var settings = {};
		settings[setting] = $scope.game[setting];

		socket.emit('change_setting', {game: $scope.game.name, settings: settings});
	}


	$scope.reveal = function(){

		$scope.game.reveal = true;

	}


	$scope.chooseWhite = function(card){
		// look through all the current white cards
		for(var i=0;i<$scope.game.current_whites.length;i++){
			// once we find the one that got chosen
			if($scope.game.current_whites[i].text == card && !$scope.game.chosen){
				// then send that to the server
				socket.emit('choose_white', {card: $scope.game.current_whites[i]});
				$scope.game.chosen = true;
			}
		}
	}


	// when you connect to a game
	socket.on('connected', function(data){
		console.log('connected');

		if($scope.connected){
			console.log('refreshing stale client');
			location.reload();
		}else{
			$scope.connected = true;
		}

		for(game in data.games){
			$scope.games.push(data.games[game]);
		}
	})


	// when your name is approved
	socket.on('browsing', function(){
		$scope.stage = 'browse_games';
	})


	// when you join a game
	socket.on('game_joined', function(data){

		$scope.joining = false;

		$scope.game = data.room;

		$scope.stage = 'setup';

		$scope.player.name = data.player.name;
		$scope.player.symbol = data.player.symbol;
		$scope.player.socket_id = data.player.socket_id;

		if(data.room.started){
			socket.emit('request_card', {count: 10});
			$scope.stage = 'game';
		}

		// if you are now the top player in the list, you are the host
		if($scope.game.players[0].name == $scope.player.name){
			$scope.player.host = true;
		}else{
			$scope.player.host = false;
		}
	})


	// when you leave a game
	socket.on('left_game', function(){
		$scope.game.name = '';
		$scope.game.players = [];
		$scope.game.current_answer = $scope.blank_answer;

		$scope.player.hand = [];
		$scope.player.czar = false;

		$scope.stage = 'browse_games';
	})


	// when a new game is created
	socket.on('game_created', function(data){
		$scope.games.push(data.room);
	})


	// when this games player list is updated
	// Broadcasted to everyone. Used for game browser
	socket.on('game_players_updated', function(data){
		for(var i=0;i<$scope.games.length;i++){
			if($scope.games[i].name == data.room.name){
				$scope.games[i].players = data.room.players;
			}
		}
	})


	// when everyone has left a game and it closes
	// Broadcasted to everyone. Used for game browser
	socket.on('game_closed', function(data){
		// search for the closed game
		for(var i=0;i<$scope.games.length;i++){
			// when we find it
			if($scope.games[i].name == data.name){
				// remove it from the array of games
				$scope.games.splice(i, 1);
				break;
			}
		}
	})


	// when another player joined this room
	socket.on('player_joined', function(data){
		$scope.game.players.push(data.player);
	})


	// when another player left this room
	socket.on('player_left', function(data){
		// search for the user
		for(var i=0;i<$scope.game.players.length;i++){
			// once we've found them
			if($scope.game.players[i].socket_id == data.socket_id){
				// remove them from the list of players
				$scope.game.players.splice(i, 1);

				for(var j=0;j<$scope.game.current_whites.length;j++){
					if($scope.game.current_whites[j].player.socket_id == data.socket_id){
						$scope.game.current_whites.splice(j, 1);
					}
				}

				if(data.game.reveal){
					$scope.reveal();
				}
			}
		}

		// if you are now the top player in the list, you are the host
		if($scope.game.players.length && $scope.game.players[0].name == $scope.player.name){
			$scope.player.host = true;
		}else{
			$scope.player.host = false;
		}
	})


	// when this game is updated
	socket.on('game_updated', function(data){
		$scope.game = merge($scope.game, data.settings);
	})


	// when this game is started
	socket.on('start_game', function(data){
		$scope.stage = 'game';

		// if the czar is you
		if(data.czar.socket_id == $scope.player.socket_id){
			// set you as the czar
			$scope.player.czar = true;
		}

		// search through all the players in this game
		for(var i=0;i<$scope.game.players.length;i++){
			// if we find them
			if($scope.game.players[i].socket_id == data.czar.socket_id){
				// set them as the czar
				$scope.game.players[i].czar = true;
				// end the loop
				break;
			}
		}
		

		socket.emit('request_card', {count: 10});
	})


	// when you are dealt one or more cards
	socket.on('deal_card', function(data){
		for(var i=0;i<data.cards.length;i++){
			$scope.player.hand.push(data.cards[i]);
		}
	})


	// when the black card is dealt
	socket.on('deal_black', function(data){
		$scope.game.current_black = [];

		$scope.player.active = true;

		if(data.card.pick != 1){
			socket.emit('request_black');
			return;
		}

		$scope.game.current_black.push(data.card);
	})


	// when a card was played
	socket.on('card_played', function(data){
		$scope.game.current_whites.push(data.card);

		if(data.reveal){
			$scope.reveal();
		}
	})


	// when a white card is chosen
	socket.on('white_chosen', function(data){

		var card = data.card;
		var player = data.card.player;

		$scope.game.current_answer = card.text;
		$scope.game.chosen = true;
		
		// loop through all the players
		for(var i=0;i<$scope.game.players.length;i++){

			// find the one that won
			if($scope.game.players[i].socket_id == data.card.player.socket_id){
				// and give that player a point
				$scope.game.players[i].score += 1;
				$scope.game.players[i].winner = true;
			}

			// also for each player, 
			for(var j=0;j<$scope.game.players[i].hand.length;j++){
				// make sure all their white cards aren't highlighted
				$scope.game.players[i].hand[j].chosen = false;
			}
		}

		// go through the cards on the screen and light up the one that won
		for(var i=0;i<$scope.game.current_whites.length;i++){
			if($scope.game.current_whites[i].text == card.text){
				$scope.game.current_whites[i].chosen = true;
			}
		}


		if(!$scope.game.end){

			// if the player is the czar
			if($scope.player.czar){

				// then set a timer that will go off after 5 seconds
				$scope.timer = setTimeout(function(){
					// and cause everyone's screen to wipe, ready for the next round
					socket.emit('wipe');
					socket.emit('request_black');
				}, 5000);

			}else{

				// remove the played cards from each players hand
				$scope.player.hand.splice($scope.player.hand.indexOf($scope.player.played_card), 1);

				// ask for a new card
				socket.emit('request_card', {count: 1});

			}
		}
		

	})


	// when the round ends (or a czar leaves)
	socket.on('wiped', function(data){

		console.log('wiped');


		// make sure the player is not the czar
		$scope.player.czar = false;

		$scope.game.current_answer = $scope.blank_answer;

		// look through all the players
		for(var i=0;i<$scope.game.players.length;i++){
			// make sure each player isn't displayed as a winner anymore
			$scope.game.players[i].winner = false;
			// when we find the player that is the new czar
			if($scope.game.players[i].socket_id == data.czar.socket_id){
				// make them the czar
				$scope.game.players[i].czar = true;

				// if the new czar is you
				if(data.czar.socket_id == $scope.player.socket_id){
					// make you the czar locally
					$scope.player.czar = true;
				}

			// if not
			}else{
				// make them not the czar.
				$scope.game.players[i].czar = false;
			}
		}

		// make sure all your cards are white
		$('.hand .card').removeClass('chosen');

		$scope.game.current_whites = [];
		$scope.game.chosen = false;
		$scope.player.played_card = false;
		$scope.game.reveal = false;
	})


	// when someone wins the game
	socket.on('winner', function(data){
		$scope.stage.end = true;

		// after 5 seconds
		setTimeout(function(){
			// show the victory screen with the new winner
			$scope.game.winner = data.player;
			$scope.stage = 'victory';
		}, 5000);
	})


	// when a czar leaves
	socket.on('czar_left', function(){
		console.log('czar left');
		socket.emit('wipe');
	})


	// when a game already has 11 players
	socket.on('full_game', function(){
		$scope.joining = false;
		alert('This game is full.');
	})


	socket.on('bad_setting', function(){
		alert('Those settings will not work.');
	})


	socket.on('username_taken', function(){
		alert('Someone already has that name.');
	})



	// when the client is told to refresh
	socket.on('reset', function(){
		console.log('reset');
		location.reload();
	})

})


app.directive('card', function () {
	return {
		restrict: 'A',
		transclude: true,
		template:
			'<div class="text" ng-transclude></div>' +
			'<div class="star">' +
				'<i class="fa fa-check"></i>' +
			'</div>',
		link: function (scope, element, attrs) {
			element.addClass('card ' + attrs.card);
		}
	}
})

app.directive('black', function () {
	return {
		restrict: 'A',
		template:
			'<div class="text">' +
				'<span class="before_answer1"></span>' +
				'<span class="answer1 answer">{{game.current_answer}}</span>' +
				'<span class="after_answer1"></span>' +
				'<span class="answer2 answer"></span>' +
				'<span class="after_answer2"></span>' +
			'</div>',
		link: function(scope, element, attrs) {
			element.addClass('card black');
			
			attrs.$observe('text', function(text) {
				var text = text.replace(/--/g, '<wbr>').replace(/\\/g,'<br>').split('%s');

				element.find('.before_answer1').html(text[0]);
				if(text[1]) element.find('.after_answer1').html(text[1]);
			})
			
			if(attrs.card == 'black'){
				console.log($('.text', this).html());
			}
			
		}
	}
})


app.directive('answer', function(){
	return function(scope, element, attrs){

		element.addClass('answer');
		
		$(element).mouseover(function(){
			scope.displayAnswer($('.text', this).text());
		})

		$(element).mouseout(function(){
			scope.displayAnswer(scope.blank_answer);
		})
		
	}
})

app.directive('judge', function(){
	return function(scope, element, attrs){
		
		$(element).mouseover(function(){
			if(scope.player.czar){
				$('.star', this).addClass('show');
			}
			
		})
		
		$(element).mouseout(function(){
			if(scope.player.czar){
				$('.star', this).removeClass('show');
			}
		})

		$(element).click(function(){
			if(scope.player.czar){
				scope.chooseWhite(element.find('.text').text());
			}
		})
	}
})

app.directive('inhand', function(){
	return function(scope, element, attrs){

		$(element).click(function(){
			scope.playCard(element);
		})
		
	}
})


app.directive('modal', function(){
	return {
		restrict: 'E',

		transclude: true,

		template: 
			'<div class="modal">' +
				'<div class="content" ng-transclude></div>' +
				'<div class="close">' +
					'<i class="fa fa-times"></i>' +
				'</div>' +
			'</div>',

		link: function(scope, element, attrs){
			$('.close', element).click(function(){
				console.log('close modal');
			})
		}
	}
})










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



function shuffle(yourArray){
	return yourArray.sort(function() {
		return 0.5 - Math.random()
	});
}