import {UserModel} from '../models/UserModel.js'
import {generateToken} from '../untils/until.js'
import expressAsyncHandler from 'express-async-handler'
import cloudinary from 'cloudinary'
import {AccessLogModel} from '../models/AccessLogModel.js'

const saveAccessLog = async () => {
    try {
        const accessLog = new AccessLogModel({
            timestamp: new Date()
        });

        await accessLog.save();
        console.log('Access log saved successfully');
    } catch (error) {
        console.error('Error saving access log:', error);
    }
}

export const getAllUser = (req, res) => {
    saveAccessLog();

    UserModel.find({})
        .then(user => res.send(user))
        .catch(err => console.log(err))
}

export const registerUser = expressAsyncHandler(async (req, res) => {
    saveAccessLog();

    const user = new UserModel({
        // _id: req.body._id,
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        address: '',
        phone: '',
        isAdmin: false,
    })
    const createUser = user.save();
    res.send({
        _id: user._id,
        name: user.name,
        email: user.email,
        password: user.password,
        address: user.address ,
        phone: user.phone,
        token: generateToken(user),
    });
})

export const login = expressAsyncHandler(async (req, res) => {
    const user = await  UserModel.findOne({email: req.body.email, password: req.body.password})
    if(user){ 
        res.send({
            _id: user._id,
            name: user.name,
            email: user.email,
            password: user.password,
            address: user.address ,
            phone: user.phone,
            isAdmin: user.isAdmin,
            token: generateToken(user),
        });
    }else{
        res.status(401).send({message: "invalid email or password"})
    }
})

export const UpdateUser = expressAsyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.body._id);

    if (!user) {
        return res.status(404).send("User not found");
    }

    let result;

    if (req.file) {
        result = await cloudinary.uploader.upload(req.file.path, {
            folder: "dev_setups",
        });
        user.avatar = result.secure_url;
    }

    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;
    user.address = req.body.address;
    user.phone = req.body.phone;
    user.avatar = result?.secure_url || user.avatar;

    const updatedUser = await user.save();
    if (updatedUser) {
        return res.send("Update success");
    } else {
        return res.status(500).send("Update failed");
    }
});

export const DeleteUser = expressAsyncHandler(async (req, res) => {
    const user = await UserModel.findById({_id: req.params.id})

    if(user){
        await user.remove()
        res.send({message: 'user deleted'})
    }else{
        res.send({message: 'user not exists'})
    }
})

export const findUserById = expressAsyncHandler(async (req, res) => {
    const user = await UserModel.findById({ _id: req.params.id })

    if (user) {
        res.send(user)
    } else {
        res.send({ message: 'user not found' })
    }
})

export const countNewMembersOfMonth = async (req, res) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const count = await UserModel.countDocuments({
        createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });
    
    res.json({ count });
};


// export const countMonthlyAccess = async (req, res) => {
//     const today = new Date();
//     const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//     const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//     lastDayOfMonth.setHours(23, 59, 59, 999);

//     const count = await AccessLogModel.countDocuments({
//         timestamp: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
//     });
//     res.json({ count });
//     return count;
// }

