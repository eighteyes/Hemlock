
function makeList(){
   
  var crap = ['Kardashian', 'Trump', 'Biden', 'Bill Gates', 'Zuckerberg','Bezos']; 
  
  // populate initial list
  return [].concat(  crap )

}


function makeListObj(badList){
    
  var badUrls = [];
  var badNames = [];
  
  
  // replace spaces with - for urls
  badList.forEach(function (t, i, a) { badUrls[i] = t.replace(new RegExp(' ', 'g'), '-'); });
  
  
  var badNameRegexStr = badList.join('|');
  var badUrlsRegexStr = badUrls.join('|');
  
  badNames = new RegExp(badNameRegexStr, "ig");
  badUrls = new RegExp(badUrlsRegexStr, 'ig');
  
  return { names: badNames, urls: badUrls, list: badList }
}

