export enum SocketEvent {
    Connected= 'connection',
    JOINGAME = 'join-game',
    ERROR='error',
    UserJoined = 'user_joined',//player-joined in main
    UserLeft = 'user_left',
    STARTGAME='start-game',
    GAMESTARTED='game-started',
    AllPlayer='all-player',//players in main
    NEWHOST='new-host',
    GAMEFINISHED='game-finished',
    SCORE='player-score',
    PLAYERTYPED='player-typed',
    LEAVE='leave',
    PLAYERLEFT='player-left',
    DISCONNECT='disconnect',
    // Add more event types as needed
}



