const User = require('../models/User')
const {StatusCodes} = require('http-status-codes')
const CustomError = require('../errors')
const {attachCookiesToResponse, createTokenUser} = require('../utils')


const register = async (req,res)=>{
    const {email,name,password} = req.body

    const emailAlreadyExists = await User.findOne({email})
    if(emailAlreadyExists){
        throw new CustomError.BadRequestError("Email already exists")
    }
    
    // first registered user is admin
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin' : 'user';


    const user = await User.create({name, email, password, role})
    const tokenUser = createTokenUser(user)

    // const token = createJWT({payload: tokenUser}) // createJWT method comes from utils under jwt.js, we are passing payload in it.

   
    attachCookiesToResponse({res,user:tokenUser})
    res.status(StatusCodes.CREATED).json({user: tokenUser}) // status code for CREATED is 201

    
}

const login = async (req,res)=>{
    const {email, password} = req.body

    if(!email || !password){
        throw new CustomError.BadRequestError("Please provide email and passsword") //error code 400     
    }
    const user = await User.findOne({email})

    if(!user){
        throw new CustomError.UnauthenticatedError('Invalid Credentials')
    }

    const isPasswordCorrect = await user.comparePassword(password)
    if(!isPasswordCorrect){
        throw new CustomError.UnauthenticatedError("Invalid Credentials")
    }
    const tokenUser = createTokenUser(user)
    attachCookiesToResponse({res, user: tokenUser})
    res.status(StatusCodes.OK).json({user: tokenUser}) // status code 200
}

const logout = async (req,res)=>{
    res.cookie('token','logout',{
        httpOnly: true,
        expires: new Date(Date.now() )
    })
    res.status(StatusCodes.OK).json({msg:"user logged out!"})
}

module.exports = {
    register,
    login,
    logout
}