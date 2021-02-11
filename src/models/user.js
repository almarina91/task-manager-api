const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value){
            if(value < 0){
                throw new Error('Age must be greater than 0')
            }
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value){
            // noinspection JSUnresolvedFunction
            if (!validator.isEmail(value)) {
                throw new Error ('Email is invalid!')
            }
        }
    },
    avatar: {
        type: Buffer
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('a password can not contain the word password')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

// kaze mongoose-u kako su ove dve povezane

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField:'owner'
})

// this will remove sensitive data from what we return

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

// this will be available on user instance

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({ token });
    user.save();
    return token
}

// this will be available on User model
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email: email});
    if (!user) {
        throw new Error ('Unable to login!')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch) {
        throw new Error ('Unable to login')
    }
    return user
}

// hash the plain text password before saving
userSchema.pre('save', async function(next){
    const user = this;
    if (user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next();
})

// delete all tasks from a user when the user is deleted

userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({owner: user._id})
    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;