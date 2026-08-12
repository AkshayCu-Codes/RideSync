from app.core.config import Settings


def test_cors_origins_are_parsed_from_comma_separated_environment_value() -> None:
    settings = Settings(cors_origins="https://app.ridesync.example, https://admin.ridesync.example")

    assert settings.allowed_cors_origins == [
        "https://app.ridesync.example",
        "https://admin.ridesync.example",
    ]
