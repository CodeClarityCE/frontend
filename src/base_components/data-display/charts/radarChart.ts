import * as d3 from 'd3';
/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/// mthh - 2017 /////////////////////////////////////////
// Inspired by the code of alangrafu and Nadieh Bremer //
// (VisualCinnamon.com) and modified for d3 v4 //////////
/////////////////////////////////////////////////////////

const max = Math.max;
const sin = Math.sin;
const cos = Math.cos;
const HALF_PI = Math.PI / 2;

export type RadarChartData = {
    name: string;
    axes: Axis[];
}[];

interface Axis {
    axis: string;
    value: number;
    id?: string;
}

export interface RadarChartOptions {
    w: number;
    h: number;
    margin: { top: number; right: number; bottom: number; left: number };
    levels: number;
    maxValue: number;
    labelFactor: number;
    wrapWidth: number;
    opacityArea: number;
    dotRadius: number;
    opacityCircles: number;
    strokeWidth: number;
    roundStrokes: boolean;
    color: d3.ScaleOrdinal<string, string>;
    format: string;
    unit: string;
    legend: boolean | { title?: string; translateX: number; translateY: number };
}

export const RadarChart = function RadarChart(
    parent_selector: string,
    data: RadarChartData,
    cfg: RadarChartOptions
): d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> {
    const wrap = (
        text: d3.Selection<SVGTextElement, string, SVGGElement, unknown>,
        width: number
    ): void => {
        text.each(function (this: SVGTextElement): void {
            const text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                lineHeight = 1.4, // ems
                y = text.attr('y'),
                x = text.attr('x'),
                dy = parseFloat(text.attr('dy'));

            let word,
                lineNumber = 0,
                line: string[] = [],
                tspan = text
                    .text(null)
                    .append('tspan')
                    .attr('x', x)
                    .attr('y', y)
                    .attr('dy', `${dy}em`);

            while ((word = words.pop())) {
                line.push(word);
                tspan.text(line.join(' '));
                const computedTextLength = tspan.node()?.getComputedTextLength() ?? 0;
                if (computedTextLength > width) {
                    line.pop();
                    tspan.text(line.join(' '));
                    line = [word];
                    tspan = text
                        .append('tspan')
                        .attr('x', x)
                        .attr('y', y)
                        .attr('dy', `${++lineNumber * lineHeight + dy}em`)
                        .text(word);
                }
            }
        });
    }; //wrap

    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    // var maxValue = max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
    let maxValue = 0;
    for (const dataItem of data) {
        if (!dataItem?.axes) continue;
        for (const axis of dataItem.axes) {
            if (axis) {
                axis.id = dataItem.name ?? '';
                if ((axis.value ?? 0) > maxValue) {
                    maxValue = axis.value ?? 0;
                }
            }
        }
    }
    maxValue = max(cfg.maxValue, maxValue);

    const allAxis = (data[0]?.axes ?? []).map((i) => i.axis), //Names of each axis
        total = allAxis.length, //The number of different axes
        radius = Math.min(cfg.w / 2, cfg.h / 2), //Radius of the outermost circle
        Format = d3.format(cfg.format), //Formatting
        angleSlice = (Math.PI * 2) / total; //The width in radians of each "slice"

    //Scale for the radius
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, maxValue]);

    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////
    const parent = d3.select(parent_selector);

    //Remove whatever chart with the same id/class was present before
    parent.select('svg').remove();

    //Initiate the radar chart SVG
    const svg = parent
        .append('svg')
        .attr('width', cfg.w + cfg.margin.left + cfg.margin.right)
        .attr('height', cfg.h + cfg.margin.top + cfg.margin.bottom)
        .attr('viewBox', [
            0,
            0,
            cfg.w + cfg.margin.left + cfg.margin.right,
            cfg.h + cfg.margin.top + cfg.margin.bottom
        ])
        .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')
        .attr('class', 'radar');

    //Append a g element
    const g = svg
        .append('g')
        .attr(
            'transform',
            `translate(${cfg.w / 2 + cfg.margin.left},${cfg.h / 2 + cfg.margin.top})`
        );

    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////

    //Wrapper for the grid & axes
    const axisGrid = g.append('g').attr('class', 'axisWrapper');

    //Draw the background circles
    axisGrid
        .selectAll('.levels')
        .data(d3.range(1, cfg.levels + 1).reverse())
        .enter()
        .append('circle')
        .attr('class', 'gridCircle')
        .attr('r', (d) => (radius / cfg.levels) * d)
        .style('fill', '#CDCDCD')
        .style('stroke', '#CDCDCD')
        .style('fill-opacity', cfg.opacityCircles);

    //Text indicating at what % each level is
    axisGrid
        .selectAll('.axisLabel')
        .data(d3.range(1, cfg.levels + 1).reverse())
        .enter()
        .append('text')
        .attr('class', 'axisLabel')
        .attr('x', 4)
        .attr('y', (d) => (-d * radius) / cfg.levels)
        .attr('dy', '0.5em')
        .style('font-size', '1em')
        .attr('fill', '#737373')
        .text((d) => Format((maxValue * d) / cfg.levels) + cfg.unit);

    /////////////////////////////////////////////////////////
    //////////////////// Draw the axes //////////////////////
    /////////////////////////////////////////////////////////

    //Create the straight lines radiating outward from the center
    const axis = axisGrid
        .selectAll('.axis')
        .data(allAxis)
        .enter()
        .append('g')
        .attr('class', 'axis');
    //Append the lines
    axis.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', (_d, i) => rScale(maxValue * 1.1) * cos(angleSlice * i - HALF_PI))
        .attr('y2', (_d, i) => rScale(maxValue * 1.1) * sin(angleSlice * i - HALF_PI))
        .attr('class', 'line')
        .style('stroke', 'white')
        .style('stroke-width', '2px');

    //Append the labels at each axis
    axis.append('text')
        .attr('class', 'legend')
        .style('font-size', '1em')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('x', (_d, i) => rScale(maxValue * cfg.labelFactor) * cos(angleSlice * i - HALF_PI))
        .attr('y', (_d, i) => rScale(maxValue * cfg.labelFactor) * sin(angleSlice * i - HALF_PI))
        .text((d) => d)
        .call(wrap, cfg.wrapWidth);

    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////

    //The radial line function
    const radarLine = d3
        .lineRadial<Axis>()
        .curve(d3.curveLinearClosed)
        .radius((d) => rScale(d.value))
        .angle((_d, i) => i * angleSlice);

    if (cfg.roundStrokes) {
        radarLine.curve(d3.curveCardinalClosed);
    }

    //Create a wrapper for the blobs
    const blobWrapper = g
        .selectAll('.radarWrapper')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'radarWrapper');

    //Append the backgrounds
    blobWrapper
        .append('path')
        .attr('class', 'radarArea')
        .attr('d', (d) => radarLine(d.axes))
        .style('fill', (_d, i) => cfg.color(i.toString()))
        .style('fill-opacity', cfg.opacityArea)
        .on('mouseover', function (this: SVGPathElement): void {
            //Dim all blobs
            parent.selectAll('.radarArea').transition().duration(200).style('fill-opacity', 0.1);
            //Bring back the hovered over blob
            d3.select(this).transition().duration(200).style('fill-opacity', 0.7);
        })
        .on('mouseout', () => {
            //Bring back all blobs
            parent
                .selectAll('.radarArea')
                .transition()
                .duration(200)
                .style('fill-opacity', cfg.opacityArea);
        });

    //Create the outlines
    blobWrapper
        .append('path')
        .attr('class', 'radarStroke')
        .attr('d', function (d): string | null {
            return radarLine(d.axes);
        })
        .style('stroke-width', `${cfg.strokeWidth}px`)
        .style('stroke', (_d, i) => cfg.color(i.toString()))
        .style('fill', 'none');

    //Append the circles
    blobWrapper
        .selectAll('.radarCircle')
        .data((d) => d.axes)
        .enter()
        .append('circle')
        .attr('class', 'radarCircle')
        .attr('r', cfg.dotRadius)
        .attr('cx', (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
        .attr('cy', (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
        .style('fill', () => cfg.color('0'));

    /////////////////////////////////////////////////////////
    //////// Append invisible circles for tooltip ///////////
    /////////////////////////////////////////////////////////

    //Wrapper for the invisible circles on top
    const blobCircleWrapper = g
        .selectAll('.radarCircleWrapper')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'radarCircleWrapper');

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function (this: SVGCircleElement): void {
        tooltip.style('opacity', 1);
    };
    const mousemove = function (this: SVGCircleElement, event: MouseEvent, d: Axis): void {
        tooltip
            .html(Format(d.value) + cfg.unit)
            .style('left', `${event.x}px`)
            .style('top', `${event.y - 18 * 2}px`);
    };
    const mouseleave = function (this: SVGCircleElement): void {
        tooltip.style('opacity', 0);
    };
    //Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper
        .selectAll('.radarInvisibleCircle')
        .data((d) => d.axes)
        .enter()
        .append('circle')
        .attr('class', 'radarInvisibleCircle')
        .attr('r', cfg.dotRadius * 1.5)
        .attr('cx', (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
        .attr('cy', (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave);

    const tooltip = d3
        .select('.radarChart')
        .append('div')
        .style('opacity', 0)
        .style('position', 'fixed')
        .attr('class', 'tooltip')
        .style('font-size', '18px');

    if (cfg.legend !== false && typeof cfg.legend === 'object') {
        const legendZone = svg.append('g');
        const names = data.map((el) => el.name);
        // if (cfg.legend.title) {
        //     legendZone
        //         .append('text')
        //         .attr('class', 'title')
        //         .attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY})`)
        //         .attr('x', cfg.w - 150)
        //         .attr('y', 0)
        //         .attr('font-size', '1.5em')
        //         .attr('fill', '#404040')
        //         .text(cfg.legend.title);
        // }
        const legend = legendZone
            .append('g')
            .attr('class', 'legend')
            .attr('height', 100)
            .attr('width', 200)
            .attr('transform', `translate(${cfg.legend.translateX},${cfg.legend.translateY + 20})`);
        // Create rectangles markers
        legend
            .selectAll('circle')
            .data(names)
            .enter()
            .append('circle')
            .attr('cx', cfg.w - 160)
            .attr('cy', (_d, i) => i * 25 + 18)
            .attr('r', 7)
            .style('fill', (_d, i) => cfg.color(i.toString()));
        // Create labels
        legend
            .selectAll('text')
            .data(names)
            .enter()
            .append('text')
            .attr('x', cfg.w - 145)
            .attr('y', (_d, i) => i * 25 + 24)
            .attr('font-size', '1.2em')
            .text((d) => d);
    }
    return svg;
};
