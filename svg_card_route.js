const fs = require('fs')
const {
    parse: svgsonParse,
    stringify: svgsonStringify
} = require('svgson');
const dateformat = require('dateformat-util');
const FeedParser = require('feedparser');
let feedparser = new FeedParser();
const axios = require('axios').default;
const images = require('images')
const CacheList = require('./cache')
const { sep } = require('path');
const feedIcon = 'data:image/png;base64,' + Buffer.from(images.loadFromBuffer(fs.readFileSync("./Generic_Feed.png"))
    .size(64).encode("png"), 'binary').toString('base64');
const parseRssFeed = async (url, max = 0) => {
    feedparser = new FeedParser();
    let feedXml = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    });
    feedXml.data.pipe(feedparser);
    await new Promise((resolve, reject) => {
        feedparser.on('readable', () => resolve())
        feedparser.on('error', () => { reject(); console.error("reject!") })
    });
    let feeds = [];
    let feed;
    let index = 0;
    let getBase64Buffer = new CacheList();
    while (feed = feedparser.read()) {
        const FaviconUrl = (new URL(feed.link)).origin;
        console.log(FaviconUrl)
        const FaviconUrlDownload = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(FaviconUrl);
        let favicon = getBase64Buffer.get(FaviconUrl);
        if (favicon == undefined) {
            try {
                let faviconData = await axios({
                    method: 'get',
                    url: FaviconUrlDownload,
                    responseType: 'arraybuffer'
                });
                favicon = 'data:image/png;base64,' + Buffer.from(faviconData.data, 'binary').toString('base64');
            }
            catch (err) {
                favicon = feedIcon;
            }
            getBase64Buffer.push(FaviconUrl, favicon);
        }
        let picture;
        const PictureUrl = feed.image.url;
        try {
            let pictureData = await axios({
                method: 'get',
                url: PictureUrl,
                responseType: 'arraybuffer'
            });
            let resize = (pic) => images.loadFromBuffer(pic).size(110).encode("jpg", { quality: 85 });
            picture = 'data:image/jpg;base64,' + Buffer.from(resize(pictureData.data), 'binary').toString('base64');
        }
        catch (err) {
            picture = undefined;
        }
        feeds.push({
            title: feed.title,
            date: feed.date,
            favicon: favicon,
            link: feed.link,
            content: feed.summary,
            picture: picture
        });
        if (max != 0) {
            index++;
            if (index >= max) {
                break;
            }
        }
    }
    getBase64Buffer.stop();
    return feeds;
};
// const svgCache = new CacheList(3600000);
const getSvg = async (rssUrl, JSONFeedUrl, config) => {
    const svgCache = new CacheList(1000, 125000, `.${sep}svgCache.json`);
    if (rssUrl) {

    }
    else if (JSONFeedUrl) {

    }
    if (config) {

    }
    const rssCache = svgCache.get(rssUrl);
    if (rssCache != undefined) {
        svgCache.stop();
        return rssCache;
    }
    const xml = fs.readFileSync("svg_card_template.svg");
    let svg = await svgsonParse(xml);
    const svgFind = (className) => svg.children.find(element => element.attributes.class == className);
    let rss = (await parseRssFeed(rssUrl, 1))[0];
    console.log(rss)
    let cardtitle = svgFind("data-card-title");
    for (let element of cardtitle.children) {
        if (element.name == "image") {
            element.attributes.href = rss.favicon;
        }
        else if (element.attributes.class == "data-title") {
            element.children[0].children[0].value = rss.title;
        }
    }
    let cardbody = svgFind("data-card-body");
    for (let element of cardbody.children) {
        if (element.name == "foreignObject") {
            element.children[0].children[0].value = rss.content;
        }
        else if (element.name == "image") {
            if (rss.picture) {
                element.attributes.href = rss.picture;
            }
            else {
                cardbody.children.splice(cardbody.children.indexOf(element), 1);
            }
        }
        else if (element.attributes.class == "data-date") {
            let date = new Date(rss.date);
            element.children[0].value = dateformat.format(date, 'yyyy/MM/dd hh:mm:ss');
        }
    }
    let cardlink = svgFind("data-link").children[0];
    cardlink.children[0].value = rss.link;
    cardlink.attributes.href = rss.link;
    let svgOutput = svgsonStringify(svg);
    svgCache.push(rssUrl, svgOutput, 15000);
    svgCache.stop();
    return svgOutput;
}
/**
 * @param {import('fastify').FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify, options) {
    fastify.get('/svg', async (request, reply) => {
        reply.header("Access-Control-Allow-Origin", "*");
        reply.header("Access-Control-Allow-Methods", "GET");
        reply.type('image/svg+xml').code(200)
        reply.code(200)
        return await getSvg(request.query.rss, request.query.json, request.query.config);
    });
}

module.exports = routes