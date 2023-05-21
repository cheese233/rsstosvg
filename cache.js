const sizeof = require("object-sizeof")
const fs = require("fs");
class CacheNode {
    count = 0;
    constructor(value, expire = 600000) {
        this.value = value;
        this.expire = expire;
    }
}
class CacheList {
    #cacheList = {};
    #ExpireTime;
    #maxCacheSize;
    #ExpireTimer;
    #fileName;
    #saveToFile = () => {
        let save = JSON.stringify({ time: this.#ExpireTime, cache: this.#cacheList })
        fs.writeFileSync(this.#fileName, save);
    }
    #ReadFile = () => {
        let read = fs.readFileSync(this.#fileName);
        return JSON.parse(read);
    }
    #isExpire(time) {
        if (this.expireTime >= time) {
            return true;
        }
        else {
            return false;
        }
    }
    #ExpireRemove() {
        for (const n in this.#cacheList) {
            if (this.#isExpire(this.#cacheList[n].expire)) {
                console.log("Cleaned", n)
                this.remove(n);
            }
        }
    }
    #ExpireTimeRenew = () => {

    }
    #ExpireAutoRemove = (time) => setInterval(() => {
        this.#ExpireRemove();
        this.#ExpireTimeRenew();
    }, time);
    constructor(expireTick = 60000, maxSize = 125000, saveFileName) {
        this.#ExpireTime = new Date();
        if (saveFileName != undefined) {
            this.#fileName = saveFileName;
            try {
                let read = this.#ReadFile();
                this.#cacheList = read.cache;
                this.#ExpireTime = new Date(read.time);
            }
            catch (e) {

            }
        }
        this.#ExpireRemove();
        this.#ExpireTimer = this.#ExpireAutoRemove(expireTick);
        this.#maxCacheSize = maxSize;
    }
    get(key) {
        let getNode = this.#cacheList[key];
        if (getNode == undefined) {
            return undefined;
        }
        getNode.count++;
        return getNode.value;
    }
    #findLowest() {
        let lowest;
        for (const n in this.#cacheList) {
            if (lowest == undefined || (lowest.count > n.count || (lowest.count == n.count && lowest.expire > n.expire))) {
                lowest = n;
            }
        }
        return lowest;
    }
    push(key, value, expire) {
        while (sizeof(this.#cacheList) >= this.#maxCacheSize) {
            this.remove(this.#findLowest());
        }
        let node = new CacheNode(value, expire + this.expireTime);
        this.#cacheList[key] = node;
    }
    remove(key) {
        delete this.#cacheList[key];
    }
    get expireTime() {
        return new Date() - this.#ExpireTime;
    }
    stop() {
        clearInterval(this.#ExpireTimer);
        if (this.#fileName != undefined) {
            this.#saveToFile();
        }
    }
}
module.exports = CacheList;