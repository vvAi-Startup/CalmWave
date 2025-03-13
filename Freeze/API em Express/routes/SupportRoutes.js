import express from 'express'
const supportRoutes = express.Router()
import SupportController from '../controllers/SupportController.js'
import Auth from '../middleware/Auth.js'
import CheckAdmin from '../middleware/CheckAdmin.js'

supportRoutes.post('/support', Auth.Authorization, SupportController.createRequest)
supportRoutes.get('/support/:id', Auth.Authorization, SupportController.getOneRequest)
supportRoutes.get('/supports', Auth.Authorization, SupportController.getAllRequests)
supportRoutes.put('/support/:id', Auth.Authorization, SupportController.updateRequest)
supportRoutes.delete('/support/:id', Auth.Authorization, CheckAdmin.checkAdminRole, SupportController.deleteRequest)

export default supportRoutes
