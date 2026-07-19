import { useEffect, useRef, useState } from 'react'
import { getMe, updateProfile, changePassword } from '../../services/authService'
import Skeleton from '../../components/Skeleton'
import FollowingPage from './followingPage'
import styles from './profilePage.module.css'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const AVATAR_SIZE = 512

function getAvatarStorageKey(userId) {
  return userId ? `profileAvatar:${userId}` : ''
}

function getInitials(name) {
  return (name || 'User')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getRoleLabel(role) {
  if (role === 'LecturerStudent') return 'Lecturer / Student'
  return role || 'Member'
}

function formatDate(value) {
  if (!value) return 'Not available'

  let dateString = value;
  if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:?\d{2}$/)) {
    dateString += 'Z';
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Could not read this image.'))
    reader.onload = () => {
      const image = new Image()

      image.onerror = () => reject(new Error('This image format is not supported.'))
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        const cropSize = Math.min(image.width, image.height)
        const sourceX = (image.width - cropSize) / 2
        const sourceY = (image.height - cropSize) / 2

        canvas.width = AVATAR_SIZE
        canvas.height = AVATAR_SIZE
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
        context.drawImage(
          image,
          sourceX,
          sourceY,
          cropSize,
          cropSize,
          0,
          0,
          AVATAR_SIZE,
          AVATAR_SIZE,
        )
        resolve(canvas.toDataURL('image/jpeg', 0.86))
      }

      image.src = reader.result
    }

    reader.readAsDataURL(file)
  })
}

function ProfilePage() {
  const avatarInputRef = useRef(null)
  const [profile, setProfile] = useState({
    id: '',
    fullName: '',
    email: '',
    institution: '',
    researchField: '',
    roles: [],
    createdAt: '',
    lastLoginAt: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [processingAvatar, setProcessingAvatar] = useState(false)
  const [tab, setTab] = useState('profile')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      try {
        const result = await getMe()
        setProfile({
          id: result.id || '',
          fullName: result.fullName || '',
          email: result.email || '',
          institution: result.institution || '',
          researchField: result.researchField || '',
          roles: result.roles || [],
          createdAt: result.createdAt || '',
          lastLoginAt: result.lastLoginAt || '',
        })

        const storageKey = getAvatarStorageKey(result.id)
        setAvatar(storageKey ? localStorage.getItem(storageKey) || '' : '')
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleProfileChange = (field) => (event) => {
    setProfile((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handlePasswordChange = (field) => (event) => {
    setPasswordData((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setSuccess('')

    if (!file.type.startsWith('image/')) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError('Profile image must be smaller than 5 MB.')
      return
    }

    setProcessingAvatar(true)
    try {
      const image = await resizeAvatar(file)
      const storageKey = getAvatarStorageKey(profile.id)

      if (!storageKey) {
        throw new Error('Could not identify the current account.')
      }

      localStorage.setItem(storageKey, image)
      setAvatar(image)
      window.dispatchEvent(
        new CustomEvent('profile-avatar-updated', {
          detail: { userId: profile.id, image },
        }),
      )
      setSuccess('Profile photo updated on this device.')
    } catch (err) {
      setError(err.message || 'Failed to process profile image.')
    } finally {
      setProcessingAvatar(false)
    }
  }

  const handleRemoveAvatar = () => {
    const storageKey = getAvatarStorageKey(profile.id)
    if (storageKey) localStorage.removeItem(storageKey)

    setAvatar('')
    setError('')
    setSuccess('Profile photo removed.')
    window.dispatchEvent(
      new CustomEvent('profile-avatar-updated', {
        detail: { userId: profile.id, image: '' },
      }),
    )
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setSavingProfile(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateProfile({
        fullName: profile.fullName,
        institution: profile.institution,
        researchField: profile.researchField,
      })
      setProfile((current) => ({
        ...current,
        ...result,
        fullName: result.fullName || '',
        email: result.email || current.email,
        institution: result.institution || '',
        researchField: result.researchField || '',
        roles: result.roles || current.roles,
      }))
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    setChangingPassword(true)
    setError('')
    setSuccess('')
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmNewPassword: passwordData.confirmPassword,
      })
      setSuccess('Password changed successfully.')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <section className={styles.page}>
        <Skeleton variant="title" width="35%" />
        <div className={styles.loadingCard}>
          <Skeleton variant="card" height="280px" />
        </div>
      </section>
    )
  }

  const roles = profile.roles.map(r => String(r).toLowerCase())
  const primaryRole = roles.includes('admin') ? 'Admin' : roles.includes('researcher') ? 'Researcher' : profile.roles[0]

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.eyebrow}>Account settings</span>
        <h1 className={styles.title}>{tab === 'following' ? 'My Following' : 'My Profile'}</h1>
        <div className={styles.tabBar}>
          <button
            type="button"
            className={tab === 'profile' ? styles.tabActive : styles.tab}
            onClick={() => setTab('profile')}
          >
            Profile
          </button>
          <button
            type="button"
            className={tab === 'following' ? styles.tabActive : styles.tab}
            onClick={() => setTab('following')}
          >
            Following
          </button>
        </div>
      </header>

      {tab === 'following' ? (
        <FollowingPage />
      ) : (
        <>
          {error && <div className={styles.alertError}>{error}</div>}
          {success && <div className={styles.alertSuccess}>{success}</div>}

          <section className={styles.heroCard}>
            <div className={styles.heroPattern} />
            <div className={styles.avatarSection}>
              <div className={styles.avatarRing}>
                {avatar ? (
                  <img className={styles.avatarImage} src={avatar} alt={profile.fullName} />
                ) : (
                  <span className={styles.avatarInitials}>{getInitials(profile.fullName)}</span>
                )}
              </div>
              <div className={styles.avatarActions}>
                <button
                  type="button"
                  className={styles.photoButton}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={processingAvatar}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3 7.5 5H5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-2.5L15 3H9Zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                  </svg>
                  {processingAvatar ? 'Processing...' : avatar ? 'Change photo' : 'Upload photo'}
                </button>
                {avatar && (
                  <button type="button" className={styles.removePhotoButton} onClick={handleRemoveAvatar}>
                    Remove
                  </button>
                )}
                <input
                  ref={avatarInputRef}
                  className={styles.fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                />
                <p className={styles.photoHint}>JPG, PNG or WebP, up to 5 MB. Stored on this device.</p>
              </div>
            </div>

            <div className={styles.identity}>
              <h2>{profile.fullName || 'ScholarTrend Member'}</h2>
              <p>{profile.email}</p>
              <div className={styles.identityTags}>
                <span>{getRoleLabel(primaryRole)}</span>
                {profile.researchField && <span>{profile.researchField}</span>}
              </div>
            </div>

            <dl className={styles.accountFacts}>
              <div>
                <dt>Member since</dt>
                <dd>{formatDate(profile.createdAt)}</dd>
              </div>
              <div>
                <dt>Last sign in</dt>
                <dd>{formatDate(profile.lastLoginAt)}</dd>
              </div>
            </dl>
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={`${styles.panelIcon} ${styles.profileIcon}`}>ID</span>
                <div>
                  <h2>Personal Information</h2>
                  <p>Details shown across your ScholarTrend account.</p>
                </div>
              </div>

              <form className={styles.form} onSubmit={handleProfileSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="fullName">Full name</label>
                    <input
                      id="fullName"
                      className={styles.input}
                      value={profile.fullName}
                      onChange={handleProfileChange('fullName')}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="email">Email address</label>
                    <input id="email" className={styles.input} value={profile.email} disabled />
                    <span className={styles.fieldHint}>Your sign-in email cannot be changed here.</span>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="institution">Institution</label>
                    <input
                      id="institution"
                      className={styles.input}
                      value={profile.institution}
                      onChange={handleProfileChange('institution')}
                      placeholder="e.g. FPT University"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="researchField">Research field</label>
                    <input
                      id="researchField"
                      className={styles.input}
                      value={profile.researchField}
                      onChange={handleProfileChange('researchField')}
                      placeholder="e.g. Artificial Intelligence"
                    />
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.primaryButton} disabled={savingProfile}>
                    {savingProfile ? 'Saving changes...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={`${styles.panelIcon} ${styles.securityIcon}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-5-5Zm3 8H9V7a3 3 0 1 1 6 0v3Zm-3 4a2 2 0 0 1 1 3.73V19h-2v-1.27A2 2 0 0 1 12 14Z" />
                  </svg>
                </span>
                <div>
                  <h2>Password & Security</h2>
                  <p>Use a unique password to keep your account secure.</p>
                </div>
              </div>

              <form className={styles.form} onSubmit={handlePasswordSubmit}>
                <div className={styles.securityFields}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="currentPassword">Current password</label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        className={styles.input}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange('currentPassword')}
                        autoComplete="current-password"
                        placeholder="Enter current password"
                        required
                      />
                      <button 
                        type="button" 
                        className={styles.eyeButton}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        tabIndex="-1"
                      >
                        {showCurrentPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="newPassword">New password</label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        className={styles.input}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange('newPassword')}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        required
                      />
                      <button 
                        type="button" 
                        className={styles.eyeButton}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex="-1"
                      >
                        {showNewPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="confirmPassword">Confirm new password</label>
                    <div className={styles.passwordWrapper}>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className={styles.input}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange('confirmPassword')}
                        autoComplete="new-password"
                        placeholder="Repeat new password"
                        required
                      />
                      <button 
                        type="button" 
                        className={styles.eyeButton}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex="-1"
                      >
                        {showConfirmPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.secondaryButton} disabled={changingPassword}>
                    {changingPassword ? 'Updating password...' : 'Update password'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </>
      )}
    </section>
  )
}

export default ProfilePage
