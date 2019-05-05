// TODO: Find better solution for this maybe (regeneratorruntime is not defined)?
import 'babel-polyfill';
import { BehaviorSubject } from 'rxjs';
import Track from './Track';

export enum PlayerState {
    Idle,
    Playing,
    Paused,
    Stopped,
    Loading,
    Error,
}

export default class PlayerController {
    // Youtube player
    private _player: YT.Player;
    private _playerStateChanged: BehaviorSubject<YT.PlayerState>;

    // Abstractions
    private _activeTrack?: Track;
    private _tracks: Track[];
    private _activeTrackIndex;
    private _playbackPosition: number;
    private _state: PlayerState;


    public initted: BehaviorSubject<boolean>;
    public isInitted = false;

    public readonly trackChanged: BehaviorSubject<Track | undefined>;
    public readonly activeTrackIndexChanged: BehaviorSubject<number>;
    public readonly tracksChanged: BehaviorSubject<Track[]>;
    // NOTE: Relative to start of track
    public readonly progress: BehaviorSubject<number>;
    public readonly stateChanged: BehaviorSubject<PlayerState>;

    public constructor() {
        // TODO: Create new player
        this._player = new YT.Player('player', {
            height: '1000',
            width: '1000',
            videoId: '',
            events: {
            //   'onReady': this._onPlayerReady,
                'onReady': this._onPlayerReady.bind(this),
                'onStateChange': this._onPlayerStateChange.bind(this)
            }
        });
        this.initted = new BehaviorSubject(false);
        this._playerStateChanged = new BehaviorSubject<YT.PlayerState>(YT.PlayerState.UNSTARTED);

        this._tracks = [];
        this._activeTrackIndex = -1;
        this._playbackPosition = -1;
        this._state = PlayerState.Idle;
        this.trackChanged = new BehaviorSubject(this._activeTrack);
        this.activeTrackIndexChanged = new BehaviorSubject(-1);
        this.tracksChanged = new BehaviorSubject(this._tracks);
        this.progress = new BehaviorSubject(0);
        this.stateChanged = new BehaviorSubject<PlayerState>(this._state);
    }

    private _onPlayerReady = (event: YT.PlayerEvent) => {
        this._player = event.target;
        this.isInitted = true;
        console.log("I am initted")
        this.initted.next(true);
    }

    // For using in the construction of the iFrame player
    public _onPlayerStateChange(event: YT.OnStateChangeEvent): void {
        this._playerStateChanged.next(event.data);
    }

    /**
     * Make player operations awaitable
     */
    private _loadVideo(id: string, start?: number): Promise<YT.PlayerError> {
        return new Promise((res, rej) => {
            // Wait till initted
            this._player.loadVideoById(id, start);
            this._playerStateChanged
            .subscribe(state => {
                if (state === YT.PlayerState.PLAYING) {
                    // TODO: Determine if we should let it play?
                    res();
                }
            })
        });
    }

    /**
     * Should not be called while dragging!
     */
    private _seekTo(time: number): Promise<void> {
        return new Promise((res, rej) => {
            this._player.seekTo(time, true);
            this._playerStateChanged
            .subscribe(state => {
                // TODO: Determine what state entails 'done'
                if (state === YT.PlayerState.PLAYING ||
                    state === YT.PlayerState.PAUSED) {
                    res();
                }
            });
        });
    }

    /**
     * Set a single track as active.
     */
    public async queueTrack(track: Track): Promise<void> {
        const prevVideoId = this._activeTrack && this._activeTrack.videoId;
        this._activeTrack = track;
        if (this._activeTrack.videoId !== prevVideoId) {
            await this._loadVideo(track.videoId, track.start);
        } else {
            await this._seekTo(track.start);
        }
    }

    /**
     * Load playlist
     */
    public loadTrackList(tracks: Track[]): void {
        this._tracks = tracks;
        this.queueTrack(tracks[0]);
        this._activeTrackIndex = 0;
        this.activeTrackIndexChanged.next(0);
        this.trackChanged.next(this._activeTrack);
    }

    // /**
    //  * Play
    //  */
    // public play(): Promise<void> {
    //     // TODO: Handle no track, end of track etc
        
    // }

}
