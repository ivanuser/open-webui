from setuptools import setup, find_packages

setup(
    name="open-webui-mcp",
    version="0.1.0",
    description="Model Context Protocol (MCP) implementation for Open WebUI",
    author="Open WebUI Team",
    author_email="info@open-webui.com",
    packages=find_packages(),
    install_requires=[
        "modelcontextprotocol>=0.2.0",
        "websockets>=12.0",
        "psutil>=5.9.0",
        "aiohttp>=3.9.0",
        "requests>=2.28.0",
        "uvicorn>=0.20.0",
        "fastapi>=0.100.0",
        "pydantic>=2.0.0",
    ],
    python_requires=">=3.9",
)
