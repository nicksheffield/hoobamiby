#Hoobamiby
A Cards Against Humanity clone

Inspired by [Pretend You're Xyzzy](http://pyz.socialgamer.net/game.jsp).

Runs on node.js, using socket.io and angular.js

```
dP                         dP                           oo dP                
88                         88                              88                
88d888b. .d8888b. .d8888b. 88d888b. .d8888b. 88d8b.d8b. dP 88d888b. dP    dP 
88'  `88 88'  `88 88'  `88 88'  `88 88'  `88 88'`88'`88 88 88'  `88 88    88 
88    88 88.  .88 88.  .88 88.  .88 88.  .88 88  88  88 88 88.  .88 88.  .88 
dP    dP `88888P' `88888P' 88Y8888' `88888P8 dP  dP  dP dP 88Y8888' `8888P88 
                                                                         .88 
                                                                     d8888P 

By Nick Sheffield - numbereft@gmail.com
[http://hoobamiby.com](http://hoobamiby.com)

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
```

###Todo

	* Multi pick cards implemented
	* Record of winning answers displayed at winner screen
	* Support for expansions
	* When czar leaves and the cards are revealed, everything bugs out
	* Delay on winner screen