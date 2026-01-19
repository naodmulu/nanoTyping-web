'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
    const [height, setHeight] = useState<number | null>(null);

    useEffect(() => {
        const header = document.getElementById('site-header');
        const footer = document.getElementById('site-footer');

        const updateHeight = () => {
            const h =
                window.innerHeight -
                (header?.offsetHeight || 0) -
                (footer?.offsetHeight || 0);
            setHeight(h);
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    return (
        <div
            style={{ height: height ? `${height}px` : 'auto' }}
            className="flex flex-col items-center justify-center text-center px-4"
        >
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-xl mb-6">Oops! Page not found.</p>
            <Link href="/" className="text-blue-600 underline">
                Go back home
            </Link>
        </div>
    );
}
