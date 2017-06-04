import mongoose from 'mongoose'
import cluster from 'cluster'
import databases from '~/config/databases'

let webWorkers = []

mongoose.connect(databases.mongodb.uri, databases.mongodb.options)
mongoose.Promise = require('bluebird')

require('events').EventEmitter.prototype._maxListeners = 100

if (cluster.isMaster) {
    console.info(`<ORBITAL Core> | ${process.pid} | CLUSTER - Master thread is running on ${process.pid}`)

    let numCPUs = require('os').cpus().length
    numCPUs = 2
    for (let i = 0; i < numCPUs; i++) {
        addWebWorker()
    }

    cluster.on('exit', (worker, code, signal) => {
        if (webWorkers.indexOf(worker.id) != -1) {
            console.warn(`<ORBITAL Web Server> | ${worker.process.pid} | CLUSTER - Worker thread ${worker.process.pid} died > ${signal || code}`)
            removeWebWorker(worker.id)
            addWebWorker()
        }
    })

} else {
    if (process.env.web) {
        require('~/web')
    }
}

function addWebWorker() {
    webWorkers.push(cluster.fork({web: 1}).id)
}

function removeWebWorker(id) {
    webWorkers.splice(webWorkers.indexOf(id), 1)
}