import { useCallback } from 'react'
import shortid from 'shortid'
import _ from 'lodash'
import $ from 'jquery'

export default function useFileActions(appData_, setState, sync) {
  const openFile = useCallback(
    (id) => {
      setState((prev) => ({ ...prev, currentDoc: false }))
      $(window).scrollTop(0)
      const appData = _.cloneDeep(appData_)
      appData.currentDoc = id
      sync(appData, { showDocs: false, showShelf: false, initialData: false })
    },
    [appData_, setState, sync]
  )

  const startNewFile = useCallback(() => {
    setState((prev) => ({ ...prev, currentDoc: false }))
    $(window).scrollTop(0)
    const appData = _.cloneDeep(appData_)
    const id = shortid.generate()
    appData.currentDoc = id
    appData.docs.unshift({ id, title: false, lastModified: new Date() })
    sync(appData, { showDocs: false, initialData: false, showShelf: false })
  }, [appData_, setState, sync])

  const deleteFile = useCallback(
    (fileName) => {
      const currentDoc = appData_.currentDoc
      setState((prev) => ({ ...prev, currentDoc: false }))
      const newAppData = _.cloneDeep(appData_)
      newAppData.docs = newAppData.docs.filter((file) => file.id !== fileName)
      if (currentDoc === fileName) {
        if (newAppData.docs.length) {
          newAppData.currentDoc = newAppData.docs[0].id
        } else {
          const id = shortid.generate()
          newAppData.currentDoc = id
          newAppData.docs.unshift({
            id,
            title: false,
            lastModified: new Date(),
          })
        }
      }
      sync(newAppData, { initialData: false })
      // Additional deletion logic for external storage can be handled outside.
    },
    [appData_, setState, sync]
  )

  const handleImport = useCallback(
    (e) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const newAppData = _.cloneDeep(appData_)
        const id = shortid.generate()
        newAppData.currentDoc = id
        newAppData.docs.unshift({ id, title: false, lastModified: new Date() })
        setState((prev) => ({ ...prev, currentDoc: false }))
        $(window).scrollTop(0)
        sync(newAppData, {
          initialData: ev.target.result,
          showDocs: false,
          showShelf: false,
        })
      }
      reader.readAsText(e.target.files[0])
    },
    [appData_, setState, sync]
  )

  const setTitle = useCallback(
    (id, title) => {
      const newAppData = _.cloneDeep(appData_)
      newAppData.docs.forEach((f) => {
        if (f.id === id) {
          f.title = title
        }
      })
      sync(newAppData, {})
    },
    [appData_, sync]
  )

  const toggleArchive = useCallback(
    (id) => {
      const newAppData = _.cloneDeep(appData_)
      newAppData.docs.forEach((f) => {
        if (f.id === id) {
          f.archived = !f.archived
        }
      })
      sync(newAppData, { newTitle: false, editTitle: false })
    },
    [appData_, sync]
  )

  return {
    openFile,
    startNewFile,
    deleteFile,
    handleImport,
    setTitle,
    toggleArchive,
  }
}
