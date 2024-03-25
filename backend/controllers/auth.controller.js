import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/generateToken.js";

export const signup = async (req, res) => {
    try {
        const {fullName, username, password, confirmPassword, gender} = req.body;

        if(password !== confirmPassword) {
            return res.status(400).json({error:"Passwords do not match!"});
        }

        const user = await User.findOne({username});

        if(user) {
            return res.status(400).json({error:"Username already exists! Try another one."});
        }

        // HASH PASSWORD
        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(password, salt);

        const boyProfilePicture = `https://avatar.iran.liara.run/public/boy?username=${username}`;
        const girlProfilePicture = `https://avatar.iran.liara.run/public/girl?username=${username}`;

        const newUser = new User({
            fullName,
            username,
            password: hashedPwd,
            gender,
            profilePicture: gender === 'male' ? boyProfilePicture : girlProfilePicture,
        })

        if(newUser) {
            // Generate JWT token
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                profilePicture: newUser.profilePicture
        })
        } else {
            return res.status(400).json({error:"Invalid user data."});
        }
    } catch (error) {
        console.log('Error in signup controller', error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
};

export const login = async (req, res) => {
    try {
        const {username, password} = req.body;
        const user = await User.findOne({username});
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || '');

        if(!user || !isPasswordCorrect) {
            return res.status(400).json({error: 'Invalid credentials'})
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            profilePicture: user.profilePicture,
        });

        console.log("logged as: ", user.username);

    } catch (error) {
        console.log('Error in login controller', error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
};

export const logout = async (req, res) => {
    try {
        res.cookie('jwt', '', {maxAge:0});
        res.status(200).json({message:'Logged out successfully'})
    } catch (error) {
        console.log('Error in logout controller', error.message);
        res.status(500).json({error:"Internal Server Error"});
    }
};
