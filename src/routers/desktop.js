const express = require('express')
const multer = require('multer')
const router = new express.Router()

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './src/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname + '-' + Date.now())
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(desktop)$/)) {
            return cb(new Error('Please upload a jpeg file'))
        }
        cb(undefined, true)
    }
})

router.post('/desktop/upload', upload.single('jpeg'), async (req, res) => {
    try {
        const path = req.file.path
        console.log("uploaded to:"  + path)
        const obj = {
            filename: req.file.filename
        }
        res.send(obj)
    } catch (e) {
        res.status(400).send(e)
    }

}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

module.exports = router