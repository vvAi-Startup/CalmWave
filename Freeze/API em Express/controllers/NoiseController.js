import noiseService from "../services/NoiseService.js";
import { ObjectId } from "mongodb"

const getAllNoises = async (req, res) => {
  try {
    const { role, id: userId} = req.loggedUser
    if(role === 'admin'){
      const noises = await noiseService.getAll()
      res.status(200).json({noises})
    }else{
      const noises = await noiseService.getAllPerUser(userId)
      if(!noises){
        return res.status(403).json({ error: "Não existe nenhum ruído nessa conta!" })
      }
      return res.status(200).json({noises})
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: `Erro ao obter ruídos: ${error}` })
  }
}

const createNoise = async (req, res) => {
  try {
    const userId = req.loggedUser.id

    const noiseData = {
      ...req.body,
      userId
    } 
    await noiseService.Create(noiseData)
    res.status(201).json({ message: "Ruído adicionado com sucesso!"}) 
  } catch (error) {
    res.status(500).json({ error: `Erro ao criar ruído: ${error.message}` })
  }
}

const deleteNoise = async (req, res) => {
  try{
    const id = req.params.id
    const { role, id: userId } = req.loggedUser

    if (ObjectId.isValid(id)){
      if(role === 'admin'){
        await noiseService.Delete(id)
        res.sendStatus(204)
      }else{
        await noiseService.DeletePerUser(id, userId)
        res.sendStatus(204)
      }
    }else{
      return res.status(400).json({ error: 'ID inválido.' }) 
    }
  }catch(error){
    res.status(500).json({ error: `Erro ao deletar ruído: ${error}` })
  }
}

const updateNoise = async (req, res) => {
  try{
    const id = req.params.id
    const { role, id: userId } = req.loggedUser

    if(ObjectId.isValid(id)){

      const noiseUpdateData = req.body
      
      if(role === 'admin'){
        const updatedNoise = await noiseService.Update(id, noiseUpdateData)
        if(!updatedNoise){
          return res.status(404).json({error: 'Ruído não encontrado'})
        }
        return res.status(200).json({updatedNoise}) // OK! 
      }else{
        const updatedNoise = await noiseService.UpdatePerUser(id, userId, noiseUpdateData)
        if(!updatedNoise){
          return res.status(403).json({error: 'Ruído não encontrado em sua conta'})
        }
        return res.status(200).json({updatedNoise})
      }
    }else{
      res.status(400).json({ error: 'ID inválido '})
    }
  } catch(error){
      res.status(500).json({error: `Erro ao atualizar: ${error}`})
  }
}

const getOneNoise = async (req, res) =>{
  try{
    const id = req.params.id
    const { role, id: userId } = req.loggedUser

    if(ObjectId.isValid(id)){
      if(role === 'admin'){
        const noise = await noiseService.getOne(id)
        if(!noise){
          return res.status(404).json({error: 'Ruído não encontrado'})
        }
        return res.status(200).json({noise})
      } else{
        const noise = await noiseService.getOnePerUser(id, userId)
        if(!noise){
          return res.status(403).json({ error: "Não existe nenhum ruído com esse ID em sua conta!" })
        }
        return res.status(200).json({noise})
      }
    }else{
      return res.status(400).json({ error: 'ID inválido '})
    }
  }catch(error){
    res.status(500).json({error: `Erro interno do servidor ${error}`})
  }
}

export default { getAllNoises, getOneNoise, createNoise, updateNoise, deleteNoise }