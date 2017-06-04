import express from 'express'
const router = express.Router()

router.route('/')
    .get((req, res, next) => {
        res.render('index', { title: 'Testing', message: 'First Comment!', message1: 'Second comment'})
    })

export default router