import Calmwave from "../models/Calmwave.js"

const { Support } = Calmwave

class supportService {
    async getAll() {
        try {
            const requests = await Support.find()
            return requests
        } catch(error){
            console.log(error)
        }
    }

    async getAllPerUser(userId){
        try {
            const requests = await Support.find({ userId: userId })
            return requests
        } catch(error){
            console.log(error)
        }
    }
    
    async Create(requestData){
        try{
            const newRequest = new Support(requestData)
            await newRequest.save()
        } catch(error){
            console.log(error)
        }
    }

    async Delete(id){
        try{
            await Support.findByIdAndDelete(id)
            console.log(`Requisição com id: ${id} foi excluído de sua base de dados!`)
        } catch(error){
            console.log(error)
        }
    }

    async Update(id, requestData) {
        try {
            // O segundo parâmetro usa { new: true } para retornar o documento atualizado
            const updatedRequest = await Support.findByIdAndUpdate(id, requestData, { new: true })
            console.log(`Dados da requisição com id: ${id} alterado com sucesso.`)
            return updatedRequest // Retorne a requisição atualizada, se necessário
        } catch (error) {
            console.log(error)
        }
    }

    async UpdatePerUser(id, userId, requestData){
        try{
            const updateRequest = await Support.findOneAndUpdate(
                { _id: id, userId: userId },
                requestData,
                { new: true }
            )
            console.log(`Dados de sua requisição com id: ${id} alterados com sucesso.`)
            return updateRequest
        } catch(error){
            console.log(error)
        }
    }

    async getOne(id){
        try{
            const request = await Support.findOne({_id: id})
            return request
        }catch(error){
            console.log(error)
        }
    }

    async getOnePerUser(id, userId){
        try{
            const requestUser = await Support.findOne({_id: id, userId: userId})
            return requestUser
        }catch(error){
            console.log(error)
        }
    }
}

export default new supportService()