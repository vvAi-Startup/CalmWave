import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_ATLAS_URI}`)
    console.log('MongoDB conectado...')
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB', error)
    process.exit(1) // Sair da aplicação se falhar
  }
};

connectDB()

export default mongoose
