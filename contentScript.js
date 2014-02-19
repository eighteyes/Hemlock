

console.log('hi from Hemlock');
chrome.runtime.sendMessage( {count : 666} );

var badList = ['Celebrities', 'Kardashian', 'Mike Rowe', 'Neil Patrick Harris', '92010', 'Kayne West','Simon Cowell', 'George Zimmerman', 'Paris Hilton', 'Beyonce', 'Obama', 'Zuckerberg', 'al-Qaida', 'Philip Seymour Hoffman', 'Russell Brand', 'Miley Cyrus', 'Justin Bieber', 'Tom Cruise'];
var badUrls = [];
badList.forEach( function(t, i, a) { badUrls[i] = t.replace(new RegExp(' ', 'g'), '-'); } );

var badRegexStr = badList.join('|');
var badUrlsRegexStr = badUrls.join('|');

var badNames = new RegExp(badRegexStr, "ig");
var badUrls = new RegExp(badUrlsRegexStr, 'ig');

// find badness in attributes
function parseAttributes( domObj ){
  var atts = domObj.attributes;
  for (var i=0, l=atts.length; i<l; i++){
    if ( atts[i].value.match(badNames) || atts[i].value.match(badUrls) ){
      console.log("removing:", atts[i].value)
      return true;
    }
  }
  return false;
}

console.log("regex:", badNames, badUrls);
matches = document.body.innerText.match(badNames);
if (matches) {
    var payload = {
        count: matches.length // Pass the number of matches back.
    };
    chrome.runtime.sendMessage(payload, function(response) {
      console.log("CS", response.farewell);
    });
    // .sendRequest(payload, function(response) {});
    console.log('MATCH', matches);
}


// this is where they die
//oh shit
if ( location.href.match(badUrls) ) {
  alert('Too deep already');
}
// images
$('img').filter( function() {
  return parseAttributes( this );
}).remove();

//headlines and articles, be ruthless
$('h1,h2,h3,h4,h5,h6,p,a,span').filter( function() {
  return $(this).text().match(badNames);
}).remove();

//links
$('a').filter( function () {
  return parseAttributes( this );
}).remove();

//divs are a pain
$('div').contents().filter(function() {
  return this.nodeType === 3 && this.textContent.match(badNames);
}).remove();

