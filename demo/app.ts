import PlayerController from '../src/PlayerController';
import Track from '../src/Track';
declare global {
    interface Window { onYouTubeIframeAPIReady: any; }
}

const tracks: Track[] = [
    {
        title: 'Thing',
        videoId: 'l0vrsO3_HpU',
        start: 124,
        stop: Infinity,
    }
];

window.onYouTubeIframeAPIReady = function() {
    const pc = new PlayerController();
    pc.initted
    .subscribe(initted => {
        if (initted) {
            pc.loadTrackList(tracks);
        }
    });
}
