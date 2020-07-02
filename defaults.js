
function makeList(){
  
  var tv = ['Game Of Thrones', 'Orange Is The New Black', 'The Big Bang Theory','Baseball','Football'];
  var politics = ['Clinton', 'Trump', 'Obama', 'Biden', 'Democrat', 'Republican', 'Jeff Sessions', 'Paul Ryan', 'Mike Pence','right-wing','left-wing'];
  var tech = ['Zuckerberg', 'Facebook', 'Twitter','Steve Jobs', 'Elon Musk', 'Reed Hastings', 'Reid Hoffman', 'Peter Thiel', 'Jack Dorsey','Bill Gates','Apple','Etsy','Ebay',
  'Marc Andreessen', 'Larry Ellison', 'Tim Cook', 'Sergey Brin', 'Larry Page', 'Jeff Bezos', 'TikTok','Instagram','Reddit','NetFlix']
  var crap = ['Kardashian', 'Selena Gomez', 'Stephen Colbert', 'Trevor Noah', 'Katy Perry', 'Seth Rogan', 'Jim Parsons',
  'Mike Rowe', 'Neil Patrick Harris', 'Kayne', 'Simon Cowell', 'Hilton', 'Beyonce', 'Mark Cuban',
  'Robert Downey', 'Schumer', 'Drake', 'Adele', 'Beyoncé', 'Kanye', 'Nicki Minaj', 'Jennifer Lawrence','Aniston','Hanks','Degeneres',
  'Taylor Swift', 'Jenner', 'Nicolas Cage', 'Russell Brand', 'Miley Cyrus', 'Justin Bieber', 'Tom Cruise', 'Oprah',
  'Kushner', 'Ivanka','Karen','Jenner','Buffett','Barr'];
  var xxx = ['porn','dick','pussy']
  
  // populate initial list
  return [].concat(tv, politics, crap, tech, xxx)

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

