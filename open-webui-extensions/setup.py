#!/usr/bin/env python3
"""
Setup script for the Open WebUI Extension System
"""

from setuptools import setup, find_packages

setup(
    name="open-webui-extensions",
    version="0.1.0",
    description="Extension System for Open WebUI",
    author="Open WebUI Team",
    author_email="info@open-webui.com",
    url="https://github.com/open-webui/open-webui-extensions",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "fastapi>=0.68.0",
        "pydantic>=1.8.2",
        "typing-extensions>=3.10.0",
    ],
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.7",
    entry_points={
        "console_scripts": [
            "open-webui-extensions-install=open_webui_extensions.install:main",
        ],
    },
)
