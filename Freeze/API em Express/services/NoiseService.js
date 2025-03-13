import Calmwave from "../models/Calmwave.js"

const { Noise } = Calmwave

class noiseService {
    async getAll() {
        try {
            const noises = await Noise.find()
            return noises
        } catch(error){
            console.log(error)
        }
    }

    async getAllPerUser(userId){
        try {
            const noises = await Noise.find({ userId: userId })
            return noises
        } catch(error){
            console.log(error)
        }
    }
    
    async Create(noiseData){
        try{
            const newNoise = new Noise(noiseData)
            await newNoise.save()
        } catch(error){
            console.log(error)
        }
    }

    async Delete(id){
        try{
            await Noise.findByIdAndDelete(id)
            console.log(`Ruído com id: ${id} foi excluído de sua base de dados!`)
        } catch(error){
            console.log(error)
        }
    }

    async DeletePerUser(id, userId){
        try{
            await Noise.findOneAndDelete({_id: id, userId: userId})
            console.log(`Ruído com id: ${id} foi excluído de sua conta!`)
        } catch(error){
            console.log(error)
        }
    }

    async Update(id, noiseData) {
        try {
            // O segundo parâmetro usa { new: true } para retornar o documento atualizado
            const updatedNoise = await Noise.findByIdAndUpdate(id, noiseData, { new: true })
            console.log(`Dados do ruído com id: ${id} alterado com sucesso.`)
            return updatedNoise // Retorne o ruído atualizado, se necessário
        } catch (error) {
            console.log(error)
        }
    }

    async UpdatePerUser(id, userId, noiseData){
        try{
            const updateNoise = await Noise.findOneAndUpdate(
                { _id: id, userId: userId },
                noiseData,
                { new: true }
            )
            console.log(`Dados do seu ruído com id: ${id} alterado com sucesso.`)
            return updateNoise
        } catch(error){
            console.log(error)
        }
    }

    async getOne(id){
        try{
            const noise = await Noise.findOne({_id: id})
            return noise
        }catch(error){
            console.log(error)
        }
    }

    async getOnePerUser(id, userId){
        try{
            const noiseUser = await Noise.findOne({_id: id, userId: userId})
            return noiseUser
        }catch(error){
            console.log(error)
        }
    }
}

export default new noiseService()