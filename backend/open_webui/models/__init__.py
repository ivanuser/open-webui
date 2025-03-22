"""
Models package for Open WebUI.
"""

# Import models
from .users import UserModel, Users
from .auths import User, UserCreate, Token, TokenData, UserInDB

# Export models
__all__ = [
    "UserModel",
    "Users",
    "User",
    "UserCreate",
    "Token",
    "TokenData",
    "UserInDB"
]
