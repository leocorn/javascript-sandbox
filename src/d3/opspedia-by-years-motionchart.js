jQuery(document).ready(function($) {

    var intranets;
    var pathes;
    var rules;
    var sizes;
    // store groups in format [group, total, [site, site]].
    var groups = [];

    // get query parameters.
    var queryParams = getUrlVars();
    var searchTerm = 'group' in queryParams ?
                     queryParams['group'] : '';
    searchTerm = decodeURIComponent(searchTerm);
    //$('#search-input').val(searchTerm);

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;

    // using when to have multipile ajax call.
    $.when(
        // get the list name.
        $.ajax({
            type: "GET",
            url: 'data/intranet-path.json',
            dataType: "json",
            success: function(data) {
                //console.log(data.length);
                pathes = data;
            }
        }),
        // get the rules for group.
        $.ajax({
            type: "GET",
            url: 'data/intranet-path-rules.json',
            dataType: "json",
            success: function(data) {
                //console.log(data);
                rules = data;
            }
        }),
        // load the size.
        $.ajax({
            type: "GET",
            url: 'data/intranet-size-2017.json',
            dataType: "json",
            success: function(data) {
                //console.log(data.length);
                sizes = data;
            }
        })
    ).then(function() {

        mergeData();
        //// scale colors.
        //var colors = scaleColors(["#FF4900", "#14cc46"], 
        //                         intranets.length);
        ////console.log(intranets);
        //buildZoomableCircles(intranets, colors);
        //buildSitesSummary(intranets, colors);
        $('#result').html('');
        $('#summary').html('');
        handleSearch(2017, searchTerm);
        // build circles year by year.
        buildYear(2009);
        showCircles(2017);
    });

    // hook the click function.
    $('#search-button').on('click', function() {

        var term = $('#search-input').val();
        //window.location.href = '?search_term=' + term;
        handleSearch(2017, term);
        showCircles(2017);
    });

    // hook the keypress evetn.
    $('#search-input').on('keypress', function(event) {

        //console.log(event);
        // only handle the enter key.
        if(event.keyCode == 13) {
            // this is binded to dom element.
            //window.location.href = '?search_term=' + $(this).val();
            handleSearch(2017, $(this).val());
            showCircles(2017);
        }
    });

    /**
     *
     */
    function mergeData() {

        // reset intranets and groups
        intranets = [];
        groups = [];

        //console.log('Merge data pathes');
        //console.log(pathes[0]);
        // store the sites by gorups.
        var groupSites = {};
        // append the size to intanets list.
        //sizes.forEach(function(size) {
        $.each(sizes, function(index, size) {
            var id = size[0];
            var theSize = size[1];
            if(theSize > 10240) {
                var i = -1;
                // find the correct site for the size.
                if(isIE) {
                    for(var n = 0; n < pathes.length; n++) {
                        if(pathes[n][0] === id) {
                            i = n;
                            break;
                        }
                    } 
                } else {
                    // it will return -1, if no match found.
                    i = pathes.findIndex(function(one) {
                        return one[0] === id;
                    });
                }
                if(i >= 0) {
                    //intranets[i].push(theSize);
                    //console.log(intranets[i]);

                    // try to find the match group for the 
                    // Intranet path.
                    // TODO: multipile size will be different!
                    var path = pathes[i][1];
                    // === decide the group.
                    // set the default group
                    var group = 'Personal';
                    for( var n = 0; n < rules.length; n ++) {
                        var rule = rules[n];
                        var condition = RegExp(rule[0]);
                        if(condition.test(path)) {
                            group = rule[1];
                            break;
                        }
                    }
                    //intranets[i].push(group);
                    var theSite = [id, path, theSize, group];
                    intranets.push(theSite);
                    // store the sites in group.
                    if(Object.keys(groupSites).indexOf(group) < 0) {
                        // no group exist yet! create new one.
                        groupSites[group] = {};
                        groupSites[group]['sites'] = [];
                        groupSites[group]['total'] = 0;
                    }
                    // add the site to group
                    groupSites[group]['sites'].push(theSite);
                    groupSites[group]['total'] += theSize;
                }
            } else {
                // skip small size site.
            }
        });

        // sort the intranets.
        intranets = intranets.sort(function(a, b) {
            // sort by size of the site.
            return b[2] - a[2];
        });
        //console.log('Merge data');
        //console.log(intranets[0]);

        // get ready the groups.
        Object.keys(groupSites).forEach(function(group, index) {
            var sites = groupSites[group]['sites'];
            var groupTotal = groupSites[group]['total'];
            groups.push([group, groupTotal, sites]);
        });
        // sort by group total size.
        groups = groups.sort(function(a, b) {
            return b[1] - a[1];
        });
        console.log(groups);
    }

    /**
     * perform search again and rebuild the zoomable circle.
     * TODO: add animation
     */
    function handleSearch(year, searchTerm) {

        //console.log(intranets[0]);
        var sites = [];
        if(searchTerm.startsWith('cat:')) {
            var term = searchTerm.split(':')[1];
            // perform search.
            sites = $.grep(intranets, function(site, i) {
                //return site[1].includes(searchTerm);
                return site[3] === term;
            });
            //buildGroupNav(term);
        } else {
            // perform search.
            sites = $.grep(intranets, function(site, i) {
                //return site[1].includes(searchTerm);
                var index = site[1].indexOf(searchTerm);
                return index > -1;
            });
            //buildGroupNav('');
        }

        // scale colors.
        var colors = scaleColors();
        buildZoomableCircles(sites, colors, year);
        if(searchTerm.length > 0) {
            buildSitesSummary(sites, colors);
        }
    }

    /**
     * utility function to scale colors.
     * colorRance will be like: ["blue", "yellow"]
     */
    function scaleColors(colorRange, size) {

        //return d3.scale.linear().domain([0, size])
        //    .range(colorRange)
        //    .interpolate(d3.interpolateHcl);
        //return d3.scale.category10();
        return d3.scale.category20();
        //return d3.scale.category20b();
        //return d3.scale.category20c();
    }
    
    /**
     * utility function to build the summary.
     */
    function buildSitesSummary(sites, colors) {

        var items = [];
        var total = 0;
        for(i = 0; i < sites.length; i++) {
            var site = sites[i];
            var size = site[2];
            total = total + size;
            var name = site[1];
            var item = 
'<li class="list-group-item" >' +
'  <span class="badge" style="background: ' + colors(i) + '">' +
readablizeBytes(size) + '</span>' +
'  <span class="glyphicon glyphicon-stop"' +
'        style="color: ' + colors(i) + '"></span>' +
'  <a href="/' + name + '">' + 
name + '</a>' +
'</li>';
            items.push(item);
        }

        var group = 
'<ul class="list-group" style="margin: 0px">' +
items.join('\n') +
'</ul>';

        var summary = $("#summary");
        summary.html(group);
        var summaryHeading = 
'Found <span class="badge">' + sites.length + '</span> Sites ' +
'<span class="badge pull-right">Total size: ' + 
readablizeBytes(total) + '</span>';
        var heading = $('#summary-heading');
        heading.html(summaryHeading);
    }

    /**
     * utility function to build the group summary.
     */
    function buildGroupSitesSummary(colors, year) {

        var total = 0;
        var siteTotal = 0;
        // items for summary list.
        var items = [];
        groups.forEach(function(group, index) {
            var groupName = group[0];
            var groupTotal = group[1];
            siteTotal = siteTotal + group[2].length;
            total = total + groupTotal;
            var item = 
'<li class="list-group-item" >' +
'  <span class="badge" style="background: ' + colors(index) + '">' +
readablizeBytes(groupTotal) + '</span>' +
'  <span class="glyphicon glyphicon-stop"' +
'        style="color: ' + colors(index) + '"></span>' +
'  <a href="?group=cat:' + groupName + '">' + 
groupName + '</a>' +
'</li>';
            items.push(item);
        });

        // add the list group to panel body.
        var group = 
'<div class="panel-body" id="group' + year + '"' +
'      style="max-height: 580px; overflow-y: auto; padding: 0px">' + 
'<ul class="list-group" style="margin: 0px">' +
items.join('\n') +
'</ul>' +
'</div>';

        // preparing the heading message.
        var summaryHeading = 
'<div class="panel-heading">' +
  'OPSpedia Year <span class="badge">' + year + '</span><br/>' +
  '<span class="badge">' + groups.length + '</span> Groups ' +
  '<span class="badge">' + siteTotal + '</span> Sites' +
  '<span class="badge pull-right">Total size: ' + 
  readablizeBytes(total) + '</span>' +
'</div>';

        var groupPanel = 
'<div class="panel panel-success panel-no-custom"' +
'     style="display:none"' +
'     id="group' + year + '">' +
summaryHeading + group +
'</div>';

        var summary = $("#summary");
        summary.append(groupPanel);
    }

    /**
     * utility function to build group nav bar.
     */
    function buildGroupNav(term, maxTab=7) {

        var colors = scaleColors();
        // tabs for navigation.
        var tabs = [];
        var moreTabs = [];

        // setup the tab for all first.
        var active = (term === '') ? 'active' : '';
        var allTab =
'<li role="presentation" class="' + active + '">'+ 
'<a id="all" href="?group=">All' +
'  <span class="badge" style="background: ' + colors(0) + '">' +
intranets.length + '</span>' +
'</a></li>';
        tabs.push(allTab);
        var include = false;
        var tailingTab = '';
        //groups.forEach(function(group, index) {
        for(var i = 0; i < groups.length; i ++) {
            var group = groups[i];
            var groupName = group[0];
            // reset active we shall only have one active.
            active = "";
            if(term === groupName) {
                // the active tab in cluded in limit?
                include = (i < maxTab);
                active = "active";
            }
            // build the navgation tabs.
            var tab = 
'<li role="presentation" class="' + active + '">'+ 
'<a id="' + groupName + '" href="?group=cat:' + groupName + '">' + 
groupName + 
'  <span class="badge" style="background: ' + colors(i + 1) + '">' +
group[2].length + '</span>' +
'</a></li>';
            if(i >= maxTab) {
                // add to dropdown for extra tab.
                moreTabs.push(tab);
                if(active === "active") {
                    // this will be the tailing tab.
                    tailingTab = tab;
                }
            } else {
                tabs.push(tab);
            }
        }

        // handle the tailing tab.
        tabs.push(tailingTab);

        // add the more... dropdown.
        var moreTab = 
'<li role="presentation" class="dropdown pull-right">' +
'  <a class="dropdown-toggle" data-toggle="dropdown" ' +
'     href="#" role="button" aria-haspopup="true" ' +
'     aria-expanded="false">' +
'    More ...<span class="caret"></span>' +
'  </a>' +
'  <ul class="dropdown-menu">' +
moreTabs.join('\n') +
'  </ul>' +
'</li>';
        tabs.push(moreTab);

        $('#group-nav').html(tabs.join('\n'));
    }

    /**
     * utility function to build zoomable circles.
     */
    function buildZoomableCircles(sites, colors, year) {

        var result = $("#result");
        var id = 'circles' + year;
        result.append('<div id="' + id + '" style="display: none"></div>');

        // get ready group circles first.
        var groupCircles = {};
        // total size
        var totalSize = 0;
        var maxSize = 101420689474;
        for(i = 0; i < sites.length; i++) {
            var site = sites[i];
            var size = site[2];
            if(size < 10240) {
                // site is not ready.
                continue;
            }
            totalSize = totalSize + size;
            // set name to empty if size is too small
            // less than 200MB.
            // we have sorted the site by size.
            var name = i < Math.min(sites.length / 2, 10) ? site[1] : '';
            var circle = {
              "name": name,
              "children":[{
                  "name": site[1],
                  "size": size,
                  "leafFill": colors(i),
                  "imgUrl": ""
              }]
            };

            // check the gorup and push the circle to proper group
            var group = site[3];
            if(Object.keys(groupCircles).indexOf(group) < 0 ) {
                // no group exist! create new one.
                groupCircles[group] = [];
            }
            groupCircles[group].push(circle);

            //circles.push(circle);
            //console.log(groupCircles);
        }

        var circles = [];
        var theGroups = Object.keys(groupCircles);
        theGroups.forEach(function(group) {
            var groupCircle = {
                "name":group,
                "children":groupCircles[group]
            };
            circles.push(groupCircle);
        });
        // add the place holder circle.
        var holderSize = maxSize - totalSize;
        if(holderSize > totalSize) {
            var holderAmount = holderSize / totalSize;
            for(var i = 0; i < holderAmount - 1; i++) {
                circles.push({
                  "name": name,
                  "children":[{
                             "name": "hold",
                             "size": totalSize * (i + 1),
                             "leafFill": "lightgrey",
                             "imgUrl": ""
                          }]
                });
            }
            var marginSize = maxSize - totalSize * holderAmount;
            circles.push({
              "name": name,
              "children":[{
                         "name": "hold",
                         "size": marginSize,
                         "leafFill": "lightgrey",
                         "imgUrl": ""
                      }]
            });
        } else if (holderSize > 0) {
            circles.push({
              "name": name,
              "children":[{
                         "name": "hold",
                         "size": holderSize,
                         "leafFill": "lightgrey",
                         "imgUrl": ""
                      }]
            });
        }

        // get ready the json data for the zoomable circle.
        var jsonData = {
              "attributes": {
                "title": "3 Equal size circles",
                "description": "Data example to show the data structure",
                "colorRange": [
                  //"white","gainsboro", "silver"
                  //"white","#f8f9fa", "lightgrey"
                  "white", "lightgrey","#f8f9fa"
                ],
                "leafFill": "green"
              },
              "data": {
                "name":"This will NOT show anywhere!",
                "children": [
                  {
                    "name":"OPSpedia Year " + year + " - " + readablizeBytes(totalSize),
                    "children": circles
                  }
                ]
              }
            };
        $('#jsonstring').html(JSON.stringify(jsonData, null, 2));
        // set the diameter based on the total size.
        var diameter = scaleDiameter(totalSize);
        $('#' + id).zoomableCircles({"diameter":600, "margin":5}, jsonData);
        //setTimeout(function() {
        //    $('#' + id).fadeIn(3000);
        //}, 2000);
        //$('#' + oldId).fadeOut(2000, function() {
        //    result.remove("#" + oldId);
        //    $('#' + id).fadeIn(3000);
        //});
        if(theGroups.length > 1) {
            buildGroupSitesSummary(colors, year);
        }
    }

    /**
     * utility function to get a scale diameter for the given size.
     * 
     */
    function scaleDiameter(size) {

        console.log("size = " + size);
    }

    /**
     * utility function to show readable size.
     */
    function readablizeBytes(bytes) {

        var s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        var e = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
    }

    /**
     * parse the URL got the query parameters.
     */
    function getUrlVars() {

        var vars = [], hash;
        var href = window.location.href;
        var hashes = href.slice(href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }

        return vars;
    }

    /**
     * quick try for the animation.
     */
    $('#play').on('click', function() {
    
        // try fade out the svg image.
        $('#circles2017').fadeOut(200);
        $('#group2017').fadeOut(200);
        //setTimeout(function() {
        //    fadeYear(2008);
        //}, 2000);

        var show = function(stopYear, year, callback) {

            $('#group' + year).fadeIn(3000);
            $('#circles' + year).fadeIn(3000, function() {
                callback();
            });

            // toggle the active for year nav.
            $('#year-nav li.active').removeClass('active');
            $('#year-nav li#year' + year).addClass('active');
        };

        // sync call to keep sequence:
        // define the loop, 
        var loop = function(stopYear, year, show, loopDone) {
            show(stopYear, year, function() {
                // loop in the next year.
                if(++year < stopYear) {
                    var oldYear = year - 1;
                    setTimeout(function(){
                        $('#group' + oldYear).fadeOut(2000);
                        $('#circles' + oldYear).fadeOut(2000);
                    }, 4000);
                    setTimeout(function() {
                        loop(stopYear, year, show, loopDone);
                    }, 6000);
                } else {
                    // do nothing.
                }
            });
        };
        // start the sequenced loop, sync loop
        loop(2018, 2009, show, function(){});
    });

    /**
     * handle a single year
     */
    $('li[id^="year"]').on('click', function() {
        // find out current year
        var year = $(this).attr('id');
        // find out the active year
        var activeYear = $('#year-nav li.active').attr('id');
        if(year == activeYear) {
            return;
        }
        var newYear = year.split('year')[1];
        var oldYear = activeYear.split('year')[1];

        $('#group' + oldYear).fadeOut(2000);
        $('#circles' + oldYear).fadeOut(2000);
        setTimeout(function() {
            // toggle the active for year nav.
            $('#year-nav li.active').removeClass('active');
            $('#year-nav li#' + year).addClass('active');
            $('#group' + newYear).fadeIn(2000);
            $('#circles' + newYear).fadeIn(2000);
        }, 2000);
    });

    /**
     * function to play all years data.
     */
    function buildYear(year) {

        var fileUrl = 'data/intranet-size-' + year + '.json';
        $.ajax({
            type: "GET",
            url: fileUrl,
            dataType: "json",
            success: function(data) {
                //console.log(data.length);
                sizes = data;
                // mergedata.
                mergeData();
                handleSearch(year, "");
                if (year < 2016) {
                    buildYear(year + 1);
                }
            }
        });
    }

    /**
     * function to show circles for a year
     */
    function showCircles(year) {

        $('#circles' + year).fadeIn(3000);
        $('#group' + year).fadeIn(3000);
    }
});
