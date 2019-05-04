import { BehaviorSubject } from 'rxjs';
import Track from './Track';

export enum PlayerState {
    Playing,
    Paused,
    Stopped,
    Loading,
    Idle,
    Error,
}

export default class PlayerController {
    // Youtube player
    private _player: YT.Player;
    private _playerStateChanged: BehaviorSubject<YT.PlayerState>;

    // Abstractions
    private _activeTrack?: Track;
    private _tracks: Track[];
    public readonly activeTrackIndex: number;
    private _playbackPosition: number;
    private _state: PlayerState;

    public readonly trackChanged: BehaviorSubject<Track | undefined>;
    public readonly tracksChanged: BehaviorSubject<Track[]>;
    // NOTE: Relative to start of track
    public readonly progress: BehaviorSubject<number>;
    public readonly stateChanged: BehaviorSubject<PlayerState>;

    public constructor() {
        // TODO: Create new player
        this._player = new YT.Player('player', {
            height: '390',
            width: '640',
            videoId: 'M7lc1UVf-VE',
            events: {
              'onReady': this._onPlayerReady,
              'onStateChange': this._onPlayerStateChange
            }
          });
        this._playerStateChanged = new BehaviorSubject<YT.PlayerState>(-1);

        this._tracks = [];
        this.activeTrackIndex = -1;
        this._playbackPosition = -1;
        this._state = PlayerState.Idle;
        this.trackChanged = new BehaviorSubject(this._activeTrack);
        this.tracksChanged = new BehaviorSubject(this._tracks);
        this.progress = new BehaviorSubject(0);
        this.stateChanged = new BehaviorSubject<PlayerState>(this._state);
    }

    private _onPlayerReady = (event: YT.PlayerEvent) => {
        this._player = event.target;
    }

    // For using in the construction of the iFrame player
    private _onPlayerStateChange(event: YT.OnStateChangeEvent): void {
        this._playerStateChanged.next(event.data);
    }

}
