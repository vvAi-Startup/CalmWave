import supportService from "../services/SupportService.js"
import { ObjectId } from "mongodb"
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const sendSupportEmail = async (supportRequest, userEmail, nameUser) => {
  try {
    // Configuração do transporter para enviar e-mail
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Usando o Gmail (pode ser alterado para outro provedor)
      auth: {
        user: process.env.EMAIL, // Seu e-mail
        pass: process.env.SENHA_EMAIL, // Senha do e-mail ou app password
      },
    })
    const mailOptions = {
      from: userEmail,
      to: process.env.EMAIL, // E-mail do destinatário (admin)
      subject: supportRequest.typeRequest || 'Nova Requisição de Suporte',
      text: `Você recebeu uma nova requisição de suporte:\n\n
             Nome: ${nameUser}\n
             Email: ${userEmail}\n
             Tipo: ${supportRequest.typeRequest}\n
             Mensagem: ${supportRequest.content}\n
             ID do Usuário: ${supportRequest.userId}`, // Incluindo o ID do usuário
    }

    // Enviar o e-mail
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error)
  }
}


const createRequest = async (req, res) => {
  try {
    const {email, id: userId, name:nameUser} = req.loggedUser
    const requestData = {
      ...req.body,
      userId,
    } 
    const supportRequest = await supportService.Create(requestData)
    if(supportRequest){
      await sendSupportEmail(supportRequest, email, nameUser)
      return res.status(201).json({ message: "Requisição de suporte criada com sucesso!" }) 
    }
  } catch (error) {
    res.status(500).json({ error: `Erro ao criar requisição: ${error.message}` })
  }
}

const getAllRequests = async (req, res) => {
  try {
    const { role, id: userId} = req.loggedUser
    if(role === 'admin'){
      const requests = await supportService.getAll()
      res.status(200).json({requests})
    }else{
      const requests = await supportService.getAllPerUser(userId)
      if(!requests){
        return res.status(403).json({ error: "Não existe nenhuma requisição feita nesta conta!" })
      }
      return res.status(200).json({requests})
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: `Erro ao obter requisições: ${error}` })
  }
}


const deleteRequest = async (req, res) => {
  try{
    if (ObjectId.isValid(req.params.id)){
      const id = req.params.id
      supportService.Delete(id)
      res.sendStatus(204)
    }else{
      res.sendStatus(400) // BAD REQUEST
    }
  }catch(error){
    res.status(500).json({ error: `Erro ao deletar requisição: ${error}` })
  }
}

const updateRequest = async (req, res) => {
  try{
    const id = req.params.id
    const { role, id: userId } = req.loggedUser

    if(ObjectId.isValid(id)){

      const requestUpdateData = req.body

      if(role === 'admin'){
        const updatedRequest = await supportService.Update(id, requestUpdateData)
      if(!updatedRequest){
        res.status(404).json({error: 'Requisição não encontrada'})
      } 
      return res.status(200).json({updatedRequest})
      }else{
        const updatedRequest = await supportService.UpdatePerUser(id, userId, requestUpdateData)
        if(!updatedRequest){
          return res.status(403).json({error: 'Requisição não encontrado em sua conta'})
        }
        return res.status(200).json({updatedRequest})
      }
      }else{
        res.status(400).json({ error: 'ID inválido '})
    }
  }catch(error){
      res.status(500).json({error: `Erro ao atualizar: ${error.message}`})
  }
}

const getOneRequest = async (req, res) =>{
  try{
    const id = req.params.id
    const { role, id: userId } = req.loggedUser

    if(ObjectId.isValid(id)){
      if(role === 'admin'){
        const request = await supportService.getOne(id)
      if(!request){
        return res.status(404).json({error: 'Requisição não encontrada'})
      } 
      return res.status(200).json({request})
      }else{
        const request = await supportService.getOnePerUser(id, userId)
        if(!request){
          return res.status(403).json({ error: "Não existe nenhuma requisição com esse ID em sua conta!" })
        }
        return res.status(200).json({request})
      }
      }else{
        res.status(400).json({ error: 'ID inválido '})
    } 
    }catch(error){
    res.status(500).json({error: "Erro interno do servidor"})
  }
}

export default { getAllRequests, getOneRequest, createRequest, updateRequest, deleteRequest}



