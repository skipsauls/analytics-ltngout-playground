function getRequestBaseURL() {
    return '';
}

function request(obj, successHandler, errorHandler) {

    var method = obj.method || 'GET',
        xhr = new XMLHttpRequest(),
        url = getRequestBaseURL();

    // dev friendly API: Add leading '/' if missing so url + path concat always works
    if (obj.path && obj.path.charAt(0) !== '/' && obj.path.indexOf('http') < 0) {
        obj.path = '/' + obj.path;
    }
    url = url + obj.path;

    if (obj.params) {
        url += '?' + toQueryString(obj.params);
    }

    var self = this;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status > 199 && xhr.status < 300) {
                if (successHandler) {
                    var resp = undefined;
                    if (xhr.responseText) {
                        resp = xhr.responseText || undefined;
                        try {
                            resp = JSON.parse(xhr.responseText);
                        } catch (e) {}
                    }                    
                    successHandler(resp);
                }
            } else {
                var error = xhr.responseText ? JSON.parse(xhr.responseText) : {message: 'An error has occurred'};
                if (errorHandler) {
                    errorHandler(error);
                }
            }
        }
    };

    xhr.open(method, url, true);
    if (obj.accept) {
        xhr.setRequestHeader("Accept", obj.accept);
    } else {
        xhr.setRequestHeader("Accept", "application/json");
    }
    
    if (obj.contentType) {
        xhr.setRequestHeader("Content-Type", obj.contentType);
    } else {
        xhr.setRequestHeader("Content-Type", "application/json");
    }

    if (obj.headers) {
        for (var k in obj.headers) {
            xhr.setRequestHeader(k, obj.headers[k]);            
        }
    }
    
    console.warn("xhr.send obj.data: ", obj.data, JSON.stringify(obj.data));

    xhr.send(obj.data ? JSON.stringify(obj.data) : undefined);
}

/*
$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results[1] || 0;
}
*/