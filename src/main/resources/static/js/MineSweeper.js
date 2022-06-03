//console.clear();
const getSettings = document.getElementById('setSettings');

var timer;
var seconds = 0;
let stompClient = null;
let currentSubscription;
let gameSubscription;
let username = null;
var roomId = null;
let gameTopic=null;

let size = 10; // size x size tiles
let bombFrequency = 0.2; // percentage of bombs
let tileSize = 60;

const board = document.querySelectorAll('.board')[0];
//let visibleBoard = [];
let tiles;
let boardSize;

const restartBtn = document.querySelectorAll('.btn')[0];
const endscreen = document.querySelectorAll('.endscreen')[0]

// settings
const boardSizeBtn = document.getElementById('boardSize');
const tileSizeBtn = document.getElementById('tileSize');
const difficultyBtns = document.querySelectorAll('.difficulty');

let bombs = [];
let numbers = [];
let numberColors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c', '#34495e', '#7f8c8d',];
let endscreenContent = {
    winByComplete: '<span>✔</span>GG! You won by fastest completing! Your time is <span id="WinnerTime"></span> seconds!',
    winByBoom: '<span>✔</span> Haha, looks like <span id="LoserName"></span> just exploded on a mine! Consider yourself a winner! ',
    loseByComplete: '💣 Game over! <span id="WinnerName"></span> completed the game within the fastest time of <span id="WinnerTime"></span> seconds! Better luck next time!',
    loseByBoom: '💣 Booom, you have exploded! Game over. Better luck next time!',
    endByDissconect: 'Oopsie! Looks like someone abandoned your match! Restart the game!'};
let gameOver = false;


//timer
function timerAddSecond(){
    if(seconds < 9999 && gameOver === false){
        seconds ++;
        document.getElementById("timer").innerHTML = seconds;
    }
}
function timeRuns(){
    if(gameOver === false){
        timer = setInterval(timerAddSecond, 1000);
    }
}


/* clear board */
function clear(){
	// console.clear();
	gameOver = false;
	bombs = [];
	numbers = [];
	endscreen.innerHTML = '';
	endscreen.classList.remove('show');


	try {
	    tiles.forEach(tile => {
        tile.remove();
        	});
	} catch (e){
	}

}

/* setup the game */
function setup(){
	for (let i = 0; i < Math.pow(size, 2); i++) {
		const tile = document.createElement('div');
		tile.classList.add('tile');
		board.appendChild(tile);
	}

	tiles = document.querySelectorAll('.tile');
	boardSize = Math.sqrt(tiles.length);
	board.style.width = boardSize * tileSize + 'px';

	document.documentElement.style.setProperty('--tileSize', `${tileSize}px`);
	document.documentElement.style.setProperty('--boardSize', `${boardSize * tileSize}px`);

	let x = 0;
	let y = 0;

	tiles.forEach((tile, i) => {
		// set tile coordinates
		tile.setAttribute('data-tile', `${x},${y}`);

		// add bombs
		let random_boolean = Math.random() < bombFrequency;
		if (random_boolean) {
			bombs.push(`${x},${y}`);
			if (x > 0) numbers.push(`${x-1},${y}`);
			if (x < boardSize - 1) numbers.push(`${x+1},${y}`);
			if (y > 0) numbers.push(`${x},${y-1}`);
			if (y < boardSize - 1) numbers.push(`${x},${y+1}`);

			if (x > 0 && y > 0) numbers.push(`${x-1},${y-1}`);
			if (x < boardSize - 1 && y < boardSize - 1) numbers.push(`${x+1},${y+1}`);

			if (y > 0 && x < boardSize - 1) numbers.push(`${x+1},${y-1}`);
			if (x > 0 && y < boardSize - 1) numbers.push(`${x-1},${y+1}`);
		}

		x++;
		if (x >= boardSize) {
			x = 0;
			y++;
		}

		/* rightclick */
		tile.oncontextmenu = function(e) {
			//sendMove(numbers);
			e.preventDefault();
			flag(tile);
		}

		/* leftclick */
		tile.addEventListener('click', function(e) {
			//sendMove(numbers);
			clickTile(tile);
		});
	});

	sendBoard(bombs, numbers);
	$("#timer").html(0);


	console.log("BOMBS:"); //Remove
		console.log(bombs);
		console.log("NUMBERS:"); //Remove
		console.log(numbers);  //Remove
	numbers.forEach(num => {
		let coords = num.split(',');
		let tile = document.querySelectorAll(`[data-tile="${parseInt(coords[0])},${parseInt(coords[1])}"]`)[0];
		let dataNum = parseInt(tile.getAttribute('data-num'));
		if (!dataNum) dataNum = 0;
		tile.setAttribute('data-num', dataNum + 1);
	});
}

/* flag a tile */
const flag = (tile) => {
	if (gameOver) return;
	if (!tile.classList.contains('tile--checked')) {
		if (!tile.classList.contains('tile--flagged')) {
			tile.innerHTML = '🚩';
			tile.classList.add('tile--flagged');
		} else {
			tile.innerHTML = '';
			tile.classList.remove('tile--flagged');
		}
	}
}

/* check if bomb or not */
const clickTile = (tile) => {
	if (gameOver) return;
	if (tile.classList.contains('tile--checked') || tile.classList.contains('tile--flagged')) return;
	let coordinate = tile.getAttribute('data-tile');
	if (bombs.includes(coordinate)) {
		endGame(tile);
	} else {
		/* check if nearby bomb */
		let num = tile.getAttribute('data-num');
		if (num != null) {
			tile.classList.add('tile--checked');
			tile.innerHTML = num;
			tile.style.color = numberColors[num-1];
			setTimeout(() => {
				checkVictory();
			}, 100);
			return;
		}
		checkTile(tile, coordinate);
	}
	tile.classList.add('tile--checked');
}


/* clicked the right one */
const checkTile = (tile, coordinate) => {

	console.log('✔');
	let coords = coordinate.split(',');
	let x = parseInt(coords[0]);
	let y = parseInt(coords[1]);

	/* check nearby tiles */
	setTimeout(() => {
		if (x > 0) {
			let targetW = document.querySelectorAll(`[data-tile="${x-1},${y}"`)[0];
			clickTile(targetW, `${x-1},${y}`);
		}
		if (x < boardSize - 1) {
			let targetE = document.querySelectorAll(`[data-tile="${x+1},${y}"`)[0];
			clickTile(targetE, `${x+1},${y}`);
		}
		if (y > 0) {
			let targetN = document.querySelectorAll(`[data-tile="${x},${y-1}"]`)[0];
			clickTile(targetN, `${x},${y-1}`);
		}
		if (y < boardSize - 1) {
			let targetS = document.querySelectorAll(`[data-tile="${x},${y+1}"]`)[0];
			clickTile(targetS, `${x},${y+1}`);
		}

		if (x > 0 && y > 0) {
			let targetNW = document.querySelectorAll(`[data-tile="${x-1},${y-1}"`)[0];
			clickTile(targetNW, `${x-1},${y-1}`);
		}
		if (x < boardSize - 1 && y < boardSize - 1) {
			let targetSE = document.querySelectorAll(`[data-tile="${x+1},${y+1}"`)[0];
			clickTile(targetSE, `${x+1},${y+1}`);
		}

		if (y > 0 && x < boardSize - 1) {
			let targetNE = document.querySelectorAll(`[data-tile="${x+1},${y-1}"]`)[0];
			clickTile(targetNE, `${x+1},${y-1}`);
		}
		if (x > 0 && y < boardSize - 1) {
			let targetSW = document.querySelectorAll(`[data-tile="${x-1},${y+1}"`)[0];
			clickTile(targetSW, `${x-1},${y+1}`);
		}
	}, 10);
}

function winByBoom(LoserName){
    endscreen.innerHTML = endscreenContent.winByBoom;
    document.getElementById("LoserName").innerHTML = LoserName;
    endscreen.classList.add('show');
    gameOver = true;
}

function loseByBoom(){
    endscreen.innerHTML = endscreenContent.loseByBoom;
    endscreen.classList.add('show');
    gameOver = true;
}

function winByComplete(WinnerTime, WinnerName){
    endscreen.innerHTML = endscreenContent.winByComplete;
    document.getElementById("WinnerTime").innerHTML = WinnerTime;
    endscreen.classList.add('show');
    gameOver = true;
}

function loseByComplete(WinnerTime, WinnerName){
    endscreen.innerHTML = endscreenContent.loseByComplete;
    document.getElementById("WinnerTime").innerHTML = WinnerTime;
    document.getElementById("WinnerName").innerHTML = WinnerName;
    endscreen.classList.add('show');
    gameOver = true;
}

function endByDissconect(){
    endscreen.innerHTML = endscreenContent.endByDissconect;
    endscreen.classList.add('show');
    gameOver = true;
}

//Check for losing by clicking on mine and send message to server
const endGame = (tile) => {
	tiles.forEach(tile => {
		let coordinate = tile.getAttribute('data-tile');
		if (bombs.includes(coordinate)) {
			tile.classList.remove('tile--flagged');
			tile.classList.add('tile--checked', 'tile--bomb');
			tile.innerHTML = '💣';
		}

	});
	    //Send Message If Lost
       	sendLose(username);
}

//Check for winning and send message to server
const checkVictory = () => {
	let win = true;
	tiles.forEach(tile => {
		let coordinate = tile.getAttribute('data-tile');
		if (!tile.classList.contains('tile--checked') && !bombs.includes(coordinate)) win = false;
	});
	if (win) {
		//Send Message If Win
		sendWin(username);
	}
}

function connect() {
	console.log("connect...connect")
	 if( $('#room-id').val() == "" ||  $('#name').val() == "" )
     {
         preventDefault();
     }
     username = $("#name").val().trim();
     if (username) {
         $("#stage1").hide();
         $("#stage2").attr("class","");


        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.connect({}, onConnected, onError);
    }
}

function onConnected () {
	console.log("Conencted...onConnected") //Remove
    enterRoom($("#room-id").val());
    $(".connecting").hide();
}

const onError = (error) => {
    $(".connecting").css("color","red");
    $(".connecting").text('Could not connect to WebSocket server. Please refresh this page to try again!');
}

const enterRoom = (newRoomId) => {
	roomId = newRoomId;
	gameTopic=`/app/game/${newRoomId}`
    $("#room-id-display").text(roomId);
    topic = `/app/chat/${newRoomId}`;
    gameTopic = `/app/game/${newRoomId}`;

    if (currentSubscription || gameSubscription) {

		currentSubscription.unsubscribe();
        gameSubscription.unsubscribe();
    }
    currentSubscription = stompClient.subscribe(`/channel/${roomId}`, onMessageReceived);
    gameSubscription = stompClient.subscribe(`/game/${roomId}`, onGameMessageReceived);

    stompClient.send(`${topic}/addUser`, {}, JSON.stringify({sender: username, type: 'JOIN'}));
    stompClient.send(`${gameTopic}/joinToTheGame`, {}, JSON.stringify({sender: username, type: 'JOIN'}));
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');
    if (message.type == 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type == 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
        getSettings.style.display = 'block';
        endByDissconect();
        clearInterval(timer);


    } else {
        messageElement.classList.add('chat-message');

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender + ":");
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    $('#messageArea').append(messageElement);
    $('#messageArea').scrollTop($('#messageArea').prop('scrollHeight'));
}

function onGameMessageReceived (payload){
	var gameMessage = JSON.parse(payload.body);
	if (gameMessage.type == 'JOIN'){
	    console.log("ON GAME MESSAGE RECEIVED: ")//Remove
        console.log(gameMessage) //Remove
        getSettings.style.display = 'block';
        clearInterval(timer);

	} else if (gameMessage.type == 'WIN'){
        console.log("ON WIN MESSAGE RECEIVED: ")//Remove
        console.log(gameMessage) //Remove
        getSettings.style.display = 'block';
        clearInterval(timer);

        //Winner page
        let WinnerTime = gameMessage.time.time;
        let WinnerName = gameMessage.username.username;

        if(username == WinnerName){
            winByComplete(WinnerTime, WinnerName);
        } else{
            loseByComplete(WinnerTime, WinnerName);
        }

    }else if (gameMessage.type == 'LOSE'){
         console.log("ON LOSE MESSAGE RECEIVED: ")//Remove
         console.log(gameMessage) //Remove
         getSettings.style.display = 'block';
         clearInterval(timer);

         //Loser page
         let LoserName = gameMessage.username.username;

        if(username == LoserName){
            loseByBoom(LoserName);
        } else{
            winByBoom(LoserName);
        }

    }else if(gameMessage.type == 'GAME') {
             console.log("ON GAME MESSAGE RECEIVED: ")//Remove
             console.log(gameMessage) //Remove
             setBoard(gameMessage);
             getSettings.style.display = 'none';}
}

//Set sent Board from Message
function setBoard(bombsMap){

      $("#stageWin").hide();
      $("#stageLose").hide();
      $("#stage2").show();

    clear();
    var checkTimer = true;
    timer = 0;
    seconds=0;

	let coordsBombs = bombsMap.bombs.bombs;
	let coordsNumbers = bombsMap.numbers.numbers;
	let sentSize = bombsMap.size.size;
	console.log("BOMBS" + coordsBombs);
	console.log("NUMBERS" + coordsNumbers);
	console.log("SET BOARD:" + bombsMap);


	for (let i = 0; i < Math.pow(sentSize, 2); i++) {
    		const tile = document.createElement('div');
    		tile.classList.add('tile');
    		board.appendChild(tile);
    	}

    	tiles = document.querySelectorAll('.tile');
    	boardSize = Math.sqrt(tiles.length);
    	board.style.width = boardSize * tileSize + 'px';

    	document.documentElement.style.setProperty('--tileSize', `${tileSize}px`);
    	document.documentElement.style.setProperty('--boardSize', `${boardSize * tileSize}px`);

    	let x = 0;
    	let y = 0;

    	tiles.forEach((tile, i) => {
    		// set tile coordinates
    		tile.setAttribute('data-tile', `${x},${y}`);

    		/* rightclick */
    		tile.oncontextmenu = function(e) {
    			//sendMove(numbers);
    			e.preventDefault();
    			flag(tile);
    		}

    		/* leftclick */
    		tile.addEventListener('click', function(e) {
    			//sendMove(numbers);
    			clickTile(tile);

    			if(checkTimer){
    			    seconds = 0;
    			    timeRuns();
    			    checkTimer = false;
    			}
    		});

    		x++;
            if (x >= sentSize) {
                x = 0;
                y++;
            }
    	});

        bombs=[]
        tiles = document.querySelectorAll('.tile');
        coordsBombs.forEach(tempNum=>{
            let coordsBombs = tempNum.split(',');
            let x = parseInt(coordsBombs[0]);
            let y = parseInt(coordsBombs[1]);
            bombs.push(`${x},${y}`);
        });

        numbers = [];
        tiles = document.querySelectorAll('.tile');
        coordsNumbers.forEach(tempNum=>{
                    let coordsNumbers = tempNum.split(',');
                    let x = parseInt(coordsNumbers[0]);
                    let y = parseInt(coordsNumbers[1]);
                    numbers.push(`${x},${y}`);
        })

        coordsNumbers.forEach(num => {
        		let coords = num.split(',');
        		let tile = document.querySelectorAll(`[data-tile="${parseInt(coords[0])},${parseInt(coords[1])}"]`)[0];
        		let dataNum = parseInt(tile.getAttribute('data-num'));
        		if (!dataNum) dataNum = 0;
        		tile.setAttribute('data-num', dataNum + 1);
        })
	}

//Send Board to Server
function sendBoard() {
	console.log("SEND BOARD GAME TOPIC" + gameTopic)  //Remove
	console.log("Send board:") //Remove

    var BombMessage = {};
    BombMessage.bombs = bombs;
    BombMessage.numbers = numbers;
    BombMessage.size=size;

    console.log("SEND BOARD MESSAGE: " + JSON.stringify(BombMessage));
    stompClient.send(`${gameTopic}/sendBoard`, {}, JSON.stringify(BombMessage));
}

function sendWin() {
	console.log("SEND WIN GAME TOPIC" + gameTopic)  //Remove

    var UserWinMessage = {};
    UserWinMessage.username = username;
    UserWinMessage.time = seconds;

    console.log("SEND WIN MESSAGE: " + JSON.stringify(UserWinMessage));
    stompClient.send(`${gameTopic}/sendWin`, {}, JSON.stringify(UserWinMessage));
}

function sendLose() {
	console.log("SEND LOSE GAME TOPIC" + gameTopic)  //Remove

    var UserLoseMessage = {};
    UserLoseMessage.username = username;

    console.log("SEND WIN MESSAGE: " + JSON.stringify(UserLoseMessage));
    stompClient.send(`${gameTopic}/sendLose`, {}, JSON.stringify(UserLoseMessage));
}

function sendBackToGame() {
	console.log("SEND BACK TO GAME TOPIC" + gameTopic)  //Remove

    var BackToGameMessage = {};

    console.log("SEND BACK TO GAME: " + JSON.stringify(BackToGameMessage));
    stompClient.send(`${gameTopic}/BackToGame`, {}, JSON.stringify(BackToGameMessage));
}


//Chat messages
const sendMessage = () => {
    var messageContent = $('#message').val().trim();
    if (messageContent.startsWith('/join ')) {

        var newRoomId = messageContent.substring('/join '.length);
        if(newRoomId != roomId){
            clear();
			enterRoom(newRoomId);
            $('#messageArea').empty();
        }

    } else if (messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };
        stompClient.send(`${topic}/sendMessage`, {}, JSON.stringify(chatMessage));
    }
    $('#message').val( '');
}


//Restart game
restartBtn.addEventListener('click', function(e) {
	e.preventDefault();
	clear();
});


//Changes tile size locally
tileSizeBtn.addEventListener('change', function(e) {
	console.log(this.value);
	tileSize = this.value;
});


//Sets new game with chosen parameters
function setSettings(){

        if($("#boardSize").val() == ""){
            size = 10;
        }else if($("#boardSize").val() > 25){
            size = 25;
        } else if($("#boardSize").val() < 3){
            size = 3;
        } else if($("#boardSize").val() > 14){
            size = $("#boardSize").val();
        } else{
            size = $("#boardSize").val();
        }

        if($("#difficulty").val() == ""){
            bombFrequency = 30;
        }else if($("#difficulty").val() > 100){
            bombFrequency = 100;
        } else if($("#difficulty").val() < 1){
            bombFrequency = 1;
        } else{
            bombFrequency = ($("#difficulty").val())/100;
        }

    console.log('BombPercentage')
    console.log(bombFrequency)
    console.log('BoardSize')
    console.log(size)

    try {
        clear();
    } catch (e){
    }

    setup();
}


//Set functions on buttons by ID.
$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $("#join" ).click(function() { connect()});
    $("#send").click(function () { sendMessage()});
    $("#setSettings").click(function () { setSettings()});
    $("#WinToGame").click(function () { sendBackToGame()});
    $("#LoseToGame").click(function () { sendBackToGame()});
});

