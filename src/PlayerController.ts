// TODO: Find better solution for this maybe (regeneratorruntime is not defined)?
// import 'babel-polyfill';
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
    private _activeTrackIndex: number;
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

    public constructor(elementId: string) {
        // TODO: Create new player
        this._player = new YT.Player(elementId, {
            height: '0',
            width: '0',
            videoId: '',
            events: {
                'onReady': this._onPlayerReady.bind(this),
                'onStateChange': this._onPlayerStateChange.bind(this)
            }
        });
        console.log("CONTROLLER", this._player);
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

    // ==============================================================
    // YOUTUBE WRAPPER METHODS
    // ==============================================================
    // For using in the construction of the iFrame player
    private _onPlayerReady = (event: YT.PlayerEvent) => {
        console.log("CONTROLLER bound ready event called");
        this._player = event.target;
        this.isInitted = true;
        console.log("I am initted")
        this.initted.next(true);
    }

    public _onPlayerStateChange(event: YT.OnStateChangeEvent): void {
        this._playerStateChanged.next(event.data);
    }

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

    // ===================================================
    // OUR LOGIC
    //====================================================
    private set state(state: PlayerState) {
        this._state = state;
        this.stateChanged.next(this._state);
    }

    private set activeTrackIndex(index: number) {
        this._activeTrackIndex = index;
        this.activeTrackIndexChanged.next(this._activeTrackIndex);
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
        this.trackChanged.next(this._activeTrack);
    }

    /**
     * Load playlist
     */
    public loadTrackList(tracks: Track[]): void {
        this._tracks = tracks;
        this.queueTrack(tracks[0]);
        this.activeTrackIndex = 0;
        this.tracksChanged.next(this._tracks);
    }

    /**
     * Play
     */
    public play(): Promise<boolean> {
        // TODO: Handle no track, end of track etc
        return new Promise((res, rej) => {
            if (!this._activeTrack) {
                return rej('No track queue\'d');
            }

            if (this._player.getPlayerState() === YT.PlayerState.PLAYING) {
                return res();
            }

            this._player.playVideo();
            this._playerStateChanged
            .subscribe(state => {
                if (state === YT.PlayerState.PLAYING) {
                    // TODO: Start watching
                    this.state = PlayerState.Playing;
                    return res();
                }
            })
        });
    }

    /**
     * Pause
     */
    public pause(): Promise<void> {
        return new Promise((res, rej) => {
            if (this._player.getPlayerState() === YT.PlayerState.PAUSED) {
                return res();
            }

            this._player.pauseVideo();
            this._playerStateChanged
            .subscribe(state => {
                if (state === YT.PlayerState.PAUSED) {
                    res();
                }
            })
        });
    }

}
