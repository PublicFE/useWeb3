import { ReactNode, useEffect, useRef, useState } from 'react'
import styles from './main.module.scss'
import { Sitenav } from 'components/sitenav'
import { Link } from 'components/link'
import { Newsletter } from 'components/newsletter'
import Fab from 'components/fab'
import MobileNav from 'components/mobileNav'
import useLocalStorage from '../../hooks/useLocalStorage'

type Props = {
  title?: string
  hideNewsletter?: boolean
  className?: string
  children: ReactNode
}

export function Main(props: Props) {
  const [isMobileNavOpen, setMobileNav] = useState(false)
  const [className, setClassName] = useState('')
  const [theme, setTheme] = useLocalStorage('SITE_THEME', 'light')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const handleCLick = () => {
    setMobileNav((state) => !state)
  }
  const title = props.title ?? 'useWeb3'

  useEffect(() => {
    if (props.className) setClassName(`${styles.container} ${props.className} ${theme}`)
  }, [props.className, theme])

  return (
    <div className={className}>
      <aside className={styles.sitenav}>
        <Sitenav />
        <select
          name="theme_switcher"
          value={theme}
          className={styles.themeSwitcher}
          onChange={(e) => setTheme(e.target.value)}>
          <option value="light">明亮</option>
          <option value="dark">暗黑</option>
          <option value="pantone">潘通</option>
          <option value="blueberry_dark">蓝黑</option>
        </select>
      </aside>
      <aside className={styles.mobileSitenav}>
        <MobileNav isOpen={isMobileNavOpen} />

        {isMobileNavOpen && (
          <select
            name="theme_switcher"
            value={theme}
            className={styles.themeSwitcher}
            onChange={(e) => setTheme(e.target.value)}>
            <option value="light">明亮</option>
            <option value="dark">暗黑</option>
            <option value="pantone">潘通</option>
            <option value="blueberry_dark">蓝黑</option>
          </select>
        )}
      </aside>
      <main className={styles.content}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <h1>{title}</h1>
          </header>

          {/* <Donate /> */}

          {props.children}

          {/*{!props.hideNewsletter && <Newsletter className={styles.newsletter} />}*/}

          <footer className={styles.footer}>
            <p>
              twitter账号 @ <Link href="https://twitter.com/useWeb3">useWeb3</Link>. 贡献{' '}
              <Link href="https://github.com/PublicFE/useWeb3">Github</Link>.
            </p>
            <p>
              创建者 <Link href="https://twitter.com/wslyvh">@wslyvh</Link>.
            </p>
          </footer>
          <Fab onClick={handleCLick} />
        </div>
      </main>
    </div>
  )
}
