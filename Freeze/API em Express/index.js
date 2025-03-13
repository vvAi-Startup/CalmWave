import express from 'express'
import cors from 'cors'
const app = express()
import dotenv from 'dotenv'
dotenv.config()

import mongoose from './config/connection-db.js'
import User from './models/Calmwave.js'
import Noise from './models/Calmwave.js'
import Support from './models/Calmwave.js'

// Middleware para processar JSON
app.use(express.json())

app.use(express.urlencoded({extended: false}))

app.use(cors())

// Rotas de autenticação
import noiseRoutes from './routes/NoiseRoutes.js'
app.use('/', noiseRoutes)
import userRoutes from './routes/UserRoutes.js'
app.use('/', userRoutes)
import supportRoutes from './routes/SupportRoutes.js'
app.use('/', supportRoutes)

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, (error) => {
  if(error){
    console.log(error)
  }
  console.log(`Servidor rodando na porta http://localhost:${PORT}`)
})
