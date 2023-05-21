/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify, options) {
    const path = require('path')
    const fs = require('fs')
    const marked = require("marked")
    const readmeHtml = `<!DOCTYPE html>
            <html>

            <head>
                <link rel="stylesheet" href="index.css">
            </head>

            <body>
                <div class="main">
                    ${marked.marked(fs.readFileSync("./readme.md").toString(), { mangle: false, headerIds: false })}
                </div>
            </body>

            </html>`;
    fastify.get('/index.html', async (request, reply) => {
        reply.type('text/html').code(200)
        return readmeHtml
    });
    fastify.register(require('./svg_card_route'));
    fastify.register(require('@fastify/static'), {
        root: path.join(__dirname, 'public'),
        prefix: '/'
    });
}

module.exports = routes