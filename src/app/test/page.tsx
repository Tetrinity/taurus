'use client'

import Link from "next/link";

export default function TestPage() {
    return (
        <div>
            <p>test page</p>
            <Link href="/">Go to home</Link>
            <Link href="..">Go up level</Link>
        </div>
    );
}
