import lity from "lity";


class Lightbox {
    constructor() {



    }




    init(){

        
        $('.lightbox').on('click', function(event){
            event.preventDefault();
            var link = $(this).attr('href');

            lity(link);

        });


    }

}

export default Lightbox;