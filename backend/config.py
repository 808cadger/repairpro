"""config.py — AutoRepairIQ Pro Pydantic settings"""
# Aloha from Pearl City! 🌺

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    db_path: str = "./autorepairiq.db"
    api_token: str = ""
    cors_origins: str = "capacitor://localhost,http://localhost,http://localhost:8080"
    image_upload_dir: str = "./uploads"
    max_image_size_mb: int = 10
    default_labor_rate: float = 110.0  # #ASSUMPTION: Hawaii indie shop average

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
