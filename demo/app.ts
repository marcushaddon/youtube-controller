import PlayerController from '../src/PlayerController';
declare global {
    interface Window { onYouTubeIframeAPIReady: any; }
}

window.onYouTubeIframeAPIReady = function() {
    const pc = new PlayerController();
    console.log(pc)
}

