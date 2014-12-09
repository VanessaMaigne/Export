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
    $.fn.extend( {
        exportAll: function( options )
        {
            var defaults = {
                consoleLog:'true'
            };

            options = $.extend( defaults, options );
            element = this;

            // Copy styles from source to export
//            if( options.sourceDivId )
//                copySelectedCss( $( "#" + options.sourceDivId ), element, options.listStyleToGet );

//            if( options.callbackBeforeCanvg )
//                options.callbackBeforeCanvg.name( options.callbackBeforeCanvg.arguments );

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
                var callbackAfterConvert = (i == imageToConvert.size()) ? html2CanvasLaunch : false;
                convertImgToCanvas( options.sourceDivId, d.id, callbackAfterConvert );
            } );
        }
    } );

    function html2CanvasLaunch()
    {
        html2canvas( $( element ), {
//                useCORS: true,
            onrendered: function( canvas )
            {

                if( options.callbackOnRendered )
                    options.callbackOnRendered.name( options.callbackOnRendered.arguments );

//                    var img = canvas.toDataURL("image/png");
//                    $( options.aElement ).attr( "href", img );
//                    if($( options.aElement ).attr( "download") != undefined)
//                        return;
//                    $( options.aElement ).attr( "download", "test.png");
//                    $( options.aElement ).removeAttr( "href");
//                    $( options.aElement ).removeAttr("download");

//                    eventFire( a, "click");

                var data = canvas.toDataURL( "image/" + options.fileType );

                var img = document.createElement( 'img' );
                img.src = data;
                img.title = 'Click on the image to save it';

                // download doesn't work with Safari, IE or Opera.
                // http://caniuse.com/download
//                    var a = document.createElement( 'a' );
//                    a.setAttribute( "download", options.fileName + "." + options.fileType );
//                    a.setAttribute( "href", data );
//                    a.appendChild( img );

                document.body.appendChild( img );
//                    var w = open();
//                    w.document.title = options.windowTitle ? options.windowTitle : "Exported image";
//                    w.document.body.appendChild( a );
//                    w.document.body.appendChild( img );
            }
        } );
    }

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
            console.log( "fin" );
            if( callbackAfterConvert )
                callbackAfterConvert();
        };
        console.log( "fin2" );
    }


//    // get Canvas Element
//    var myCanvas = document.getElementById( 'canvasid' );
//    // get 2D context
//    var myCanvasContext = myCanvas.getContext( '2d' );
//    // Load up our image.
//    var source = new Image();
//    source.src = 'Home-web-icon.svg';
//    // Render our SVG image to the canvas once it loads.
//    source.onload = function()
//    {
//        myCanvasContext.drawImage( source, 0, 0, 200, 200 );
//    };


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
})( jQuery );