import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import SearchResultsList from '../../components/SearchResultsList'
import Skeleton from '../../components/Skeleton'
import { getAuthorById, getAuthorByName } from '../../services/authorService'
import {
  followAuthor,
  getFollowedAuthors,
  unfollowAuthor,
} from '../../services/followService'
import styles from './authorDetailPage.module.css'

function formatNumber(value) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function getInitials(name) {
  return String(name || 'Author')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function AuthorDetailPage() {
  const { authorId, authorName } = useParams()
  const navigate = useNavigate()
  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followError, setFollowError] = useState('')

  useEffect(() => {
    let active = true

    async function fetchAuthor() {
      setLoading(true)
      setError('')
      setFollowError('')
      setIsFollowing(false)
      try {
        const hasToken = Boolean(localStorage.getItem('token'))
        const result = authorId
          ? await getAuthorById(authorId)
          : await getAuthorByName(authorName)
        if (!active) return

        setAuthor(result)

        if (hasToken && result?.id) {
          try {
            const followedResult = await getFollowedAuthors({ page: 1, pageSize: 1000 })
            const followedAuthors = followedResult?.items ?? []
            if (active) {
              setIsFollowing(
                followedAuthors.some((item) => Number(item.id) === Number(result.id)),
              )
            }
          } catch {
            // Ignore follow-status lookup errors so author details still render.
          }
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || err.message || 'Failed to load author details.')
          setAuthor(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAuthor()
    return () => {
      active = false
    }
  }, [authorId, authorName])

  const handleFollowToggle = async () => {
    if (!author?.id || followLoading) return

    setFollowLoading(true)
    setFollowError('')
    try {
      if (isFollowing) {
        await unfollowAuthor(author.id)
        setIsFollowing(false)
      } else {
        await followAuthor(author.id)
        setIsFollowing(true)
      }
    } catch (err) {
      setFollowError(
        err.response?.data?.message ||
          err.message ||
          `Failed to ${isFollowing ? 'unfollow' : 'follow'} author.`,
      )
    } finally {
      setFollowLoading(false)
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/authors')
  }

  if (loading) {
    return (
      <section className={styles.page}>
        <Skeleton variant="title" width="40%" />
        <Skeleton variant="card" count={3} />
      </section>
    )
  }

  if (error || !author) {
    return (
      <section className={styles.page}>
        <div className={styles.errorState}>
          <strong>Author could not be loaded</strong>
          <p>{error}</p>
          <Link to="/authors">Back to authors</Link>
        </div>
      </section>
    )
  }

  const recentPapers = author.recentPapers ?? []
  const metaItems = [
    author.country,
    author.externalId ? `External ID ${author.externalId}` : '',
  ].filter(Boolean)

  return (
    <section className={styles.page}>
      <button type="button" className={styles.backButton} onClick={handleBack}>
        <span aria-hidden="true">&larr;</span>
        Back
      </button>
      <header className={styles.hero}>
        <div className={styles.identity}>
          <div className={styles.avatar}>{getInitials(author.name)}</div>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Author profile</span>
            <h1>{author.name}</h1>
            <p>{author.affiliation || 'Affiliation not specified'}</p>
            {metaItems.length > 0 && (
              <div className={styles.metaLine}>
                {metaItems.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={styles.heroActions}>
          {localStorage.getItem('token') ? (
            <button
              type="button"
              className={`${styles.followButton} ${isFollowing ? styles.followingButton : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading
                ? 'Saving...'
                : isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          ) : (
            <Link className={styles.followButton} to="/login">Sign in</Link>
          )}
          <Link
            className={styles.primaryLink}
            to={`/search/results?query=${encodeURIComponent(author.name)}&searchType=Author&page=1&pageSize=10`}
          >
            View papers
          </Link>
        </div>
      </header>

      {followError && <p className={styles.followError}>{followError}</p>}

      <div className={styles.metricsBar}>
        <article>
          <span>Papers</span>
          <strong>{formatNumber(author.paperCount)}</strong>
        </article>
        <article>
          <span>Total citations</span>
          <strong>{formatNumber(author.totalCitations)}</strong>
        </article>
        <article>
          <span>H-index</span>
          <strong>{formatNumber(author.hIndex)}</strong>
        </article>
        <article>
          <span>Recent papers</span>
          <strong>{formatNumber(recentPapers.length)}</strong>
        </article>
      </div>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>Latest research</span>
            <h2>Recent papers</h2>
          </div>
          <span>{recentPapers.length} shown</span>
        </div>
        <SearchResultsList papers={recentPapers} />
      </section>
    </section>
  )
}

export default AuthorDetailPage
