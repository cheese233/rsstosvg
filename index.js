const fastify = require('fastify')({
    logger: true
})
const path = require('path')
const fs = require('fs')
const marked = require("marked")
const readmeHtml = marked.marked(fs.readFileSync("./readme.md").toString(), { mangle: false, headerIds: false });
fastify.get('/', async (request, reply) => {
    reply.type('text/html').code(200)
    return `<!DOCTYPE html>
            <html>

            <head>
                <link rel="stylesheet" href="index.css">
            </head>

            <body>
                <div class="main">
                    ${readmeHtml}
                </div>
            </body>

            </html>`
});
fastify.register(require('./svg_card_route'));
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/'
});
fastify.listen({ port: 3008 }, (err, address) => {
    if (err) throw err
    console.log(`Server is now listening on ${address}`);
})