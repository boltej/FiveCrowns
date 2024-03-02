/*
Note: 
a "play" is one card being played
a "round" is four cards being played, one from each player
a "hand" is one set of ten plays (a complete hand of cards)
a "game" is a set of rounds, that finishes when a team gets 500 points
*/

const socket = io('/');

//---------------------------------------------------------
// message handlers
//---------------------------------------------------------

socket.on('user disconnected', (team, player, username, role) => {
    PopulateActiveRooms();
});


// a new room was added.  Update login/join screen
socket.on('room added', (_roomID) => {
    socket.emit('get rooms', (rooms) => {
        PopulateActiveRooms(rooms);
    });
});


// a player was added to a room.  Update login/join screen
socket.on('update rooms', () => {
    socket.emit('get rooms', (rooms) => {
        PopulateActiveRooms(rooms);
    });
});


function PopulateActiveRooms(rooms) {
    let $list = $('#tablesList');
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
        let pdivs = '';
        for (p of r.players) {
            if (p.role === 'player') {
                players.push(p.username);
                pdivs = pdivs
                    + '<div class="ui teal button" style="margin:2px" onclick="RemovePlayer(\'' + r.roomID + '\',1); return false;">Remove</div>'
                    + '<span>' + p.username + '</span><br/>';
                playerCount++;
            }
        }
        let pStr = players.join();
        pStr = pStr.replace(',', ', ');
        let button = "ui teal button";
        let roomLabel = 'Table ' + i + ': Waiting for more players';

        if (playerCount >= 4) {
            button = "ui disabled button";
            roomLabel = 'Table ' + i + ': This game is full';
        }
        i++;

        $list.append('<div class="item" >'
            + '<div class="right floated content">'
            + '  <div class="ui teal button" onclick="CloseRoom(\'' + r.roomID + '\',1); return false;">Close this Table</div>'
            + '</div>'
            + '<i class="large middle aligned user friends icon"></i>'
            + '<div class="content">'
            + '  <div class="header">' + roomLabel + '</div>'
            + '  <div class="description">Players</div><br/>' + pdivs
            + '</div></div>');
    }
}


socket.emit('get rooms', (rooms) => {
    PopulateActiveRooms(rooms);
});

