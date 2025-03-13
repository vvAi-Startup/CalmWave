import express from 'express'
const userRoutes = express.Router()
import UserController from "../controllers/UserController.js"
import Auth from '../middleware/Auth.js'
import CheckAdmin from '../middleware/CheckAdmin.js'

userRoutes.post('/register', UserController.registerUser)
userRoutes.post('/login', UserController.loginUser)
userRoutes.post('/logout', Auth.Authorization, UserController.logoutUser)
userRoutes.delete('/delete-user/:id', Auth.Authorization, UserController.deleteUser)
userRoutes.put('/update-user/:id', Auth.Authorization, UserController.updateUser)
userRoutes.get('/user/:id', Auth.Authorization, UserController.getOneUser)
userRoutes.get('/users', Auth.Authorization, CheckAdmin.checkAdminRole, UserController.getAllUsers)

export default userRoutes
