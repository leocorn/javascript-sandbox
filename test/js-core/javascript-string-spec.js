describe('JavaScript String Prototype Testing Specs', function() {

    // we will use jQuery to manipulate HTML for testing...

    beforeEach(function() {
        // empty for now...
    });

    describe('testing search and replace functions', function() {

        /**
         * we will test functions for string object in java script,
         * including:
         *
         * - match
         * - replace
         */

        it('Testing the replace function', function() {

            var colors = 'Colors list, red, Blue, organge, red';
            var result = colors.replace('red', 'purple');
            // verify things...
            expect(colors).toMatch('red');
            expect(colors).not.toMatch('purple');
            // only one red is replaced.
            expect(result).toMatch('red');
            expect(result).toMatch('purple');
        });

        it('Testing the replace url function', function() {
            var source = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Bit%27s_moments_036.jpg/375px-Bit%27s_moments_036.jpg";
            var oldUrl = "https://upload.wikimedia.org/wikipedia/commons";
            var newUrl = "/images";
            var result = source.replace(oldUrl, newUrl);
            // verify
            expect(result).toMatch("/images/thumb/d/d4/Bit%27s_moments_036.jpg/375px-Bit%27s_moments_036.jpg");
            // the RegExp class will escape the special chars, like /
            var fromPattern = new RegExp("https://upload.wikimedia.org/wikipedia/commons", "g");
            var result = source.replace(fromPattern, "/newimages");
            expect(result).toMatch("/newimages/thumb/d/d4/Bit%27s_moments_036.jpg/375px-Bit%27s_moments_036.jpg");

        });

        it('Testing the replace all funtion', function() {

            var colors = 'Colors list, red, Blue, organge, red';
            // using regular express to replace all.
            var result = colors.replace(/red/g, 'purple');
            // verify things...
            expect(colors).toMatch('red');
            expect(colors).not.toMatch('purple');
            // no more red.
            expect(result).not.toMatch('red');
            expect(result).toMatch('purple');

            // we could use the RegExp class to build the match
            // pattern.
            var fromString = 'red';
            var fromPattern = new RegExp(fromString, 'g');
            // we should have the save result.
            result = colors.replace(fromPattern, 'purple');
            expect(result).not.toMatch('red');
            expect(result).toMatch('purple');
        });

        it('Testing the match function', function() {

            // match is prototype function for string.
            // get ready some testing string
            var source = 'some testing string for test purpose' +
                ' something again';
            var result = source.match(/om/g);
            // we should find 2 match.
            expect(result.length).toBe(2);

            // without the g flag, it will return the first match
            // and some additional properties: such as input and
            // index.
            var matches = source.match(/om/i);
            // it will be only one match.
            expect(matches.length).toBe(1);
            expect(matches[0]).toBe('om');
            // this is how we get the index property.
            expect(matches['index']).toBe(1);
            // get the input property.
            expect(matches['input']).toBe(source);

            // find more cases in javascript-regexp-spec.js
        });

    });

    describe('Testing the split function', function() {

        it('Split by regular express', function() {
            // split works for both string and regex separator
            var source = 'testing, again, split';
            // we could use the regular expression as the separator.
            var result = source.split(/,\s*/);
            // result is a type of array, array is a type of object.
            expect(typeof result).toBe('object');
            expect(result.length).toBe(3);
            expect(result[0]).toBe('testing');
        });

        it('split source by new line \\n', function() {

            // get ready a String with new line in it.
            var source = 'testing a string with \n in the middle' +
                '\nadd one more line';
            // we are using the regular string as the separator.
            var result = source.split('\n');
            expect(typeof result).toBe('object');
            expect(result.length).toBe(3);
            expect(result[0]).toBe('testing a string with ');
            expect(result[2]).toBe('add one more line');
        });
    });

    describe('Testing the fromCharCode function', function() {

        it('char code for alphabet letters', function() {

            var letters = [];
            // loop the char code.
            for(var i = 65; i <= 90; i ++) {
                letters.push(String.fromCharCode(i));
            }
            // verify now.
            expect(letters[0]).toBe('A');
            expect(letters[1]).toBe('B');
        });
    });

    describe('Testing the string to int function', function() {

        it('parse pixle to integer', function() {

            var width = '123px';
            // the function parseInt will only retain the leading
            // numbers and discards all the rest.
            var number = parseInt(width);
            expect(number).toBe(123);
        });
    });

    describe('Testing the substring', function() {

        it('Basic usage for substring', function() {

            var aString = 'some string';
            var sub = aString.substring(0);
            expect(sub).toBe('some string');
            sub = aString.substring(0, 1);
            expect(sub).toBe('s');
            sub = aString.substring(0, 100);
            expect(sub).toBe('some string');
        });
    });
});
