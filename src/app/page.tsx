'use client'

import Image from "next/image";
import styles from "./page.module.css";
import { useMediaQuery } from "usehooks-ts";
import Link from "next/link";

export default function Home() {
    const isMobile = useMediaQuery("(max-width: 700px)");

    if (isMobile) {
        return (
            <div className={styles.page}>
                Mobile UI coming later. Try on desktop for now!
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <Image
                    className={styles.logo}
                    src="next.svg"
                    alt="Next.js logo"
                    width={180}
                    height={38}
                    priority
                />
                <ol>
                    <li>
                        Get started by editing <code>src/app/page.tsx</code>.
                    </li>
                    <li>Save and see your changes instantly.</li>
                </ol>

                <Link href="/test">Go to test page</Link>
                <Link href="test">Go to test page relative</Link>

            </main>
        </div>
    );
}
