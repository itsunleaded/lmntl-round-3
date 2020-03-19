import { TweenMax, TimelineMax, Power2, Expo, CSSPlugin } from 'gsap';
import { Draggable} from "gsap/Draggable";
import { ThrowPropsPlugin } from "../vendor/greensock-js-shockingly-green 3/src/bonus-files-for-npm-users/ThrowPropsPlugin";

class resourcesOverview {
    constructor() {
        this.scrollContent = $('#resourcesOverview__content');
        this.scrollContainer = $('.resourcesOverview__wrapper');
        this.scrollRows = $('.resourcesOverview__row');
        this.easingValue = Expo.easeOut;
        this.draggable = null;
        this.navigateForward = this.navigateForward.bind(this);
        this.navigateBack = this.navigateBack.bind(this);
        this.wheelHandler = this.wheelHandler.bind(this);
        this.animationBlocked = false;

        this.resourceElements = $('.resourcesOverview__item');
        this.resources = [];
        this.currentResource = 0;


        this.resourceImages = $('.resourcesOverview--image');
        this.images = [];
        this.currentImage = 0;
    }

    init(){

        var _self = this;
        this.setViewPortHeight();
        this.setContainerSize();
        this.setupResources();

        console.log('Initialize resourcesOverview');
        this.draggable = Draggable.create(this.scrollContent, {
            type: 'y',
            bounds: this.scrollContainer,
            throwProps: true,
            maxDuration: 1,
            onPress: function(e){
                e.preventDefault();
                e.stopPropagation();
            },
            snap: function(endValue) {

                if(_self.animationBlocked)
                    _self.animationBlocked = false;

                var snapHeight = _self.snapHeight();

                return Math.round(endValue/snapHeight) * snapHeight;

            },
            onThrowComplete: function(){
                _self.resources.forEach(function(element, index){


                    var overlap = Draggable.hitTest(element, _self.scrollContainer, "50%");

                    if(overlap){

                        //Updated Selected Title
                        _self.resources[_self.currentResource].classList.remove('resourcesOverview--active');
                        _self.resources[index].classList.add('resourcesOverview--active');

                        //Update Image
                        _self.updateImage(index);

                        //Set Current Resource
                        _self.currentResource = index;

                    }

                });
            }
        });



        this.events();

    }

    setViewPortHeight() {

        // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
        let vh = window.innerHeight * 0.01;
        // Then we set the value in the --vh custom property to the root of the document
        document.documentElement.style.setProperty('--vh', `${vh}px`);

    }

    setupResources() {

        this.resources = this.resourceElements.toArray();
        this.images = this.resourceImages.toArray();
    }

    setContainerSize() {

        var viewportHeight = Math.round(window.innerHeight);
        this.scrollContainer.height(viewportHeight/3);
        this.scrollRows.height(viewportHeight/3);

    }

    snapHeight() {


        var height = this.scrollContainer.height();

        return height;

    }

    isFirstResource() {

        if(this.currentResource == 0)
            return true;
        else
            return false;

    }

    isLastResource() {

        if(this.currentResource == (this.resources.length - 1))
            return true;
        else
            return false;

    }

    updateImage(index) {

        console.log('Update Image Index: ' + index);
        //Hide Current Image
        TweenMax.to(this.images[this.currentImage], 0.8, {
            autoAlpha: 0,
            ease: this.easingValue
        });

        //Show Requested Image
        TweenMax.to(this.images[index], 0.8, {
            autoAlpha: 1,
            ease: this.easingValue,
            onComplete: function(){
                //Update Current Index
                this.currentImage = index;
            }.bind(this)
        });

    }


    updateNavigation(direction) {

        if(direction == 'next'){
            this.resources[this.currentResource - 1].classList.remove('resourcesOverview--active');
            this.resources[this.currentResource].classList.add('resourcesOverview--active');

        } else {
            this.resources[this.currentResource + 1].classList.remove('resourcesOverview--active');
            this.resources[this.currentResource].classList.add('resourcesOverview--active');

        }


    }

    navigateForward() {
        console.log('Navigate Forward');
        if(this.animationBlocked)
            return false;

        if(!this.isLastResource()) {

            this.currentResource = this.currentResource + 1;
            console.log('Current Resource: ' + this.currentResource);
            this.updateNavigation('next');
            this.updateImage(this.currentResource);

            TweenMax.to(this.scrollContent, 1.0, {
               y: '-=' + this.snapHeight(),
                ease: this.easingValue,
                onComplete: function(){

                   this.animationBlocked = false;
                }.bind(this)
            });

            this.animationBlocked = true;
        }

    }

    navigateBack() {
        console.log('Navigate Back');
        if(this.animationBlocked)
            return false;

        if(!this.isFirstResource()) {

            this.currentResource = this.currentResource - 1;
            console.log('Current Resource: ' + this.currentResource);
            this.updateNavigation('back');
            this.updateImage(this.currentResource);

            TweenMax.to(this.scrollContent, 1.0, {
                y: '+=' + this.snapHeight(),
                ease: this.easingValue,
                onComplete: function(){

                    this.animationBlocked = false;
                }.bind(this)
            });

            this.animationBlocked = true;
        }

    }

    wheelHandler(e) {
        //console.log('wheel handler!');

        var e = window.event || e; // old IE support
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

        if(delta == -1) {
            //console.log('navigate forward');
            this.navigateForward();
        } else {
            //console.log('navigate back');
            this.navigateBack();
        }


    }

    events() {

        window.addEventListener('mousewheel', this.wheelHandler, false );
        window.addEventListener('DOMMouseScroll', this.wheelHandler, false );


    }

}

export default resourcesOverview;