
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

    // Construct the multipart body strictly following RFC 2046
    const boundary = '-------314159265358979323846';
    
    // NOTE: The body must NOT start with \r\n. It must start immediately with --boundary.
    const bodyParts = [
        `--${boundary}\r\n`,
        `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
        JSON.stringify(metadata),
        `\r\n--${boundary}\r\n`,
        `Content-Type: ${contentType}\r\n\r\n`,
        content,
        `\r\n--${boundary}--`
    ];

    const multipartBody = new Blob(bodyParts, { type: `multipart/related; boundary=${boundary}` });

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
                errorText = errJson.error?.message || JSON.stringify(errJson);
            } catch (e) {
                errorText = await response.text();
            }
            // Include status code for better handling upstream
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
