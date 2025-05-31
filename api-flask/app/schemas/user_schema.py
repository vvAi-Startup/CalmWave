from marshmallow import Schema, fields, validate

class UserSchema(Schema):
    """Schema for user data (output)."""
    id = fields.Str(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=3))
    email = fields.Email(required=True)

class UserRegistrationSchema(Schema):
    """Schema for user registration input."""
    name = fields.Str(required=True, validate=validate.Length(min=3))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6), load_only=True) # load_only=True means it's only for input

class UserLoginSchema(Schema):
    """Schema for user login input."""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)

class TokenSchema(Schema):
    """Schema for JWT token response."""
    token = fields.Str(required=True)
    user = fields.Nested(UserSchema, required=True)