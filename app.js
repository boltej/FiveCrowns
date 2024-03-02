const express = require('express');
const { DefaultSerializer } = require('v8');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    //upgradeTimeout: 30000,
    //pingInterval: 25000, // default - 25000
    //pingTimeout: 60000, // default - 60000
    //transports: ['websocket'],
    //allowUpgrades: false
});
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-write-stream');
const csvReader = require('csv-parser');


/*
Note: 
a "play" is one card being played
a "round" is a set of plays for a given level (3-13)
////a "hand" is one set of ten plays (a complete hand of cards)
a "game" is a set of rounds, that finishes when a team gets 500 points
*/

const GP_PREGAME = 0;
const GP_SUSPENDED = 1;
const GP_GAMESTARTED = 2;
const GP_PLAYINGROUND = 3;
const GP_LASTROUND = 4;
const GP_GAMECOMPLETE = 6;

class GameState {
    constructor() {
        this.gameStarted = false;
        this.gamePhase = GP_PREGAME;
        this.currentPlay = -1;
        this.currentPlayer = null;
        this.currentRound = -1;
        this.winningPlayer = -1;
        this.lastRoundPlays = -1;
        this.drawPile = [];
        this.discardPile = [];
    }
}

class Player {
    constructor(_username, _role, _playerID, _roomID, _socketID) {
        this.username = _username;
        this.role = _role;
        this.playerID = _playerID;
        this.roomID = _roomID;
        this.socketID = _socketID;
        this.hand = [];
        this.currentScore = 0;
        this.isOut = false;
        }
}

class Room {
    constructor(_roomID) {
        this.roomID = _roomID;
        this.players = [];   // array of Players
        this.botCount = 0;
        this.deck = [
        'KS1', 'QS1', 'JS1', 'TS1', '9S1', '8S1', '7S1', '6S1', '5S1', '4S1', '3S1',
        'KC1', 'QC1', 'JC1', 'TC1', '9C1', '8C1', '7C1', '6C1', '5C1', '4C1', '3C1',
        'KD1', 'QD1', 'JD1', 'TD1', '9D1', '8D1', '7D1', '6D1', '5D1', '4D1', '3D1',
        'KH1', 'QH1', 'JH1', 'TH1', '9H1', '8H1', '7H1', '6H1', '5H1', '4H1', '3H1',
        'KR1', 'QR1', 'JR1', 'TR1', '9R1', '8R1', '7R1', '6R1', '5R1', '4R1', '3R1',
        'KS2', 'QS2', 'JS2', 'TS2', '9S2', '8S2', '7S2', '6S2', '5S2', '4S2', '3S2',
        'KC2', 'QC2', 'JC2', 'TC2', '9C2', '8C2', '7C2', '6C2', '5C2', '4C2', '3C2',
        'KD2', 'QD2', 'JD2', 'TD2', '9D2', '8D2', '7D2', '6D2', '5D2', '4D2', '3D2',
        'KH2', 'QH2', 'JH2', 'TH2', '9H2', '8H2', '7H2', '6H2', '5H2', '4H2', '3H2',
        'KR2', 'QR2', 'JR2', 'TR2', '9R2', '8R2', '7R2', '6R2', '5R2', '4R2', '3R2',
        'JJ1', 'JJ2', 'JJ3', 'JJ4', 'JJ5', 'JJ6'];

        this.fullDeck = [];

        this.gs = new GameState();
    }
}


let rooms = [];

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

function GetRoom(roomID) {
    for (r of rooms)
        if (r.roomID === roomID)
            return r;

    return null;
}

io.on('connection', (socket) => {
    console.log('a user connected');

    // handle a use disconnecting (done)
    socket.on('disconnect', () => {
        // get the player's room based on their socketID
        let room = null;
        let dp = null;
        for (r of rooms) {
            for (dp of r.players) {
                if (dp.socketID === socket.id) {
                    room = r;
                    break;
                }
            }
            if (room !== null)
                break;
        }

        // did we find the room/socket?  If not, nothing else to do
        // disconnecting
        if (room === null)
            return;

        // found the player, place them in a "suspended" class
        //let leaving = '';
        //let team = 0;
        //let player = 0;
        //let role = '';
        //// change player status in room's player list to 'suspended'
        //let leaving = p.username;
        //let team = p.team;
        //        player = room.players[i].player;
        //        role = room.players[i].role;
        //room.players.splice(i, 1);
        const role = dp.role;
        dp.role = 'suspended';
        dp.team = -1;
        dp.player = -1;

        let remaining = [];
        for (p of room.players)
            if (p.role === 'player')
                remaining.push(p.username);

        //if (remaining.length < 4)
        //    room.gs.gamePhase = GP_SUSPENDED;
        socket.to(room.roomID).emit('user disconnected', dp.team, dp.player, dp.username, role);
        console.log('player ' + dp.username + ' disconnected.  Remaining players: ' + remaining.join());

        if (remaining.length === 0) {
            for (let i = 0; i < rooms.length; i++) {
                if (rooms[i] === room) {
                    console.log('Room ' + room.roomID + ' has been closed');
                    rooms.splice(i, 1);
                    break;
                }
            }
            io.emit('update rooms');
        }
    });

    // start a new room, done)
    socket.on('add room', (fn) => {
        let roomID = uuidv4();        // generate unique identifier
        let room = new Room(roomID);  // make the room 
        rooms.push(room);             // add to list of rooms open on the server
        console.log('adding room ' + roomID);
        io.emit('room added', roomID);   // let everyone know a new room was created
        fn(roomID);                   // callback for sender

    });

    socket.on('get playerlist', (fn) => {
        let _users = [];
        fs.createReadStream('data/games.csv')
           .pipe(csvReader())
           .on('data', (row) => {
               // have a game record, update the users stats
               let username = row['Username'];
               if (username !== undefined) {
                   if (_users.includes(username) === false) {
                       _users.push(username);
                   }
               }
            })
           .on('end', () => {
                // at this point, the 'users' dictionary contains entries for each user
                // in the database.  Clean up are return
                //console.log("users");
                //console.log(_users);
                fn(_users);
            });
    });


    // log the chat message (done)
    //socket.on('chat message', (roomID, msg) => {
    //    io.to(roomID).emit('chat message', msg);
    //});

    // a new player has joined - send the current teams list (done)
    socket.on('new player', (roomID, username, role) => {
        // get next open player slot for this room
        let room = GetRoom(roomID);
        if (room === null) {
            console.log('Unable to find room ' + roomID);
            return;
        }

        // get count of current players in this room
        // and whether the new player is on the suspended list for this room
        let playerCount = 0;
        let wasSuspended = false;
        let newPlayer = null;
        for (p of room.players) {
            if (p.role === 'player')
                playerCount++;
            else if (p.role === 'suspended' && p.username === username) {
                wasSuspended = true;
                newPlayer = p;
                //newPlayer.role = playerInfo.role;
            }
        }
        
        if (wasSuspended === false) {
            const playerID = uuidv4();        // generate unique identifier
            room.players.length;
            console.log('Adding Player ' + username + ', Role: ' + role);
            newPlayer = new Player(username, role, playerID, roomID, socket.id);
            room.players.push(newPlayer);
        } else {  // WAS  suspended previously
            console.log('Resuming Player ' + username + ', Role: ' + role);
            newPlayer.role = role;
        }

        if (role === 'player' || role === 'bot') {
            //console.log('Player ' + username + ' has joined a game');
        }
        else  // playerInfo.role != 'player'
            console.log('Observer ' + username + ' has joined a game');

        if (newPlayer.role === 'bot')
            newPlayer.socketID = 'bot_' + room.botCount.toString();
        else {
            socket.join(roomID);  // connect socket to room 
            newPlayer.socketID = socket.id;
        }
        // player added === user-connected
        io.to(roomID).emit('player added', newPlayer, room.players);
        io.emit('update rooms');
    });

    socket.on('get rooms', (fn) => {
        //console.log('get rooms called');
        let _rooms = [];

        for (r of rooms) {
            roomInfo = {
                roomID: r.roomID,
                players: r.players,
                gamePhase: r.gs.gamePhase
            };
            _rooms.push(roomInfo);
        }
        fn(_rooms);
    });

    // get the current game state
    socket.on('get state', (roomID, fn) => {
        let room = GetRoom(roomID);
        fn(room.gs, room.players);
    });

    socket.on('get hand', (roomID, player, fn) => {
        let room = GetRoom(roomID);

        for (let p of room.players) {
            if ((p.role === 'player' || p.role === 'bot') && p.player === player) {
                fn(p.hand);
                break;
            }
        }
    });

    // tell observers to update hand when observee hand changes
    // still needed????
    socket.on('update hand', (roomID, socketID, updatedHand) => {
        let room = GetRoom(roomID);

        if (room === null)
            console.log("no room found during on('update hand')");

        for (let p of room.players) {
            if ((p.role === 'player' || p.role === 'bot') && p.socketID === socketID) {
                p.hand = [...updatedHand];  // make a copy of the hand

                for (let obs of room.players) {
                    if (obs.role === 'observer') { // && obs.team === p.team && obs.player === p.player) {
                        io.to(obs.socketID).emit('new hand', updatedHand);
                        //io.to(obs.socketID).emit('sending middle', updatedMiddle, (obs.team === p.team && obs.player === p.player) ? 1 : 0);
                    }
                }
            }
        }
    });

    // request to start a game (done)
    socket.on('start game', (roomID, restart) => {
        let room = GetRoom(roomID);

        if (restart)
            room.gs.gameStarted = false;

        if (room.gs.gameStarted)
            return;

        // to start a game, 
        // 1) reset round counter to 0 and player scores to 0
        // 2) run rounds until score of 500 achieved
        room.gs.currentPlay = 0;
        room.gs.currentRound = 0;
        room.gs.gamePhase = GP_GAMESTARTED;
        for (p of room.players) {
            p.currentScore = 0;
        }

        io.to(roomID).emit('game started', room.gs);

        room.gs.gameStarted = true;
        console.log('starting game in room ' + roomID);

        StartRound(room);
    });

    // redeal a hand
    socket.on('redeal', (roomID) => {
        let room = GetRoom(roomID);
        io.to(roomID).emit('redeal');
        StartRound(room);  // this calls GetNextPlayer
    });

    // a card was played in this room update game state and let clients know
    socket.on('card clicked', (roomID, cardID, source ) => { // source: 0=hand,1=draw,2=discard
    
        const DRAW_CLICKED = 0;
        const DISCARD_CLICKED = 1;
        const HAND_CLICKED = 2;
        
        let room = GetRoom(roomID);
        console.log('card-clicked, ' + cardID + ", " + source);

        let discard = '';
        switch(source) {
            case HAND_CLICKED:  // from hand (discarded)
                RemoveCardFromHand(room.gs.currentPlayer, cardID);
                room.gs.discardPile.unshift(cardID);  // push to beginning
                discard = room.gs.discardPile.length > 0 ? room.gs.discardPile[0] : "";
                console.log('discarding ' + discard);
                io.to(room.roomID).emit('update discard', discard);
                break;

            case DRAW_CLICKED:     // from draw pile 
                AddCardToHand(room.gs.currentPlayer, cardID, room.gs.currentRound+2);
                room.gs.drawPile.shift(cardID);  // pop from beginning
                break;

            case DISCARD_CLICKED:     // from discard pile 
                AddCardToHand(room.gs.currentPlayer, cardID, room.gs.currentRound+2);                
                room.gs.discardPile.shift(cardID);
                discard = room.gs.discardPile.length > 0 ? room.gs.discardPile[0] : "";
                console.log('discarding ' + discard);
                io.to(room.roomID).emit('update discard', discard);
                break;
        }
        io.to(room.roomID).emit('card click complete', cardID, source);
    });

    socket.on('get drawcard', (roomID, fn) => {
        let room = GetRoom(roomID);
        const card = room.gs.drawPile.length > 0 ? room.gs.drawPile[0] : "";
        console.log('get drawcard: ' + card);
        fn(card);
    });
   
// a card was played in this room update game state and let clients know
socket.on('play complete', (roomID) => {
    let room = GetRoom(roomID);
    console.log('play complete for player ' + room.gs.currentPlayer.username);
 
    room.gs.currentPlayer = GetNextPlayer(room);

    room.gs.lastRoundPlaysLeft--;
    // check for end of round
    if (room.gs.currentPlayer.isOut) { // end of round    //if ( room.gs.lastRoundPlaysLeft === 0) {
        // complete the round and start a new one
        console.log('updating scores');
        UpdateScores(room); // score cards
        io.to(room.roomID).emit('update scores', room.players);

        if (room.gs.currentRound <=11)  // 11 is max number of rounds 
            StartRound(room);
    
        else  {  // end of game
            GameComplete(room);
        }    
        return;
    }
    
    if (room.gs.currentPlayer == room.players[0]) {
        console.log('Starting play ' + room.gs.currentPlay);
        room.gs.currentPlay++;
    }
    io.to(room.roomID).emit('update scoreboard', room.players, room.gs.currentPlayer);

    console.log('play card sent to ' + room.gs.currentPlayer.username);
    io.to(room.roomID).emit('play card', room.gs.currentRound, room.gs.currentPlayer, room.gs.currentPlay);
});


socket.on('request go out', (roomID) => {
    let room = GetRoom(roomID);
    const hand = room.gs.currentPlayer.hand;
    console.log('go out request from ' + room.gs.currentPlayer.username + ', hand=' + hand);

    io.to(room.roomID).emit('go out request', room.gs.currentPlayer);
});

socket.on('approve out', (roomID) => {
    let room = GetRoom(roomID);
    room.gs.currentPlayer.isOut = true;
    room.gs.gamePhase = GP_LASTROUND;
    room.gs.lastRoundPlaysLeft = room.players.length-1;
    console.log('sending go out request approved ' + room.gs.lastRoundPlaysLeft);
    io.to(room.roomID).emit('go out request approved', room.players, room.gs.lastRoundPlaysLeft);

    // advance to the next player an send a "play card" message to the room, indicating current player
    room.gs.currentPlayer = GetNextPlayer(room);
    
    if (room.gs.currentPlayer.role === 'player') {
        if (room.gs.currentPlayer.isOut) {

        } else {
        console.log('sending play card request: ' + room.gs.currentPlayer.username);
        io.to(room.roomID).emit('play card', room.gs.currentRound, room.gs.currentPlayer, room.gs.currentPlay);
        }
    }
    else if (p.role === 'bot')
        BotPlayCard(p);
});

socket.on('deny out', (roomID, username) => {
    let room = GetRoom(roomID);
    const hand = room.gs.currentPlayer.hand;
    io.to(room.roomID).emit('go out request denied');
});

function UpdateScores(room) {
    const wild = room.gs.currentRound+2;

    for (let p of room.players) {
        if (p.isOut === false) {
            for (let card of hand) {
                p.currentScore += GetCardScore(card, wild);
            }
        console.log('Player' + p.username + ': ' + p.currentScore + ' points');
        } else {
            console.log('Player' + p.username + ' (out): ' + p.currentScore + ' points');
        }
    }

}

function GetCardScore(card, wild) {
    // jokers=50
    if (card[1] === 'J')
        return 50;

    // no trump defined, treat jacks normally
    switch (card[0]) {
        case 'T': return wild==10 ? 20 : 10;
        case 'J': return wild==11 ? 20 : 11;
        case 'Q': return wild==12 ? 20 : 12;
        case 'K': return wild==13 ? 20 : 13;
        case 'A': return wild==14 ? 20 : 14;
        default: 
            const rank = parseInt(card[0]);
            return wild == rank ? 20 : rank; 
    }
}

    socket.on('get leaderboard', (fn) => {
        //let userStats = { '# Games':0, 'Games Won':0, '% Won':0, 'AHS':0 };   // 'user' :
        let users = {};
        fs.createReadStream('data/games.csv')
            .pipe(csvReader())
            .on('data', (row) => {
                // have a game record, update the users stats
                let username = row['Username'];
                if (username !== undefined) {
                    //console.log(username);
                    //console.log(row);

                    // find current record for this user (key = username, value=dictionary of stats)
                    if (users[username]) {
                        let user = users[username];
                        user['Games']++;
                        if (parseInt(row['Won']) > 0)
                            user['Games Won'] += 1;
                        user['AHS'] += parseInt(row['HandStrength']);
                    }
                    else {  // user not found, so add them
                        users[username] = {
                            'Games': 1,
                            'Games Won': parseInt(row['Won']),
                            '% Won': 0,
                            'AHS': parseInt(row['HandStrength'])
                        };
                    }
                }
            })
            .on('end', () => {
                // at this point, the 'users' dictionary contains entries for each user
                // in the database.  Clean up are return
                for (let username in users) {
                    let user = users[username];
                    //console.log(username);
                    //console.log(user);
                    user['% Won'] = user['Games Won'] / user['Games'];
                    user['AHS'] = user['AHS'] / user['Games'];
                    //console.log(user);
                }
                fn(users);
            });
    });

    socket.on('error', (err) => {
        console.error('Socket Error Encountered: ', err);
    });
});

io.on('error', (err) => {
    console.error('io Error Encountered: ', err);
});

process.on('uncaughtException', (err) => {
    console.error('Process Error Encountered: ', err);
});

server.listen(8877, () => {
    console.log('listening on *:8877');
});

/////////////////////////////////////////////
// helper functions
////////////////////////////////////////////


function GetSocketID(room, playerID, roles) {
    for (const p of room.players) {
        if (roles.includes(p.role) && p.playerID === playerID)
            return p.socketID;
    }
    return null;
}

function GetUsername(room, playerID, role) {
    for (const p of room.players) {
        if (p.role === role && p.playerID === playerID)
            return p.username;
    }
}

function GetPlayer(room, playerID) {
    for (const p of room.players) {
        if ((p.role === 'player' || p.role === 'bot') && p.playerID === playerID)
            return p;
    }
    console.log('GetPlayer() - Player ' + playerID + ' not found in room ' + room.roomID);
    return null;
}


// start a round  (play as many play necessary to win) - deal the cards to each player
function StartRound(room) {
    // shuffle the room deck 3 times.
    for (let j = 0; j < 3; j++)
        _ShuffleArray(room.deck);

    room.fullDeck = [...room.deck];  // make a copy of the deck

    // deal cards
    let i = 0;  // index of current hand being dealt
    room.gs.currentRound++;

    let cardsPerHand = room.gs.currentRound+2;

    for (const p of room.players) {
        if (p.role === 'player' || p.role === 'bot') {
            let hand = room.fullDeck.slice(i, i +  cardsPerHand);
            p.hand = [...hand];
            p.isOut = false;
            i += cardsPerHand;
        }
    }

    // put the next card in the discard pile, the rest in the draw pile
    room.gs.discardPile = [ room.fullDeck[i] ];
    room.gs.drawPile = room.fullDeck.slice(i+1); 

    // starts a new round (play four cards), currentTeam/gs.currentPlayer start
    room.gs.currentPlay = 0;
    if ( room.gs.currentPlayer === null) 
        room.gs.currentPlayer = room.players[0];

    room.gs.gamePhase = GP_PLAYINGROUND;

    console.log("emitting 'start round' " + room.gs.currentRound + ' (' + room.gs.currentPlay + ')');
    io.to(room.roomID).emit('start round', room.gs, room.players);

    // send a "play card" message to the room, indicating current player
    //let p = GetPlayer(room, room.gs.currentPlayerID);
    let p = room.gs.currentPlayer;
    if (p.role === 'player')
        io.to(room.roomID).emit('play card', room.gs.currentRound, room.gs.currentPlayer, room.gs.currentPlay);
    else if (p.role === 'bot')
        BotPlayCard(p);
}

function GetNextPlayer(room) {
    for ( let i=0; i < room.players.length; i++) {
        let player = room.players[i];

        if ( player == room.gs.currentPlayer) {
            let nextIndex = i>=room.players.length-1 ? 0 : i+1;
            
            while ( room.players[nextIndex].role !== 'player')
                nextIndex = nextIndex>=room.players.length-1 ? 0 : nextIndex+1;
            
            return room.players[nextIndex];
        }
    }
    console.log("Error getting next player");
}

function RoundComplete(room) {
    console.log('Completed Round ' + room.gs.currentRound);
}

function RemoveCardFromHand(player, cardID) {
    for (let i = 0; i < player.hand.length; i++) {
        if (p.hand[i] === cardID) {
            p.hand.splice(i, 1);
        }
    }
}

function AddCardToHand(player, card, wild) {
    console.log('Adding card to hand: player=' + player + ', card=' + card + ", wild=" + wild);
    if ((player.role === 'player' || player.role === 'bot')) {
        player.hand.push(card);
        io.to(player.socketID).emit('update hand', player.hand, wild);
    }
}

function GetCardScore(card, wild) {
    // jokers=50
    if (card[1] === 'J')
        return 50;

    // no trump defined, treat jacks normally
    switch (card[0]) {
        case 'T': return wild==10 ? 20 : 10;
        case 'J': return wild==11 ? 20 : 11;
        case 'Q': return wild==12 ? 20 : 12;
        case 'K': return wild==13 ? 20 : 13;
        case 'A': return wild==14 ? 20 : 14;
        default: 
            const rank = parseInt(card[0]);
            return wild == rank ? 20 : rank; 
    }
}



// a hand has finished - check for game over, and start new hand if not 
function GameComplete(room) {
    // scores have been updated, send to room after determining winner
    let winner = room.players[0];
    
    for (let p of room.players ) {
        if (p.role === 'player' || p.role === 'observer') {
            if ( p.currentScore < winner.currentScore )
                winner = p;
        }    
    }
    
    const imgURLWinner = GetRandomImage(0);
    const imgURLLoser = GetRandomImage(1);

    let imgURL = null; // = imgURLWinner;
    let msg = null;

    for (let p of room.players) {
        if (p.role === 'player' || p.role === 'observer') {
            console.log("emitting 'game complete' msg");
            io.to(p.socketID).emit('game complete', winner, room.players, p.playerID == winner.playerID ? imgURLWinner : imgURLLoser);
        }
    }
 }


function GameComplete(room) {
    room.gs.gameStarted = false;

    for (p of room.players) {
        if (room.gs.currentHand > 0 && p.hsThisGame.length > 0)
            p.handStrength /= p.hsThisGame.length; // average hand strength for game
    }
    SaveGameData(room);
}


function GetRandomImage(flag) {
    if (flag === 0) {
        const directoryPath = path.join(__dirname, '/public/Animations/Winners');
        const files = fs.readdirSync(directoryPath);
        const file = files[Math.floor(Math.random() * files.length)];
        console.log('Getting random file: ' + file);
        return 'Animations/Winners/' + file;
    }
    else {
        const directoryPath = path.join(__dirname, '/public/Animations/Losers');
        const files = fs.readdirSync(directoryPath);
        const file = files[Math.floor(Math.random() * files.length)];
        console.log('Getting random file: ' + file);

        return 'Animations/Losers/' + file;
    }
}


// Fisher-Yates verion (in place)
function _ShuffleArray(array) {
    let m = array.length;
    let i = 0;

    while (m) {
        i = Math.floor(Math.random() * m--);

        [array[m], array[i]] = [array[i], array[m]];
    }

    return array;
}


function shuffleArray(array) {
    let curId = array.length;
    // There remain elements to shuffle
    while (0 !== curId) {
        // Pick a remaining element
        let randId = Math.floor(Math.random() * curId);
        curId -= 1;
        // Swap it with the current element.
        let tmp = array[curId];
        array[curId] = array[randId];
        array[randId] = tmp;
    }
    return array;
}

/*
function SortCards(a, b) {
    let sa = '';  // suit (character)
    let sb = '';
    let na = 0; // numeric ranking of suits
    let nb = 0;
    let ra = 0; // rank
    let rb = 0;
 
    [ra, sa] = GetRankAndSuit(a,trumpSuit);   //??????
    [rb, sb] = GetRankAndSuit(b,trumpSuit);
 
    //console.log('CardA: ' + a + 'r=' + ra + ',s=' + sa);
    //console.log('CardB: ' + b + 'r=' + rb + ',s=' + sb);
 
    switch (sa) {
        case 'S': na = 0; break;
        case 'C': na = 1; break;
        case 'D': na = 2; break;
        case 'H': na = 3; break;
        case 'J': na = 4; break;// joker
    }
 
    switch (sb) {
        case 'S': nb = 0; break;
        case 'C': nb = 1; break;
        case 'D': nb = 2; break;
        case 'H': nb = 3; break;
        case 'J': nb = 4; break;// joker
    }
    // different suits?
    if (na !== nb)
        return (na - nb);
 
    // note: no jokers after this, ther are filtered out above
    // same suit, so sort by rank
    return (ra - rb);
}
*/


function SaveHandData(room, biddingTeamTricks) {
    var writer = csvWriter({ sendHeaders: false }); //Instantiate var
    var csvFilename = "data/hands.csv";

    // If CSV file does not exist, create it and add the headers
    if (!fs.existsSync(csvFilename)) {
        writer = csvWriter({ sendHeaders: false });
        writer.pipe(fs.createWriteStream(csvFilename));
        writer.write({
            header1: 'C1',
            header2: 'C2',
            header3: 'C3',
            header4: 'C4',
            header5: 'C5',
            header6: 'C6',
            header7: 'C7',
            header8: 'C8',
            header9: 'C9',
            header10: 'C10',
            header11: 'Username',
            header12: 'Bid',
            header13: 'Tricks'
        });
        writer.end();
    }

    // Append some data to CSV the file    
    writer = csvWriter({ sendHeaders: false });
    writer.pipe(fs.createWriteStream(csvFilename, { flags: 'a' }));

    let hand = '';
    let username = '';
    for (const p of room.players) {
        if (p.role === 'player' && p.team === room.gs.winningBidderTeam && p.player === room.gs.winningBidderPlayer) {
            hand = p.startingHand;
            username = GetUsername(room, p.team, p.player, 'player');
            break;
        }
    }

    writer.write({
        header1: hand[0],
        header2: hand[1],
        header3: hand[2],
        header4: hand[3],
        header5: hand[4],
        header6: hand[5],
        header7: hand[6],
        header8: hand[7],
        header9: hand[8],
        header10: hand[9],
        header11: username,
        header12: room.gs.winningBid,
        header13: biddingTeamTricks
    });
    writer.end();
}

function SaveGameData(room) {
    var writer = csvWriter({ sendHeaders: false }); //Instantiate var
    var csvFilename = "data/games.csv";

    // If CSV file does not exist, create it and add the headers
    if (!fs.existsSync(csvFilename)) {
        writer = csvWriter({ sendHeaders: false });
        writer.pipe(fs.createWriteStream(csvFilename));
        writer.write({
            header1: 'Date',
            header2: 'Username',
            header3: 'Won',
            header4: 'Margin',
            header5: 'HandStrength'
        });
        writer.end();
    }

    // Append some data to CSV the file    
    writer = csvWriter({ sendHeaders: false });
    writer.pipe(fs.createWriteStream(csvFilename, { flags: 'a' }));

    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

    let winningTeam = 0;
    if (room.teams[1].score > room.teams[0].score)
        winningTeam = 1;
    let margin = winningTeam === 0 ? room.teams[0].score - room.teams[1].score : room.teams[1].score - room.teams[0].score;

    for (p of room.players) {
        if (p.role === 'player') {

            writer.write({
                header1: date,
                header2: p.username,
                header3: winningTeam === p.team ? 1 : 0,
                header4: winningTeam === p.team ? margin : -margin,
                header5: p.handstrength
            });
            //writer.write('\n');
        }
    }
    writer.end();
}


//////////////////  B O T   S T U F F //////////////////////


function BotPlayCard(room, bot) {
    // look are current hand:
    // 1) Do I have to follow suit?

    // do I have the lead?  Then play in order
    if (room.gs.currentRound === 0) {
        // lead high trump if possible.
        let highCard = '';
        let highRank = 0;
        for (card of hand) {
            if (IsTrump(card, room.gs.trumpSuit)) {
                //
                [rank, suit] = GetRankAndSuit(card, room.gs.trumpSuit);
                if (rank > highRank) {
                    highCard = card;
                    highRank = rank;
                }
            }
        }
        if (highRank > 0) {
            // found a high trump, play it
        }

        io.to(room.roomID).emit('first card played', highCard, bot.team, bot.player, bot.username, room.gs.winningBid);  // send back to all clients
        CardPlayed(room, card);
    }

    // what's been played so far?
    // const leadSuit = room.gs.firstCardPlayed[1];  // e.g. 'S'

    // do have have the 


    //CardPlayed(room, card)
}

function GetBotName(room) {
    const botNames = ['', 'Botty McBotface', 'Madam Curie', 'Albert Einstein', 'Capt. Picard', 'Slick', 'George Orwell', 'Kamala', 'Dr.Biden', 'V.Putin'];
    let botCount = room.botCount;
    if (botCount > botNames.length)
        botCount = botNames.length - 1;

    return botNames[botCount];
}

function GetRandomBotName() {
    const names = ['Botty McBotface', 'Albert Einstein', 'Capt. Picard', 'Slick Willy', 'George Orwell', 'Kamala',
        'Dr. Biden', 'V.Putin', 'Dr. Fauci', 'Jacinda Ardern', 'Benoit Mandlebrot', 'The Ghost of RGB', 'Angela Merkel', 'Greta Thunberg'];
    return names[Math.floor(Math.random() * names.length)];
}


function LogHand(msg, hand) {
    for (card of hand) {
        msg += " " + card;
    }
    console.log(msg);
}


