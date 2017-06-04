import express from 'express'
import mongoose from 'mongoose'
import helmet from 'helmet'
import morgan from 'morgan'
import bodyParser from 'body-parser'

import wwwRouter from '~/config/routes/www'
import databases from '~/config/databases'

let app = express()
let logger = morgan('combined')

if (!process.env.web_www) process.env.web_www = 1

if (!mongoose.connection.db) {
    mongoose.connect(databases.mongodb.uri, databases.mongodb.options)
}
mongoose.Promise = require('bluebird')
mongoose.connection
    .on('connected', () => {
        console.info(`<ORBITAL WWW> | ${process.pid} | DATABASE - Connected to database`)
    })
    .on('error', (err) => {
        console.warn(`<ORBITAL WWW> | ${process.pid} | DATABASE - Database connection errored > ${err}`)
    })
    .on('disconnected', () => {
        console.info(`<ORBITAL WWW> | ${process.pid} | DATABASE - Disconnected from database`)
    })

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
app.set('views', 'dist/views')
app.set('view engine', 'pug')

app.use((req, res, next) => {
    res.header('X-Robots-Tag', 'none, nosnippet, noimageindex, notranslate, noodp')
    return next()
})

app.get('/robots.txt', (req, res) => {
    res.type('text/plain')
    return res.send('User-agent: *\nDisallow: /')
})

app.use('/', wwwRouter)

app.on('mount', (parent) => {
    console.info(`<ORBITAL WWW> | ${process.pid} | WWW - WWW mounted`)
})

if (!process.env.web) {
    app.listen('8080', () => {
        console.info(`<ORBITAL WWW> | ${process.pid} | WWW - WWW ready`)
    })
}

console.info(`<ORBITAL WWW> | ${process.pid} | CLUSTER - Worker thread is running on ${process.pid}`)

export default app