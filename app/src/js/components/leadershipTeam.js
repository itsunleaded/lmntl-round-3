import 'owl.carousel.es6';

class leadershipTeam {
    constructor() {

        this.carousel = $('.leadershipTeam__carousel');


    }
 
    init(){ 

        console.log('Initialize leadershipTeam');
        this.carousel.owlCarousel({
           loop: true,
           margin: 10,
           responsiveClass:true,
           dots: true,
           autoPlay: true,
           autoplayHoverPause: true,
           autoplaySpeed: 500,
           smartSpeed: 1000,
           fluidSpeed: 1000,
           responsive:{
               0:{
                   items:1,
                   nav:false
               },
               768:{
                   items:2,
                   nav:false
               },
               992:{
                   items: 3,
                   nav:false
               }
            }

        });

    }

    ready() {

        console.log('They Ready!');



    }

    events() {


    }

}

export default leadershipTeam;