const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const {sendWelcomeEmail, sendCancellingEmail} = require('../emails/account');

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// create new user
router.post('/users', async (req, res)=>{
    const user = new User(req.body);
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();

        res.status(201).send({user, token})

    } catch(e) {
        res.status(400).send(e)
    }
});


// updating user
router.patch('/users/me', auth, async(req,res)=>{
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every(update=>allowedUpdates.includes(update));

    if (!isValidOperation){
        return res.status(400).send({error:'invalid updates'})
    }
    try {
        updates.forEach( update => req.user[update]=req.body[update]);
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
})

// login user
router.post('/users/login', async (req, res)=>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken();
        res.send({user, token })
    } catch (e) {
        res.status(404).send()
    }
})

// logout
router.post('/users/logout', auth, async(req,res)=>{
    try {
        req.user.tokens = req.user.tokens.filter(token =>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// logout from all devices
router.post('/users/logoutAll', auth, async (req,res)=>{
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send()
    } catch(e) {
        res.status(500).send();
    }
})

// delete user
router.delete('/users/me', auth, async (req, res)=>{
    try {
        sendCancellingEmail(req.user.email, req.user.name)
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// kazu multeru gde da cuva slike, u kom folderu
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter: function(req,file,cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png$)/)) {
            return cb(new Error('please upload a jpg,jpeg or png image'))
        }
        cb(undefined, true)
    }
})

// upload image or update it
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res)=>{
    //ubaci binarni zapis slike u bazu na polje avatar (napravi ga na modelu)- preko sharp-a modifikuj
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save()
    res.send()
    }, (error, req,res,next)=>{
    res.status(400).send({error: error.message})
})

// delete user's profile image
router.delete('/users/me/avatar', auth, async(req,res)=> {
            req.user.avatar = undefined
            await req.user.save()
            res.send()
    }
)

// serving up the avatar
router.get('/users/:id/avatar', async(req,res)=>{
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})


module.exports = router;