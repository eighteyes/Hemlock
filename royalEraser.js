chrome.browserAction.setBadgeText("fuck");
console.log("hi from hemlock");

var badList = ['Celebrities', 'Obama', 'Zuckerberg', 'NFL', 'al-Qaida', 'Philip Seymour Hoffman', 'Russell Brand', 'Miley Cyrus', 'Justin Bieber', 'Tom Cruise'];
var badUrls = [];
badList.forEach( function(t, i, a) { badUrls[i] = t.replace(' ', '-'); } );

var badRegexStr = badList.join('|');
var badUrlsRegexStr = badUrls.join('|');

var badNames = new RegExp(badRegexStr, "i");
var badUrls = new RegExp(badUrlsRegexStr, 'i');

function parseAttributes( domObj ){
  var atts = domObj.attributes;
  for (var i=0, l=atts.length; i<l; i++){
    if ( atts[i].value.match(badNames) || atts[i].value.match(badUrls) ){
      return true;
    }
  }
  return false;
}

var pyre = [];

//oh shit
if ( location.href.match(badUrls) ) {
  alert('Too deep already');
}
// images
$('img').filter( function() {
  return parseAttributes( this );
}).remove();

//headlines
$('h1,h2,h3,h4,h5,h6,p,a').filter( function() {
  return $(this).text().match(badNames)
}).remove();

//links
$('a').filter( function () {
  return parseAttributes( this );
}).remove();

//general
$('p').filter(function()  {
  return $(this).text().match(badNames);
}).remove();

//swanky div scan, avoids child problems
var divs = document.getElementsByTagName('div');
for ( var i = 0, l = divs.length; i < l; i++ ) {
  if ( divs[i].hasOwnProperty('textContent') && divs[i].textContent.match(badNames) ) {
    console.log('trigger')
    $(divs[i]).remove();
  }
}

pyre.forEach( function (t) {
  console.log(t.text());
  t.remove();
});

//content
var els = document.getElementsByTagName("*");
    //there is an offender on the page
    for ( var i = 0, l = els.length; i<l; i++ ){
        els[i].innerHTML.replace(badNames, "<die></die>");
    }
