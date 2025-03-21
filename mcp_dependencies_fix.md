# MCP Dependencies Fix

## Changes Made

### 1. NPM Dependency Update
Updated the `package.json` file to fix the ModelContextProtocol SDK version:
- Changed `@modelcontextprotocol/sdk` from version `^0.2.0` to `^0.1.0`

### 2. Python Package Updates
Modified the `backend/requirements.txt` file to use compatible versions:
- Changed `uv==0.1.52` to `uv==0.5.31` (a version that exists in PyPI)
- Changed `modelcontextprotocol==0.2.0` to `modelcontextprotocol==0.1.5`

## How to Install

After these changes, you can run:

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r backend/requirements.txt
```

## Troubleshooting

If you encounter Python version compatibility issues, you may need to:

1. Use a compatible Python version (3.7-3.11)
2. Create a virtual environment:
   ```bash
   python -m venv venv
   # Activate on Windows
   venv\Scripts\activate
   # Activate on Linux/Mac
   source venv/bin/activate
   ```

3. Install with compatibility flag:
   ```bash
   pip install -r backend/requirements.txt --ignore-requires-python
   ```

## Additional Notes

If you need to update the MCP functionality, check the latest compatible versions:
- MCP Server (Node.js): [npmjs.com/package/@modelcontextprotocol/server](https://www.npmjs.com/package/@modelcontextprotocol/server)
- MCP SDK (Python): [pypi.org/project/modelcontextprotocol](https://pypi.org/project/modelcontextprotocol/)
