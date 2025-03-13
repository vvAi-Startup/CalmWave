// middleware/checkAdminRole.js
const checkAdminRole = (req, res, next) => {
    const { role } = req.loggedUser // A role do usuário já está disponível em req.loggedUser
    
    if (role !== 'admin') {
      return res.status(403).json({ error: "Acesso negado. Somente administradores podem acessar essa rota." })
    }
  
    next() // Usuário é administrador, segue para a rota
  }
  
  export default { checkAdminRole }
  
  