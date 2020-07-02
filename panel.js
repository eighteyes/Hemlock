console.log('hi from panel')
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = handleStateChange; // Implemented elsewhere.

function handleStateChange(data){
  console.log('Change', data);
}
function save_options() {
  var o = $('#blocklist').val().split('\n')
  console.log('update save', o);
  chrome.storage.sync.set({list:o});
}

function restore_options() {
  chrome.storage.sync.get(null, function(o) {
    console.log('saved', o);
    if ( o.hasOwnProperty('list') && o.list.length > 0 ){
      o = o.list.join('\n')
      $('#blocklist').val(o)
    }
  });
}



function clear_saved(){
  console.log('cleared')
  $('#blocklist').val('')

  chrome.storage.sync.clear()
}

function add_defaults(){
  console.log('Setting defaults')
var content  = makeList().join('\n')
  $('#blocklist').val(content)
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
function setup(){
  restore_options()
  document.getElementById('save').addEventListener('click',
    save_options);
document.getElementById('clear').addEventListener('click',
    clear_saved);
document.getElementById('defaults').addEventListener('click',
    add_defaults);

}
document.addEventListener('DOMContentLoaded', setup);

