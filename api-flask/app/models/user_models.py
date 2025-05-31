from app.extensions import users_collection, logger
from bson.objectid import ObjectId

class UserModel:
    def __init__(self):
        self.collection = users_collection
        if self.collection is None:
            raise RuntimeError("MongoDB collection 'users' not initialized. Call init_mongo() first.")

    def find_by_email(self, email):
        """Finds a user by email."""
        user = self.collection.find_one({'email': email})
        if user:
            user['_id'] = str(user['_id'])
        return user

    def find_by_id(self, user_id):
        """Finds a user by ID."""
        try:
            user = self.collection.find_one({'_id': ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
            return user
        except Exception:
            return None # Invalid ObjectId

    def create_user(self, user_data):
        """Creates a new user."""
        result = self.collection.insert_one(user_data)
        logger.info(f"User created with ID: {result.inserted_id}")
        return str(result.inserted_id)

    # You can add more methods here as needed (e.g., update_user, delete_user)