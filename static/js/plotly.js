
// populates the dropdown menu items 
function populateMenu(){
    var url = "/names";
    Plotly.d3.json(url, function(error, response) {
        if (error) return console.warn(error);
        for (var i=0; i<response.length; i++) {
            var sampleMenu = d3.select('#samples')
                .append("option:option")
                .attr("value", response[i])
                .text(response[i])
            }
    });
};

// sample ID is used to retrieve the weekly washing frequency from the  /wfreq/<sample> route. 

function meterChart(sample){
  url = "/wfreq/".concat(sample);
  var level = 0;
  Plotly.d3.json(url, function(error, response) {
        if (error) return console.warn(error);
        level = +response;
        // Contain the washing frequency to a number between 0 and 7 (over 7 treated as 7).
        level = level>7 ? 7 : level;
    // Trig to calc meter point
    var degrees = 180 - level*(180/7),
        radius = .5;
    var radians = degrees * Math.PI / 180;
    var x = radius * Math.cos(radians);
    var y = radius * Math.sin(radians);
    var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
         pathX = String(x),
        space = ' ',
        pathY = String(y),
        pathEnd = ' Z';
    var path = mainPath.concat(pathX,space,pathY,pathEnd);
    var data = [{ type: 'scatter',
        x: [0], y:[0],
        marker: {size: 14, color:'850000'},
        showlegend: false,
        name: 'frequency',
        text: level,
        hoverinfo: 'text+name'},
        { values: [7/6, 7/6, 7/6, 7/6, 7/6, 7/6, 7],
            rotation: 90,
            text: ['7+', '5-6', '4-5', '3-4',
                    '1-2', '0-1', ''],
            textinfo: 'text',
            textposition:'inside',      
            marker: {colors:['rgba(14, 127, 0, .5)', 'rgba(110, 154, 22, .5)',
                         'rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)',
                         'rgba(210, 206, 145, .5)', 'rgba(232, 226, 202, .5)',
                         'rgba(255, 255, 255, 0)']},
            labels: ['7+', '5-6', '4-5', '3-4', '2-3', '1-2', ''],
            hoverinfo: 'label',
            hole: .5,
            type: 'pie',
            showlegend: false
        }
    ];
    var layout = {
        shapes:[{
        type: 'path',
        path: path,
        fillcolor: '850000',
        line: {
            color: '850000'
        }
        }
    ],
    title: '<b>Washing Frequency</b> <br> Scrubs per week',
    height: 400,
    width: 400,
    xaxis: {zeroline:false, showticklabels:false,
             showgrid: false, range: [-1, 1]},
    yaxis: {zeroline:false, showticklabels:false,
             showgrid: false, range: [-1, 1]}
    };
    Plotly.newPlot('meter', data, layout);
  })
};

// create pie chart for data

function pieChart(sample){
    var values = [];
    var labels = [];
    var names = [];
    url = "/samples/".concat(sample);
    Plotly.d3.json(url, function(error, response) {
      if (error) return console.warn(error);
      for (var i=0; i<10; i++){
        values.push(+response[0].sample_values[i]);
        labels.push(+response[0].otu_ids[i]);
      };
      Plotly.d3.json('/otu', function(error, response) {
          if (error) return console.warn(error);
          for (var j=0; j<10; j++){
            names.push(response[labels[j]]);
          }
          data = [{values, labels, hovertext:names, type:'pie'}];
          var layout = { height: 400, width:400, title:'<b>Top 10 Residents of Belly Button</b>'};
          Plotly.newPlot("pie", data, layout);
        })
    })
};

// create the bubble chart

function bubbleChart(sample){
    var all_values = [];
    var all_ids = [];
    var names = [];
    url = "/samples/".concat(sample);
    Plotly.d3.json(url, function(error, response) {
      if (error) return console.warn(error);
      
      for (i=0; i<30; i++){
        all_values.push(response[0].sample_values[i]);
        all_ids.push(response[0].otu_ids[i]);
      }
      Plotly.d3.json('/otu', function(error, response) {
        if (error) return console.warn(error);
        for (var j=0; j<30; j++){
          names.push(response[all_ids[j]]);
        }
        var bubble_trace = {
            x: all_ids,
            y: all_values,
            hovertext: names,
            mode: 'markers',
            marker: {
                size: all_values
            }
        };
        var bubble_data = [bubble_trace];
        var bubble_layout = {
            title: '<b>Bubble Chart</b><br>Top 30 samples',
            height: 500,
            width: 1000
        };
        Plotly.newPlot("bubble", bubble_data, bubble_layout);   
      })
    })
};

//  populates sample metadata on the page.

function populateMetaData(sample){
    url = "/metadata/".concat(sample);
    Plotly.d3.json(url, function(error, response) {
        if (error) return console.warn(error);
        var age = response.AGE;
        var bbtype = response.BBTYPE;
        var gender = response.GENDER;
        var ethnicity = response.ETHNICITY;
        var location = response.LOCATION;
        var sampleid = sample;
        document.getElementById("metadata1").innerHTML = `AGE: ${age}`;
        document.getElementById("metadata2").innerHTML = `BBTYPE: ${bbtype}`;
        document.getElementById("metadata3").innerHTML = `GENDER: ${gender}`;
        document.getElementById("metadata4").innerHTML = `ETHNICITY: ${ethnicity}`;
        document.getElementById("metadata5").innerHTML = `LOCATION: ${location}`;
        document.getElementById("metadata6").innerHTML = `SAMPLEID: ${sampleid}`;
    });
}

// This will called everytime the user selects a new sample from the dropdown menu.

function optionChanged(sample){
    populateMetaData(sample);
    pieChart(sample);
    meterChart(sample);
    bubbleChart(sample);
};
//set the default sample BB_940.
populateMenu();
populateMetaData('BB_940');
pieChart('BB_940');
meterChart('BB_940');
bubbleChart('BB_940');