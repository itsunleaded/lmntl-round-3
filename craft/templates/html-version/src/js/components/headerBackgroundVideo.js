import videojs from "video.js";

class headerBackgroundVideo {
    constructor() {

        this.video = document.querySelector('.headerBackgroundVideo--video');

        this.options = {
          controls: false,
          autoplay: true,
          preload: 'metadata',
          loop: true,
          muted: 'muted'
        };



    }

    init(){

        console.log('Initialize headerBackgroundVideo');

        if(this.video) {
            this.video = videojs(this.video, this.options, this.ready());
            this.video.addClass('headerBackgroundVideo--video-js');
            window.myVideo = this.video;

        }
    }

    ready() {




    }

    events() {


    }

}

export default headerBackgroundVideo;