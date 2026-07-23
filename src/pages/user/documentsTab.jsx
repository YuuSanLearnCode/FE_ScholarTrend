import { useState, useEffect, useRef, useCallback } from 'react'
import { getFiles, uploadFile, deleteFile, downloadFile } from '../../services/fileService'
import { searchPapers } from '../../services/paperService'
import Skeleton from '../../components/Skeleton'
import styles from './documentsTab.module.css'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
]

function getFileIcon(contentType) {
  if (contentType?.includes('pdf')) return '📄'
  if (contentType?.includes('word')) return '📝'
  if (contentType?.includes('spreadsheet') || contentType?.includes('excel')) return '📊'
  if (contentType?.includes('csv')) return '📑'
  return '📁'
}

function getFileTypeName(contentType) {
  if (contentType?.includes('pdf')) return 'PDF'
  if (contentType?.includes('word')) return 'DOCX'
  if (contentType?.includes('spreadsheet') || contentType?.includes('excel')) return 'XLSX'
  if (contentType?.includes('csv')) return 'CSV'
  return 'FILE'
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DocumentsTab() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Upload states
  const [selectedFile, setSelectedFile] = useState(null)
  const [description, setDescription] = useState('')
  const [paperSearchQuery, setPaperSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [searching, setSearching] = useState(false)
  
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Delete Dialog states
  const [fileToDelete, setFileToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fileInputRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getFiles({ pageSize: 50, category: 'document' })
      setFiles(response.items || [])
    } catch (err) {
      setError(err.message || 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Fake or Real Search Papers
  useEffect(() => {
    if (paperSearchQuery.length < 2) {
      setSearchResults([])
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchPapers({ query: paperSearchQuery, pageSize: 5 })
        setSearchResults(res.items || [])
      } catch (err) {
        console.error('Failed to search papers', err)
      } finally {
        setSearching(false)
      }
    }, 500)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [paperSearchQuery])

  const validateFile = (file) => {
    if (!file) return false
    
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds maximum size of 50MB.')
      setSuccess('')
      return false
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx|xlsx|csv)$/i)) {
      setError('Only PDF, DOCX, XLSX and CSV are supported.')
      setSuccess('')
      return false
    }

    setError('')
    return true
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (validateFile(file)) {
      setSelectedFile(file)
    }
    e.target.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError('')
    setSuccess('')
    setUploadProgress(0)

    try {
      // Simulate progress since axios interceptors / API service doesn't easily expose onUploadProgress without refactor
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev
          return prev + 10
        })
      }, 300)

      // Pass the category, description, and paperId to the API
      const paperId = selectedPaper?.id ?? selectedPaper?.researchPaperId ?? null;
      await uploadFile(selectedFile, 'document', description, paperId);
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      setSuccess('Document uploaded successfully.')
      setSelectedFile(null)
      setDescription('')
      setSelectedPaper(null)
      setPaperSearchQuery('')
      
      // Refresh list
      fetchFiles()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const confirmDelete = (file) => {
    setFileToDelete(file)
  }

  const handleDelete = async () => {
    if (!fileToDelete) return
    
    setDeleting(true)
    try {
      await deleteFile(fileToDelete.id)
      setSuccess('Document deleted.')
      setFiles(files.filter(f => f.id !== fileToDelete.id))
      setFileToDelete(null)
    } catch (err) {
      setError(err.message || 'Failed to delete document.')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = async (file) => {
    try {
      const blobData = await downloadFile(file.id)
      const url = window.URL.createObjectURL(new Blob([blobData]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.fileName || 'download')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      setError('Failed to download file.')
    }
  }

  return (
    <div className={styles.container}>
      {/* Upload Section */}
      <section className={styles.uploadCard}>
        <h2>Upload New Document</h2>
        
        {error && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        {!selectedFile ? (
          <div 
            className={`${styles.dropzone} ${isDragging ? styles.active : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.dropIcon}>☁️</span>
            <p className={styles.dropText}>Drop file here or Click to select</p>
            <p className={styles.dropSubtext}>PDF, DOCX, XLSX, CSV (Up to 50MB)</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className={styles.fileInput}
              accept=".pdf,.docx,.xlsx,.csv,application/pdf" 
            />
          </div>
        ) : (
          <div className={styles.selectedFileInfo}>
            <div className={styles.fileNameRow}>
              <span>{getFileIcon(selectedFile.type)} {selectedFile.name} ({formatBytes(selectedFile.size)})</span>
              {!uploading && (
                <button className={styles.cancelBtn} onClick={() => setSelectedFile(null)}>✖ Remove</button>
              )}
            </div>
            
            {uploading && (
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
            {uploading && <div className={styles.progressText}>{uploadProgress}% Uploading...</div>}
          </div>
        )}

        <div className={styles.formGroup}>
          <label>Description (Optional)</label>
          <textarea 
            className={styles.textarea} 
            placeholder="Briefly describe this document..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Related Paper (Optional)</label>
          {selectedPaper ? (
            <div className={styles.fileNameRow} style={{ background: 'var(--color-brand-bg)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
              <span>{selectedPaper.title || selectedPaper.paperTitle}</span>
              <button className={styles.cancelBtn} onClick={() => setSelectedPaper(null)}>✖</button>
            </div>
          ) : (
            <div className={styles.searchContainer}>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="Search paper to link..."
                value={paperSearchQuery}
                onChange={(e) => setPaperSearchQuery(e.target.value)}
                disabled={uploading}
              />
              {paperSearchQuery && (
                <div className={styles.searchResults}>
                  {searching ? (
                    <div className={styles.searchLoading}>Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(p => (
                      <div key={p.id ?? p.researchPaperId} className={styles.searchItem} onClick={() => { setSelectedPaper(p); setPaperSearchQuery(''); setSearchResults([]); }}>
                        {p.title || p.paperTitle}
                      </div>
                    ))
                  ) : (
                    <div className={styles.searchLoading}>No papers found.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          className={styles.uploadBtn} 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
        >
          {uploading ? <><span className={styles.spinner}></span> Uploading...</> : '⬆ Upload Document'}
        </button>
      </section>

      {/* List Section */}
      <section className={styles.listCard}>
        <div className={styles.listHeader}>
          <h2>My Documents</h2>
        </div>

        {loading ? (
          <div className={styles.skeletonList}>
            <Skeleton className={styles.skeletonItem} />
            <Skeleton className={styles.skeletonItem} />
            <Skeleton className={styles.skeletonItem} />
          </div>
        ) : files.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📁</span>
            <h3>No documents yet.</h3>
            <p>Upload your first research document above.</p>
          </div>
        ) : (
          <div className={styles.documentList}>
            {files.map(file => (
              <div key={file.id} className={styles.documentItem}>
                <div className={styles.docInfo}>
                  <span className={styles.docIcon}>{getFileIcon(file.contentType)}</span>
                  <div className={styles.docDetails}>
                    <span className={styles.docName}>{file.fileName}</span>
                    <div className={styles.docMeta}>
                      <span className={styles.badge}>{getFileTypeName(file.contentType)}</span>
                      <span>{formatBytes(file.sizeBytes)}</span>
                      <span>Uploaded {formatDate(file.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.docActions}>
                  <button className={`${styles.actionBtn} ${styles.btnDownload}`} onClick={() => handleDownload(file)}>
                    ⬇ Download
                  </button>
                  <button className={`${styles.actionBtn} ${styles.btnDelete}`} onClick={() => confirmDelete(file)}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Dialog Overlay */}
      {fileToDelete && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <h3>Delete this document?</h3>
            <p><strong>{fileToDelete.fileName}</strong><br/>This action cannot be undone.</p>
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancelBtn} onClick={() => setFileToDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button className={styles.dialogConfirmBtn} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
