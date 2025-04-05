import async from "async";
import { get, set, del } from "idb-keyval";

// Constants for multipart request formatting
const boundary = "-------314159265358979323846";
const delimiter = "\r\n--" + boundary + "\r\n";
const close_delim = "\r\n--" + boundary + "--";

/**
 * Initialize Google API sync utilities
 * @param {Object} gapi - Google API client instance
 * @returns {Object} - Object containing all sync utility functions
 */
function initialize(gapi) {
  /**
   * Creates a file in Google Drive app data folder
   * @param {string} name - File name
   * @param {Object} data - File data to be stored as JSON
   * @returns {Promise<Object>} - Promise resolving to the created file information
   */
  async function create(name, data) {
    const metadata = {
      name,
      mimeType: "application/json",
      parents: ["appDataFolder"],
    };

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(data) +
      close_delim;

    const request = gapi.client.request({
      path: "/upload/drive/v3/files",
      method: "POST",
      params: { uploadType: "multipart" },
      headers: {
        "Content-Type": `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    });

    return new Promise((resolve, reject) => {
      request.execute((result, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Creates an image file in Google Drive
   * @param {string} name - Image file name
   * @param {string} dataUrl - Data URL of the image
   * @returns {Promise<Object>} - Promise resolving to the created image information
   */
  async function createImage(name, dataUrl) {
    try {
      const imageFolderId = await getImagesFolder();

      const mimeTypeMatch = dataUrl.match(/data:(image\/[a-z]+);/);
      if (!mimeTypeMatch) {
        throw new Error("Invalid data URL format");
      }

      const mimeType = mimeTypeMatch[1];
      const data = dataUrl.split(",")[1];
      const metadata = {
        name,
        mimeType,
        parents: [imageFolderId],
      };

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Transfer-Encoding: base64\n" +
        `Content-Type: ${mimeType}\r\n\r\n` +
        data +
        close_delim;

      const request = gapi.client.request({
        path: "/upload/drive/v3/files",
        method: "POST",
        params: { uploadType: "multipart" },
        headers: {
          "Content-Type": `multipart/related; boundary="${boundary}"`,
        },
        body: multipartRequestBody,
      });

      return new Promise((resolve, reject) => {
        request.execute((result, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.error("Error creating image:", error);
      throw error;
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
      });

      if (response.result.files.length) {
        return response.result.files[0].id;
      } else {
        const metadata = {
          name: "MarkThree-Media",
          mimeType: "application/vnd.google-apps.folder",
        };

        const file = await gapi.client.drive.files.create({
          resource: metadata,
          fields: "id",
        });

        return file.result.id;
      }
    } catch (error) {
      console.error("Error getting images folder:", error);
      throw error;
    }
  }

  function update(fileId, data) {
    const metadata = {
      mimeType: "application/json",
    };

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: application/json\r\n\r\n" +
      JSON.stringify(data) +
      close_delim;

    const request = gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: "PATCH",
      params: { uploadType: "multipart" },
      headers: {
        "Content-Type": 'multipart/related; boundary="' + boundary + '"',
      },
      body: multipartRequestBody,
    });

    return new Promise((resolve) => {
      request.execute((result) => resolve(result));
    });
  }

  function find(name) {
    return gapi.client.drive.files
      .list({ q: `name='${name}'`, spaces: "appDataFolder" })
      .then((response) => {
        console.log(response);
        if (response.result.files.length) {
          return gapi.client.drive.files
            .get({ fileId: response.result.files[0].id, alt: "media" })
            .then((response) => {
              return response.result;
            });
        } else {
          return false;
        }
      });
  }

  function getPagesForDoc(docId) {
    return new Promise((resolve, reject) => {
      gapi.client.drive.files
        .list({
          q: `name contains '${docId}'`,
          spaces: "appDataFolder",
          pageSize: 1000,
        })
        .then((response) => {
          console.log(response);
          resolve(
            response.result.files
              .map((f) => f.name)
              .filter((name) => name !== docId)
          );
        })
        .catch((e) => reject());
    });
  }

  function findOrFetch(name) {
    return get(name).then((localVersion) => {
      if (localVersion) {
        return JSON.parse(localVersion);
      } else {
        return find(name);
      }
    });
  }

  function findOrFetchFiles(names) {
    return async.series(
      names.map((name) => {
        return function (callback) {
          findOrFetch(name).then((result) => {
            if (result) {
              callback(null, result);
            } else {
              callback(`Could not find file ${name}`, null);
            }
          });
        };
      })
    );
  }

  function deleteFile(name) {
    del(name);
    return new Promise((resolve) => {
      gapi.client.drive.files
        .list({ q: `name='${name}'`, spaces: "appDataFolder" })
        .then((response) => {
          console.log(response);
          if (response.result.files.length) {
            gapi.client.drive.files
              .delete({ fileId: response.result.files[0].id })
              .then(resolve);
          } else {
            resolve(false);
          }
        });
    });
  }

  function deleteFiles(names) {
    return async.series(
      names.map((name) => {
        return function (callback) {
          deleteFile(name)
            .then((result) => {
              setTimeout(() => {
                if (!(result.status === 204)) {
                  callback(`Delete request failed for ${name}`);
                } else {
                  callback();
                }
              }, 1500);
            })
            .catch((err) => callback("Delete request failed"));
        };
      })
    );
  }

  function createFiles(files) {
    return async.series(
      files.map((file) => {
        return function (callback) {
          create(file.name, file.data).then((result) => {
            if (!result.name) {
              callback(`Create request failed for ${file.name}`);
            } else {
              callback();
            }
          });
        };
      })
    );
  }

  function initializeData(name, defaultData) {
    return find(name).then((remoteData) => {
      return get(name).then((cachedData) => {
        cachedData = cachedData && JSON.parse(cachedData);

        // normal page reload
        if (cachedData && remoteData) {
          if (remoteData.revision >= cachedData.revision) {
            return remoteData;
          } else {
            return cachedData;
          }
        }

        // file does not yet exist on server
        if (cachedData && !remoteData) {
          return create(name, cachedData).then((response) => {
            console.log(response);
            cachedData.fileId = response.id;
            set(name, JSON.stringify(cachedData));
            return syncByRevision(name, cachedData);
          });
        }

        // new device
        if (!cachedData && remoteData) {
          set(name, JSON.stringify(remoteData));
          return remoteData;
        }

        // app being loaded for the first time
        if (!cachedData && !remoteData) {
          set(name, JSON.stringify(defaultData));
          return create(name, defaultData).then((response) => {
            console.log(response);
            defaultData.fileId = response.id;
            set(name, JSON.stringify(defaultData));
            return syncByRevision(name, defaultData);
          });
        }
      });
    });
  }

  function syncByRevision(name, newData) {
    newData.revision++;
    set(name, JSON.stringify(newData));
    return find(name).then((remoteData) => {
      console.log(remoteData);
      if (remoteData.revision >= newData.revision) {
        // if the server version is at a higher revision, use the server version (fast-forward)
        set(name, JSON.stringify(remoteData));
        return remoteData;
      } else {
        // otherwise use the new version and update server version
        set(name, JSON.stringify(newData));
        console.log(`Updating ${name}, fileId ${newData.fileId}`);
        return update(newData.fileId, newData).then(() => newData);
      }
    });
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
  };
}

export default initialize;
