console.log('hi from Hemlock');
// chrome.runtime.sendMessage( {count : 666} );
var tv = ['Game Of Thrones', 'Orange Is The New Black', 'The Big Bang Theory', 'Grey\'s Anatomy', 'NFL'];
var politics = ['Clinton', 'Trump', 'Democrat', 'Republican', 'GOP','DNC', 'Jeff Sessions','Paul Ryan','Mike Pence'];
var terror = ['ISIS']
var tech = ['Zuckerberg', 'Facebook', 'Steve Jobs', 'Elon Musk', 'Reed Hastings', 'Reid Hoffman', 'Peter Thiel', 'Jack Dorsey',
            'Marc Andreessen', 'Larry Ellison', 'Tim Cook', 'Sergey Brin', 'Larry Page', 'Jeff Bezos']
var crap = ['Kardashian', 'Selena Gomez', 'Stephen Colbert', 'Trevor Noah', 'Katy Perry', 'Seth Rogan', 'Jim Parsons', 
            'Mike Rowe', 'Neil Patrick Harris', 'Kayne', 'Simon Cowell', 'Hilton', 'Beyonce','Mark Cuban',
  'Robert Downey', 'Amy Schumer', 'Drake', 'Adele', 'Beyoncé', 'Kanye', 'Nicki Minaj', 'Jennifer Lawrence',
  'Taylor Swift', 'Jenner', 'Nicolas Cage', 'Russell Brand', 'Miley Cyrus', 'Justin Bieber', 'Tom Cruise', 'Oprah',
            'Kushner','Ivanka'
];

var badList = [].concat(tv, politics, terror, crap, tech) 
// var bad = {
//   list:[].concat(tv, politics, terror, crap, tech),
//   urls: bad.list.forEach(function(t, i, a) { badUrls[i] = t.replace(new RegExp(' ', 'g'), '-'); }),


// }
var badUrls = [];
badList.forEach
var badRegexStr = badList.join('|');
var badUrlsRegexStr = badUrls.join('|');

var badNames = new RegExp(badRegexStr, "ig");
var badUrls = new RegExp(badUrlsRegexStr, 'ig');


chrome.storage.sync.get(null, function(names){
  console.log('|=|_ > Blocks:', names);
  
  // if there ain't nothing use what we got
  if ( !_.has(names, 'tech')){
    chrome.storage.sync.set({
      entertainment: [].concat(tv, terror, crap),
      politics: politics,
      tech: tech,
    });
  
  }

// otherwise use stored

  badList = _.concat(names.entertainment, names.politics, names.tech);
  console.log(badList, _.values(names))
  badUrls = [];
  
  // replace spaces with - for urls
  badList.forEach(function(t, i, a) { badUrls[i] = t.replace(new RegExp(' ', 'g'), '-'); });

  badRegexStr = badList.join('|');
  badUrlsRegexStr = badUrls.join('|');

  badNames = new RegExp(badRegexStr, "ig");
  badUrls = new RegExp(badUrlsRegexStr, 'ig');

  var count = 0;

  console.log("regex:", badNames, badUrls);
  matches = document.body.innerText.match(badNames);
  if (matches) {
    // .sendRequest(payload, function(response) {});
    console.log('MATCH', matches);
    runBaseFilter();
  }





  // this is where they die
  //oh shit
  if (location.href.match(badUrls)) {
    console.error('Too deep already');
  }

  // onready
  $(function() {
    setTimeout(runBaseFilter, 10)

    var count = 0;

    console.log("regex:", badNames, badUrls);
    matches = document.body.innerText.match(badNames);
    if (matches) {
      // .sendRequest(payload, function(response) {});
      console.log('MATCH', matches);
      runBaseFilter();
    }

  })

  // finish drawing
  
  // define what element should be observed by the observer
  // and what types of mutations trigger the callback
  observer.observe(document, {
    subtree: true,
    attributes: true
      //...
  });

})


// find badness in attributes
function parseAttributes(domObj) {
  var atts = domObj.attributes;
  for (var i = 0, l = atts.length; i < l; i++) {
    if (atts[i].value.match(badNames) || atts[i].value.match(badUrls)) {
      console.log("removing:", atts[i].value)
      return true;
    }
  }
  return false;
}



function removeTarget(m) {
  try {
    m.target.parentNode.removeChild(m.target);
    count++;
    chrome.runtime.sendMessage({ count: count });
  } catch (e) {
    console.error(m)
  }
}

function runBaseFilter() {
  // images
  $('img').filter(function() {
    return parseAttributes(this);
  }).remove();

  //headlines and articles, be ruthless
  var l = $('h1,h2,h3,h4,h5,h6,p,a,span,strong').filter(function() {
    return $(this).text().match(badNames);
  }).remove();

  count += l.length;

  //links
  var badLinks = $('a,div').filter(function() {
    return parseAttributes(this);
  });

  badLinks.parent('article').remove();
  badLinks.remove();

  count += badLinks.length;

  //divs are a pain
  l = $('div').contents().filter(function() {
    return this.nodeType === 3 && this.textContent.match(badNames);
  }).remove();
  count += l.length;


  chrome.runtime.sendMessage({ count: count });
}
