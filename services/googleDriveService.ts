
import { SavedProject } from '../types';

/**
 * Uploads project data to Google Drive as a .ai JSON file.
 * Uses Multipart upload to send metadata and content in a single request.
 * 
 * @param accessToken The Google OAuth access token with 'drive.file' scope.
 * @param project The project data to save.
 * @param existingFileId (Optional) ID of the existing file to update (PATCH instead of POST).
 */
export const uploadProjectToDrive = async (
    accessToken: string, 
    project: SavedProject,
    existingFileId?: string
): Promise<{ id: string; webViewLink: string }> => {
    
    // Sanitize filename
    const safeName = project.name.replace(/[^a-zA-Z0-9À-ÿ \-_]/g, '').trim() || 'Project';
    const fileName = `${safeName}.ai`;
    const contentType = 'application/json';
    
    // Prepare the metadata part
    const metadata = {
        name: fileName,
        mimeType: contentType,
        description: `Codegen Studio Project: ${project.name}`,
    };

    // Prepare the content part
    const content = JSON.stringify(project, null, 2);

    // Construct the multipart body using Blob to handle UTF-8 correctly
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metadataHeader = `Content-Type: application/json\r\n\r\n`;
    const contentHeader = `Content-Type: ${contentType}\r\n\r\n`;

    const multipartBody = new Blob(
        [
            delimiter,
            metadataHeader,
            JSON.stringify(metadata),
            delimiter,
            contentHeader,
            content,
            closeDelim
        ],
        { type: 'multipart/related' }
    );

    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    // If updating, change URL and Method
    if (existingFileId) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
        method = 'PATCH';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody
        });

        if (!response.ok) {
            let errorText = "Erro desconhecido";
            try {
                const errJson = await response.json();
                errorText = errJson.error?.message || response.statusText;
            } catch (e) {
                errorText = await response.text();
            }
            throw new Error(`Google Drive API Error (${response.status}): ${errorText}`);
        }

        const fileData = await response.json();
        
        return {
            id: fileData.id,
            webViewLink: `https://drive.google.com/file/d/${fileData.id}/view`
        };

    } catch (error) {
        console.error("Failed to upload to Google Drive", error);
        throw error;
    }
};
