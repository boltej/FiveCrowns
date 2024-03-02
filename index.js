/*
Note: 
a "play" is one card being played
a "round" is four cards being played, one from each player
a "hand" is one set of ten plays (a complete hand of cards)
a "game" is a set of rounds, that finishes when a team gets 500 points
*/

let roomID = '';
let username = '';
let myPlayer = 0;
let observers = [];
let $selectedCard = null;
let discardsRemaining = 0;
let currentRound = 0;
let currentSocketID = '';
let currentPlayerName = '';
let gameIsActive = true;
let gameIsStarted = false;
let isActivePlayer = false;
let isObserver = false;

let userMsgTxt = '';
let userMsgHdr = '';
let userMsgGreen = false;

cards.options.spacing = 0.4;

// game phase constants (must mach those in app.js)
const GP_PREGAME = 0;
const GP_SUSPENDED = 1;
const GP_GAMESTARTED = 2;
const GP_PLAYINGROUND = 3;
const GP_ROUNDCOMPLETE = 4;
const GP_GAMECOMPLETE = 5;



//$(function () {
const socket = io('/', {
    //transports: ['websocket'],
    //autoConnect: true
});


window.onload = ()=>{
    // on startup
    var select = document.getElementById("selectUser");
    socket.emit('get playerlist', (playerlist) => {
        for (player of playerlist) {
            var el = document.createElement("option");
            el.textContent = playerjoin
            el.value = player;
            select.appendChild(el);
        }
    });

    $('#finalizeMiddle').css('display', 'none');
    $('#gameMsgBtn').hide();
    $('#myHandAll').hide();
};



function Test() {
    //$('#myHand').hide();
    $('#myHandAll').show();

    //let hand = ['JS', '8S', '5S', 'AC', 'TC', '6C', '4C', 'TH', '5H', '4H'];
    let hand = ['AS', 'KS', '6S', '5S', 'AC', 'KC', 'QC', 'JD', '7D', '4D'];  // notrump test
    //let hand = ['', '', '', '', '', '', '', '', '', ''];

    //hand.sort(SortCards);
    //DistributeHand(hand, 'obs-T0P0-', 65);

    socket.emit('suggest bid from hand', hand, (suggestedBid) => {
        //ToastMsg('Your Suggested Bid was ' + suggestedBid);  // last one
        $('#suggestBid')
            .modal({
                onShow: function () {
                    $('#sugBid').text(suggestedBid);
                },
                onApprove: function () {
                    return true;
                }
            })
            .modal('show');
    });
}

//Test();



//---------------------------------------------------------
// message handlers
//---------------------------------------------------------
socket.on('user disconnected', (team, player, username, role) => {
    //lastGameMsgHdr = $('#gameMsgHdr').html();
    //lastGameMsgText = $('#gameMsgText').html();
    //lastGameMsgState = $('#gameMsgPanel').hasClass('green') ? true : false;
    if (role === 'player' || role === 'bot') {
        let msgHdr = 'Player ' + username + ' has left the game.';
        let msgTxt = 'Game play will be continued without this player';
        SetGameMsg(msgHdr, msgTxt, null, false);
        //gameIsActive = false;  // suspend play if leaving user has role of 'observer'
        //if (peers[userID])
        //    peers[userID].close();
    }
});

//socket.on('chat message', (msg) => {
//    $('#messages').prepend($('<li>').text(msg));
//});

// a new room was added.  Update login/join screen
socket.on('room added', (_roomID) => {
    socket.emit('get rooms', (rooms) => {
        PopulateActiveRooms(rooms);
    });
});


// a play was added to a room.  Update login/join screen
socket.on('update rooms', () => {
    socket.emit('get rooms', (rooms) => {
        PopulateActiveRooms(rooms);
    });
});

// a player has been added to the game
socket.on('player added', (players) => {
    UpdateScoreboard(player)
});

socket.on('game started', (gameState) => {
    UpdateGameState(gameState);
    UpdateLeaderboard();
    ToastMsg('The game is afoot!', "Let's get started...", 10); */
});

function UpdateScoreboard(players) {
    html = '<div class="ui relaxed divided list" >';

    // sort players by score
    players.sort((a, b) => { return a.currentScore < b.currentScore; });

    let first = true;
    for (const p of players) {
        if (first)
            html += '<div class="item"><div class="content"><div class="header">' + p.username + '</div><div class="description">current Score: ' + p.currentScore + '</div></div></div>';
    }
    html += '</div>';
    $('#divScoreboard').html()
}

function UpdateGameState(gameState) {

    switch (gameState.gamePhase) {
        case GP_PREGAME:
            userMsgHdr = 'Waiting to start game...';
            userMsgTxt = '';
            userMsgGreen = true;
            SetGameMsg(userMsgHdr, userMsgTxt, null, userMsgGreen);
            break;

        case GP_SUSPENDED:
            break;

        case GP_GAMESTARTED:
            $selectedCard = null;
            $('#round').text('1');
            $('#wildcard').text('');
            userMsgHdr = 'Starting game...';
            userMsgTxt = '';
            userMsgGreen = true;
            SetGameMsg(userMsgHdr, userMsgTxt, null, userMsgGreen);
            break;

        case GP_PLAYINGROUND:





        case GP_ROUNDCOMPLETE:
        case GP_GAMECOMPLETE:

    }
}
/*
class GameState {
    gameStarted = false;
    gamePhase = GP_PREGAME;
    currentPlay = -1;
    currentPlayer = null;
    currentRound = -1;
    winningPlayer = -1;
    drawPile = [];
    discardPile = [];
    constructor() {
    }
}

class Player {
    username = '';
    role = '';    // 'player' | 'observer' | 'suspended' | 'bot'
    playerID = -1;  // index in player array
    hand = [];
    currentScore = 0;
    roomID = '';
    socketID = '';
*/
function GetMe(players) {
    for (const p of players) {
        if (p.username = username)
            return p;
    }
    return null;
}

// signals a round is about to start
socket.on('start round', (gameState, players) => {
    userMsgHdr = 'Starting round';
    userMsgTxt = 'Current Round is ' + currentHand;
    userMsgGreen = true;
    SetGameMsg(userMsgHdr, userMsgTxt, null, userMsgGreen);

    //let thisPlayer = GetMe(players);
    //$('#obsPanel').hide();
   
});


// if a redeal is made, reset the interface
socket.on('redeal', () => {
    firstCardPlayedInRound = '';
    trumpSuit = '';
    ResetPlayPanel();
});

function UpdateHand(hand) {
    DistributeHand(hand, '', 90);
//    console.log('Receiving hand: ' + hand.join());
//    let count = CountCards();
//
//
//
//    $('#openNelloHand').hide();
}



// called after bidding, middle selected, before first card played

// the server is asking for a card to be played
socket.on('play card', (round, socketID, playerName) => {
    console.log("'play card' msg received for player " + playerName);
    currentRound = round;
    currentSocketID = socketID;
    currentPlayerName = playerName;

    let isCurrentPlayer = (socket.id === socketID) ? true : false;
    userMsgTxt = isCurrentPlayer ? "<b>It's your turn!</b>  Click/tap a card to play it" : 'Please wait for your turn!';
    userMsgHdr = 'Now Playing Round ' + (round + 1) + ', Current Player is ' + currentPlayerName;
    userMsgGreen = isCurrentPlayer;
    SetGameMsg(userMsgHdr, userMsgTxt, null, isCurrentPlayer);

    if (isCurrentPlayer)
        SetHandActive(true);

    HighlightCurrentPlayer(playerName);

    PlayCard(round, socketID, playerName);  // set up and respond to a card being played
});

// move a card to the play area from the specified player's location
// and remove it from from my hand if I have it
// This message is sent to ALL players 
socket.on('card played', (team, player, cardID) => {
    console.log('card played: Card=' + cardID + ' Team=' + team + ' Player=' + player);

    // add card to play area in appropriate players spot
    let id = 'T' + team + 'P' + player;
    $('#' + id + 'card')
        .attr('src', 'cards/' + cardID + '.svg')
        .width('100px');

    RemoveCardFromHand(cardID);
    CountCards();
});

function RemoveCardFromHand(cardID) {
    // if the card is in the current hand, remove it
    //$('.hand').children().each((i, card) => {
    //    if ($(card).attr('src').slice(6, 8) === cardID)
    //        $(card).remove();
    //});
    $('#hand-spades').children().each((i, card) => {
        if ($(card).attr('src').slice(6, 8) === cardID)
            $(card).remove();
    });

    $('#hand-clubs').children().each((i, card) => {
        if ($(card).attr('src').slice(6, 8) === cardID)
            $(card).remove();
    });
    $('#hand-diamonds').children().each((i, card) => {
        if ($(card).attr('src').slice(6, 8) === cardID)
            $(card).remove();
    });
    $('#hand-hearts').children().each((i, card) => {
        if ($(card).attr('src').slice(6, 8) === cardID)
            $(card).remove();
    });
    $('#hand-extras').children().each((i, card) => {
        if ($(card).attr('src').slice(6, 8) === cardID)
            $(card).remove();
    });

    $('#on-hand-spades').children().each((i, card) => {
        if ($(card).attr('src').slice(6, 8) === cardID)
            $(card).remove();
    });

    $('#on-hand-clubs').children().each((i, card) => {
        if ($(card).attr('src').slice(6, 8) === cardID)
            $(card).remove();
    });

    $('#on-hand-diamonds').children().each((i, card) => {
        if ($(card).attr('src').slice(6, 8) === cardID)
            $(card).remove();
    });

    $('#on-hand-hearts').children().each((i, card) => {
        if ($(card).attr('src').slice(6, 8) === cardID)
            $(card).remove();
    });

    if (isObserver) {
        for (let team of [0, 1])
            for (let player of [0, 1]) {
                let pre = '#obs-T' + team + 'P' + player + '-';
                // if the card is in the current hand, remove it
                $(pre + 'hand-spades').children().each((i, card) => {
                    if ($(card).attr('src').slice(6, 8) === cardID)
                        $(card).remove();
                });

                $(pre + 'hand-clubs').children().each((i, card) => {
                    if ($(card).attr('src').slice(6, 8) === cardID)
                        $(card).remove();
                });
                $(pre + 'hand-diamonds').children().each((i, card) => {
                    if ($(card).attr('src').slice(6, 8) === cardID)
                        $(card).remove();
                });
                $(pre + 'hand-hearts').children().each((i, card) => {
                    if ($(card).attr('src').slice(6, 8) === cardID)
                        $(card).remove();
                });
                $(pre + 'hand-extras').children().each((i, card) => {
                    if ($(card).attr('src').slice(6, 8) === cardID)
                        $(card).remove();
                });
            }
    }
}

socket.on('round complete', (round, winnerName, teamAtricks, teamBtricks) => {
    ToastMsg('You won round ' + (round + 1), 'Congratulations ' + winnerName + '!', 10);

    $('#teamAscore').html(teamA.join() + ': <span class="score">' + teamAScore + '</span> (' + teamAtricks + ')');
    $('#teamBscore').html(teamB.join() + ': <span class="score">' + teamBScore + '</span> (' + teamBtricks + ')');

    // open face nello? then show the bidder's hand
    //if (bid==='No' && round===0 && isObserver === false && username !== bidderName) { // show the bidders hand in the observer pane
    //    $('#openNelloHand').show();
    //    $('#on-name').text(bidderName);
    //    socket.emit('get hand', roomID, bidTeam, bidPlayer, (hand) => {
    //        hand.sort(SortCards);
    //        DistributeHand(hand, 'on-', 90);
    //    });
    //}

    ResetPlayPanel();
});

socket.on('show openface hand', (bidderName, hand) => {
    // open face nello? then show the bidder's hand
    if (isObserver === false && username !== bidderName) { // show the bidders hand in the observer pane
        $('#openNelloHand').show();
        $('#on-name').text(bidderName);
        //socket.emit('get hand', roomID, bidTeam, bidPlayer, (hand) => {
        hand.sort(SortCards);
        DistributeHand(hand, 'on-', 90);
        //});
    }

    ResetPlayPanel();
});


function ContinueHand() {
    socket.emit('continue hand', roomID);
}

socket.on('hand complete', (hand, biddingTeam, bidMade, biddingTeamTricks, biddingTeamPts, teamAscore, teamBscore, msg, imgURL) => {
    ToastMsg('Hand ' + (hand + 1) + ' completed','',10);
    teamAScore = teamAscore;
    teamBScore = teamBscore;
    $('#teamAscore').html(teamA.join() + ': <span class="score">' + teamAScore + '</span>');
    $('#teamBscore').html(teamB.join() + ': <span class="score">' + teamBScore + '</span>');
    trumpSuit = '';

    UpdateHandStrengths(1);

    SetGameMsg('One player should hit the continue button when ready to proceed',
        "It's that button way over there ----------->", ContinueHand, true);

    $("#handCompleted")
        .modal({
            closeable: true,
            onShow: function () {
                let _teamA = teamA.join().replace(/,/, ' and ');
                let _teamB = teamB.join().replace(/,/, ' and ');
                let _teamAtricks = biddingTeam === 0 ? biddingTeamTricks : 10 - biddingTeamTricks;
                let _teamBtricks = 10 - _teamAtricks;
                let _teamApts = biddingTeam === 0 ? biddingTeamPts : _teamAtricks * 10;
                let _teamBpts = biddingTeam === 1 ? biddingTeamPts : _teamBtricks * 10;
                //let winningTeam = '';
                ///if (bidMade) {
                ///    winningTeam = biddingTeam === 0 ? _teamA : _teamB;
                ///    $('#hdrHand').text('Congratulations ' + winningTeam + ', you won the hand!');
                ///} else {
                ///    winningTeam = biddingTeam === 1 ? _teamA : _teamB;
                ///    $('#hdrHand').text('Congratulations ' + winningTeam + ', you set the other team!');
                ///}
                $('#hdrHand').text(msg);

                let content = _teamA + ' received ' + _teamApts + 'pts from ' + _teamAtricks + ' tricks; '
                    + _teamB + ' received ' + _teamBpts + 'pts from ' + _teamBtricks + ' tricks';

                $('#contentHand').text(content);
                $('#handCompletedImg').attr('src', imgURL);
            }
        })
        .modal('show');
});

socket.on('game complete', (winningTeam, teamAscore, teamBscore, teamAplayers, teamBplayers) => {
    let players = '';
    switch (winningTeam) {
        case 0:
            players = teamAplayers.join().replace(/,/g, ', ');
            $('#winner').html('Team A (' + players + ') won the game with <span style="font-size:large">' + teamAScore + '</span> points!');
            $('#loser').html('Team B finished with ' + teamBscore + ' points - better luck next time...');
            break;
        case 1:
            players = teamBplayers.join().replace(/,/g, ', ');
            $('#winner').html('Team B (' + players + ') won the game with <span style="font-size:large">' + teamBScore + '</span> points!');
            $('#loser').html('Team A finished with ' + teamAscore + ' points - better luck next time...');
            break;
        case 2:
            $('#winner').text('The game ended in a tie!');
            $('#loser').text('The final scores was ' + teamAscore + ' to ' + teamBscore);
            break;
    }
    gameIsStarted = false;
    UpdateLeaderboard();
    $("#gameCompleted").modal('show');
});

$("#playTeamA").checkbox("set checked");

$('#validOnly').checkbox({
    onChange: () => { ShowValidCardsOnly(); }
});


///$('#rbSB').checkbox({
///    onChange: () => {
///        if ($('#rbSB').checkbox('is checked'))
///            UpdateSuggestedBids();
///    }
///});


$("#join")
    .modal({
        closeable: false,
        onShow: function () {
            socket.emit('get rooms', (rooms) => {
                PopulateActiveRooms(rooms);
            });
        }
    })
    .modal('show');


function PopulateActiveRooms(rooms) {
    let $list = $('#joinRoomsList');
    $list.empty();

    if (rooms.length === 0) {
        $('#noActiveGames').show();
        $('#activeGames').hide();
    }
    else {
        $('#noActiveGames').hide();
        $('#activeGames').show();
    }

    let i = 1;
    for (r of rooms) {
        let players = [];
        let playerCount = 0;
        for (p of r.players) {
            if (p.role === 'player' || p.role === 'bot') {
                players.push(p.username);
                playerCount++;
            }
        }
        let pStr = players.join();
        pStr = pStr.replace(',', ', ');
        let button = "ui teal button";
        let roomLabel = 'Table ' + i + ': Accepting more players';

        if (r.gs.gamePhase >= GP_GAMESTARTED)
            roomLabel = "Table " + i + ':  Game is underway'
        //if (playerCount >= 4) {
        //    button = "ui disabled button";
        //    roomLabel = 'Table ' + i + ': This game is full';
        //}
        i++;

        $list.append('<div class="item" >'
            + '<div class="right floated content">'
            + '  <div class="ui teal button" onclick="JoinRoom(\'' + r.roomID + '\',1); return false;">Join as Observer</div>'
            + '</div>'
            + '<div class="right floated content">'
            + '  <div class="' + button + '" onclick="JoinRoom(\'' + r.roomID + '\', 0); return false;">Join as Player</div>'
            + '</div>'
            + '<i class="large middle aligned user friends icon"></i>'
            + '<div class="content">'
            + '  <div class="header">' + roomLabel + '</div>'
            + '  <div class="description">Players: ' + pStr + '</div>'
            + '</div></div>');
    }
}

function JoinRoom(_roomID, role) {
    username = $("#username1").val();
    // strip out illegal characters
    username = username.replace(/[<,>,&,=\,]/gi, '');
    if (username.length === 0) {
        $('#joinMsg').removeClass('green').addClass('red');
        return false;
    }

    roomID = _roomID;

    $("#player").text("Player: " + username);

    let _role = 'player';  // role==0
    switch (role) {
        case 1:  // observer
            $('#obsPanel').show();
            _role = 'observer';
            break;

        case 0:  // role='player'
            $('#obsPanel').hide();
            break;

        default:
            break;
    }

    socket.emit("new player", roomID, username, _role);
    $('#join').modal('hide');
    return true;
}

//function SendChatMessage() {
//    socket.emit('chat message', roomID, '[' + username + '] ' + $('#m').val());
//    $('#m').val('');
//}

function Observe(team, player) {
    // let server know this observer is changing teams
    socket.emit('update team', roomID, socket.id, team, player);
    $('#myHandAll').hide();
    $('#myHand').show();

    if (team !== -1) {
        socket.emit('get hand', roomID, team, player, (hand) => {
            hand.sort(SortCards);
            DistributeHand(hand, '', 90);
            console.log('Receiving hand: ' + hand.join());
            CountCards();
        });
    }
}

function ObserveAll() {
    // let server know this observer is changing teams
    socket.emit('update team', roomID, socket.id, -1, -1);
    $('#myHand').hide();
    $('#myHandAll').show();

    // get hands
    for (let team of [0, 1]) {
        for (let player of [0, 1]) {
            socket.emit('get hand', roomID, team, player, (hand) => {
                hand.sort(SortCards);
                let pre = 'obs-T' + team + 'P' + player + '-';
                DistributeHand(hand, pre, 65);
            });
        }
    }
}

function StartGame(restart) {
    let twoJokers = $('#twoJokers').checkbox('is checked');
    socket.emit('start game', roomID, restart, twoJokers);
}

function Redeal() {
    socket.emit('redeal', roomID);
}

function SelectUserName() {
    alert("Selected");
}


function ResumeGame(team, player) {
    socket.emit('get state', roomID, (gs, teams, players) => {
        // we are resuming a game because a player or observer joined.  If that player is 
        // this player, update their state - otherwise, ignore.
        gameIsActive = true;
        let sender = false;

        // narrow to "this" player only, while collecting other player names
        for (let p of players) {
            if (p.socketID === socket.id) { // is this player me?
                if (p.team === team && p.player === player)
                    sender = true;
                break;
            }
        }

        // if I'm not the player added, don't update my state
        if (sender === false)
            return;

        for (p of players) {
            if (p.role === 'player' || p.role === 'bot')
                playerNames.push(p.username);
        }

        let msg = 'Current players are ' + playerNames.join().replace('/,/g', ', ');
        SetGameMsg('Resuming Game', msg, null, true);

        //let roomID = '';
        //let username = "";
        // team info set in'add player' 
        //let team = 0;
        //let teamA = [];
        //let teamB = [];
        //let observers = [];
        teamAScore = teams[0].score;
        teamBScore = teams[1].score;
        //let $selectedCard = null;
        //let discardsRemaining = 0;
        firstCardPlayedInRound = gs.firstCardPlayed; // card ID
        trumpSuit = gs.trumpSuit;
        currentRound = gs.currentRound;
        //let currentSocketID = '';
        //let currentPlayerName = '';
        //let observeeSocketID = '';

        // update UI

        // update scoreboard
        let teamAtricks = teams[0].tricks;
        let teamBtricks = teams[1].tricks;
        $('#teamAscore').html(teamA.join() + ': <span class="score">' + teamAScore + '</span>  (' + teamAtricks + ')');
        $('#teamBscore').html(teamB.join() + ': <span class="score">' + teamBScore + '</span>  (' + teamBtricks + ')');

        // bid summary    
        SetBidInScoreboard(gs.winningBidder, gs.currentBid);

        // update bid options
        AddBidOptions();

        // are we currently bidding? then cycle through options, removing as needed
        if (gs.gamePhase === GP_BIDDING) { // not first bid or prior pass?
            $('#ddlBids option').each(function () {
                let value = $(this).val();  // e.g. "RS"
                if (CompareBids(value, gs.currentBid) <= 0)  // + if a>b, - if a<b
                    $(this).remove();
            });
            // select top value
            $('#ddlBids')[0].selectedIndex = 0;
        }

        // put the current hand in the My Hand window
        for (let p of players) {
            if (socket.id === p.socketID) { /// is this us?
                let hand = p.hand;
                hand.sort(SortCards);
                DistributeHand(hand, '', 90);
                console.log('Resuming hand: ' + hand.join());
                break;
            }
        }
        CountCards();

        // depending on game state
        SetGameMsg(userMsgHdr, userMsgTxt, null, userMsgGreen);
    });

}


function PlaceBid(pass) {
    if (pass) {
        $('#confirmPassBid')
            .modal({
                closable: false,
                onApprove: function () {
                    socket.emit('place bid', roomID, 'pass', 'pass');
                    socket.emit('suggest bid', roomID, myTeam, myPlayer, (suggestedBid) => {
                        if (suggestedBid === '7N')
                            suggestedBid = 'Nello';
                        else if (suggestedBid === '8N' || suggestedBid === '9N')
                            suggestedBid = 'Open Face Nello';

                        ToastMsg('Your Suggested Bid was ' + suggestedBid, 'Suggested Bid', 20);  // last one
                        //$('#suggestBid')
                        //   .modal({
                        //        onShow: function () {
                        //            $('#sugBid').text(suggestedBid);
                        //        },
                        //        onApprove: function () {
                        //            return true;
                        //        }
                        //    })
                        //   .modal('show');

                    });
                    return true;
                },
                onDeny: function () {
                    return true;
                }
            })
            .modal('show');

        return;
    }

    else {
        // not a pass, confirm bid
        $('#confirmBid')
            .modal({
                closable: false,
                onShow: function () {
                    let bid = $('#ddlBids').dropdown('get value');  // e.g. '6C'
                    let bidText = $('#ddlBids').dropdown('get text');  // e.g. '6 Clubs'
                    $('#proposedBid').text(bidText);
                },
                onApprove: function () {
                    let bid = $('#ddlBids').dropdown('get value');  // e.g. '6C'
                    let bidText = $('#ddlBids').dropdown('get text');  // e.g. '6 Clubs'
                    trumpSuit = bid[1];
                    socket.emit('place bid', roomID, bid, bidText);
                    socket.emit('suggest bid', roomID, myTeam, myPlayer, (suggestedBid) => {
                        if (suggestedBid === '7N')
                            suggestedBid = 'Nello';
                        else if (suggestedBid === '8N' || suggestedBid === '9N')
                            suggestedBid = 'Open Face Nello';

                        ToastMsg('Your Suggested Bid was ' + suggestedBid, 'Suggested Bid', 20);  // last one
                        //$('#suggestBid')
                        //    .modal({
                        //        onShow: function () {
                        //            $('#sugBid').text(suggestedBid);
                        //        },
                        //        onApprove: function () {
                        //            return true;
                        //        }
                        //    })
                        //    .modal('show');
                    });
                    return true;
                },
                onDeny: function () {
                    return true;
                }
            })
            .modal('show');
    }
}


// compare to bids for the purpose of sorting
// + = a > b
// - = a < b
// 0 = a==b
function CompareBids(ca, cb) {
    // same bids are equal
    if (ca === cb)
        return 0;

    // get rank
    let ra = ca[0];
    let rb = cb[0];

    switch (ra) {
        case 'T': ra = 10; break;  // ten
        case 'N': ra = -1; break;
        default: ra = parseInt(ra);
    }
    switch (rb) {
        case 'T': rb = 10; break;
        case 'N': rb = -1; break;
        default: rb = parseInt(rb);
    }

    let sa = ca.slice(-1);
    let sb = cb.slice(-1);

    // special case - nello, it's between 7S and 7C/8S and 8C/9S and 9C
    if (ra === -1) {
        if (sa === 'l') {  // regular nello
            if ((rb === 7 && sb !== 'S') || rb > 7)
                return -1;  // nello bid is above comparator
            else
                return 1;
        } else if (sa === 'o') {  // open face nello
            if ((rb === 8 && sb !== 'S') || rb > 8)
                return -1;
            else
                return 1;
        } else if (sa === 'd') {  // double nello
            if ((rb === 9 && sb !== 'S') || rb > 9)
                return -1;
            else
                return 1;
        } else {
            console.error('CompareBids() failed - a=' + ra + sa + ', b=' + rb + sb);
        }
    }
    if (rb === -1) {
        if (sb === 'l') {
            if ((ra === 7 && sa !== 'S') || ra > 7)
                return 1;
            else
                return -1;
        } else if (sb === 'o') {
            if ((ra === 8 && sa !== 'S') || ra > 8)
                return 1;
            else
                return -1;
        } else if (sb === 'd') {
            if ((ra === 9 && sa !== 'S') || ra > 9)
                return 1;
            else
                return -1;
        } else {
            console.error('CompareBids() failed - a=' + ra + sa + ', b=' + rb + sb);
        }
    }

    // if these not the same rank, return the delta
    if (ra !== rb)
        return (ra - rb);

    // same rank, check suit

    switch (sa) {
        case 'S': ra = 0; break;
        case 'C': ra = 1; break;
        case 'D': ra = 2; break;
        case 'H': ra = 3; break;
        case 'N': ra = 4; break;
    }

    switch (sb) {
        case 'S': rb = 0; break;
        case 'C': rb = 1; break;
        case 'D': rb = 2; break;
        case 'H': rb = 3; break;
        case 'N': rb = 4; break;
    }
    return (ra - rb);
}

function AddBidOptions() {
    let $bids = $('#ddlBids');
    $bids.empty();
    $bids.append('<option value="6S" selected="selected">6 Spades (40 pts)</option>');
    $bids.append('<option value="6C">6 Clubs (60 pts)</option>');
    $bids.append('<option value="6D">6 Diamonds (80 pts)</option>');
    $bids.append('<option value="6H">6 Hearts (100 pts)</option>');
    $bids.append('<option value="6N">6 No Trump (120 pts)</option>');
    $bids.append('<option value="7S">7 Spades (140 pts)</option>');
    $bids.append('<option value="Nl">Nello (150/250 pts)</option>');
    $bids.append('<option value="7C">7 Clubs (160 pts)</option>');
    $bids.append('<option value="7D">7 Diamonds (180 pts)</option>');
    $bids.append('<option value="7H">7 Hearts (200 pts)</option>');
    $bids.append('<option value="7N">7 No Trump (220 pts)</option>');
    $bids.append('<option value="8S">8 Spades (240 pts)</option>');
    $bids.append('<option value="No">Open Face Nello (250/350 pts)</option>');
    $bids.append('<option value="8C">8 Clubs (260 pts)</option>');
    $bids.append('<option value="8D">8 Diamonds (280 pts)</option>');
    $bids.append('<option value="8H">8 Hearts (300 pts)</option>');
    $bids.append('<option value="8N">8 No Trump (320 pts)</option>');
    $bids.append('<option value="9S">9 Spades (340 pts)</option>');
    $bids.append('<option value="Nd">Double Nello (350/450 pts)</option>');
    $bids.append('<option value="9C">9 Clubs (360 pts)</option>');
    $bids.append('<option value="9D">9 Diamonds (380 pts)</option>');
    $bids.append('<option value="9H">9 Hearts (400 pts)</option>');
    $bids.append('<option value="9N">9 No Trump (420 pts)</option>');
    $bids.append('<option value="TS">10 Spades (440 pts)</option>');
    $bids.append('<option value="TC">10 Clubs (460 pts)</option>');
    $bids.append('<option value="TD">10 Diamonds (480 pts)</option>');
    $bids.append('<option value="TH">10 Hearts (500 pts)</option>');
    $bids.append('<option value="TN">10 No Trump (520 pts)</option>');
}

function ClearCardsFromPlayArea() {
    $('.playCard').attr('src', ''); // clear play area
}

function SetHandActive(active) {
    if (active) {
        $('#hand-spades').addClass('active-hand');
        $('#hand-clubs').addClass('active-hand');
        $('#hand-diamonds').addClass('active-hand');
        $('#hand-hearts').addClass('active-hand');
        $('#hand-extras').addClass('active-hand');
        $('#hand-middle').addClass('active-hand');
    }
    else {
        $('#hand-spades').removeClass('active-hand');
        $('#hand-clubs').removeClass('active-hand');
        $('#hand-diamonds').removeClass('active-hand');
        $('#hand-hearts').removeClass('active-hand');
        $('#hand-extras').removeClass('active-hand');
        $('#hand-middle').removeClass('active-hand');
    }
}

function DistributeHand(hand, wild, pre, width) { 
    let $spades = $('#' + pre + 'hand-spades');
    let $clubs = $('#' + pre + 'hand-clubs');
    let $diamonds = $('#' + pre + 'hand-diamonds');
    let $hearts = $('#' + pre + 'hand-hearts');
    let $stars = $('#' + pre + 'hand-stars');
    let $wildcards = $('#' + pre + 'hand-wildcards');
    $spades.empty();
    $clubs.empty();
    $diamonds.empty();
    $hearts.empty();
    $stars.empty();
    $wildcards.empty();

    for (const card of hand) {  // card is like '3R' or 'TC'. jokers are 'JJ'
        let rank, suit;
        [rank, suit] = GetRankAndSuit(card);  // rank=3-13 (King), Joker=50,
        let id = pre + card;
        if (rank > 13 || rank == wild)
            $wildcards.prepend("<img id='" + id + "' class='card' style='width:" + width + "px' src='cards/" + card + ".svg' />");

        else {
            switch (suit) {
                case 'S':
                    $spades.prepend("<img id='" + id + "' class='card' style='width:" + width + "px' src='cards/" + card + ".svg' />");
                    break;
                case 'C':
                    $clubs.prepend("<img id='" + id + "' class='card'  style='width:" + width + "px' src='cards/" + card + ".svg' />");
                    break;
                case 'D':
                    $diamonds.prepend("<img id='" + id + "' class='card' style='width:" + width + "px' src='cards/" + card + ".svg' />");
                    break;
                case 'H':
                    $hearts.prepend("<img id='" + id + "' class='card' style='width:" + width + "px' src='cards/" + card + ".svg' />");
                    break;
                case 'R':
                    $stars.prepend("<img id='" + id + "' class='card' style='width:" + width + "px' src='cards/" + card + ".svg' />");
                    break;
                default:
                    // shouldn't ever get here
                    $wildcards.prepend("<img id='" + id + "' class='card' style='width:" + width + "px' src='cards/" + card + ".svg' />");
                    break;
            }
        }
        // for every card, bring to front if hovering
        $(".card").mouseenter((evt) => {
            let src = evt.target.src;
            let id = evt.target.id;
            // change the order of the siblings so this one is on top

            // get parent (hand-xxxx)
            //let parent = evt.target.parentNode;
            //let $parent = $(parent);
            //let _this = this;
            //let __this = $(this);
            //let a = 1;
        });
    }
}

function OnCardHover(isMouseEnter, $hand, $card) {
    return false;
}

function PlayCard(round, socketID, playerName) {
    // a card has been clicked, play it if allowed
    cards.playCard = function ($card) {
        $selectedCard = $card;
        let card = cards.cid($card);  // e.g 6C
        console.log('Playing card ' + card);

        // is the card playable?
        if (IsPlayableCard(card)) {
            // update approve modal
            $('#cardToPlay').text(GetCardTextFromID(card));

            if ($('#fastPlay').checkbox('is checked')) {
                if (firstCardPlayedInRound === '') {
                    socket.emit('first card played', roomID, card);
                }

                SetHandActive(false);
                socket.emit('card played', roomID, card);
                return true;
            }
            else {
                $('#approvePlay')
                    .modal({
                        closable: false,
                        onApprove: function () {
                            let card = cards.cid($selectedCard);

                            if (firstCardPlayedInRound === '')
                                socket.emit('first card played', roomID, card);

                            SetHandActive(false);
                            socket.emit('card played', roomID, card);
                            return true;
                        },
                        onDeny: function () {
                            PlayCard(currentRound, currentSocketID, currentPlayerName);
                            return true;
                        }
                    })
                    .modal('show');
            }
        }
        else {
            $('illegalCard').text(GetCardTextFromID(card));
            $('#illegalPlay')
                .modal({
                    closable: false,
                    onApprove: function () {
                        PlayCard(currentRound, currentSocketID, currentPlayerName);
                        return true;
                    }
                })
                .modal('show');
        }
    };
}


function ConfirmBid(bidText) {
    $('#confirmBid')
        .modal({
            closable: false,
            onShow: function () {
                $('#proposedBid').text(bidText);
            },
            onApprove: function () {
                return true;
            },
            onDeny: function () {
                return false;
            }
        })
        .modal('show');
}


// implements playing rules
function IsPlayableCard(card) {
    // a card is playable if:
    // 
    // 1) it is following the suit of the first card played.
    // 2) otherwise, you must be out of the suit of the first card played
    // 3) jokers are always considered to be the same suit as trump.
    // 4) the jack of the same color is a trump suit
    if (firstCardPlayedInRound === '') // any card is okay for the first play
        return true;

    let cs, cr, fs, fr;
    [cr, cs] = GetRankAndSuit(card);      // card played
    [fr, fs] = GetRankAndSuit(firstCardPlayedInRound);  // current high card

    if (cs === fs)   // following suit?
        return true;

    let hand = GetCurrentHand();

    if (IsOutOfSuit(hand, fs)) // if you are out of the suit of the first card played, it's valid
        return true;

    return false;
}

function GetCurrentHand() {
    let deck = [];
    $('#hand-spades').children().each((i, card) => {
        deck.push(cards.cid($(card)));
    });
    $('#hand-clubs').children().each((i, card) => {
        deck.push(cards.cid($(card)));
    });
    $('#hand-diamonds').children().each((i, card) => {
        deck.push(cards.cid($(card)));
    });
    $('#hand-hearts').children().each((i, card) => {
        deck.push(cards.cid($(card)));
    });
    $('#hand-extras').children().each((i, card) => {
        deck.push(cards.cid($(card)));
    });
    return deck;
}

function GetCurrentMiddle() {
    let deck = [];
    $('#hand-middle').children().each((i, card) => {
        deck.push(cards.cid($(card)));
    });
    return deck;
}

function CountCards() {
    let hand = GetCurrentHand();
    $('#cardCount').text('Cards: ' + hand.length);
    return hand.length;
}

function IsOutOfSuit(deck, cs) {
    let r, s;
    for (card of deck) {
        [r, s] = GetRankAndSuit(card);
        if (s === cs)
            return false;
    }
    return true;
}

function GetRankAndSuit(card) {
    // first, handle jokers

    // joker?  // if no trump defined, return 'J', else, trump suite
    if (card === 'JJ') {
        return [50, 'J'];
    }

    let rank = 0;
    // no trump defined, treat jacks normally
    switch (card[0]) {
        case 'T': rank = 10; break;
        case 'J': rank = 11; break;
        case 'Q': rank = 12; break;
        case 'K': rank = 13; break;
        default: rank = parseInt(card[0]);
    }

    return [rank, card[1]];
}

function SortCards(a, b) {
    let sa = '';  // suit (character)
    let sb = '';
    let na = 0; // numeric ranking of suits
    let nb = 0;
    let ra = 0; // rank
    let rb = 0;

    [ra, sa] = GetRankAndSuit(a);
    [rb, sb] = GetRankAndSuit(b);

    switch (sa) {
        case 'S': na = 0; break;
        case 'C': na = 1; break;
        case 'D': na = 2; break;
        case 'H': na = 3; break;
        case 'R': na = 4; break;
        case 'J': na = 5; break;  // joker
    }

    switch (sb) {
        case 'S': nb = 0; break;
        case 'C': nb = 1; break;
        case 'D': nb = 2; break;
        case 'H': nb = 3; break;
        case 'R': nb = 4; break;
        case 'J': nb = 5; break;  // joker
    }
    // different suits?
    if (na !== nb)
        return (na - nb);

    // note: no jokers after this, ther are filtered out above
    // same suit, so sort by rank
    return (ra - rb);
}

function IsTrump(card) {
    if (trumpSuit === '' || trumpSuit === 'N')
        return false;

    // joker?
    if (card[1] === 'J' || card === 'Jr' || card === 'Jb')
        return true;

    // jack and trump defined?
    if (card[0] === 'J') {
        switch (card[1]) {
            case 'S':
                return (trumpSuit === 'S') ? 1 : (trumpSuit === 'C') ? -1 : 0;
            case 'C':
                return (trumpSuit === 'C') ? 1 : (trumpSuit === 'S') ? -1 : 0;
            case 'D':
                return (trumpSuit === 'D') ? 1 : (trumpSuit === 'H') ? -1 : 0;
            case 'H':
                return (trumpSuit === 'H') ? 1 : (trumpSuit === 'D') ? -1 : 0;
        }
    }

    // not a jack
    return (card[1] === trumpSuit) ? true : false;
}

function SetGameMsg(hdr, text, buttonFn, green) {
    let $gmHdr = $('#gameMsgHdr');
    let $gmTxt = $('#gameMsgText');

    if (green)
        $('#gameMsgPanel').removeClass('red').addClass('green');
    else
        $('#gameMsgPanel').removeClass('green').addClass('red');

    if (buttonFn !== null) {
        $('#gameMsgBtn').click(buttonFn);
        $('#gameMsgBtn').show();
    }
    else {
        $('#gameMsgBtn').hide();
    }

    if (hdr === null)
        $gmHdr.hide();
    else {
        $gmHdr.html(hdr);
        $gmHdr.show();
    }

    if (text === null)
        $gmTxt.hide();
    else {
        $gmTxt.html(text);
        $gmTxt.show();
    }

}

function ToastMsg(msg, title, seconds) {

    //$('#mainPanel').toast({ message: msg, displayTime: 5000, class: 'grey' });

    const color = 'yellow';

    $('#mainPanel')
        .toast({
            title: title,
            message: msg,
            class: 'inverted ' + color,
            displayTime: seconds*1000,
            className: {
                toast: 'ui message'
            }
        });
}

function GetCardTextFromID(card) {
    let rank = card[0]; // rank
    let suit = card[1]; // suit

    if (suit === 'J') // joker
        return 'Joker';
    else if (suit === 'r') // joker
        return 'Red Joker';
    if (suit === 'b') // joker
        return 'Black Joker';

    switch (rank) {
        case '4': rank = 'Four'; break;
        case '5': rank = 'Five'; break;
        case '6': rank = 'Six'; break;
        case '7': rank = 'Seven'; break;
        case '8': rank = 'Eight'; break;
        case '9': rank = 'Nine'; break;
        case 'T': rank = 'Ten'; break;
        case 'J': rank = 'Jack'; break;
        case 'Q': rank = 'Queen'; break;
        case 'K': rank = 'King'; break;
        case 'A': rank = 'Ace'; break;
    }

    switch (suit) {
        case 'S': suit = 'Spades'; break;
        case 'C': suit = 'Clubs'; break;
        case 'D': suit = 'Diamonds'; break;
        case 'H': suit = 'Hearts'; break;
    }

    return rank + ' of ' + suit;
}

function ShowValidCardsOnly() {
    let validOnly = $('#validOnly').checkbox('is checked');

    $('#hand-spades').children().each((i, card) => {
        if (validOnly && IsPlayableCard(cards.cid($(card))) === false) {
            $(card).hide();
        }
        else
            $(card).show();
    });
    $('#hand-clubs').children().each((i, card) => {
        if (validOnly && IsPlayableCard(cards.cid($(card))) === false) {
            $(card).hide();
        }
        else
            $(card).show();
    });
    $('#hand-diamonds').children().each((i, card) => {
        if (validOnly && IsPlayableCard(cards.cid($(card))) === false) {
            $(card).hide();
        }
        else
            $(card).show();
    });
    $('#hand-hearts').children().each((i, card) => {
        if (validOnly && IsPlayableCard(cards.cid($(card))) === false) {
            $(card).hide();
        }
        else
            $(card).show();
    });
    $('#hand-extras').children().each((i, card) => {
        if (validOnly && IsPlayableCard(cards.cid($(card))) === false) {
            $(card).hide();
        }
        else
            $(card).show();
    });
}

function HighlightCurrentPlayer(currentPlayer) {
    for (let player of ['T0P0', 'T0P1', 'T1P0', 'T1P1']) {
        let $name = $('#' + player + 'name');
        if ($name.text() === currentPlayer)
            $name.addClass('currentPlayer');
        else if ($name.hasClass('currentPlayer'))
            $name.removeClass('currentPlayer').addClass('pastPlayer');

        if (isObserver) {
            $name = $('#obs-' + player + 'name');
            let $hand = $('#obs-' + player + 'hand');
            if ($name.text().trim() === currentPlayer)
                $hand.addClass('currentPlayer');
            else if ($hand.hasClass('currentPlayer'))
                $hand.removeClass('currentPlayer').addClass('pastPlayer');
        }
    }
}


// for the player specified (lastPlayer'), update the bid text
// to be whateve was bid
function SetLastBid(lastPlayer, lastBid) {
    if ($('#T0P0name').text() === lastPlayer)
        $('#T0P0bid').text(lastBid);
    else if ($('#T0P1name').text() === lastPlayer)
        $('#T0P1bid').text(lastBid);
    else if ($('#T1P0name').text() === lastPlayer)
        $('#T1P0bid').text(lastBid);
    else if ($('#T1P1name').text() === lastPlayer)
        $('#T1P1bid').text(lastBid);


}


function ConnectToNewUser(userID, stream) {
    const call = myPeer.call(userID, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
    });

    peers[userID] = call;
}

function AddVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}

// user clicked the "start game" button
function StartNewRoom() {
    username = $("#username1").val();

    if (username === '')
        username = $("#selectUser").options[$("#selectUser").selectedIndex].valueval();
    // strip out illegal characters
    username = username.replace(/[<,>,&,=]/gi, '');
    if (username.length === 0) {
        $('#joinMsg').removeClass('green').addClass('red');
        return false;
    }

    socket.emit('add room', (newRoomID) => {
        roomID = newRoomID;

        $("#player").text("Player: " + username);

        socket.emit("new player", roomID, username, "player");
        //socket.emit("chat message", roomID, "Player " + username + " has joined the game");

        $('#obsPanel').hide();
        $('#join').modal('hide');
    });
}

/*
function IsMisdeal(hand) {
    let misdeal = true;
    for (card of hand) {
        switch (card[0]) {
            case 'J':    // jack or joker
            case 'Q':
            case 'K':
                misdeal = false;
                break;
            default:
                continue;
        }
    }
    return misdeal;
}
*/

function ResetPlayPanel() {
    $('.playName').removeClass('currentPlayer').removeClass('pastPlayer');
    $('.playBid').text('');
    $('.playSugBid').text('');
    $('.playSugBid').hide('');
}


function UpdateHandStrengths(flag) {
    let hsArray = [];

    for (let team of [0, 1]) {
        for (let player of [0, 1]) {
            socket.emit('get suggested bids', roomID, team, player, (hs) => {
                //socket.emit('get handstrength', roomID, team, player, (hs) => {
                // hs is an array of hand strengths so far this game for the given player
                console.log('get suggested bids => ' + hs);

                if (hs.length === 0)
                    return;

                let mean = 0;
                let count = 0;
                for (var _hs of hs) {
                    mean += _hs;
                    count++;
                }
                mean /= count; 

                let handStrength = hs.slice(-1)[0];  // last one

                if (flag === 0) {
                    const $hs = $('#T' + team + 'P' + player + 'hs');
                    $hs.text(handStrength.toString());
                    // $hs.show();'
                }
                else if (flag === 1) {
                    hsArray.push(handStrength);

                    if (hsArray.length === 4) {
                        // update chart in client
                        console.log('handstrength: ' + hsArray);
                        UpdateHSChart(hsArray);
                        hsArray = [];
                    }
                }
            });
        }
    }
}




function UpdateSuggestedBids() {
    for (let team of [0, 1]) {
        for (let player of [0, 1]) {
            socket.emit('suggest bid', roomID, team, player, (bid) => {
                const $bid = $('#T' + team + 'P' + player + 'sugBid');
                $bid.text('(' + bid + ')');
                $bid.show();
            });
        }
    }
}

function HideSuggestedBids() {
    for (let team of [0, 1]) {
        for (let player of [0, 1]) {
            const $bid = $('#T' + team + 'P' + player + 'sugBid');
            $bid.text('');
            $bid.hide();
        }
    }
}


function UpdateLeaderboard() {
    socket.emit('get leaderboard', (playerStats) => {
        let table = [];
        for (player in playerStats) {
            let ps = playerStats[player];
            let row = [];
            row.push(player);
            row.push(ps['Games']);
            row.push(ps['Games Won']);
            row.push(ps['% Won'].toFixed(2));

            if (ps['AHS'] === null)
                row.push('--');
            else
                row.push(ps['AHS'].toFixed(2));
            table.push(row);
        }

        $('#leaderboard').DataTable({
            data: table,
            columns: [
                { title: 'Name' },
                { title: 'Games' },
                { title: 'Games Won' },
                { title: '% Won' },
                { title: 'Avg Hand Strength' }
            ],
            destroy: true,
            'paging': false,
            'scrollY': '12em',
            'scrollCollapse': true,
            'searching': false,
            'info': false
        });

    });
}


let hsChart = null;
let hsCount = 0;
function UpdateHSChart(hsArray) {
    // get player names

    if (hsChart === null) {
        hsCount = 0;

        let ctx = document.getElementById('myChart').getContext('2d');
        hsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [], // x-axis
                datasets: [{
                    label: teamA[0],
                    backgroundColor: 'red',
                    borderColor: 'red',
                    fill: false,
                    data: []
                }, {
                    label: teamA[1],
                    backgroundColor: 'aqua',
                    borderColor: 'aqua',
                    fill: false,
                    data: []
                }, {
                    label: teamB[0],
                    backgroundColor: 'green',
                    borderColor: 'green',
                    fill: false,
                    data: []
                }, {
                    label: teamB[1],
                    backgroundColor: 'yellow',
                    borderColor: 'yellow',
                    fill: false,
                    data: []
                }]
            },
            options: {
                //title: { display: true, text: 'Hand Strengths this Game' }
                legend: {
                    labels: {
                        fontColor: 'white'
                    }
                }
            }
        });     // end of:  new Chart(...)
    }   // end of: if (hsChart === null)

    // update chart data with latest counts
    means = [0,0,0,0];
    hsChart.data.labels.push(hsCount.toString());
    hsChart.data.datasets.forEach((dataset, index) => {
        if (hsArray[index] === 'T')
            dataset.data.push(10);
        else
            dataset.data.push(hsArray[index]);

        //means[i] += data.push()
    });
    hsChart.update();
    hsCount += 1;
}

/*
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function FadeMiddle() {
    let $middle = $('#hand-middle');  // first car

    await sleep(1000);

    while ($middle.children().length > 0) {
        let $last = $middle.children().last();
        let card = cards.cid($last);
        // make a new card element
        let $card = $("<img class='card' style='width:100px' src='cards/" + card + ".svg' />");

        [r, s] = GetRankAndSuit(card);
        switch (s) {
            case 'S': $('#hand-spades').append($card.hide().fadeIn(800)); break;
            case 'C': $('#hand-clubs').append($card.hide().fadeIn(800)); break;
            case 'D': $('#hand-diamonds').append($card.hide().fadeIn(800)); break;
            case 'H': $('#hand-hearts').append($card.hide().fadeIn(800)); break;
            case 'N': $('#hand-extras').append($card.hide().fadeIn(800)); break;
        }
        $last.fadeOut(800, function () {
            $(this).remove();

            CountCards();

        });
        await sleep(1000);
    }

    hand = GetCurrentHand();
    hand.sort(SortCards);
    DistributeHand(hand);
}
*/

function AddBot() {
    socket.emit('new player', roomID, 'bot', 'bot');
}

//function UpdateBidSuggestions() {
//
//    socket.emit('suggest bid', roomID, 0,0, (team,player, bid) => {
//       ;
//    });
//}