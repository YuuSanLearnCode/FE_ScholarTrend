import { useEffect, useState } from 'react'
import { getMe, updateProfile, changePassword } from '../../services/authService'
import Skeleton from '../../components/Skeleton'
import styles from './profilePage.module.css'

function ProfilePage() {
  const [profile, setProfile] = useState({ fullName: '', email: '', institution: '', researchField: '' })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      try {
        const result = await getMe()
        setProfile({
          fullName: result.fullName || '',
          email: result.email || '',
          institution: result.institution || '',
          researchField: result.researchField || '',
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile')
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

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateProfile({ fullName: profile.fullName, institution: profile.institution, researchField: profile.researchField })
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
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
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
      setSuccess('Password changed successfully.')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className={styles.page}>
        <Skeleton variant="title" width="40%" />
        <div className={styles.panel}><Skeleton variant="card" /></div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>Manage your personal information and security settings.</p>
      </div>

      {error && <div className={styles.alertError}>{error}</div>}
      {success && <div className={styles.alertSuccess}>{success}</div>}

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Personal Information</h2>
        <form className={styles.form} onSubmit={handleProfileSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="fullName">Full Name</label>
            <input id="fullName" className={styles.input} value={profile.fullName} onChange={handleProfileChange('fullName')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input id="email" className={styles.input} value={profile.email} disabled />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="institution">Institution</label>
            <input id="institution" className={styles.input} value={profile.institution} onChange={handleProfileChange('institution')} placeholder="e.g. University of Science" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="researchField">Research Field</label>
            <input id="researchField" className={styles.input} value={profile.researchField} onChange={handleProfileChange('researchField')} placeholder="e.g. Computer Science" />
          </div>
          <button type="submit" className={styles.button} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>Change Password</h2>
        <form className={styles.form} onSubmit={handlePasswordSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="currentPassword">Current Password</label>
            <input id="currentPassword" type="password" className={styles.input} value={passwordData.currentPassword} onChange={handlePasswordChange('currentPassword')} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="newPassword">New Password</label>
            <input id="newPassword" type="password" className={styles.input} value={passwordData.newPassword} onChange={handlePasswordChange('newPassword')} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">Confirm New Password</label>
            <input id="confirmPassword" type="password" className={styles.input} value={passwordData.confirmPassword} onChange={handlePasswordChange('confirmPassword')} required />
          </div>
          <button type="submit" className={styles.button} disabled={saving}>
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default ProfilePage
