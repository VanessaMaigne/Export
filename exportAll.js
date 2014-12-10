/**
 * exportAll _ version 2.0
 * ##################################################
 *   Created by vmaigne@gmail.com _ august 2014
 * ##################################################
 * This library exports your HTML page content into PNG, JPG & GIF formats
 *
 * @mandatory aElement : DOM "a" element, used to launch the export.
 * We clone the element into a targetContainer and copy css styles (sourceDiv and targetDiv MUST HAVE the same childrens, that's why we need to launch callbackBeforeCanvg AFTER the css copy)
 * @optional listStyleToGet : list of styles to keep in the export elements
 * @optional callbackBeforeCanvg : function to call before the transformation of all svg elements to canvas
 * @optional callbackOnRendered : function to call before the window.open
 * @optional windowTitle : title for the opened tab
 * @mandatory fileName
 * @mandatory fileType
 *
 * http://jqueryfiledownload.apphb.com/
 * http://stackoverflow.com/questions/283956/is-there-any-way-to-specify-a-suggested-filename-when-using-data-uri
 */

(function( $ )
{
    var element = false;
    var options = false;
    var sourceContainerId = false;
    var targetContainerId = false;

    $.fn.extend( {
        exportAll: function( optionsArgument )
        {
            var defaults = {
                consoleLog:'true'
            };

            options = $.extend( defaults, optionsArgument );
            element = this;
            sourceContainerId = this[0].id;

            // Create a new container for export and clone source content
            createExportContainerAndClone();

            // Copy styles from source to export
            if( sourceContainerId && targetContainerId )
                copySelectedCss( $( "#" + sourceContainerId ), $( "#" + targetContainerId ), options.listStyleToGet );

            if( options.callbackBeforeCanvg )
                options.callbackBeforeCanvg.name( options.callbackBeforeCanvg.arguments, targetContainerId );

            // Transform all svg into canvas
            canvg( null, null, null, targetContainerId );

            // Get only .svg images
            var imagesToConvert = $.map( $( "#" + targetContainerId + " img" ), function( d )
            {
                if( d.src.indexOf( ".svg" ) != -1 )
                    return d;
            } );

            // Transform img with .svg file into canvas
            // Use recursive function to wait for the loading of each image before to launch the callback at the last image
            convertImgToCanvas( imagesToConvert, 0, html2CanvasLaunch );
        }
    } );

    function createExportContainerAndClone()
    {
        var dt = new Date();
        var currentTime = dt.getFullYear() + "" + (dt.getMonth() + 1) + "" + dt.getDate() + "_" + dt.getHours() + "" + dt.getMinutes() + "" + dt.getSeconds();
        targetContainerId = "exportContainer_" + currentTime;
        var targetContainer = $( '<div id="' + targetContainerId + '"></div>' );
        targetContainer.width( $( "#" + sourceContainerId ).width() );
        targetContainer.height( $( "#" + sourceContainerId ).height() );
        $( "body" ).append( targetContainer );

        $( "#" + targetContainerId ).empty();
        $( "#" + targetContainerId ).append( $( "#" + sourceContainerId ).contents().clone() );
    }

    /**
     * This method convert an image into a canvas and launch the callback after the load of this image
     * @param imagesToConvert : array of svg images to convert
     * @param index : index of the array
     * @param callbackAfterConvert : function to launch at the end of the load of the last image
     */
    function convertImgToCanvas( imagesToConvert, index, callbackAfterConvert )
    {
        if( !imagesToConvert || !imagesToConvert[index] || index > imagesToConvert.length )
            return;

        var image = imagesToConvert[index];

        // Load up our image.
        var source = new Image();
        source.src = $( image ).attr( "src" );

        // Render our SVG image to the canvas once it loads.
        source.onload = function()
        {
            // create Canvas Element
            var myCanvas = document.createElement( "canvas" );
            myCanvas.width = $( image ).width();
            myCanvas.height = $( image ).height();
            $( image ).parent().append( myCanvas );

            // get 2D context
            myCanvas.getContext( '2d' ).drawImage( source, 0, 0, myCanvas.width, myCanvas.height );

            $( image ).remove();
            index++;
            if( callbackAfterConvert && index == imagesToConvert.length )
                callbackAfterConvert();
            convertImgToCanvas( imagesToConvert, index, callbackAfterConvert );
        };
    }

    /**
     * This method launch the html2canvas function to create the final image with all transformed elements
     */
    function html2CanvasLaunch()
    {
        html2canvas( $( "#" + targetContainerId ), {
//            useCORS: true,
            onrendered: function( canvas )
            {
                if( options.callbackOnRendered )
                    options.callbackOnRendered.name( options.callbackOnRendered.arguments, targetContainerId );

                var data = canvas.toDataURL( "image/" + options.fileType );

                // Remove target export container
                $( "#" + targetContainerId ).remove();

                var img = document.createElement( 'img' );
                img.src = data;
                img.title = 'Click on the image to save it';

                // download doesn't work with Safari, IE or Opera.
                // http://caniuse.com/download
                var a = document.createElement( 'a' );
                a.setAttribute( "download", options.fileName + "." + options.fileType );
                a.setAttribute( "href", data );
                a.appendChild( img );

                var w = open();
                w.document.title = options.windowTitle ? options.windowTitle : "Exported image";
                w.document.body.appendChild( a );
            }
        } );
    }

    /**
     * This method copy some wanted styles from one div to another one
     * @param @mandatory sourceDiv : the source div
     * @param @mandatory targetDivId : the target div to copy the styles
     * @param listStyleToGet : array of wanted styles
     */
    function copySelectedCss( sourceDiv, targetDiv, listStyleToGet )
    {
        var sourceChildren = sourceDiv.children();
        $.each( targetDiv.children(), function( i, d )
        {
            var styles = $( sourceChildren[i] ).getStyleObject( listStyleToGet );
            if( styles )
                $( d ).css( styles );
            copySelectedCss( $( sourceChildren[i] ), $( d ), listStyleToGet );
        } );
    }


//    function eventFire(el, etype){
//        if (el.fireEvent) {
//            (el.fireEvent('on' + etype));
//        } else {
//            var evObj = document.createEvent('Events');
//            evObj.initEvent(etype, true, false);
//            el.dispatchEvent(evObj);
//        }
//    }


    //http://stackoverflow.com/questions/754607/can-jquery-get-all-css-styles-associated-with-an-element
    /*
     * getStyleObject Plugin for jQuery JavaScript Library
     * From: http://upshots.org/?p=112
     */
    $.fn.getStyleObject = function( listStyleToGet )
    {
        var dom = this.get( 0 );
        if( !dom )
            return;

        var style;
        var returns = {};
        if( window.getComputedStyle )
        {
            var camelize = function( a, b )
            {
                return b.toUpperCase();
            };
            style = window.getComputedStyle( dom, null );
            for( var i = 0, l = style.length; i < l; i++ )
            {
                var prop = style[i];
                if( !listStyleToGet || listStyleToGet.indexOf( prop ) != -1 )
                {
                    var camel = prop.replace( /\-([a-z])/g, camelize );
                    returns[camel] = style.getPropertyValue( prop );
                }
            }
            return returns;
        }

        if( style = dom.currentStyle )
        {
            for( var prop in style )
                returns[prop] = style[prop];

            return returns;
        }

        return this.css();
    }
})( jQuery );
