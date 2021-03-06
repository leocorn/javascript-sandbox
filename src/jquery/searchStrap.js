/**
 * **************************
 * NOTE: MOVED to new location sre/search/searchStrap.js.
 * on November 28, 2016
 * Check the new location for update.
 * *****************************
 *
 * jQuery plugin to present a simple search function.
 *
 *   jQuery('#searn-input-id').searchStrap();
 */

;(function($) {

    // plugin name and default values.
    var pluginSearchStrap = "searchStrap";
    // set the default values
    var defaults = {
        // the url endpoint for search.
        searchUrl : '/search',
        // the kkkkkk
        itemsPerPage: 10,
        // id for the search button.
        searchButton : 'search-button',
        // query param for search term.
        queryName : 'searchterm',

        // options for facet, based on Solr
        // here are default facet.
        facet: {
            //TODO: facetQuery: ['term one', 'term two'],
            // only support facet field for now.
            facetField: ['site', 'authors', 'keywords']
        },

        // jQuery selector for the the search result section.
        resultSelector: '#search-result'
    };

    // the plugin constructor.
    function Plugin(element, options) {
        // the DOM element.
        this.element = element;
        this.$element = $(element);
        // merge the facet options.
        var facet = $.extend({}, defaults.facet, options.facet);
        options.facet = facet;
        // extend mthod will merge object contents.
        this.settings = $.extend({}, defaults, options);
        this._defatuls = defaults;
        this._name = pluginSearchStrap;
        this.init();
    }

    // use extend method to avoid Plugin prototype confilcts.
    $.extend(Plugin.prototype, {

        // the initialize function.
        init: function() {

            var self = this;
            // we will get search term from query
            var paramName = self.settings.queryName;
            var searchTerm =
                decodeURIComponent(this.getUrlVars()[paramName]);
            this.$element.val(searchTerm);

            // prepare the query to perform the initial search
            var searchQuery = this.prepareSearchQuery(searchTerm, 1);
            self.search(searchQuery);

            // hook the click event to search button.
            //console.log(self.settings.searchButton);
            $('#' + self.settings.searchButton).
                on('click', function() {

                self.handleButtonClick();
            });

            // hook the key press event.
            this.$element.on('keypress', function(event) {

                //console.log(event);
                // only handle the enter key.
                if(event.keyCode == 13) {
                    self.handleButtonClick();
                }
            });
        },

        /**
         * parse the URL got the query parameters.
         */
        getUrlVars : function() {

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
        },

        /**
         * utility method to build the search query.
         * only handle search term and pagination now.
         * TODO: Will add field query soon.
         *
         * default start item is 1.
         */
        prepareSearchQuery: function(term, start) {

            // set the default value to 1 for start.
            var start = typeof start !== 'undefined' ? start : 1;

            var searchQuery = {
                term: term,
                start: start
            };

            return searchQuery;
        },

        /**
         * Perform search according to the search query.
         * Search query will track the search states, including:
         *
         * - search term
         * - start number
         * - TODO facets, filter query, 
         */
        search: function(searchQuery) {

            var self = this;

            // get ready action data for search endpoint.
            var thefacet = {
                    facetField: ['site', 'keywords', 'authors']
            };
            var searchAction = {
                term: searchQuery.term,
                start: searchQuery.start,
                perPage: self.settings.itemsPerPage,
                // facet
                facet: JSON.stringify(self.settings.facet)
            };

            $.ajax({
                url: self.settings.searchUrl,
                method: 'GET',
                dataType: 'json',
                // data object will 
                data: searchAction,
                success: function(data) {
                    self.handleSearchResult(data);
                }
            });
        },

        /**
         * handle button click event or enter key press.
         * we will reset search for both cases.
         */
        handleButtonClick : function() {

            var term = this.$element.val();
            // prepare the query to perform the initial search
            var query = this.prepareSearchQuery(term, 1);
            this.search(query);

            // update the brwoser url.
            this.updateBrowserUrl(query);
        },

        /**
         * update the url on browser
         */
        updateBrowserUrl: function(searchQuery) {

            // build the new url.
            url = '?' + this.settings.queryName + 
                  '=' + encodeURIComponent(searchQuery.term);
            //
            window.history.pushState('', 'testing', url);
        },

        /**
         * handle search result. it will mainly 
         * - calculate numbers,
         * - build the document list, 
         *   including summary and pagination
         * - hook events.
         */
        handleSearchResult: function(data) {

            var self = this;
            // log the data for debuging...
            console.log(data);

            var currentQuery = data.currentQuery;
            // TODO: analyze the search result.
            // total results.
            var total = data.total;
            // calculate current page.
            var currentPage =
                (currentQuery.start - 1) / currentQuery.perPage + 1;
            // calculate the total pages.
            var totalPages = Math.ceil(total / currentQuery.perPage);

            // build the simple result page.
            var $result = 
                this.build2ColumnResult(data.docs, currentQuery, 
                            total, currentPage, totalPages);

            // TODO: hook events:
            // hook click event for all available pages on 
            // pagination nav bar.
            $result.find('nav ul li[class!="active"] a').
                on('click', function(event) {

                // identify the page.
                var searchTerm = currentQuery.term;
                var perPage = currentQuery.perPage;
                self.handlePagination($(this), searchTerm, 
                                      currentPage, totalPages, 
                                      perPage);
            });
        },

        /**
         * build the 2 column search result list, which will have
         *   - col-8 column for current search result, using panel.
         *   - col-4 column for search filters, unsing panel.
         *
         * The current search panel will include:
         *   - current search with field query list, panel-heading
         *   - sorting dropdown, panel-body
         *   - summary of search result: total pages, current pages, 
         *     total items
         *   - list of items in list-group > list-group-item > media
         *   - pagination, panel-footer
         *
         * The search filter panel will include:
         *   - search filters
         *   - facets label and facets values in tag cloud.
         */
        build2ColumnResult: function(docs, currentQuery, total, 
                                     currentPage, totalPages) {

            // build the current search panel
            var $currentSearch = 
                this.buildCurrentSearchPanel(docs, currentQuery, 
                        total, currentPage, totalPages);
            // build the search filter panel.
            var $searchFilter = this.buildSearchFilterPanel();

            // the left column.
            var $leftCol = $('<div class="col-md-8"></div>');
            $leftCol.append($currentSearch);
            // the right column
            var $rightCol = $('<div class="col-md-4"></div>');
            $rightCol.append($searchFilter);

            var $result = $(this.settings.resultSelector);
            $result.html('').append($leftCol).append($rightCol);

            return $result;
        },

        /**
         * build the current search panel.
         */
        buildCurrentSearchPanel: function(docs, currentQuery,
            total, currentPage, totalPages) {

            var self = this;

            // panel heading...
            var heading = 
                '<div class="panel-heading">' +
                '  <strong>Current Search:</strong><br/>' +
                currentQuery.term + '<br/>' +
                '<span>' +
                '  <strong>Order by:</strong>' +
                '  <select class="success" id="order">' +
                '    <option value="relevance">Relevance</option>' +
                '    <option value="changetime">Last Modified Date</option>' +
                '  </select>' +
                '</span>' +
                '</div>';

            // panel body
            var end = currentQuery.start + currentQuery.perPage - 1;
            end = end > total ? total : end;
            var body = 
                '<div class="panel-body bg-info-custom">' +
                'Page <strong>' + currentPage + '</strong>' +
                ' Showing [<strong>' + currentQuery.start + 
                '</strong> - <strong>' + end + 
                '</strong>] of <strong>' +
                total + '</strong> total results';
                '</div>';

            // using list group for search result.
            var $ul = $('<ul class="list-group"></ul>');
            $.each(docs, function(index, item) {
                // present each item as a list group item.
                var liHtml = self.buildMediaItemHtml(item);
                $ul.append(liHtml);
            });

            // build the pagination bar.
            var pagination = 
                this.buildPaginationDots(currentPage, totalPages);
            // panel footer, pagination nav bar.
            var footer = 
                '<div class="panel-footer panel-footer-custom">' +
                pagination +
                '</div>';

            var $panel = $('<div class="panel panel-info' +
                           '            panel-custom"></div>');

            // append everything together.
            $panel.append(heading).append(body)
                  .append($ul).append(footer);

            return $panel;
        },

        /**
         * build the search filter panel.
         */
        buildSearchFilterPanel: function() {

            // panel heading...
            var heading = 
                '<div class="panel-heading">' +
                '  <strong>Search Filters</strong>' +
                '</div>';

            var body = 
                '<div class="panel-body">' +
                '  LIST OF FILTERS.' +
                '  <p></p>' +
                '  In Tag Cloud' +
                '</div>';
            // filter for sites
            // filter for keywords
            // filter for authors.

            var $panel = $('<div class="panel panel-success' +
                           '            panel-custom"></div>');

            // append everything together.
            $panel.append(heading).append(body);

            return $panel;
        },

        /**
         * build simple search result list, including:
         *   1. basic summary for search rsult.
         *   2. straight list-group for the document list.
         *   3. pagination.
         */
        buildSimpleResult: function(docs, currentQuery, total, 
                                    currentPage, totalPages) {

            var self = this;

            // build the info bar.
            var info = this.buildInfoBar(currentQuery.term, total,
                                         currentPage, totalPages);

            // using list group for search result.
            var $ul = $('<ul class="list-group"></ul>');
            $.each(docs, function(index, item) {
                // present each item as a list group item.
                var liHtml = self.buildMediaItemHtml(item);
                $ul.append(liHtml);
            });

            // build the pagination bar.
            var pagination = 
                this.buildPaginationDots(currentPage, totalPages);

            // the search result section: 
            var $result = $(self.settings.resultSelector);
            $result.html('').append(info)
                            .append($ul).append(pagination);

            return $result;
        },

        /**
         * build the information bar for search result.
         */
        buildInfoBar: function(term, total, currentPage, totalPages) {

            var info =  '<p class="text-info">' +
                'Found ' + total + ' results (0.51 seconds) ' +
                'for <span class="label-info">' + 
                term + '</span>' +
                '</p>';

            return info;
        },

        /**
         * build the HTML for each item
         *
         * @param item object of each item
         */
        buildItemHtml: function(item) {

            var liHtml =
                '<li class="list-group-item">' +
                '  <h4 class="list-group-item-heading">' +
                '    <a href="' + item.url +
                            '" style="padding: 0;">' +
                       item.title +
                '    </a>' +
                '  </h4>' +
                '  <small class="text-muted">SITE</small>' +
                '  <p class="list-group-item-text">' +
                     item.description +
                '  </p>' +
                '</li>';

            return liHtml;
        },

        /**
         * build the HTML for each item using media object.
         *
         * @param item object of each item
         */
        buildMediaItemHtml: function(item) {

            var itemHtml = 
              '<li class="list-group-item">' +
              '<div class="media">' +
              '  <div class="media-left">' + 
              '    <span class="text-warning fa-stack fa-lg">' +
              '      <i class="fa fa-circle fa-stack-2x"></i>' +
              '      <i class="fa fa-file-text-o fa-stack-1x fa-inverse"></i>' +
              '    </span>' +
              '  </div>' + 
              '  <div class="media-body">' +
              '    <h4 class="media-heading">' +
                     '<a href="' + item.url + 
                         '" style="padding: 0;">' + item.title + 
                     '</a>' +
              '    </h4>' +
              '    <small class="text-muted">' + 
                     item.site + '</small>' +
              '    <p class="media-description">' + 
                     item.description + 
              '    </p>' + 
              '  </div>' +
              '</div>' + 
              '</li>';

            return itemHtml;
        },

        /**
         * using the current query and total to build the 
         * pagination bar.
         */
        buildPagination: function(currentPage, totalPages) {

            // border check up (first, last)
            // previous button will be handled by first page.
            // next button will be hanelded by last page.
            var pagination = '<nav class="text-center">' +
                             '<ul class="pagination">';

            // decide the previous page.
            if(currentPage !== 1) {
                pagination = pagination + 
                    this.buildAPage('First') +
                    this.buildAPage('&laquo; Previous');
            }

            // generate the page list.
            for(var page = 1; page <= totalPages; page ++) {

                // normal page.
                var thePage = this.buildAPage(page);
                if(page == currentPage) {
                    thePage = this.buildAPage(page, 'active');
                }
                pagination = pagination + thePage;
            }

            // decide the next page.
            if(currentPage !== totalPages) { 
                pagination = pagination +
                    this.buildAPage('Next &raquo;') +
                    this.buildAPage('Last');
            }

            // add the ending tags.
            pagination = pagination + '</ul></nav>';
            return pagination;
        },
        
        /**
         * build the pagination with ... and 
         * without First and Last button.
         */
        buildPaginationDots: function(currentPage, totalPages,
                surroundingPages, tailingPages) {

            // set default value for surrouning and tailing pages.
            var surroundingPages = 
                typeof surroundingPages !== 'undefined' ?
                surroundingPages : 1;
            var tailingPages = 
                typeof tailingPages !== 'undefined' ?
                tailingPages : 2;

            var pagination = '<nav class="text-center">' +
                             '<ul class="pagination">';

            var thePage = '';
            // decide the previous page button
            if(currentPage !== 1) {
                thePage = this.buildAPage('&laquo; Previous');
            } else {
                thePage = this.buildAPage('&laquo; Previous', 'disabled');
            }
            pagination = pagination + thePage;

            // calculate the start page:
            // - set startPage = currentPage - 2 
            // - if startPage < 1 then set startPage = 1
            var startPage = currentPage - surroundingPages;
            startPage = startPage < 1 ? 1 : startPage;

            // calculate the end page.
            // - assumet we get the start page.
            // - set endPage = startPage + 5 - 1
            // - if endPage > totalPages set endPage = totalPages
            var endPage = startPage + (surroundingPages * 2);
            endPage = endPage > totalPages ? totalPages : endPage

            // decide the start page again based on the end page.
            startPage = endPage - (surroundingPages * 2);

            // decide the first page and first ... page
            // - if startPage <= 3 then no ... page
            //   - we will have all pages before start page.
            //   - simplely set the startPage = 1
            startPage = startPage <= (tailingPages + 2) ? 
                        1 : startPage;
            // - else the case (startPage > 4)
            //   - we will have first page and first ... page.
            //   - build the first page and the first ... page.
            if(startPage > 1) {
                // build the first page and the first ... page
                // build the tailing pages at the beginning.
                for(var i = 1; i <= tailingPages; i++) {
                    thePage = this.buildAPage(i);
                    pagination = pagination + thePage;
                }
                // build the first ... page.
                thePage = this.buildAPage('...', 'disabled');
                pagination = pagination + thePage;
            }

            // decide the last page and last ... page
            // - if endPage >= totalPages - 2 then no need ... page.
            //   - we will build all pages to total pages.
            //   - simplely set endPage = totalPages.
            endPage = endPage >= (totalPages - tailingPages - 1) ? 
                      totalPages : endPage;

            // generate the page list from start to end pages..
            for(var page = startPage; page <= endPage; page ++) {

                // normal page.
                var thePage = this.buildAPage(page);
                if(page == currentPage) {
                    // active page.
                    thePage = this.buildAPage(page, 'active');
                }
                pagination = pagination + thePage;
            }

            // - else (endPage < totalPages - 2)
            //   - we have build the last ... page and last page.
            if(endPage < totalPages) {

                // build the first page and the last ... page
                thePage = this.buildAPage('...', 'disabled');
                pagination = pagination + thePage;
                // build the tailing page at the end.
                for(var i = tailingPages - 1; i >= 0; i--) {
                    thePage = this.buildAPage(totalPages - i);
                    pagination = pagination + thePage;
                }
            }

            // decide the next page button.
            if(currentPage !== totalPages) { 
                thePage = this.buildAPage('Next &raquo;');
            } else {
                thePage = this.buildAPage('Next &raquo;', 'disabled');
            }
            pagination = pagination + thePage;

            // add the ending tags.
            pagination = pagination + '</ul></nav>';
            return pagination;
        },

        /**
         * utility method to build a page button on the pagination.
         *
         * the number class could be active, disabled, or nothing
         */
        buildAPage: function(number, numberClass) {

            // set default number class to nothing.
            var numberClass = typeof numberClass !== 'undefined' ?
                              numberClass : '';
            var page = 
                '<li class="' + numberClass + '"><a><span>' +
                number + 
                '</span></a></li>';

            // take off a tag for disabled page.
            if(numberClass == 'disabled') {
                page = 
                    '<li class="' + numberClass + '"><span>' +
                    number + 
                    '</span></li>';
            }

            return page;
        },

        /**
         * handle the pagination.
         */
        handlePagination: function($href, term, currentPage,
                                   totalPages, perPage) {

            var pageText = $href.text();
            var nextPage = 1;
            //console.log('page = ' + pageText);
            if(pageText.includes('First')) {
                // the first page button. do nothing using 
                // the default, start from 1
                nextPage = 1;
            } else if(pageText.includes('Last')) {
                // last page.
                nextPage = totalPages;
            } else if(pageText.includes('Previous')) {
                // previous page.
                nextPage = currentPage - 1;
            } else if(pageText.includes('Next')) {
                // the next page.
                nextPage = currentPage + 1;
            } else {
                // get what user selected.
                nextPage = parseInt(pageText);
            }
            var start = (nextPage - 1) * parseInt(perPage) + 1;

            // calculate start number to build search query.
            var query = 
                this.prepareSearchQuery(term, start);
            this.search(query);
        }
    });

    $.fn[pluginSearchStrap] = function(options) {

        // return to maintain the chain.
        return this.each(function() {
            // check the local storage index for the current
            // element.
            if(!$.data(this, "plugin_" + pluginSearchStrap)) {
                // no plugin created yet, let create a new one.
                $.data(this, "plugin_" + pluginSearchStrap, 
                       new Plugin(this, options));
            }
        });
    };

})(jQuery);
