import { WEBUI_API_BASE_URL } from '$lib/constants';
import type { Banner } from '$lib/types';

export const importConfig = async (token: string, config) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/import`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				config: config
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
feature/ui-customization-admin
		const detail = err.detail || 'Failed to import config';

		const detail = err?.detail || 'Failed to import config';
main
		throw detail;
	}
};

export const getUIThemeSettings = async (token: string) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/ui/theme`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to get UI theme settings';
		throw detail;
	}
};

export const setUIThemeSettings = async (
	token: string,
	themeSettings: { font_color?: string; primary_color?: string; logo_url?: string }
) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/ui/theme`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(themeSettings)
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to set UI theme settings';
		throw detail;
	}
};

export const exportConfig = async (token: string) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/export`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to export config';
		throw detail;
	}
};

export const getDirectConnectionsConfig = async (token: string) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/direct_connections`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to get direct connections config';
		throw detail;
	}
};

export const setDirectConnectionsConfig = async (token: string, config: object) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/direct_connections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				...config
			})
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to set direct connections config';
		throw detail;
	}
};

export const getToolServerConnections = async (token: string) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/tool_servers`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to get tool server connections';
		throw detail;
	}
};

export const setToolServerConnections = async (token: string, connections: object) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/tool_servers`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				...connections
			})
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to set tool server connections';
		throw detail;
	}
};

export const verifyToolServerConnection = async (token: string, connection: object) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/tool_servers/verify`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				...connection
			})
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to verify tool server connection';
		throw detail;
	}
};

export const getCodeExecutionConfig = async (token: string) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/code_execution`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to get code execution config';
		throw detail;
	}
};

export const setCodeExecutionConfig = async (token: string, config: object) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/code_execution`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				...config
			})
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to set code execution config';
		throw detail;
	}
};

export const getModelsConfig = async (token: string) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/models`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to get models config';
		throw detail;
	}
};

export const setModelsConfig = async (token: string, config: object) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/models`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				...config
			})
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to set models config';
		throw detail;
	}
};

export const setDefaultPromptSuggestions = async (token: string, promptSuggestions: string) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/suggestions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				suggestions: promptSuggestions
			})
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to set default prompt suggestions';
		throw detail;
	}
};

export const getBanners = async (token: string): Promise<Banner[]> => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/banners`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to get banners';
		throw detail;
	}
};

export const setBanners = async (token: string, banners: Banner[]) => {
	try {
		const response = await fetch(`${WEBUI_API_BASE_URL}/configs/banners`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				banners: banners
			})
		});
		if (!response.ok) {
			const errorData = await response.json();
			throw errorData;
		}
		return await response.json();
	} catch (err) {
		console.error(err);
		const detail = err.detail || 'Failed to set banners';
		throw detail;
	}
};
