import { TweenMax, Power2, Expo, CSSPlugin } from 'gsap';

class calloutHoverBackground {
    constructor() {

        this.buttons = document.querySelectorAll('.calloutHoverBackground__item');
        this.easingValue = Expo.easeOut;
        this.backgroundImages = document.querySelectorAll('.calloutHoverBackground--desktop-image.hover');
        this.showImage = this.showImage.bind(this);
        this.mouseOver = this.mouseOver.bind(this);
        this.mouseOut = this.mouseOut.bind(this);
        this.imagesArray = [];
        this.setupBackgroundImages = this.setupBackgroundImages.bind(this);
        this.activeImage = document.querySelector('.active-image');
        this.blockAnimation = false;

        this.hoverTimeout = null;
    }




    init(){

        console.log('Initialize calloutHoverBackground');

        console.log(this.buttons);
        this.setupBackgroundImages();
        this.events();



    }

    setupBackgroundImages() {

        this.imagesArray = Array.from(this.backgroundImages);

        this.imagesArray.forEach(function(element, index){

            console.log('Image:');
            console.log(element);

        }.bind(this));

    }

    showContent(i) {

        var overlay = this.buttonsArray[i].querySelector('.calloutHoverBackground__overlay');
        var content = this.buttonsArray[i].querySelector('.calloutHoverBackground__content');
        var label = this.buttonsArray[i].querySelector('.calloutHoverBackground__label');

        TweenMax.to(label, 0.8, {
            autoAlpha: 0,
            y: 5,
            ease: this.easingValue
        });


        TweenMax.to(overlay, 0.8, {
            autoAlpha: 1,
            ease: this.easingValue
        });

        TweenMax.to(content, 0.8, {
            y: -20,
            opacity: 1,
            ease: this.easingValue,
            delay: 0.1,
            onComplete: function(){

            }.bind(this)
        });




    }

    hideContent(i) {

        var overlay = this.buttonsArray[i].querySelector('.calloutHoverBackground__overlay');
        var content = this.buttonsArray[i].querySelector('.calloutHoverBackground__content');
        var label = this.buttonsArray[i].querySelector('.calloutHoverBackground__label');

        TweenMax.to(overlay, 0.8, {
            autoAlpha: 0,
            ease: this.easingValue
        });

        TweenMax.to(content, 0.8, {
            y: 0,
            opacity: 0,
            ease: this.easingValue,
            onComplete: function(){

            }.bind(this)
        });

        TweenMax.to(label, 0.8, {
            autoAlpha: 1,
            y: 0,
            ease: this.easingValue,
            delay: 0.1
        });




    }

    showImage(i) {

        TweenMax.to(this.imagesArray[i], 0.5, {
            autoAlpha: 1,
            ease: this.easingValue,
            onComplete: function(){
                this.imagesArray[i].classList.add('active-image');
            }.bind(this)
        });


    }

    hideImage(i) {

        TweenMax.to(this.imagesArray[i], 0.5, {
            autoAlpha: 0,
            ease: this.easingValue,
            onComplete: function(){
                this.imagesArray[i].classList.remove('active-image');
            }.bind(this)
        })

    }


    mouseOver(event) {

        var _self = this;

        this.hoverTimeout = setTimeout(function(){

            console.log('mouse over');
            var index = event.target.dataset.imageIndex;
    
            console.log('index: ' + index);
            _self.showImage(index);
            _self.showContent(index);

        }, 100); 


    }

    mouseOut(event) {
        
        clearTimeout(this.hoverTimeout);

        console.log('mouse out');
        var index = event.target.dataset.imageIndex;
        console.log('index: ' + index);    
        this.hideImage(index);
        this.hideContent(index);           
    }

    events() {

        var _self = this;

        this.buttonsArray = Array.from(this.buttons);

        this.buttonsArray.forEach(function(element, index){


            // var length = element.children.length;
            // var hoverArea = element.children[length-1];
            // console.log(hoverArea);
                        
            //hoverArea.addEventListener('mouseover', _self.mouseOver);
            // hoverArea.addEventListener('mouseout', _self.mouseOut);
 
            $(element).on('mouseenter', _self.mouseOver); 
            $(element).on('mouseleave', _self.mouseOut);

        });
                             

    }


}

export default calloutHoverBackground;