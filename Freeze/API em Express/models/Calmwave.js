import mongoose from 'mongoose'

// Definindo o schema para User
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, 'Por favor, insira um email válido.']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  cellphone_number: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'], 
    default: 'user'
  },
}, {timestamps: true})

// Definindo o schema para Noise
const NoiseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  
    required: true
  },
  noiseType: {
    type: String,
    required: true,
    enum: ['Branco', 'Marrom', 'Rosa', 'Customizado'] 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  description:{
    type: String,
    required: true
  },
  filePath: {
    type: String, 
    required: true
  },
  loop: {
    type: Boolean, 
    default: false 
  },
  duration: {
    type: String,
    required: true, 
    validate: {
      validator: function (v) {
        // Valida o formato "hh:mm:ss"
        return /^\d{2}:\d{2}:\d{2}$/.test(v);
      },
      message: props => `${props.value} não é um formato de duração válido (use hh:mm:ss)!`
    }
  },
  averageFrequency: {
    type: Number, 
    required: true, 
    min: 0 
  }
})

// Definindo o schema para Suporte
const SupportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  typeRequest: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isAtive: {
    type: Boolean,
    default: true
  }
}, {timestamps: true})

// Exportando os modelos
const User = mongoose.model('User', UserSchema)
const Noise = mongoose.model('Noise', NoiseSchema)
const Support = mongoose.model('Support', SupportSchema)

export default { User, Noise, Support }
