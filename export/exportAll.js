/**
 * @mandatory aElement : DOM "a" element, used to launch the export
 * @optional sourceDivId : source div used to get the styles (sourceDiv and targetDiv MUST HAVE the same childrens)
 * @optional listStyleToGet : list of styles to keep in the export elements
 * @optional callbackBeforeCanvg : function to call before the transformation of all svg elements to canvas
 * @optional callbackOnRendered : function to call before the window.open
 * @optional windowTitle : title for the opened tab
 * @mandatory fileName
 * @mandatory fileType
 * http://jqueryfiledownload.apphb.com/
 * http://stackoverflow.com/questions/283956/is-there-any-way-to-specify-a-suggested-filename-when-using-data-uri
 */
(function($){
    $.fn.extend({
        exportAll: function(options) {
            var defaults = {
                consoleLog:'true'
            };

            options = $.extend(defaults, options);
            var element = this;

            // Copy styles from source to export
            if(options.sourceDivId)
                copySelectedCss($("#"+options.sourceDivId), element, options.listStyleToGet);

            if(options.callbackBeforeCanvg)
                options.callbackBeforeCanvg.name(options.callbackBeforeCanvg.arguments);

            // Transform all svg into canvas
            canvg(null, null, null, element[0].id);

            html2canvas($(element), {
                onrendered: function(canvas) {

                    if(options.callbackOnRendered)
                        options.callbackOnRendered.name(options.callbackOnRendered.arguments);

//                    var img = canvas.toDataURL("image/png");
//                    $( options.aElement ).attr( "href", img );
//                    if($( options.aElement ).attr( "download") != undefined)
//                        return;
//                    $( options.aElement ).attr( "download", "test.png");
//                    $( options.aElement ).removeAttr( "href");
//                    $( options.aElement ).removeAttr("download");

//                    eventFire( a, "click");


                    var data = canvas.toDataURL("image/"+options.fileType);

                    var img = document.createElement('img');
                    img.src = data;
                    img.title= 'Click on the image to save it';

                    // download doesn't work with Safari, IE or Opera.
                    // http://caniuse.com/download
                    var a = document.createElement('a');
                    a.setAttribute("download", options.fileName+"."+options.fileType);
                    a.setAttribute("href", data);
                    a.appendChild(img);

                    var w = open();
                    w.document.title = options.windowTitle ? options.windowTitle : "Exported image";
                    w.document.body.appendChild(a);
                }
            });
        }
    });

    /**
     * This method copy some wanted styles from one div to another one
     * @param @mandatory sourceDiv : the source div
     * @param @mandatory targetDivId : the target div to copy the styles
     * @param listStyleToGet : array of wanted styles
     */
    function copySelectedCss(sourceDiv, targetDiv, listStyleToGet)
    {
        var sourceChildren = sourceDiv.children();
        $.each(targetDiv.children(), function(i,d)
        {
            var styles = $(sourceChildren[i]).getStyleObject(listStyleToGet);
            if(styles)
                $(d).css(styles);
            copySelectedCss($(sourceChildren[i]), $(d), listStyleToGet);
        });
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
})(jQuery);