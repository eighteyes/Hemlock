console.log('hi from Hemlock');
// chrome.runtime.sendMessage( {count : 666} );
var tv = ['Game Of Thrones', 'Orange Is The New Black', 'The Big Bang Theory', 'Grey\'s Anatomy']
var politics = ['Clinton', 'Trump', 'Democrat', 'Republican', 'GOP','Jeff Sessions','Paul Ryan','Mike Pence']
var terror = ['ISIS']
var tech = ['Zuckerberg', 'Steve Jobs', 'Elon Musk', 'Reed Hastings', 'Reid Hoffman', 'Peter Thiel', 'Jack Dorsey',
            'Marc Andreessen', 'Larry Ellison', 'Tim Cook', 'Sergey Brin', 'Larry Page', 'Jeff Bezos']
var crap = ['Kardashian', 'Selena Gomez', 'Stephen Colbert', 'Trevor Noah', 'Katy Perry', 'Seth Rogan', 'Jim Parsons', 
            'Mike Rowe', 'Neil Patrick Harris', 'Kayne', 'Simon Cowell', 'Hilton', 'Beyonce',
  'Robert Downey Jr.', 'Amy Schumer', 'Drake', 'Adele', 'Beyoncé', 'Kanye', 'Nicki Minaj', 'Jennifer Lawrence',
  'Taylor Swift', 'Jenner', 'Nicolas Cage', 'Russell Brand', 'Miley Cyrus', 'Justin Bieber', 'Tom Cruise', 'Oprah',
            'Kushner','Ivanka'
];

var badList = [].concat(tv, politics, terror, crap, tech);
var badUrls = [];
badList.forEach(function(t, i, a) { badUrls[i] = t.replace(new RegExp(' ', 'g'), '-'); });

var badRegexStr = badList.join('|');
var badUrlsRegexStr = badUrls.join('|');

var badNames = new RegExp(badRegexStr, "ig");
var badUrls = new RegExp(badUrlsRegexStr, 'ig');

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

var count = 0;

console.log("regex:", badNames, badUrls);
matches = document.body.innerText.match(badNames);
if (matches) {
  // .sendRequest(payload, function(response) {});
  console.log('MATCH', matches);
  runFilter();
}


// this is where they die
//oh shit
if (location.href.match(badUrls)) {
  console.error('Too deep already');
}
$(function() {
  setTimeout(runFilter, 10)

})

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observer = new MutationObserver(function(mutations, observer) {
  // fired when a mutation occurs
  console.log(mutations, observer);
  mutations.forEach(function(m) {
    if (m.type === 'attributes' && (m.attributeName == 'href' || m.attributeName == 'data-url') && m.target.tagName !== "HTML") {
      if (!_.isNull(m.target.text.match(badUrls)) && m.target.text.match(badUrls).length > 0) {
        removeTarget(m);

      }
    } else if (m.attributeName === 'class') {
      if (!_.isNull(m.target.text.match(badNames)) && m.target.text.match(badNames)) {
        removeTarget(m);
      }
    } else if (!_.isNull(m.target.innerHTML.match(badUrls)) && !_.isNull(m.target.innerText.match(badNames)) && (m.target.innerHTML.match(badUrls).length > 0 || m.target.innerText.match(badNames).length > 0)) {
      if (_.isNull(m.target.tagName.match(/BODY|SCRIPT/))) {
        console.log(m.target, m.target.innerHTML.match(badUrls), m.target.innerText.match(badNames));
        removeTarget(m);
      }
    }
  })
});

function removeTarget(m) {
  try {
    m.target.parentNode.removeChild(m.target);
    count++;
    chrome.runtime.sendMessage({ count: count });
  } catch (e) {
    console.error(m)
  }
}

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  attributes: true
    //...
});

function runFilter() {
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
