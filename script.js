/**
 * Hey JS purists, are you happy now? :p
 */

//
// Put your username and some cors proxies here
//
var config = {
    username: 'robaatox',
    limit: 500,
    itemsPerZip: 50,
    proxies: ['url1', 'url2', 'url3']
};
var templateUrl = 'DownloadImages/Template';
var images = [];
var view = {
    imagenes: [],
    urlsZip: []
};


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
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function (json) {
            if (json.query.results === null) {
                alert('Account not found! Do you think it\'s valid? Please try in few minutes ;)');
                if (funcCallback) {
                    funcCallback();
                };
            }

            if (json.query.results.json.items === undefined) {
                alert('Account private or empty!');
                return false;
            }

            var items = json.query.results.json.items;
            var more = json.query.results.json.more_available;

            for (i in items)
                images.push({ imageData: items[i]['images'], id: items[i]['id'] });
            //images.push(items[i]['images']['standard_resolution']['url']);

            if (more == 'true' && images.length < config.limit)
                parse(items[19]['id'], funcCallback);
            else if (funcCallback) {
                funcCallback();
            };
            /*else
              createZip();*/
        },
        error: function (xhr, txt, e) {
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
        url: url,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
        },
        success: function (data) {
            zip.file(filename, data, { binary: true });
            deferred.resolve();
            console.log('file added: ' + filename);
        },
        error: function (xhr, txt, e) {
            deferred.reject();
            console.error('error adding: ' + filename);
        }
    });

    return deferred;
}

function createZip(imagesToDownload, addToNameFile) {
    var self = {};
    var zip = new JSZip();
    var i = 0;
    self.deferreds = new Array();
    self.addToNameFile = esValido(addToNameFile) ? addToNameFile : '';

    $.each(imagesToDownload, function (i, image) {
        var img = image;
        var url = img.urlFull;
        var filename = image.id + '.jpg';

        self.deferreds.push(deferredAddZip(url, filename, zip));
    });


    $.when.apply($, self.deferreds).always(function () {
        var blob = zip.generate({ type: 'blob' });

        saveAs(blob, config.username + self.addToNameFile + '.zip');

        images = new Array();
        $('#status').html("");
    });

}

function bajar(idZip) {
    //config.username = $('#user').val();
    //if (!esValido(config.username)) { return;}

    $('#status').html("Loading...");

    if (esValido(idZip)) {
        bajarPorUrl(idZip);
    } else {
        if (view.imagenes.length > 0) {
            if ($('#allImages:checked').length > 0) {
                createZip(view.imagenes);
            } else {
                var imagenesSeleccionadas = [];
                cargarImagenesSeleccionas(imagenesSeleccionadas);

                createZip(imagenesSeleccionadas);
            }


            $('#status').html("");

        } else {
            parse(0, function () {
                var noMostrar = false;

                cargarImagenes(view.imagenes);


                createZip(view.imagenes);

                $('#status').html("");

            });
        }
    }


}

function bajarPorUrl(idZip) {
    var _imagesToZip = view.urlsZip[idZip].imagesToZip;

    if (_imagesToZip.length > 0) {
        createZip(_imagesToZip, '_' + idZip);
    }
}

//////////////////////////////////////
// LIST
// test: robaatox
////////////////////////////////////////
function generarLinks() {
    $('#status').html("Loading...");
    config.itemsPerZip = parseInt($('#imagesZip').val());
    config.username = $('#user').val();
    if (!esValido(config.username)) { $('#status').html("Invalid user!"); return; }

    if (view.imagenes.length === 0) {
        parse(0, function () {
            cargarImagenes(view.imagenes);
            generarUrlZip();
        });
    } else if (view.urlsZip.length === 0) {
        generarUrlZip();
    }


}

function generarUrlZip() {
    var numImages = config.itemsPerZip;
    var _since = 0;
    var _imagesToZip = [];
    var _idZip = 0;
    var _iAux = 0;

    $.each(view.imagenes, function (i, imagen) {
        if (numImages <= i) {
            view.urlsZip.push({
                id: _idZip,
                since: _since,
                until: numImages - 1,
                imagesToZip: $.merge([], _imagesToZip)
            });

            _idZip++;
            _since = i;
            _imagesToZip = [];
            numImages += config.itemsPerZip;
        }

        _imagesToZip.push(imagen);
        _iAux = i;
    });

    if (_imagesToZip.length > 0) {
        view.urlsZip.push({
            id: _idZip,
            since: _since,
            until: _iAux,
            imagesToZip: $.merge([], _imagesToZip)
        });
    }

    $.get(templateUrl, function (template) {

        Mustache.parse(template);   // optional, speeds up future uses
        var rendered = Mustache.render(template, view);
        $('#listImage').html(rendered);
        $('#status').html("");

    });
}

function listar() {
    config.username = $('#user').val();
    if (!esValido(config.username)) { return; }
    $('#status').html("Loading...");
    $('#listImage').html("");
    images = [];

    $.get(templateUrl, function (template) {
        parse(0, function () {
            view = {
                imagenes: [],
                urlsZip: []
            };

            cargarImagenes(view.imagenes);

            Mustache.parse(template);   // optional, speeds up future uses
            var rendered = Mustache.render(template, view);
            $('#listImage').html(rendered);
            $('#status').html("");
        });


    });


}

function cargarImagenes(listDest) {
    for (var i = 0; i < images.length; i++) {
        listDest.push({
            id: images[i].id,
            url: images[i].imageData["low_resolution"]["url"],
            urlFull: images[i].imageData["low_resolution"]["url"].replace('s320x320/', '')
        });
    }
}

function cargarImagenesSeleccionas(listDest) {

    $('.imgSelect:checked').each(function (i, elem) {
        listDest.push(view.imagenes.filter(function (e) { return e.id == elem.id; })[0]);
    })

}

function esValido(text) {
    if (text === '' || text === null || typeof text === 'undefined') { return false; }
    return true;
}

function init() {
    var template = $('body').html();
    Mustache.parse(template);   // optional, speeds up future uses
    var rendered = Mustache.render(template, config);
    $('body').html(rendered);

    templateUrl = $('#listImage').data("template");
}

window.onload = function () {
    init();
}