import express from 'express'
import mongoose from 'mongoose'
import helmet from 'helmet'
import morgan from 'morgan'
import bodyParser from 'body-parser'

import wwwApp from '~/lib/apps/www'
import databases from '~/config/databases'

let app = express()
let logger = morgan('combined')

if (!process.env.web) process.env.web = 1

if (!mongoose.connection.db) {
    mongoose.connect(databases.mongodb.uri, databases.mongodb.options)
}
mongoose.Promise = require('bluebird')
mongoose.connection
    .on('connected', () => {
        console.info(`<ORBITAL Web Server> | ${process.pid} | DATABASE - Connected to database`)
    })
    .on('error', (err) => {
        console.warn(`<ORBITAL Web Server> | ${process.pid} | DATABASE - Database connection errored > ${err}`)
    })
    .on('disconnected', () => {
        console.info(`<ORBITAL Web Server> | ${process.pid} | DATABASE - Disconnected from database`)
    })

require('events').EventEmitter.prototype._maxListeners = 100

function gracefulShutdown() {
    mongoose.connection.close(() => {
        process.exit(0)
    })
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT' , gracefulShutdown)

app.use(helmet())
app.use(logger)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.set('json spaces', 2)
app.use((req, res, next) => {
    res.header('X-Robots-Tag', 'none, nosnippet, noimageindex, notranslate, noodp')
    return next()
})

app.get('/robots.txt', (req, res) => {
    res.type('text/plain')
    return res.send('User-agent: *\nDisallow: /')
})

app.use('/', wwwApp)

app.listen('8080', () => {
    console.info(`<ORBITAL Web Server> | ${process.pid} | WEB - Application ready`)
})

function gracefulShutdown() {
    Promise.resolve()
        .then(mongoose.connection.close(() => {
            return true
        }))
        .then(() => {
            process.exit(0)
        })
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT' , gracefulShutdown)

console.info(`<ORBITAL Web Server> | ${process.pid} | CLUSTER - Worker thread is running on ${process.pid}`)

export default app