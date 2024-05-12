import express from 'express'
import {getAllUser, registerUser, login, DeleteUser, UpdateUser, findUserById, countNewMembersOfMonth} from '../controllers/UserController.js'
const UserRouter = express.Router()
import {isAuth, isAdmin} from '../untils/until.js'
import { upload } from "../untils/until.js";

UserRouter.post('/register', registerUser)
UserRouter.post('/login', login)

UserRouter.get('/', getAllUser)
UserRouter.put('/update',upload.single("avatar"), UpdateUser)
UserRouter.delete('/delete/:id',upload.single("avatar"), DeleteUser)
UserRouter.get("/detail/:id", findUserById)

UserRouter.get('/getNewUser', countNewMembersOfMonth)

export default UserRouter
