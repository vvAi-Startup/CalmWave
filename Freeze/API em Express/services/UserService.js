import Calmwave from "../models/Calmwave.js"

const { User } = Calmwave

import bcrypt from 'bcrypt'

class userService{
    async getAll(){
        try {
            const users = await User.find()
            return users
        } catch(error){
            console.log(error)
        }
    }
    async Create(userData){
        try{
            const saltRounds = 10
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds)
            const newUserData = {...userData, password: hashedPassword}

            const newUser = new User(newUserData)
            await newUser.save()
        } catch(error){
            console.log(error)
        }
    }
    async Delete(id){
        try{
            const deleteUser = await User.findByIdAndDelete(id)
            if (deleteUser){
            console.log(`Usuário excluído com sucesso`)
            return true
        }else{
            console.log('Usuário não encontrado')
        }
        }catch(error){
            console.log(error)
            throw error
        }
    }

    async Update(id, userData){
        try {
            const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true });
            console.log(`Dados do usuário com id: ${id} alterados com sucesso.`);
            return updatedUser; 
        } catch (error) {
            console.log(error);
        }
    }

    async getOne(email){
        try{
            const user = await User.findOne({email: email})
            return user
        }catch(error){
            console.log(error)
        }
    }

    async getOnePerUser(email, userId){
        try{
            const user = await User.findOne({email: email, userId: userId})
            return user
        }catch(error){
            console.log(error)
        }
    }
}

export default new userService()