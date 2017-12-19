/**
 * the the Vue application object for the Wizard app.
 */
var app = new Vue({
    // HTML element selector.
    el: "#search-app",

    data: {
      query: '*',
      totalHits: 0,
      results: [
        {fields: { 
          '.id': '123',
          title: 'title one',
          url: 'http://example.com/one',
          description: 'description one'
        }},
        {fields: {
          '.id': 'abc',
          title: 'title two',
          url: 'http://example.com/two',
          description: 'description two'
        }}
      ]
    },

    computed: {
      resultSummary: function() {
          return "Found " + this.totalHits + " in total";
      }
    },

    methods: {
        simpleSearch() {
            self = this;
            console.log('I am in...');

            //axios.get('https://dev-attivio.sites.leocorn.com/rest/searchApi/simpleCgi',
            //{
            //  params: {
            //    q: this.query,
            //    hits:20,
            //    offset: 0
            //  }
            //})
            axios.post('https://dev-attivio.sites.leocorn.com/rest/searchApi/search',
            {
                query: this.query,
                rows:20,
                offset: 0
            })
            .then(function(response) {
                self.totalHits = response.data.totalHits;
                self.results = response.data.documents;
                if(self.totalHits > 0) {
                    console.log(JSON.stringify(response.data.documents[0]));
                    console.log(response.data.documents[0].fields['title']);
                }
            })
            .catch(function(error) {
              console.log(error);
            });
        }
    }
});
