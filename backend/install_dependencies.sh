#!/bin/bash
# Script to install missing dependencies for Open WebUI

# Activate virtual environment if it exists
if [ -d "open-webui" ]; then
  echo "Activating virtual environment..."
  source open-webui/bin/activate
fi

# Install the critical missing dependency
echo "Installing pydantic-settings..."
pip install pydantic-settings

# Optionally install all requirements
echo "Would you like to reinstall all dependencies from requirements.txt? (y/n)"
read answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
  echo "Installing all dependencies from requirements.txt..."
  pip install -r requirements.txt
else
  echo "Skipping full dependency installation."
fi

echo "Done! You can now start the server with ./start.sh"
