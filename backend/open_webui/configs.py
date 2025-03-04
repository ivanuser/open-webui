# backend/open_webui/config.py
# Add the following to the existing configuration models

# In the imports section, add:
from pydantic import BaseModel, Field


# Add this class along with other models
class LogoSettings(BaseModel):
    CUSTOM_LOGO_PATH: Optional[str] = None
    DEFAULT_LOGO_PATH: str = "/static/favicon.png"


# Update the main Config class to include logo settings
class Config(BaseSettings):
    # existing fields...

    # Add logo settings
    CUSTOM_LOGO_PATH: Optional[str] = None
    DEFAULT_LOGO_PATH: str = "/favicon/favicon-32x32.png"

    # Add logo settings to the model_config class if needed