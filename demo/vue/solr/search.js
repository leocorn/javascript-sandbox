
/**
 * facet buckets..
 */
Vue.component("statistics", {
    // The x-template id.
    template: "#statistics",
    props: ["stats"],

    computed: {
        theStats() {

            var self = this;
            if(self.stats) {

                // using d3-format to format numbers.
                var format = d3.format(",.2f");
                // get ready the array from the object.
                var items = [];
                Object.keys(self.stats).forEach(function(theKey) {
                    var item = {
                      "key": theKey,
                      "value": format(self.stats[theKey])
                    }
                    items.push(item);
                });

                return items;
            } else {
                return [];
            }
        }
    }
});

/**
 * facet buckets..
 */
Vue.component("facet-buckets", {
    // The x-template id.
    template: "#facet-buckets",
    props: ["facet"],

    // using computed for dynamic data.
    computed: {
        // the facet label.
        facetLabel() {
            return this.facet.label;
        },

        // ids for collapse.
        facetID() {
            return this.facet.label.replace(/ /g, '-');
        },
        facetCollapseID() {
            return "collapse" + this.facet.label.replace(/ /g, '-');
        },
        facetTargetCollapseID() {
            return "#collapse" + this.facet.label.replace(/ /g, '-');
        },

        // facet buckets.
        facetBuckets() {
            return this.facet.buckets;
        }
    },

    // methods.
    methods: {

        /**
         * show the horizontal bar and hide the list group.
         * if the horizontal bar not exist, we will draw it.
         */
        showHorizontalBar() {

            // Try to find the corrent element..
            var divId = "#collapse" + this.facet.label.replace(/ /g, '-');

            // hide the list gourp..
            d3.select(divId + ">ul").classed("d-none", true);

            // check if the svg is exist
            // d3.select will return a selection object.
            var svgElement = d3.select(divId + ">svg");
            if(svgElement.empty()) {
                this.drawHorizontalBar();
            } else {
                // show up the svg by remove the d-none class.
                svgElement.classed("d-none", false);
            }
        },

        showListGroup() {
            // Try to find the corrent element..
            var divId = "#collapse" + this.facet.label.replace(/ /g, '-');

            // check if the svg is exist
            // d3.select will return a selection object.
            var svgElement = d3.select(divId + ">svg");
            if(svgElement.empty()) {
                // do nothing...
            } else {
                // show up the svg by remove the d-none class.
                svgElement.classed("d-none", true);
            }

            // hide the list gourp..
            d3.select(divId + ">ul").classed("d-none", false);
        },

        /**
         * draw horizontal bars.
         */
        drawHorizontalBar() {
            var self = this;

            // calculate the dimension for bar chart.
            var divId = "#collapse" + self.facet.label.replace(/ /g, '-');
            var divWidth = parseInt(d3.select(divId).style("width"));
            var margin = {top: 1, right: 2, bottom: 1, left: 2};
            var width = divWidth - margin.left - margin.right;
            var height = 250 - margin.top - margin.bottom;

            /**
             * the data will have format
             * [{value:"label", count:"2"}, {}]
             */
            var data = self.facet.buckets;

            // make sure the count is number type.
            data.forEach(function(d) {
                d.count = +d.count;
            });

            // set up x and y axis
            var y = d3.scaleBand().range([height, 0]).padding(0.1);
            var x = d3.scaleLinear().range([0, width]);
            // Scale the range of the data in the domains
            x.domain([0, d3.max(data, function(d){ return d.count; })])
            // map will create a new array with 
            // the results of the provided function.
            y.domain(data.map(function(d) { return d.value; }));

            // remove the existing content.
            //d3.select(divId).html("");

            // draw the svg element.
            var svg = d3.select(divId).append("svg")
                .attr("class", "card-img-top")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", 
                      "translate(" + margin.left + "," + margin.top + ")");

            // draw the group bar.
            var bar = svg.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("fill", "steelblue")
                .attr("class", "bar");

            // append the rectangles for the bar chart
            //var barRect = bar.selectAll(".bar-rect")
            //    .data(function(d) {return d;})
            //  .enter().append("rect")
            bar.append("rect")
                .attr("class", "bar-rect")
                //.attr("x", function(d) { return x(d.sales); })
                .attr("width", function(d) {return x(d.count); } )
                .attr("y", function(d) { return y(d.value); })
                .attr("height", y.bandwidth());
            // try to append text.
            //var barText = bar.selectAll(".bar-text")
            //    .data(function(d) {return d;})
            //  .enter().append("text")
            bar.append("text")
                .attr("fill", "white")
                .attr("x", "3")
                .attr("y", function(d) {return y(d.value) + y.bandwidth() - 5;})
                .attr("font-size", y.bandwidth() * 3 / 5)
                //.attr("font-size", "1.1em")
                //.attr("dy", "1.2em")
                .text(function(d) {return d.value+ ": " + d.count;});
        }
    }
});

/**
 * listing details template. 
 */
Vue.component("listing-details", {
    // we will use the html blok with the id selector.
    // the HTML template. 
    // It should be a script element with type "x-template"
    template: "#accordion-listing-details",

    // the doc will have all details and a index field.
    props: ["doc", "index"],

    computed: {

        // for all th IDs, we need replace the following special chars with
        // empty string:
        // @ . /

        listingID() {
            return this.doc['id'].replace(/[@\.\/]/g, '');
        },

        collapseID() {
            return "collapse" + this.doc['id'].replace(/[@\.\/]/g, '');
        },

        targetCollapseID() {
            return "#collapse" + this.doc['id'].replace(/[@\.\/]/g, '');
        },

        /**
         * title for each doc.
         */
        caption() {
            // we will tweak the caption based on table.
            var table = this.doc['name'];
            // by default, we will using id as the caption.
            var caption = this.doc['id'];

            switch(table) {
              case 'xmldata':
                return caption + ' - ' +
                    this.doc.fields.title[0] + ', ' +
                    this.doc.fields.city[0] + ' -- ' +
                    this.doc.fields.avgScore[0];
              case 'offlisting':
                return caption + ' - ' +
                    this.doc.fields.title[0] + ', ' +
                    this.doc.fields.city[0];
              case 'userprefs':
                return caption + ' - ' +
                    this.doc.fields.useremail[0];
              default:
                return caption;
            }
        }
    }
});

/**
 * result list in csv format.
 */
Vue.component("results-list", {

    // the HTML template element id.
    template: "#accordion-results-list",

    props: ["docs"],

    computed: {

      // show the list of docs in JSON format.
      docsListJSON() {
          return JSON.stringify(this.docs, null, '  ');
      },

      // show the list of docs in CSV format.
      docsListCSV() {

          if(!this.docs) {
            return '--';
          }

          var theList = [];
          this.docs.forEach(function(doc, index) {
            //console.log(doc);
            var fields = [];
            if(index === 0) {
              // the first doc, we will get all keys.
              Object.keys(doc).forEach(function(field) {
                if(field === ".score") {
                  // do nothing.
                } else if(field === ".zone") {
                  // do nothing.
                } else if(field === "table") {
                  // do nothing.
                } else {
                  fields.push(field);
                }
              });
              theList.push(fields.join(","));
              fields = [];
            }
            for(var fieldName in doc.fields) {
              //console.log(fieldName);
              // skip some fields.
              if(fieldName === ".zone") {
                continue;
              } else if(fieldName === ".score") {
                continue;
              } else if(fieldName === "table") {
                continue;
              }
              fields.push(doc.fields[fieldName][0]);
            }
            theList.push(fields.join(","));
          });

          return theList.join("\n");
      }
    }
});

/**
 * the the Vue application object for the Wizard app.
 */
var app = new Vue({
    // HTML element selector.
    el: "#search-app",

    data: {
      query: '*:*',
      facetFields: "project_id,customer_name",
      // the base URL will include the ending /
      restBaseUrl: "https://localhost/rest/",
      totalHits: 0,
      facets: null,
      stats: null,
      results: null,
      resultSummary: "Click search to start.."
    },

    computed: {
      // produce the csv format.
      resultsInCSV: function() {
          return "TODO: result list in CSV format!";
      }
    },

    methods: {
        /**
         * simple search function to demonstrate Solr search function.
         */
        simpleSearch() {

            self = this;
            console.log('I am in...');
            self.resultSummary = "Searching ...";
            // set the results to null for hiding the whole section.
            self.results = null;
            self.facets = null;
            self.stats = null;

            // check the query, 
            if(!this.query) {
              // reset the query to search everything!
              this.query="*:*";
            }

            // make sure we have at less one statistics.
            //if(self.facetFields.includes('statistics')) {
            //} else {
            //    // add the statistics on listvalue_i
            //    self.facetFields = self.facetFields + 
            //      ",listvalue_i(statistics=true)";
            //}

            // post payload, it will be the query parameters here:
            // This is the JSON request payload.
            var postPayload = {
                //workflow: "customsearch",
                query: this.query,
                limit: 250,
                offset: 0,
                //fields: [".id","title","table","avgScore"],
                //sort: ["title:ASC"],
                // facets: ["table", "city", "agentname"],
                //facets: self.facetFields.split(',')
                facet: "on",
                "facet.field": "project_id",
                "facet.field": "customer_id"
            };
            // this will show how to use query parameters in a JSON request.
            var postParams = {
                query: this.query,
                // we could mix parameters and JSON request.
                params: {
                  rows: 25,
                  start: 0,
                  facet: "on",
                  // using array for multiple values
                  // in association with multiple values in HTTP parameters.
                  // ?facet_field=project_id&facet_field=customer_id
                  //"facet.field":["project_id", "customer_id"]
                  "facet.field": self.facetFields.split(',')
                  // here is for single value
                  //"facet.field":"customer_id"
                }
            }

            // the query url should be some thing like this: 
            // - 'https://one.sites.leocorn.com/rest/searchApi/search',
            // it is seems easier to use query parameters in a JSON request.
            axios.post(this.restBaseUrl + 'select', postParams)
            .then(function(response) {
                console.log(response.data);
                self.totalHits = response.data.response.numFound;
                self.results = response.data.response.docs;
                console.log(self.results);
                //self.facets = response.data.facets;
                self.facets = self.getReadyFacets(response.data.facet_counts.facet_fields);
                //self.stats = self.facets[self.facets.length - 1].statistics;
                //console.log("statistics: " + self.stats);
                self.resultSummary = "Found " + self.totalHits + " docs in total!"
                if(self.totalHits > 0) {
                    console.log('total hits: ' + self.totalHits);
                    //console.log(JSON.stringify(self.facets));
                    //console.log(JSON.stringify(response.data.documents[0]));
                    //console.log(response.data.documents[0].fields['title']);
                }
            })
            .catch(function(error) {
              self.resultSummary = "Query Error!";
              console.log(error);
            });
        },

        /**
         * process the facet_fields response to different format.
         *
         *  [
         *    { label:"field name",
         *      buckets: [
         *        {value: "field value one",
         *         count: 120},
         *        {value: "field value two",
         *         count: 20},
         *      ]
         *    }
         *  ]
         */
        getReadyFacets(facetFields) {

            // we will return the facets as array.
            var retFacets = [];
            // key is the field name.
            Object.keys(facetFields).forEach(function(fieldName) {

                var buckets = facetFields[fieldName];
                // get ready the buckets for each field.
                var facetBuckets = [];
                for(var i=0; i < buckets.length; i = i+2) {

                    facetBuckets.push(
                      {
                        value: buckets[i],
                        count: buckets[i + 1]
                      }
                    );
                }

                // get ready the facet object.
                var facetItem = {
                  label: fieldName,
                  buckets: facetBuckets
                };

                retFacets.push(facetItem);
            });

            return retFacets;
        }
    }
});
