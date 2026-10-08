"""Pydantic request / response models for the auth endpoints."""

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=80)


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleCallbackRequest(BaseModel):
    code: str


class AuthResponse(BaseModel):
    token: str
    user_id: int
    display_name: str


class ProvidersResponse(BaseModel):
    email: bool = True
    google: bool = False
