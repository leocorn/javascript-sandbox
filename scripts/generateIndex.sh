#!/bin/bash

cd ..
pwd
echo 'Start to generate the index.html file for this folder...'

echo ' 
<!DOCTYPE html>
<html><body>
<ul>' > index.html

#HTMLS=**/*/*.html
HTMLS=`find . -name '*.html'`

#for file in `find . -name '*.html'`
#for file in '*.html'
for file in $HTMLS
do 
    echo "<li><a href='$file'>$file</a></li>" >> index.html 
done

echo '
</ul>
</body></html>' >> index.html 

echo "<!-- Generated on $(date) -->" >> index.html

echo 'File generated!'
echo '============'
cat index.html
