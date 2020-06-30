
// onready
$(function () {
  
  // names and urls of offenders
  var bads = populateList();
  
  if (location.href.match(bads.urls)) {
    log('Already present in hell');
  }
  
  // do we find the poop anywhere on page?
  log("Searching for", bads);
  matches = document.body.innerText.match(bads.names);
  if (matches) {
    log('Text MATCH', matches);
    runBaseFilter(bads);
  }
  
  // stop poop from landing on the page
  runMutateFilter(bads);
})
// #end main

function runMutateFilter(bads){
  
  // define what element should be observed by the observer
  // and what types of mutations trigger the callback
  MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  
  var observer = new MutationObserver(function (mutations, observer) {
    // fired when a mutation occurs
    // log(mutations, observer);
    mutations.forEach(function (m) {
      // log(m)
      if (m.type === 'attributes' && (m.attributeName == 'href' || m.attributeName == 'data-url') && m.target.tagName !== "HTML") {
        if (!_.isUndefined(m.target.text) && !_.isNull(m.target.text.match(bads.urls)) && m.target.text.match(bads.urls).length > 0) {
          log('mutation attribute ->>>', m.target.text.match(bads.names));
          removeTarget(m);
        }
      } else if (m.attributeName === 'class') {
        if (!_.isUndefined(m.target.text) && !_.isNull(m.target.text.match(bads.names)) && m.target.text.match(bads.names)) {
          log('mutation class ->>>', m.target.text.match(bads.names));
          removeTarget(m);
        }
      } else if (!_.isNull(m.target.innerHTML.match(bads.urls)) && !_.isNull(m.target.innerText.match(bads.names)) && (m.target.innerHTML.match(bads.urls).length > 0 || m.target.innerText.match(bads.names).length > 0)) {
        if (_.isNull(m.target.tagName.match(/BODY|SCRIPT/))) {
          log('mutation inner =>>>', m.target, m.target.innerHTML.match(bads.urls), m.target.innerText.match(bads.names));
          removeTarget(m);
        }
      }
    })
  });
  
  // setup watcher for changes
  observer.observe(document, {
    subtree: true,
    attributes: true
    //...
  });
}

// find badness in attributes
function parseAttributes(domObj, matchObj) {
  var atts = domObj.attributes;
  for (var i = 0, l = atts.length; i < l; i++) {
    var m = atts[i].value.match(matchObj.names) || atts[i].value.match(matchObj.urls);
    if (m) {
      log("removing on attr:", atts[i].value, m[0])
      return true;
    }
  }
  return false;
}



function removeTarget(m) {
  try {
    if ( m.target.parentNode )  {
      m.target.parentNode.removeChild(m.target);
      log('removeNode',m)
      if (typeof incCounter !== "undefined") incCounter();
    }
  } catch (e) {
    error(e, m)
  }
}
  
  
function runBaseFilter(filters) {
  var count = 0;
  if  ( !filters.hasOwnProperty('urls') ){
    error('No Filters Setup')
  }
  
  // images
  var badImgs = $('img').filter(function () {
    return parseAttributes(this, filters);
  }).remove();
  
  //links
  var badLinks = $('a,div').filter(function () {
    return parseAttributes(this, filters);
  });
  
  // hn
  badLinks.parents('tr:first').remove();
  badLinks.remove();
  
  
  var headClean = [];
  //divs are a pain
  l = $('div').contents().filter(function () {
    // is this a textnode and does it match?
    if ( this.nodeType === 3 ){
      var m = this.textContent.match(filters.names)
      if (m){
        headClean.push([ this.textContent, m[0] ])
      }
      return m;
    }
    return false;
    
  }).remove();
  
  
  //headlines and articles, be ruthless
  var l = $('h1,h2,h3,h4,h5,h6,p,a,span,strong').filter(function () {
    var m = $(this).text().match(filters.names);
    if (m){
      headClean.push([ $(this).text(), m[0] ])
      return m
    }
    return false
  }).remove();
  
  
  log('Last Clean', headClean, badLinks, badImgs)
  
  count += headClean.length;
  count += badLinks.length;
  count += badImgs.length;
  
  chrome.runtime.sendMessage({ count: count });
}



function setSavedList(list){
  chrome.storage.sync.set(list);
}
function getSavedList(cb){
  chrome.storage.sync.get(null, function (list) {
    log('|=|_ > Saved 🍃:', list);
    
    cb(list)
    
  });
}


// add the icon to logs
function log(l){
  var a = Array.from(arguments);
  a.unshift('🍃')
  console.log.apply(null, a )
}

function error(l){
  var a = Array.from(arguments);
  a.unshift('🍁')
  console.error.apply(null, a )
}

log('hi from Hemlock');
