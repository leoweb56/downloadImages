/**
 * Hey JS purists, are you happy now? :p
 */

//
// Put your username and some cors proxies here
//
var config = {
  username: 'your_user_here',
  limit: 50,
  proxies: ['url1', 'url2', 'url3']
};

var images = [];

function checkUsername(username) {
  var regex = /^[a-zA-Z0-9._]{1,30}$/;

  return regex.test(username);
}

function parse(id, funcCallback) {
  if (!checkUsername(config.username)) {
    alert('Username not valid!');
    return false;
  }

  var url = 'https://query.yahooapis.com/v1/public/yql?q=' +
            'select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2Finstagram.com%2F' +
            config.username + '%2Fmedia%3Fmax_id%3D' + id + '%22&format=json';

  $.ajax({
    url : url,
    type : 'GET',
    dataType : 'json',
    success : function (json) {
      if (json.query.results === null) {
        alert('Account not found! Do you think it\'s valid? Please try in few minutes ;)');
        return false;
      }

      if (json.query.results.json.items === undefined) {
        alert('Account private or empty!');
        return false;
      }

      var items = json.query.results.json.items;
      var more = json.query.results.json.more_available;

      for (i in items)
        images.push(items[i]['images']);
        //images.push(items[i]['images']['standard_resolution']['url']);

      if (more == 'true' && images.length < config.limit)
        parse(items[19]['id'], funcCallback);
      else if (funcCallback) { 
        funcCallback();
      };
      /*else
        createZip();*/
    },
    error : function(xhr, txt, e) {
      alert('Something went wrong! Probably too many requests. Please try in few minutes ;)');
      return false;
    }
  });
}

function getProxy() {
  var proxies = config.proxies;

  return proxies[Math.floor((Math.random() * proxies.length))];
}

function deferredAddZip(url, filename, zip) {
  var deferred = $.Deferred();

  $.ajax({
    url : url,
    type : 'GET',
    beforeSend : function(xhr) {
      xhr.overrideMimeType('text/plain; charset=x-user-defined');
    },
    success : function(data) {
      zip.file(filename, data, {binary : true});
      deferred.resolve();
      console.log('file added: ' + filename);
    },
    error : function(xhr, txt, e) {
      deferred.reject();
      console.error('error adding: ' + filename);
    }
  });

  return deferred;
}

function createZip() {
  var zip = new JSZip();
  var deferreds = new Array();

  $.each(images, function(i, image) {
    var img = image; //var img = image.substring(7);
    var url = img.replace('/s640x640',''); //var url = getProxy() + img;
    var filename = (i + 1) + '.jpg';

    deferreds.push(deferredAddZip(url, filename, zip));
  });

  $.when.apply($, deferreds).always(function() {
    var blob = zip.generate({type :'blob'});

    saveAs(blob, config.username + '.zip');

    images = new Array();
  });
}

function bajar(){
	config.username = $('#user').val();
	parse(0);
}


//////////////////////////////////////
// LIST
// test: robaatox
////////////////////////////////////////
function listar(){
  config.username = $('#user').val();
  if (config.username === '' || config.username === null || typeof config.username === 'undefined') { return;}

  $.get('template.html', function(template) {
    parse(0, function(){
      var view = {
        imagenes: []
      };

      for (var i = 0; i<images.length; i++){
        view.imagenes.push({
          id: i,
          url: images[i]["low_resolution"]["url"],
          urlFull: images[i]["low_resolution"]["url"].replace('s320x320/', '')
        });
      }

      Mustache.parse(template);   // optional, speeds up future uses
      var rendered = Mustache.render(template, view);
      $('#listImage').html(rendered);
    });

    
  });
  

}