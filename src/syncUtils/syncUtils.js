import { get, set, del } from 'idb-keyval'

// Constants for multipart request formatting
const boundary = '-------314159265358979323846' // arbitary boundary string
const delimiter = '\r\n--' + boundary + '\r\n'
const close_delim = '\r\n--' + boundary + '--'

/**
 * Initialize Google API sync utilities
 * @param {Object} gapi - Google API client instance
 * @returns {Object} - Object containing all sync utility functions
 */
function initialize(gapi) {
  /**
   * Execute a Google API request and return the result
   * @param {Object} request - Google API request object
   * @returns {Promise<Object>} - Result from the API
   */
  async function executeRequest(request) {
    return new Promise((resolve, reject) => {
      request.execute((result, error) => {
        resolve(result)

        // if (error) {
        //   reject(error);
        // } else {
        //   resolve(result);
        // }
      })
    })
  }

  /**
   * Creates a file in Google Drive app data folder
   * @param {string} name - File name
   * @param {Object} data - File data to be stored as JSON
   * @returns {Promise<Object>} - Promise resolving to the created file information
   */
  async function create(name, data) {
    const metadata = {
      name,
      mimeType: 'application/json',
      parents: ['appDataFolder'],
    }

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(data) +
      close_delim

    const request = gapi.client.request({
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    })

    return executeRequest(request)
  }

  /**
   * Creates an image file in Google Drive
   * @param {string} name - Image file name
   * @param {string} dataUrl - Data URL of the image
   * @returns {Promise<Object>} - Promise resolving to the created image information
   */
  async function createImage(name, dataUrl) {
    try {
      const imageFolderId = await getImagesFolder()

      const mimeTypeMatch = dataUrl.match(/data:(image\/[a-z]+);/)
      if (!mimeTypeMatch) {
        throw new Error('Invalid data URL format')
      }

      const mimeType = mimeTypeMatch[1]
      const data = dataUrl.split(',')[1]
      const metadata = {
        name,
        mimeType,
        parents: [imageFolderId],
      }

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Transfer-Encoding: base64\n' +
        `Content-Type: ${mimeType}\r\n\r\n` +
        data +
        close_delim

      const request = gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: multipartRequestBody,
      })

      return executeRequest(request)
    } catch (error) {
      console.error('Error creating image:', error)
      throw error
    }
  }

  /**
   * Gets or creates the images folder in Google Drive
   * @returns {Promise<string>} - Promise resolving to the folder ID
   */
  async function getImagesFolder() {
    try {
      const response = await gapi.client.drive.files.list({
        q: `name='MarkThree-Media'`,
      })

      if (response.result.files.length) {
        return response.result.files[0].id
      } else {
        const metadata = {
          name: 'MarkThree-Media',
          mimeType: 'application/vnd.google-apps.folder',
        }

        const file = await gapi.client.drive.files.create({
          resource: metadata,
          fields: 'id',
        })

        return file.result.id
      }
    } catch (error) {
      console.error('Error getting images folder:', error)
      throw error
    }
  }

  /**
   * Updates an existing file in Google Drive
   * @param {string} fileId - ID of the file to update
   * @param {Object} data - Updated data to store
   * @returns {Promise<Object>} - Promise resolving to the updated file information
   */
  async function update(fileId, data) {
    try {
      const metadata = {
        mimeType: 'application/json',
      }

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(data) +
        close_delim

      const request = gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'multipart' },
        headers: {
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: multipartRequestBody,
      })

      const result = await executeRequest(request)
      // Ensure we have a proper result - some errors might come back with 200 status
      if (!result || result instanceof Error) {
        throw result || new Error('Unknown error during file update')
      }
      return result
    } catch (error) {
      console.error(`Error updating file ${fileId}:`, error)
      throw error
    }
  }

  /**
   * Finds a file in Google Drive by name
   * @param {string} name - Name of the file to find
   * @returns {Promise<Object|boolean>} - Promise resolving to file data or false if not found
   */
  async function find(name) {
    try {
      const response = await gapi.client.drive.files.list({
        q: `name='${name}'`,
        spaces: 'appDataFolder',
      })

      console.log(response)

      if (response.result.files.length) {
        const fileData = await gapi.client.drive.files.get({
          fileId: response.result.files[0].id,
          alt: 'media',
        })

        return fileData.result
      } else {
        return false
      }
    } catch (error) {
      console.error('Error finding file:', error)
      throw error
    }
  }

  /**
   * Gets all pages associated with a document
   * @param {string} docId - Document ID
   * @returns {Promise<Array>} - Promise resolving to an array of page names
   */
  async function getPagesForDoc(docId) {
    try {
      const response = await gapi.client.drive.files.list({
        q: `name contains '${docId}'`,
        spaces: 'appDataFolder',
        pageSize: 1000,
      })

      console.log(response)

      return response.result.files
        .map((f) => f.name)
        .filter((name) => name !== docId)
    } catch (error) {
      console.error('Error getting pages for document:', error)
      throw error
    }
  }

  /**
   * Finds a file locally or fetches from remote if not found locally
   * @param {string} name - Name of the file to find
   * @returns {Promise<Object|boolean>} - Promise resolving to file data or false
   */
  async function findOrFetch(name) {
    try {
      const localVersion = await get(name)

      if (localVersion) {
        return JSON.parse(localVersion)
      } else {
        return find(name)
      }
    } catch (error) {
      console.error(`Error finding or fetching ${name}:`, error)
      throw error
    }
  }

  /**
   * Finds multiple files locally or fetches from remote
   * @param {Array<string>} names - Array of file names to find
   * @returns {Promise<Array>} - Promise resolving to an array of file data
   */
  async function findOrFetchFiles(names) {
    try {
      const tasks = names.map((name) => async () => {
        const result = await findOrFetch(name)
        if (result) {
          return result
        } else {
          throw new Error(`Could not find file ${name}`)
        }
      })

      return await runSequentially(tasks)
    } catch (error) {
      console.error('Error fetching files:', error)
      throw error
    }
  }

  /**
   * Helper function to run async tasks sequentially
   * @param {Array<Function>} tasks - Array of async functions to run in sequence
   * @returns {Promise<Array>} - Promise resolving to array of results
   */
  async function runSequentially(tasks) {
    const results = []
    for (const task of tasks) {
      results.push(await task())
    }
    return results
  }

  /**
   * Deletes a file both locally and from Google Drive
   * @param {string} name - Name of the file to delete
   * @returns {Promise<Object|boolean>} - Promise resolving to delete result or false
   */
  async function deleteFile(name) {
    try {
      await del(name)

      const response = await gapi.client.drive.files.list({
        q: `name='${name}'`,
        spaces: 'appDataFolder',
      })

      console.log(response)

      if (response.result.files.length) {
        return gapi.client.drive.files.delete({
          fileId: response.result.files[0].id,
        })
      } else {
        return false
      }
    } catch (error) {
      console.error(`Error deleting file ${name}:`, error)
      throw error
    }
  }

  /**
   * Deletes multiple files
   * @param {Array<string>} names - Array of file names to delete
   * @returns {Promise} - Promise resolving when all files are deleted
   */
  async function deleteFiles(names) {
    try {
      const tasks = names.map((name) => async () => {
        const result = await deleteFile(name)
        await new Promise((resolve) => setTimeout(resolve, 1500))

        if (!(result.status === 204)) {
          throw new Error(`Delete request failed for ${name}`)
        }
      })

      return await runSequentially(tasks)
    } catch (error) {
      console.error('Error deleting files:', error)
      throw error
    }
  }

  /**
   * Creates multiple files
   * @param {Array<Object>} files - Array of file objects with name and data properties
   * @returns {Promise} - Promise resolving when all files are created
   */
  async function createFiles(files) {
    try {
      const tasks = files.map((file) => async () => {
        const result = await create(file.name, file.data)
        if (!result.name) {
          throw new Error(`Create request failed for ${file.name}`)
        }
      })

      return await runSequentially(tasks)
    } catch (error) {
      console.error('Error creating files:', error)
      throw error
    }
  }

  /**
   * Initializes data for a file, handling various sync scenarios
   * @param {string} name - Name of the file
   * @param {Object} defaultData - Default data to use if file doesn't exist
   * @returns {Promise<Object>} - Promise resolving to the initialized data
   */
  async function initializeData(name, defaultData) {
    try {
      const remoteData = await find(name)
      const cachedDataStr = await get(name)
      let cachedData = cachedDataStr && JSON.parse(cachedDataStr)

      // normal page reload
      if (cachedData && remoteData) {
        if (remoteData.revision >= cachedData.revision) {
          return remoteData
        } else {
          return cachedData
        }
      }

      // file does not yet exist on server
      if (cachedData && !remoteData) {
        const response = await create(name, cachedData)
        console.log(response)
        cachedData.fileId = response.id
        await set(name, JSON.stringify(cachedData))
        return syncByRevision(name, cachedData)
      }

      // new device
      if (!cachedData && remoteData) {
        await set(name, JSON.stringify(remoteData))
        return remoteData
      }

      // app being loaded for the first time
      if (!cachedData && !remoteData) {
        await set(name, JSON.stringify(defaultData))
        const response = await create(name, defaultData)
        console.log(response)
        defaultData.fileId = response.id
        await set(name, JSON.stringify(defaultData))
        return syncByRevision(name, defaultData)
      }
    } catch (error) {
      console.error(`Error initializing data for ${name}:`, error)
      throw error
    }
  }

  /**
   * Syncs file data based on revision number
   * @param {string} name - Name of the file
   * @param {Object} newData - New data to sync
   * @returns {Promise<Object>} - Promise resolving to the synced data
   */
  async function syncByRevision(name, newData) {
    try {
      newData.revision++
      await set(name, JSON.stringify(newData))

      const remoteData = await find(name)
      console.log('Remote data:', remoteData)

      if (remoteData && remoteData.revision >= newData.revision) {
        // if the server version is at a higher revision, use the server version (fast-forward)
        await set(name, JSON.stringify(remoteData))
        return remoteData
      } else {
        // otherwise use the new version and update server version
        await set(name, JSON.stringify(newData))
        console.log(`Updating ${name}, fileId ${newData.fileId}`)

        if (!newData.fileId) {
          console.error('No fileId found in data object, cannot update')
          throw new Error('No fileId found in data object')
        }

        try {
          await update(newData.fileId, newData)
          return newData
        } catch (updateError) {
          console.error(`Error updating remote file: ${updateError}`)
          // If update fails, revert to last known good version
          const lastGoodVersion = await get(name)
          if (lastGoodVersion) {
            return JSON.parse(lastGoodVersion)
          }
          throw updateError
        }
      }
    } catch (error) {
      console.error(`Error syncing revision for ${name}:`, error)
      throw error
    }
  }

  return {
    create,
    createImage,
    createFiles,
    getImagesFolder,
    update,
    find,
    deleteFile,
    deleteFiles,
    findOrFetch,
    findOrFetchFiles,
    syncByRevision,
    initializeData,
    getPagesForDoc,
  }
}

export default initialize
