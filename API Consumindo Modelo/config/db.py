import os
from pymongo import MongoClient
from dotenv import load_dotenv
from mongoengine import connect
# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# Obter a URI do MongoDB do arquivo .env
MONGO_URI = os.getenv("MONGO_URI")

def initialize_db():
    if not MONGO_URI:
        print("Erro: A variável de ambiente MONGO_URI não foi definida.")
        return
    try:
        connect(host=MONGO_URI)
        print('Conectado ao MongoDB com sucesso!')
    except Exception as e:
        print(f'Erro de conexão: {e}')