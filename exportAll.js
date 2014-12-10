/**
 * exportAll _ version 1.0
 * ##################################################
 *   Created by vmaigne@gmail.com _ august 2014
 * ##################################################
 * This library exports your HTML page content into PNG, JPG & GIF formats
 *
 * @mandatory aElement : DOM "a" element, used to launch the export
 * @optional sourceDivId : source div used to get the styles (sourceDiv and targetDiv MUST HAVE the same childrens)
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

    $.fn.extend( {
        exportAll: function( optionsArgument )
        {
            var defaults = {
                consoleLog:'true'
            };

            options = $.extend( defaults, optionsArgument );
            element = this;

            // Copy styles from source to export
            if( options.sourceDivId )
                copySelectedCss( $( "#" + options.sourceDivId ), element, options.listStyleToGet );

            if( options.callbackBeforeCanvg )
                options.callbackBeforeCanvg.name( options.callbackBeforeCanvg.arguments );

            // Transform all svg into canvas
            canvg( null, null, null, element[0].id );

            // Transform img with .svg file into canvas
            var imagesToConvert = $.map( $( "#" + options.sourceDivId + " img" ), function( d )
            {
                if( d.src.indexOf( ".svg" ) != -1 )
                    return d;
            } );

            $.each( imagesToConvert, function( i, d )
            {
                var callbackAfterConvert = (i == imagesToConvert.length - 1) ? html2CanvasLaunch : false;
                convertImgToCanvas( options.sourceDivId, d, callbackAfterConvert );
            } );
        }
    } );

    /**
     * This method launch the html2canvas function to create the final image with all transformed elements
     */
    function html2CanvasLaunch()
    {
        html2canvas( $( element ), {
//                useCORS: true,
            onrendered: function( canvas )
            {

                if( options.callbackOnRendered )
                    options.callbackOnRendered.name( options.callbackOnRendered.arguments );

                var data = canvas.toDataURL( "image/" + options.fileType );

                var img = document.createElement( 'img' );
                img.src = data;
                img.title = 'Click on the image to save it';

                // download doesn't work with Safari, IE or Opera.
                // http://caniuse.com/download
                var a = document.createElement( 'a' );
                a.setAttribute( "download", options.fileName + "." + options.fileType );
                a.setAttribute( "href", data );
                a.appendChild( img );

                document.body.appendChild( img );

//                var w = open();
//                w.document.title = options.windowTitle ? options.windowTitle : "Exported image";
//                w.document.body.appendChild( a );
            }
        } );
    }

    /**
     * This method convert an image into a canvas and launch the callback after the load of this image
     * @param containerExportId : div id of the image container
     * @param imageId : id of the image
     * @param callbackAfterConvert : function to launch at the end of the load of the last image
     */
    function convertImgToCanvas( containerExportId, imageId, callbackAfterConvert )
    {
        if( !imageId )
            return;

        var fullImageId = "#" + containerExportId + " #" + imageId;
        // create Canvas Element
        var myCanvas = document.createElement( "canvas" );
        var dt = new Date();
        var currentTime = dt.getFullYear() + "" + (dt.getMonth() + 1) + "" + dt.getDate() + "_" + dt.getHours() + "" + dt.getMinutes() + "" + dt.getSeconds();
        myCanvas.id = $( fullImageId ).attr( "id" ) + "_canvas_" + currentTime;
        myCanvas.width = $( fullImageId ).width();
        myCanvas.height = $( fullImageId ).height();
        $( fullImageId ).parent().append( myCanvas );

        // get 2D context
        var myCanvasContext = myCanvas.getContext( '2d' );
        // Load up our image.
        var source = new Image();
        source.src = $( fullImageId ).attr( "src" );
        // Render our SVG image to the canvas once it loads.
        source.onload = function()
        {
            myCanvasContext.drawImage( source, 0, 0, myCanvas.width, myCanvas.height );
            $( fullImageId ).remove();
            if( callbackAfterConvert )
                callbackAfterConvert();
        };
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
