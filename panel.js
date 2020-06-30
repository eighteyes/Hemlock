console.log('hi from panel')
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = handleStateChange; // Implemented elsewhere.
xhr.open("GET", chrome.extension.getURL('/config.yaml'), true);
xhr.send();

function handleStateChange(data){
  console.log('Change', data);
}
function save_options() {
  var o = {
    entertainment: [],
    tech: [],
    politics: []
  };
  $('#tech input').each(function(i){ o.tech.push($(this).val()) });
  $('#entertainment input').each(function(i){ o.entertainment.push($(this).val()) });
  $('#politics input').each(function(i){ o.politics.push($(this).val()) });
  console.log('update save', o);
  chrome.storage.sync.set(o);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get(null, function(items) {
    console.log('saved', items);
    for ( var k in items){
      var v = items[k];
      var c = $('#'+k);
      c.children('h1').prepend($('<button>+</button>&nbsp;').on('click', newName));    
      v.forEach(function(name){
        addInput(c, name);
      })
    }
  });
}

function clear_saved(){
  console.log('cleared')
  chrome.storage.sync.clear()
}

var newName = function(){
  addInput($(this).parent().parent(), '');
}

var addInput = function(c, name){
  var input = $('<input type="text" value="'+ name + '">');
  var btn = $('<button>x</button>').on('click', function(){
    $(this).prev('input').remove();
    $(this).remove();
  });
  c.append(input, btn);
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
document.getElementById('clear').addEventListener('click',
    clear_saved);

