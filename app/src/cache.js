
export default class Cache {
    static setCache(url, data) {
        data['expiry_time'] = (new Date()).getTime() + 300000;
        window.localStorage.setItem(url, JSON.stringify(data));
        console.log("Store:");
        console.log(data);
    }

    static getCache(url) {
        var cachedResult = window.localStorage.getItem(url);
        console.log("getCache from url:");
        console.log(url);
        console.log(cachedResult);
        console.log((new Date()).getTime());
        if (cachedResult===null) {
            return null;
        } else {
            var parsedResult = JSON.parse(cachedResult);
            if ((new Date()).getTime() < parsedResult['expiry_time']) {
                console.log("Cache Hit");
                return parsedResult;
            } else {
                return null;
            }
        } 
    }

    static deleteCache(url) {
        window.localStorage.removeItem(url);
    }

    static clearCache() {
    	window.localStorage.clear();
    }
}