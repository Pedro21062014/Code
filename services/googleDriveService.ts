
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
    
    const fileName = `${project.name.replace(/\s+/g, '_')}.ai`;
    const contentType = 'application/json';
    
    // Prepare the metadata part
    const metadata = {
        name: fileName,
        mimeType: contentType,
        description: `Codegen Studio Project: ${project.name}`,
        // If creating a new file, we can specify parents (folder IDs) here if needed
        // parents: ['root'] 
    };

    // Prepare the content part
    const content = JSON.stringify(project, null, 2);

    // Construct the multipart body
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${contentType}\r\n\r\n` +
        content +
        closeDelim;

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
                'Content-Length': multipartRequestBody.length.toString()
            },
            body: multipartRequestBody
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Drive API Error: ${response.status} - ${errorText}`);
        }

        const fileData = await response.json();
        
        // Get the webViewLink (need a separate call if not returned in upload response for v3, 
        // usually upload returns id, name, mimeType. fields param can request more but multipart is tricky)
        // For simplicity, we just return the ID, app logic can assume link structure or fetch details later.
        
        return {
            id: fileData.id,
            webViewLink: `https://drive.google.com/file/d/${fileData.id}/view`
        };

    } catch (error) {
        console.error("Failed to upload to Google Drive", error);
        throw error;
    }
};
