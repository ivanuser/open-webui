/**
 * API endpoint for retrieving extension sidebar items
 */

import fs from 'fs';
import path from 'path';
import { error, json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request }) {
    try {
        const extensionsDirPath = path.join(process.cwd(), 'extensions');
        const sidebarItems = [];

        // If extensions directory exists
        if (fs.existsSync(extensionsDirPath)) {
            const extensions = fs.readdirSync(extensionsDirPath);
            
            for (const extension of extensions) {
                const extensionPath = path.join(extensionsDirPath, extension);
                
                // Check if it's a directory
                if (fs.statSync(extensionPath).isDirectory()) {
                    const sidebarJsonPath = path.join(extensionPath, 'sidebar.json');
                    
                    // If sidebar.json exists, read it
                    if (fs.existsSync(sidebarJsonPath)) {
                        try {
                            const sidebarData = JSON.parse(fs.readFileSync(sidebarJsonPath, 'utf8'));
                            
                            // Add to sidebar items
                            sidebarItems.push({
                                id: `extension-${sidebarData.id || extension}`,
                                label: sidebarData.label || extension,
                                icon: sidebarData.icon || 'PuzzlePiece',
                                href: sidebarData.href || `/extensions/${sidebarData.id || extension}`,
                                type: 'extension',
                                order: sidebarData.order || 100
                            });
                        } catch (e) {
                            console.error(`Error parsing sidebar.json for extension ${extension}:`, e);
                        }
                    }
                }
            }
        }
        
        // Sort by order
        sidebarItems.sort((a, b) => (a.order || 100) - (b.order || 100));
        
        return json({ items: sidebarItems });
    } catch (e) {
        console.error('Error getting extension sidebar items:', e);
        return json({ items: [] });
    }
}
