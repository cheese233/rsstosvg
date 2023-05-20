class CacheNode {
    constructor(value, expire = 10) {
        this.value = value;
        this.expire = expire;
    }
}
class CacheList {
    #cacheList;
    #ExpireTime = 0;
    #ExpireAutoRemove = (time) => {
        return setInterval(() => {
            for (const n in this.#cacheList) {
                if (this.#cacheList[n].expire <= this.#ExpireTime) {
                    this.remove(n);
                }
            }
            this.#ExpireTime++;
        }, time);
    };
    #ExpireTimer = undefined;
    constructor(expireTick = 60000) {
        this.#ExpireTimer = this.#ExpireAutoRemove(expireTick);
        this.#cacheList = {};
    }
    get(key) {
        let getNode = this.#cacheList[key];
        if (getNode == undefined) {
            return undefined;
        }
        return getNode.value;
    }
    push(key, value, expire) {
        let node = new CacheNode(value, expire);
        this.#cacheList[key] = node;
    }
    remove(key) {
        return delete this.#cacheList[key];
    }
    get expireTime() {
        return this.#ExpireTime;
    }
}
module.exports = CacheList;