export = function()
{
    var barChartWithBoxPlot = {
        version: "1.0"
    };

    /**
     * d3.js
     * http://tenxer.github.io/xcharts/examples/
     */
    function addOrRemoveToRegionBarChart( dynamicAreaDiv, fluxName )
    {
        this.displayedVariables = this.displayedVariables ? this.displayedVariables : [];
        var isAlreadyAChart = (0 <= getIndexInArray( this.displayedVariables, "name", fluxName ));
        isAlreadyAChart ? $( dynamicAreaDiv ).removeClass( "selected" ) : $( dynamicAreaDiv ).addClass( "selected" );
        if( isAlreadyAChart )
            this.removeToRegionBarChart( fluxName );
        else
            this.createOrAddToBarChart( fluxName );
    }

    /**
     * This method create and/or add flux's bars in the regions bar chart
     * http://bl.ocks.org/mbostock/3887051
     * http://bl.ocks.org/gencay/4629518
     * http://cmaurer.github.io/angularjs-nvd3-directives/multi.bar.chart.html
     * @param fluxValue
     */
    function createOrAddToBarChart( fluxValue )
    {
        if( 0 >= $( "#regionBarChart div svg" ).length )
        {
            var regionBarChartHeight = this.barChartHeight - this.barCharMargin.top - this.barCharMargin.bottom;

            this.regionBarChartForMainFlux = this.createRegionBarChart( "#regionBarChartForMainFlux", $( "#regionBarChartForMainFlux" ).width() - this.barCharMargin.left, regionBarChartHeight, false, true );
            this.regionBarChartForSeparatedFlux = this.createRegionBarChart( "#regionBarChartForSeparatedFlux", $( "#regionBarChartForSeparatedFlux" ).width() - this.barCharMargin.left, regionBarChartHeight, true, false );
        }
        this.displayedVariables.push( {name : fluxValue, color: false} );
        this.updateDisplayedVariablesAndRegionBarCharts( fluxValue );
        this.updateToolTipsForCharts();
    }

    /**
     * This method create the svg container for the regions bar chart
     * @param containerId
     * @param width
     * @param height
     */
    function createRegionBarChart( containerId, width, height, useRightYAxis, isForMainFlux )
    {
        var regionsNames = new Array();
        $.each( this.regionsKeys, function( i, d )
        {
            isForMainFlux ? regionsNames.push( (i + 1) + "." + d ) : regionsNames.push( i + 1 );
        } );
        var regionBarChartx0 = d3.scale.ordinal().rangeRoundBands( [0, width], 0.1 ).domain( this.regionsKeys );
        var regionBarChartx1 = d3.scale.ordinal();
        var regionBarCharty = d3.scale.linear().range( [height, 0] );

        // Axes
        var regionBarChartxAxis = d3.svg.axis().scale( regionBarChartx0 );
        var regionBarChartyAxis = d3.svg.axis()
                .scale( regionBarCharty )
                .orient( useRightYAxis ? "right" : "left" )
                .tickFormat( d3.format( ".2s" ) )
                .tickSize( -width, 0 );

        $( containerId ).addClass( "dc-chart" );
        // BarChart
        var regionBarChartsvg = d3.select( containerId ).append( "svg" )
                .attr( "width", width + this.barCharMargin.left + this.barCharMargin.right )
                .attr( "height", height + this.barCharMargin.top + this.barCharMargin.bottom )
                .append( "g" )
                .attr( "transform", "translate(" + (useRightYAxis ? 0 : this.barCharMargin.left) + "," + this.barCharMargin.top + ")" );

        var regionBarChartsvgG = regionBarChartsvg.append( "g" )
                .attr( "class", "y axis" );
        if( useRightYAxis )
            regionBarChartsvgG.attr( "transform", "translate(" + width + ",0)" );

        regionBarChartsvgG.append( "text" )
                .attr( "transform", "rotate(-90)" )
                .attr( "y", 6 )
                .attr( "dy", ".7em" )
                .style( "text-anchor", "end" )
                .text( "" );

        regionBarChartsvg.append( "g" )
                .attr( "class", "x axis" )
                .attr( "transform", "translate(0," + height + ")" );

        // xAxis
        regionBarChartsvg.select( '.x.axis' ).call( regionBarChartxAxis );

        var regionBarChartObject = new Object();
        regionBarChartObject.width = width;
        regionBarChartObject.x0 = regionBarChartx0;
        regionBarChartObject.x1 = regionBarChartx1;
        regionBarChartObject.y = regionBarCharty;
        regionBarChartObject.xAxis = regionBarChartxAxis;
        regionBarChartObject.yAxis = regionBarChartyAxis;
        regionBarChartObject.svg = regionBarChartsvg;
        regionBarChartObject.useRightYAxis = useRightYAxis;
        regionBarChartObject.isForMainFlux = isForMainFlux;

        this.updateRegionBarChartAxes( regionBarChartObject );
        return regionBarChartObject;
    }

    function setColumnDetailsAndTotals( transposedData )
    {
        transposedData.forEach( jQuery.proxy( function( d )
        {
            var index = 0;
            d.columnDetails = this.displayedVariables.map( jQuery.proxy( function( element, i )
            {
                if( d[element.name] )
                {
                    var result = {name: element.name, column: index.toString(), yBegin: (0 > d[element.name].value ? d[element.name].value : 0), yEnd: (0 < d[element.name].value ? d[element.name].value : 0), uncertainty: d[element.name].uncertainty, color:false, region:d.Name};
                    index++;
                    return result;
                }
            }, this ) );

            d.columnDetails = d.columnDetails.filter( function( n )
            {
                return n != undefined
            } );

            d.negativeTotal = d3.min( d.columnDetails, jQuery.proxy( function( d )
            {
                if( this.displayUncertainty && d.uncertainty && !isNaN( parseFloat( d.uncertainty ) ) )
                    return d ? parseFloat( d.yBegin ) + parseFloat( d.uncertainty ) : 0;
                else
                    return d ? parseFloat( d.yBegin ) : 0;
            }, this ) );

            d.positiveTotal = d3.max( d.columnDetails, jQuery.proxy( function( d )
            {
                if( this.displayUncertainty && d.uncertainty && !isNaN( parseFloat( d.uncertainty ) ) )
                    return d ? parseFloat( d.yEnd ) + parseFloat( d.uncertainty ) : 0;
                else
                    return d ? parseFloat( d.yEnd ) : 0;
            }, this ) );
        }, this ) );
    }

    /**
     * This method update the actual bar chart after an add or a remove of a flux value
     */
    function updateDisplayedVariablesAndRegionBarCharts( fluxValue )
    {
        // Create details for each column
        this.setColumnDetailsAndTotals( this.transposedDataForMainFlux );
        this.setColumnDetailsAndTotals( this.transposedDataForSeparatedFlux );
        this.regionBarChartForMainFlux.transposedData = this.transposedDataForMainFlux;
        this.regionBarChartForSeparatedFlux.transposedData = this.transposedDataForSeparatedFlux;

//        if( 0 == this.regionBarChartForSeparatedFlux.transposedData[0].columnDetails.length )
//            this.changeSvgWidth(this.regionBarChartForSeparatedFlux,"#regionBarChartForSeparatedFlux svg",0, this.regionBarChartForMainFlux, "#regionBarChartForMainFlux svg", this.barChartWidth);
//        else if( 0 == this.regionBarChartForMainFlux.transposedData[0].columnDetails.length )
//            this.changeSvgWidth(this.regionBarChartForMainFlux, "#regionBarChartForMainFlux svg",0, this.regionBarChartForSeparatedFlux, "#regionBarChartForSeparatedFlux svg", this.barChartWidth);
//        else if( -1 != this.mainFlux.indexOf( fluxValue ) )
//            this.changeSvgWidth(this.regionBarChartForSeparatedFlux,"#regionBarChartForSeparatedFlux svg",$("#regionBarChartForSeparatedFlux").width(), this.regionBarChartForMainFlux, "#regionBarChartForMainFlux svg", $("#regionBarChartForMainFlux").width());
//        else
//            this.changeSvgWidth(this.regionBarChartForMainFlux,"#regionBarChartForMainFlux svg",$("#regionBarChartForMainFlux").width(), this.regionBarChartForSeparatedFlux, "#regionBarChartForSeparatedFlux svg", $("#regionBarChartForSeparatedFlux").width());

        // Update region barcharts
        if( -1 != this.mainFlux.indexOf( fluxValue ) )
            this.updateRegionBarChart( this.regionBarChartForMainFlux );
        else if( -1 != this.separatedFlux.indexOf( fluxValue ) )
            this.updateRegionBarChart( this.regionBarChartForSeparatedFlux );
        else
        {
            this.updateRegionBarChart( this.regionBarChartForMainFlux );
            this.updateRegionBarChart( this.regionBarChartForSeparatedFlux );
        }
    }

//    changeSvgWidth: function(regionBarChartObject1, svg1, width1, regionBarChartObject2, svg2, width2)
//    {
//        console.log(svg1+", "+width1+" !! "+svg2+", "+width2);
//        d3.select( svg1 )
//            .transition()
//            .duration( 1000 )
//            .ease( "linear" )
//            .attr( "width", width1 )
//            .each("end", jQuery.proxy(function()
//        {
//            d3.select(svg2)
//                .transition()
//                .duration( 1000 )
//                .ease( "linear" )
//                .attr( "width", width2 + this.barCharMargin.left + this.barCharMargin.right );
//
//            this.changeSvgContent(regionBarChartObject1, width1);
//            this.changeSvgContent(regionBarChartObject2, width2);
//        }, this));
//    },

//    changeSvgContent: function(regionBarChartObject, width)
//    {
//        width -= this.barCharMargin.left;
//        regionBarChartObject.width = width;
//        regionBarChartObject.x0 = d3.scale.ordinal().rangeRoundBands( [0, width], 0.1 ).domain( this.regionsKeys );
//        regionBarChartObject.yAxis.tickSize( -width, 0 );
//        regionBarChartObject.xAxis.scale( regionBarChartObject.x0 );
//        regionBarChartObject.svg.select( '.x.axis' )
//            .transition()
//            .duration( 1000 )
//            .ease( "linear" )
//            .call( regionBarChartObject.xAxis );
//        this.updateRegionBarChart(regionBarChartObject );
//    },

    function updateRegionBarChart( regionBarChart )
    {
        this.updateRegionBarChartDomains( regionBarChart );
        this.updateRegionBarChartAxes( regionBarChart );
        this.updateRegionBarChartBar( regionBarChart );
        this.updateRegionBarChartUncertainty( regionBarChart );
        this.updateRegionBarChartLegend( regionBarChart );
    }

    function updateRegionBarChartDomains( regionBarChartObject )
    {
        regionBarChartObject.y.domain( [d3.min( regionBarChartObject.transposedData, function( d )
        {
            return d.negativeTotal;
        } ), d3.max( regionBarChartObject.transposedData, function( d )
        {
            return d.positiveTotal;
        } )] );
        var displayedVariablesByBarChart = new Array();
        $.each( this.displayedVariables, jQuery.proxy( function( i, d )
        {
            if( (regionBarChartObject.isForMainFlux && (-1 != this.mainFlux.indexOf( d.name ) ))
                    || (!regionBarChartObject.isForMainFlux && (-1 != this.separatedFlux.indexOf( d.name ) )) )
                displayedVariablesByBarChart.push( d );
        }, this ) );

        regionBarChartObject.x1.domain( d3.keys( displayedVariablesByBarChart ) ).rangeRoundBands( [0, regionBarChartObject.x0.rangeBand()] );
    }

    function updateRegionBarChartAxes( regionBarChartObject )
    {
        // Update yAxis
        regionBarChartObject.svg
                .select( '.y.axis' )
                .call( regionBarChartObject.yAxis )
                .selectAll( 'line' )
                .filter( function( d )
        {
            return !d
        } )
                .classed( 'zero', true );

        // Rotate the x Axis labels
        if( !regionBarChartObject.useRightYAxis )
            regionBarChartObject.svg.selectAll( "g.x g text" )
                    .style( "text-anchor", "end" )
                    .attr( "transform", "translate(-10,0)rotate(315)" )
                    .text( function( d, i )
            {
                return (i + 1) + "." + d.replace( "North", "Nth" ).replace( "SouthEast", "SE" ).replace( "South", "Sth" );
            } );
        else
            regionBarChartObject.svg.selectAll( "g.x g text" )
                    .text( function( d, i )
            {
                return i + 1;
            } );
    }

    function updateRegionBarChartLegend( regionBarChartObject )
    {
        var legend = regionBarChartObject.svg.selectAll( ".legend" )
                .data( jQuery.proxy( function()
        {
            this.displayedVariables.slice();
            var result = new Array();
            $.each( this.displayedVariables, jQuery.proxy( function( i, d )
            {
                if( (regionBarChartObject.isForMainFlux && (-1 != this.mainFlux.indexOf( d.name ) ))
                        || (!regionBarChartObject.isForMainFlux && (-1 != this.separatedFlux.indexOf( d.name ) )) )
                    result.push( d );
            }, this ) );
            return result;
        }, this ) );

        var legendsEnter = legend.enter().append( "g" )
                .attr( "class", "legend" );

        legendsEnter.append( "rect" )
                .attr( "id", function( d, i )
        {
            return "regionBarChartSvg_legendRect_" + i;
        } )
                .attr( "x", regionBarChartObject.width - 18 )
                .attr( "width", 10 )
                .attr( "height", 10 );

        legendsEnter.append( "text" )
                .attr( "x", regionBarChartObject.width - 24 )
                .attr( "y", 9 )
                .attr( "dy", 0 )
                .style( "text-anchor", "end" );
        legend.exit().remove();

        // When remove bar
        legend.select( "text" )
                .text( jQuery.proxy( function( d )
        {
            var propertyName = this.getI18nPropertiesKeyFromValue( d.name );
            return (0 != jQuery.i18n.prop( propertyName + "_shortForAxis" ).indexOf( "[" )
                    && -1 != jQuery.i18n.prop( "separatedFlux" ).indexOf( d.name )) ? jQuery.i18n.prop( propertyName + "_shortForAxis" ) : d.name;
        }, this ) );

        legend.select( "rect" )
                .style( "fill", jQuery.proxy( function( d )
        {
            if( !d.color )
                d.color = this.color( d.name );
            return d.color;
        }, this ) )
                .style( "stroke", "#2C3537" )
                .attr( "x", regionBarChartObject.width - 18 )
                .on( "click", jQuery.proxy( function( d )
        {
            this.onClickRegionBarChart( d );
        }, this ) );

        legend.select( "text" ).transition().duration( 1000 ).ease( "linear" )
                .attr( "x", regionBarChartObject.width - 24 );

        legend.attr( "transform",
                jQuery.proxy( function( d, i )
                {
                    var zeroLineTranslateValue = d3.select( "#regionBarChartForSeparatedFlux g.y.axis g line.zero" )[0][0];
                    if( !regionBarChartObject.isForMainFlux && zeroLineTranslateValue && zeroLineTranslateValue.parentNode.attributes.transform.value && -1 != zeroLineTranslateValue.parentNode.attributes.transform.value.indexOf( "0,0" ) )
                        return "translate(0," + (this.barChartHeight - this.barCharMargin.bottom - this.barCharMargin.top * 3 + i * 15) + ")";
                    else
                        return "translate(0," + i * 15 + ")";
                }, this ) );
    }

    function updateRegionBarChartBar( regionBarChartObject )
    {
        var regionBar = regionBarChartObject.svg.selectAll( ".groupedBar" )
                .data( regionBarChartObject.transposedData );

        var regionBarEnter = regionBar.enter().append( "g" )
                .attr( "class", "groupedBar" )
                .attr( "transform", jQuery.proxy( function( d )
        {
            return "translate(" + regionBarChartObject.x0( d[this.fluxColName] ) + ",0)";
        }, this ) );

        var regionBarRect = regionBar.selectAll( "rect" )
                .data( jQuery.proxy( function( d )
        {
            return d.columnDetails;
        }, this ) );

        regionBarRect.enter().append( "rect" )
                .on( "click", jQuery.proxy( function( d )
        {
            this.onClickRegionBarChart( d );
        }, this ) );

        regionBarRect.exit().remove();

        regionBar.transition()
                .duration( 500 )
                .ease( "linear" )
                .selectAll( "rect" )
                .attr( "width", regionBarChartObject.x1.rangeBand() )
                .attr( "x", jQuery.proxy( function( d )
        {
            return regionBarChartObject.x1( d.column );
        }, this ) )
                .attr( "y", jQuery.proxy( function( d )
        {
            return regionBarChartObject.y( d.yEnd );
        }, this ) )
                .attr( "height", jQuery.proxy( function( d )
        {
            return regionBarChartObject.y( d.yBegin ) - regionBarChartObject.y( d.yEnd );
        }, this ) )
                .style( "fill", jQuery.proxy( function( d )
        {
            if( !d.color )
                d.color = this.color( d.name );
            return d.color;
        }, this ) );
    }

    function updateRegionBarChartUncertainty( regionBarChartObject )
    {
        var regionBar = regionBarChartObject.svg.selectAll( ".groupedBar" )
                .data( regionBarChartObject.transposedData );

        var regionBarPath = regionBar.selectAll( "path" )
                .data( jQuery.proxy( function( d )
        {
            return d.columnDetails;
        }, this ) );

        regionBarPath.enter().append( "path" );
        regionBarPath.exit().remove();

        regionBar.transition()
                .duration( 500 )
                .ease( "linear" )
                .selectAll( "path" )
                .attr( "d", jQuery.proxy( function( d )
        {
            var xCenter = regionBarChartObject.x1( d.column ) + regionBarChartObject.x1.rangeBand() / 2;
            var lineWidth = regionBarChartObject.x1.rangeBand() / 5;
            var yTop = regionBarChartObject.y( parseFloat( d.yEnd ) + parseFloat( d.uncertainty ) );
            var yBottom = regionBarChartObject.y( parseFloat( d.yEnd ) - parseFloat( d.uncertainty ) );
            if( 0 > d.yBegin )
            {
                yTop = regionBarChartObject.y( parseFloat( d.yBegin ) + parseFloat( d.uncertainty ) );
                yBottom = regionBarChartObject.y( parseFloat( d.yBegin ) - parseFloat( d.uncertainty ) );
            }

            if( this.displayUncertainty && d.uncertainty )
                return "M" + (xCenter - lineWidth) + "," + yBottom + "L" + (xCenter + lineWidth) + "," + yBottom + "M" + xCenter + "," + yBottom +
                        "L" + xCenter + "," + yTop + "M" + (xCenter - lineWidth) + "," + yTop + "L" + (xCenter + lineWidth) + "," + yTop;
            else
                return false;
        }, this ) )
                .attr( "stroke", jQuery.proxy( function( d )
        {
            if( !d.color )
                d.color = this.color( d.name );
            return ColorLuminance( d.color, -0.3 );
        }, this ) )
                .attr( "stroke-width", jQuery.proxy( function( d )
        {
            if( -1 != this.separatedFlux.indexOf( d.name ) || (-1 != this.mainFlux.indexOf( d.name ) && 4 > this.regionBarChartForMainFlux.transposedData[0].columnDetails.length) )
                return "2";
            else return "1";
        }, this ) );
    }

    function onClickRegionBarChart( element )
    {
        var dynamicAreaDivId = this.getI18nPropertiesKeyFromValue( element.name );
        $( "#" + dynamicAreaDivId ).removeClass( "selected" );
        this.removeToRegionBarChart( element.name );
        this.fluxBarChartForMainFlux.onClick( {key: element.name} );
        this.fluxBarChartForSeparatedFlux.onClick( {key: element.name} );
    }

    function removeToRegionBarChart( fluxName )
    {
        var index = getIndexInArray( this.displayedVariables, "name", fluxName );
        if( 0 > index )
            return;
        this.displayedVariables.splice( index, 1 );
        this.updateDisplayedVariablesAndRegionBarCharts( fluxName );
    }

};


<!-- ********** EXPORT ALL ************ -->
function exportAll( exportDivId, fileType )
{
    $( "#" + exportDivId ).empty();
    $( "#sourceWrapper" ).fadeOut( 1000 );

    $( "#" + exportDivId ).append( $( "#sourceWrapper #pageWrapper" ).clone() );
    $( "#" + exportDivId + " #mapChartAndComment" ).width( $( "#" + exportDivId + " #mapChart" ).width() );

    // File name with date
    var exportDate = $.datepicker.formatDate( 'yy_mm_dd', new Date() );
    var fileName = "GCAExportImage_" + exportDate;

    // Export
    $( '#' + exportDivId ).exportAll( {
        sourceDivId:"sourceWrapper",
        callbackBeforeCanvg:{name: callbackForExportAllBeforeCanvg, arguments: exportDivId},
        callbackOnRendered: {name: callbackForExportAllOnRendered, arguments: exportDivId},
        fileName: fileName,
        fileType: fileType,
        windowTitle: i18n.t( "label.exportAllTitle" ),
        listStyleToGet:["fill", "stroke", "opacity", "fill-opacity", "shape-rendering", "stroke-opacity",
            "font", "font-size", "font-weight", "font-family", "color",
            "float", "height", "width"]
    } );
}

function callbackForExportAllBeforeCanvg( exportDivId )
{
    $( "#" + exportDivId + " .leftTools, #" + exportDivId + " .comment, #" + exportDivId + " #regionSelect, #" + exportDivId + " #resetFlux" ).remove();
    $( "#" + exportDivId + " #resetMap, #" + exportDivId + " #synthesis" ).remove();
    $( "#" + exportDivId + " #hiddenDiv, #" + exportDivId + " #dataDiv, #" + exportDivId + " .synthesisDiv" ).remove();

    // Add GCA logo
    $( "#" + exportDivId ).append( "<div class='exportLogo'><img src='img/GCA_logo_white.png' width='150px'></div>" );
}

function callbackForExportAllOnRendered( exportDivId )
{
    $( "#" + exportDivId ).empty();
    $( "#sourceWrapper" ).fadeIn();
}

<!-- ********** EXPORT SYNTHESIS ************ -->
function exportSynthesis( exportDivId, fileType )
{
    // File name with date
    var exportDate = $.datepicker.formatDate( 'yy_mm_dd', new Date() );
    var fileName = "GCAExportImage_" + exportDate;

    // Export
    $( '#' + exportDivId ).exportAll( {
        callbackBeforeCanvg:{name: callbackForExportSynthesisBeforeCanvg, arguments:true},
        callbackOnRendered: {name: callbackForExportSynthesisBeforeCanvg, arguments: false},
        fileName: fileName,
        fileType: fileType,
        windowTitle: i18n.t( "label.exportSynthesisTitle" )
    } );
}

function callbackForExportSynthesisBeforeCanvg( isToAdd )
{
    // Add GCA logo
    if( isToAdd )
    {
        var left = $( "#synthesisDivData" ).width() - 170;
        $( "#dynamicAreasForImageFluxForSynthesis" ).append( "<div class='exportLogo' style='margin-top:-10px; margin-left:" + left + "px;'><img src='img/GCA_logo.png' width='150px'></div>" );
    }
    else
        $( "#dynamicAreasForImageFluxForSynthesis .exportLogo" ).remove();
}
