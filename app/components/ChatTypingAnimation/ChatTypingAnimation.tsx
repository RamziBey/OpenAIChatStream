import styles from './ChatTypingAnimation.module.css'

export default function ChatTypingAnimation() {
    return (
            <div className={styles.typing}>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
            </div>
    )
} 